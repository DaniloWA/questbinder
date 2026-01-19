import React, { useCallback, useRef, useEffect } from 'react';
import { GameSessionState, BooleanPermissionKey } from '../types';
import { campaignService } from '../../../services/campaignService';
import { socketService } from '../../../services/socketService';
import { smartSync } from '../../../services/sync';
import { Token } from '../../../types';
import { ActionHandlers, StateHelpers, GeometryHelpers } from '../helpers';
import { useLatestRef } from '../../../hooks/useLatestRef';

// Cursor throttle constants
const CURSOR_THROTTLE_MS = 80; // Batch Mode (relies on replay for smoothness)

export const useTokenActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  user: any,
  show: (notification: any) => void,
  permissionHelper?: any // REGRA MILENAR
) => {
  const activeScene = state.scenes.find(s => s.id === state.activeSceneId) || null;

  // State ref to always have access to latest state in callbacks (prevents stale closures)
  const stateRef = useLatestRef(state);

  // Cursor throttle refs
  const lastCursorEmitRef = useRef<number>(0);
  const pendingCursorRef = useRef<{ x: number; y: number; } | null>(null);
  const movementBufferRef = useRef<{ x: number, y: number, time: number; }[]>([]);
  const cursorRAFRef = useRef<number | null>(null);
  // Velocity tracking for smooth receiver interpolation
  const prevCursorPosRef = useRef<{ x: number; y: number; time: number; } | null>(null);
  // Click state tracking (for remote click feedback)
  const isClickingRef = useRef<boolean>(false);
  // Context menu state tracking
  const isContextingRef = useRef<boolean>(false);
  // Chat typing state tracking
  const isChattingRef = useRef<boolean>(false);
  // Dragging state tracking (hide cursor when dragging tokens)
  const isDraggingRef = useRef<boolean>(false);

  // Helper to force update state
  const forceEmitState = useCallback(() => {
    // Force emit even if we don't have a previous position yet (use 0,0 or last cursor default)
    // The key is to propagate the status flags (isHidden, isAfk)
    const pos = prevCursorPosRef.current || { x: 0, y: 0, time: Date.now() };
    emitCursorMove(pos.x, pos.y, true);
  }, []);

  // AFK Logic: Reset timer on activity (Legacy: Server now handles AFK)
  const resetAfkTimer = useCallback(() => {
    // No-op: Server handles AFK logic based on cursor movement and keep_alive
  }, []);

  // Heartbeat removed to allow AFK detection
  // Socket.IO handles connection keep-alive internally
  useEffect(() => {
    return () => { };
  }, []);

  const moveToken = useCallback((tokenId: string, newX: number, newY: number) => {
    // Use stateRef to get the latest state (avoids stale closure)
    const currentState = stateRef.current;
    resetAfkTimer(); // Token movement counts as activity

    // IMPORTANT: Get scene fresh from stateRef to avoid stale closure
    const scene = currentState.scenes.find(s => s.id === currentState.activeSceneId);
    const token = scene?.tokens.find(t => t.id === tokenId);

    if (!scene || !token) {
      console.warn('[moveToken] Failed to find token or scene:', {
        sceneId: currentState.activeSceneId,
        sceneFound: !!scene,
        tokenId,
        tokenFound: !!token,
        tokensCount: scene?.tokens.length
      });
      return;
    }

    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      validate: () => {
        if (!permissionHelper) return false;
        const canMove = permissionHelper.canMoveToken(token);

        if (!canMove) {
          console.warn('[TokenMove] Permission Denied:', {
            tokenId: token.id,
            tokenOwner: token.ownerId,
            userId: user?.id,
            isGM: state.isGM,
            canControl: permissionHelper.canControlToken(token),
            hasMovePermission: permissionHelper.can('tokenMovement'),
            globalPermissions: state.permissions
          });
        }

        return canMove;
      },

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.updateItemInSceneList(
          prev.scenes,
          prev.activeSceneId,
          'tokens',
          tokenId,
          { x: newX, y: newY }
        );
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        smartSync.apply('token', tokenId, 'update', { x: newX, y: newY }, state.activeSceneId);
      }
    });

    // Zone Triggers (Side Effect)
    if (!state.isGM || (permissionHelper && permissionHelper.canControlToken(token))) {
      const updatedToken = { ...token, x: newX, y: newY };
      const gridSize = scene.grid.size;

      // Check Trigger Zones
      if (scene.triggerZones?.length) {
        for (const zone of scene.triggerZones) {
          if (GeometryHelpers.isTokenInZone(updatedToken, zone, gridSize)) {
            if (state.lastTriggeredZoneId !== zone.id) {
              setState(prev => ({
                ...prev,
                triggeredHandoutId: zone.handoutId,
                lastTriggeredZoneId: zone.id
              }));
              console.log('[TRIGGER] Activated zone:', zone.id, 'Handout:', zone.handoutId);
              break;
            }
          }
        }
      }

      // Check Audio Zones
      if (scene.audioZones?.length) {
        let activeAudioUrl: string | null = null;
        for (const zone of scene.audioZones) {
          if (GeometryHelpers.isTokenInZone(updatedToken, zone, gridSize)) {
            activeAudioUrl = zone.audioUrl;
            break;
          }
        }
        if (activeAudioUrl !== state.activeAudioZoneUrl) {
          setState(prev => ({ ...prev, activeAudioZoneUrl: activeAudioUrl }));
        }
      }
    }
  }, [activeScene, state, user, setState, campaignId, permissionHelper, resetAfkTimer]);

  const moveTokens = (updates: { id: string, x: number, y: number; }[]) => {
    resetAfkTimer();
    updates.forEach(u => moveToken(u.id, u.x, u.y));
  };

  const updateToken = (id: string, data: Partial<Token>) => {
    resetAfkTimer();
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      user,
      permissionHelper, // REGRA MILENAR
      requiredPermission: 'tokenEdit',

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.updateItemInSceneList(
          prev.scenes,
          prev.activeSceneId,
          'tokens',
          id,
          data
        );
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        smartSync.apply('token', id, 'update', data, state.activeSceneId);
      }
    });
  };

  const addToken = (tokenData: Partial<Token>) => {
    resetAfkTimer();
    if (!state.activeSceneId) {
      console.warn('[CLIENT] addToken: no active scene');
      return;
    }

    // Retry logic for connection
    if (!state.isConnected) {
      console.warn('[CLIENT] addToken: WebSocket not connected yet, retrying in 500ms');
      setTimeout(() => addToken(tokenData), 500);
      return;
    }

    const { id, ...rest } = tokenData;

    // Auto-assign owner if linked to a character
    let ownerId = rest.ownerId;
    if (rest.linkedId) {
      const character = state.campaignCharacters.find(c => c.id === rest.linkedId);
      if (character && character.ownerId) {
        ownerId = character.ownerId;
      }
    }

    const newToken: Token = {
      id: Math.random().toString(36).substr(2, 9),
      x: 0, y: 0, size: 1, name: 'Novo Token', type: 'npc', imgUrl: '', isVisibleToPlayers: true,
      ...rest,
      ownerId: ownerId || user?.id // Default to current user if not set
    };

    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      user,
      permissionHelper, // REGRA MILENAR
      requiredPermission: 'tokenCreate',

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.addItemToSceneList(
          prev.scenes,
          prev.activeSceneId,
          'tokens',
          newToken
        );
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        console.log('[CLIENT] SmartSync token:add:', { sceneId: state.activeSceneId, token: newToken });
        smartSync.apply('token', newToken.id, 'create', newToken, state.activeSceneId);
      }
    });
  };

  const removeToken = (id: string) => {
    resetAfkTimer();
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      user,
      permissionHelper, // REGRA MILENAR
      requiredPermission: 'tokenDelete',
      // Validate permission before proceeding
      validate: () => {
        if (!permissionHelper) return false;
        const canDelete = permissionHelper.can('tokenDelete');
        if (!canDelete) {
          console.warn('[TokenDelete] Permission denied for token', id);
        }
        return canDelete;
      },

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.removeItemFromSceneList(
          prev.scenes,
          prev.activeSceneId,
          'tokens',
          id
        );
        // Remove from selection only if present
        const newSelected = prev.selectedTokenIds.includes(id)
          ? prev.selectedTokenIds.filter(tid => tid !== id)
          : prev.selectedTokenIds;
        return {
          ...prev,
          scenes: updatedScenes,
          selectedTokenIds: newSelected,
        };
      },

      // apiCall removed to avoid double-write and race conditions. 
      // Server handles persistence via socket event.

      socketEmit: () => {
        smartSync.apply('token', id, 'delete', {}, state.activeSceneId);
      },
    });
  };

  const moveTokenToScene = (tokenId: string, sceneId: string) => {
    resetAfkTimer();
    const currentScene = state.scenes.find(s => s.id === state.activeSceneId);
    const token = currentScene?.tokens.find(t => t.id === tokenId);

    if (!currentScene || !token) return;

    // REGRA MILENAR: Permission Check
    if (permissionHelper && !permissionHelper.isGameMaster()) {
      console.warn('[TokenActions] Denied moveTokenToScene (GM Only)');
      show({ type: 'error', message: 'Apenas o GM pode mover tokens entre cenas.' });
      return;
    }

    // This is a complex multi-step action, maybe harder to fit into handleOptimisticAction perfectly
    // but we can use the helpers.

    const updatedScenesStep1 = StateHelpers.removeItemFromSceneList(state.scenes, currentScene.id, 'tokens', tokenId);
    const updatedScenesStep2 = StateHelpers.addItemToSceneList(updatedScenesStep1, sceneId, 'tokens', { ...token, x: 5, y: 5 });

    setState(prev => ({ ...prev, scenes: updatedScenesStep2 }));
    // campaignService.update(campaignId, { scenes: updatedScenesStep2 }); // Removed to avoid double-write

    socketService.emit('token:remove', { sceneId: currentScene.id, id: tokenId });
    socketService.emit('token:add', { sceneId, token: { ...token, x: 5, y: 5 } });
    show({ type: 'success', message: `Token movido para outra cena.` });
  };

  const selectToken = (id: string, multi: boolean) => setState(prev => ({ ...prev, selectedTokenIds: multi ? [...prev.selectedTokenIds, id] : [id] }));
  const clearSelection = () => setState(prev => ({ ...prev, selectedTokenIds: [] }));

  const emitTokenDrag = (id: string, x: number, y: number, path: { x: number, y: number; }[]) => {
    resetAfkTimer();

    // Validate ownership before emitting drag to prevent spam/spoofing
    if (permissionHelper) {
      const activeScene = state.scenes.find(s => s.id === state.activeSceneId);
      const token = activeScene?.tokens.find(t => t.id === id);
      if (token && !permissionHelper.canControlToken(token)) return;
    }

    socketService.emit('token:drag', { userId: user?.id || '', tokenId: id, x, y, path });
  };

  const emitCursorMove = (x: number, y: number, forceImmediate = false) => {
    resetAfkTimer();
    const now = Date.now();

    // Store pending position
    pendingCursorRef.current = { x, y };

    // Calculate velocity from previous position
    let velocityX = 0;
    let velocityY = 0;
    const prev = prevCursorPosRef.current;
    if (prev) {
      const dt = now - prev.time;
      if (dt > 0 && dt < 200) { // Reasonable time window
        velocityX = (x - prev.x) / dt;
        velocityY = (y - prev.y) / dt;
      }
    }

    // Add to movement buffer (history since last emit)
    movementBufferRef.current.push({ x, y, time: now });

    // Helper to build payload with all animation fields
    const buildPayload = (px: number, py: number, vx: number, vy: number) => {
      const userId = user?.id || '';
      const override = (state.permissions?.cursorOverrides?.[userId] || {}) as { color?: string, shape?: string, name?: string; };
      const settings = state.cursorSettings || {} as { color?: string, shape?: string, name?: string; };

      const payload = {
        userId,
        userName: override.name || (settings as any).name || user?.name || '?',
        userColor: override.color || (settings as any).color || '#fbbf24',
        userShape: override.shape || (settings as any).shape || 'default',
        x: px,
        y: py,
        // Animation engine fields for smooth interpolation
        timestamp: Date.now(),
        velocityX: vx,
        velocityY: vy,
        isClicking: isClickingRef.current, // For remote click feedback

        // BATCH REPLAY: Send full path history
        path: [...movementBufferRef.current],

        // New Trail/Status Fields with Privacy Checks
        activeTool: (settings as any).showToolActivity !== false ? state.activeTool : null,
        isContexting: (settings as any).showStatusActivity !== false ? isContextingRef.current : false,
        isChatting: (settings as any).showStatusActivity !== false ? isChattingRef.current : false,

        // isAfk and isHidden removed (Server Authoritative)

        healthStatus: (() => {
          const char = state.campaignCharacters.find(c => c.ownerId === userId);
          if (!char) return 'healthy';
          if (char.hpCurrent <= 0) return 'unconscious';
          if (char.hpCurrent <= (char.hpMax / 2)) return 'bloodied';
          return 'healthy';
        })() as 'healthy' | 'bloodied' | 'unconscious',
        trailAnimation: (override as any).trailAnimation || (settings as any).trailAnimation,
        trailColor: (override as any).trailColor || (settings as any).trailColor,
        trailEnabled: (override as any).trailEnabled ?? (settings as any).trailEnabled,
        trailCustomImage: (override as any).trailCustomImage || (settings as any).trailCustomImage,
        trailLength: (override as any).trailLength ?? (settings as any).trailLength ?? 20,
        trailThickness: (override as any).trailThickness ?? (settings as any).trailThickness ?? 1,
        trailSize: (override as any).trailSize ?? (settings as any).trailSize ?? 4,
        isDragging: isDraggingRef.current, // Hide cursor when dragging tokens
      };

      // Clear buffer after building payload
      movementBufferRef.current = [];
      return payload;
    };

    // If forceImmediate OR enough time passed, send immediately
    if (forceImmediate || now - lastCursorEmitRef.current >= CURSOR_THROTTLE_MS) {
      socketService.emit('cursor:move', buildPayload(x, y, velocityX, velocityY));

      // Update tracking refs
      lastCursorEmitRef.current = now;
      prevCursorPosRef.current = { x, y, time: now };
      pendingCursorRef.current = null;
      return;
    }

    // Otherwise, schedule a batched emit via RAF if not already scheduled
    if (cursorRAFRef.current === null) {
      cursorRAFRef.current = requestAnimationFrame(() => {
        const pending = pendingCursorRef.current;
        const emitNow = Date.now();
        if (pending && emitNow - lastCursorEmitRef.current >= CURSOR_THROTTLE_MS) {
          // Recalculate velocity at emit time
          let vx = 0, vy = 0;
          const prevPos = prevCursorPosRef.current;
          if (prevPos) {
            const dt = emitNow - prevPos.time;
            if (dt > 0 && dt < 200) {
              vx = (pending.x - prevPos.x) / dt;
              vy = (pending.y - prevPos.y) / dt;
            }
          }

          socketService.emit('cursor:move', buildPayload(pending.x, pending.y, vx, vy));

          lastCursorEmitRef.current = emitNow;
          prevCursorPosRef.current = { x: pending.x, y: pending.y, time: emitNow };
        }
        pendingCursorRef.current = null;
        cursorRAFRef.current = null;
      });
    }
  };

  // Update click state for cursor feedback (called from useMapInteraction)
  // Now also emits to server for remote visual feedback
  const setCursorClickState = useCallback((clicking: boolean) => {
    // Deduplicate: Only emit if state actually changed
    if (isClickingRef.current === clicking) return;
    resetAfkTimer();

    isClickingRef.current = clicking;
    // Emit immediately to server (no throttle) for remote shrink effect
    socketService.emit('cursor:pressing', { pressing: clicking });
  }, [resetAfkTimer]);

  // Update context menu state
  const setCursorContextState = useCallback((isOpen: boolean) => {
    isContextingRef.current = isOpen;
    resetAfkTimer();
    // Force emit a move packet to update state immediately even if mouse is still
    if (lastCursorEmitRef.current > 0) {
      const prev = prevCursorPosRef.current;
      if (prev) {
        emitCursorMove(prev.x, prev.y);
      }
    }
  }, [emitCursorMove, resetAfkTimer]);

  // Force emit on tool change so remote users see it immediately
  useEffect(() => {
    if (lastCursorEmitRef.current > 0 && prevCursorPosRef.current) {
      emitCursorMove(prevCursorPosRef.current.x, prevCursorPosRef.current.y);
      resetAfkTimer();
    }
  }, [state.activeTool, state.cursorSettings, emitCursorMove, resetAfkTimer]);

  // Update chat state
  const setCursorChatState = useCallback((isChatting: boolean) => {
    isChattingRef.current = isChatting;
    resetAfkTimer();
    // Force emit a move packet to update state immediately
    if (lastCursorEmitRef.current > 0) {
      const prev = prevCursorPosRef.current;
      if (prev) {
        emitCursorMove(prev.x, prev.y);
      }
    }
  }, [emitCursorMove, resetAfkTimer]);

  const setDragging = useCallback((dragging: boolean) => {
    isDraggingRef.current = dragging;
  }, []);

  return {
    moveToken,
    moveTokens,
    updateToken,
    addToken,
    removeToken,
    moveTokenToScene,
    setCursorChatState,

    selectToken,
    clearSelection,
    emitTokenDrag,
    emitCursorMove,
    setCursorClickState, // For remote click feedback
    setCursorContextState, // For remote gesture feedback
    resetAfkTimer, // Expose for other generic activity
    setDragging, // For hiding cursor during token drag
  };
};
