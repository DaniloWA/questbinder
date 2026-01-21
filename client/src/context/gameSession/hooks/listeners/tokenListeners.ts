import { socketService } from '../../../../services/socketService';
import {
  TokenUpdatePayload,
  TokenDragPayload,
  TokenAddPayload,
  TokenRemovePayload
} from '../../../../types';
import { StateHelpers } from '../../helpers';
import { notifySmartSync } from '../../syncHelpers';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for token-related events.
 * All handlers update React state AND notify SmartSync cache.
 * 
 * Events handled:
 * - token:update - Token position/property changes
 * - token:add - New token added
 * - token:remove - Token deleted
 * - token:drag - Live drag preview (ephemeral, not persisted)
 */
export const registerTokenListeners = ({
  setState,
  user
}: ListenerDeps): ListenerCleanup => {

  // Handler: token:update
  const handleTokenUpdate = (payload: TokenUpdatePayload) => {
    // 1. Notify SmartSync cache (Bridge will update React state)
    notifySmartSync({
      entityType: 'token',
      entityId: payload.id,
      changeType: 'update',
      data: payload.changes,
      parentId: payload.sceneId
    });

    // 2. Handle ephemeral side-effects (Remote Drags cleanup)
    setState(previousState => {
      const updatedDrags = { ...previousState.remoteDrags };
      let dragsChanged = false;
      Object.keys(updatedDrags).forEach(userId => {
        if (updatedDrags[userId].tokenId === payload.id) {
          delete updatedDrags[userId];
          dragsChanged = true;
        }
      });

      if (!dragsChanged) return previousState;

      return {
        ...previousState,
        remoteDrags: updatedDrags
      };
    });
  };

  // Handler: token:add
  const handleTokenAdd = (payload: TokenAddPayload) => {
    // Notify SmartSync cache
    notifySmartSync({
      entityType: 'token',
      entityId: payload.token.id,
      changeType: 'create',
      data: payload.token,
      parentId: payload.sceneId
    });
  };

  // Handler: token:remove
  const handleTokenRemove = (payload: TokenRemovePayload) => {
    // Notify SmartSync cache
    notifySmartSync({
      entityType: 'token',
      entityId: payload.id,
      changeType: 'delete',
      data: {},
      parentId: payload.sceneId
    });
  };

  // Handler: token:drag (ephemeral - NOT synced to cache)
  const handleTokenDrag = (payload: TokenDragPayload) => {
    if (payload.userId === user?.id) return;

    setState(previousState => ({
      ...previousState,
      remoteDrags: {
        ...previousState.remoteDrags,
        [payload.userId]: payload
      }
    }));

    setTimeout(() => {
      setState(previousState => {
        if (previousState.remoteDrags[payload.userId] !== payload) {
          return previousState;
        }
        const updatedDrags = { ...previousState.remoteDrags };
        delete updatedDrags[payload.userId];
        return { ...previousState, remoteDrags: updatedDrags };
      });
    }, 2000);
  };

  // Register all listeners
  socketService.on('token:update', handleTokenUpdate);
  socketService.on('token:add', handleTokenAdd);
  socketService.on('token:remove', handleTokenRemove);
  socketService.on('token:drag', handleTokenDrag);

  // Cleanup
  return () => {
    socketService.off('token:update', handleTokenUpdate);
    socketService.off('token:add', handleTokenAdd);
    socketService.off('token:remove', handleTokenRemove);
    socketService.off('token:drag', handleTokenDrag);
  };
};
