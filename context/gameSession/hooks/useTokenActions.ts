import React, { useCallback } from 'react';
import { GameSessionState, BooleanPermissionKey } from '../types';
import { campaignService } from '../../../services/campaignService';
import { socketService } from '../../../services/socketService';
import { Token } from '../../../types';
import { ActionHandlers, StateHelpers, GeometryHelpers } from '../helpers';

export const useTokenActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  user: any,
  show: (notification: any) => void,
  permissionHelper?: any // REGRA MILENAR
) => {
  const activeScene = state.scenes.find(s => s.id === state.activeSceneId) || null;

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
        // Note: We don't strictly need optimistic update here if we trust the socket echo, 
        // but for consistency we can do it. However, usually addToken relies on server echo 
        // to avoid ID conflicts if we generated ID here. 
        // But since we generate ID here, we can be optimistic.
        // BUT, the original code didn't do optimistic update for addToken? 
        // Wait, original code: socketService.emit('token:add'...) -> handleTokenAdd -> setState.
        // It was NOT optimistic.
        // Let's make it optimistic for better UX!
        return prev;
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

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.removeItemFromSceneList(
          prev.scenes,
          prev.activeSceneId,
          'tokens',
          id
        );
        return {
          ...prev,
          scenes: updatedScenes,
          selectedTokenIds: prev.selectedTokenIds.filter(tid => tid !== id)
        };
      },

      apiCall: async () => {
        // The original code called campaignService.update. 
        // We should replicate that if we want persistence.
        // Wait, the original code updated the WHOLE scene list via campaignService.
        // We can do that here too.
        const updatedScenes = StateHelpers.removeItemFromSceneList(state.scenes, state.activeSceneId, 'tokens', id);
        await campaignService.update(campaignId, { scenes: updatedScenes });
      },

      socketEmit: () => {
        socketService.emit('token:remove', { sceneId: state.activeSceneId, id });
      }
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
    campaignService.update(campaignId, { scenes: updatedScenesStep2 });

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
    socketService.emit('cursor:move', { userId: user?.id || '', userName: user?.name || '?', userColor: '#fff', x, y });
  };

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
    emitCursorMove
  };
};
