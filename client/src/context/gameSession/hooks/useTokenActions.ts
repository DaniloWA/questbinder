import React, { useCallback, useRef } from 'react';
import { GameSessionState, BooleanPermissionKey } from '../types';
import { campaignService } from '../../../services/campaignService';
import { socketService } from '../../../services/socketService';
import { Token } from '../../../types';
import { ActionHandlers, StateHelpers, GeometryHelpers } from '../helpers';

// Cursor throttle constants
const CURSOR_THROTTLE_MS = 50; // Max 20 cursor updates per second

export const useTokenActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  user: any,
  show: (notification: any) => void,
  permissionHelper?: any // REGRA MILENAR
) => {
  const activeScene = state.scenes.find(s => s.id === state.activeSceneId) || null;

  // Cursor throttle refs
  const lastCursorEmitRef = useRef<number>(0);
  const pendingCursorRef = useRef<{ x: number; y: number; } | null>(null);
  const cursorRAFRef = useRef<number | null>(null);
  // Velocity tracking for smooth receiver interpolation
  const prevCursorPosRef = useRef<{ x: number; y: number; time: number; } | null>(null);
  // Click state tracking (for remote click feedback)
  const isClickingRef = useRef<boolean>(false);

  const moveToken = useCallback((tokenId: string, newX: number, newY: number) => {
    const scene = activeScene;
    const token = scene?.tokens.find(t => t.id === tokenId);



    if (!scene || !token) return;

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
        socketService.emit('token:update', {
          sceneId: state.activeSceneId,
          id: tokenId,
          changes: { x: newX, y: newY }
        });
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
  }, [activeScene, state, user, setState, campaignId, permissionHelper]);

  const moveTokens = (updates: { id: string, x: number, y: number; }[]) => { updates.forEach(u => moveToken(u.id, u.x, u.y)); };

  const updateToken = (id: string, data: Partial<Token>) => {
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
        socketService.emit('token:update', { sceneId: state.activeSceneId, id, changes: data });
      }
    });
  };

  const addToken = (tokenData: Partial<Token>) => {
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
      ownerId // Override or set ownerId
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
        console.log('[CLIENT] Emitting token:add to server:', { sceneId: state.activeSceneId, token: newToken });
        socketService.emit('token:add', { sceneId: state.activeSceneId, token: newToken });
      }
    });
  };

  const removeToken = (id: string) => {
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

      // Always emit to server; server will enforce its own permission check
      socketEmit: () => {
        socketService.emit('token:remove', { sceneId: state.activeSceneId, id });
      },
    });
  };

  const moveTokenToScene = (tokenId: string, sceneId: string) => {
    const currentScene = state.scenes.find(s => s.id === state.activeSceneId);
    const token = currentScene?.tokens.find(t => t.id === tokenId);

    if (!currentScene || !token) return;

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
    socketService.emit('token:drag', { userId: user?.id || '', tokenId: id, x, y, path });
  };

  const emitCursorMove = (x: number, y: number) => {
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

    // Helper to build payload with all animation fields
    const buildPayload = (px: number, py: number, vx: number, vy: number) => {
      const userId = user?.id || '';
      const override = (state.permissions?.cursorOverrides?.[userId] || {}) as { color?: string, shape?: string, name?: string; };
      const settings = state.cursorSettings || {} as { color?: string, shape?: string, name?: string; };

      return {
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

        // New Trail/Status Fields
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
      };
    };

    // If enough time has passed since last emit, send immediately
    if (now - lastCursorEmitRef.current >= CURSOR_THROTTLE_MS) {
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
  const setCursorClickState = useCallback((clicking: boolean) => {
    isClickingRef.current = clicking;
  }, []);

  return {
    moveToken,
    moveTokens,
    updateToken,
    addToken,
    removeToken,
    moveTokenToScene,
    selectToken,
    clearSelection,
    emitTokenDrag,
    emitCursorMove,
    setCursorClickState, // For remote click feedback
  };
};
