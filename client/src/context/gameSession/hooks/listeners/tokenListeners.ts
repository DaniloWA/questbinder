import { socketService } from '../../../../services/socketService';
import {
  TokenUpdatePayload,
  TokenDragPayload
} from '../../../../types';
import { StateHelpers } from '../../helpers';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for token-related events
 * - token:update
 * - token:add
 * - token:remove
 * - token:drag
 */
export const registerTokenListeners = ({
  setState,
  user
}: ListenerDeps): ListenerCleanup => {

  // Handler: token:update
  const handleTokenUpdate = (payload: TokenUpdatePayload) => {
    setState(previousState => {
      // 1. Update Scenes
      const updatedScenes = StateHelpers.updateItemInSceneList(
        previousState.scenes,
        payload.sceneId,
        'tokens',
        payload.id,
        payload.changes
      );

      // 2. Clear Remote Drags (Fix for remote cursor delay)
      // If this token was being dragged, the update means the drag ended.
      const updatedDrags = { ...previousState.remoteDrags };
      let dragsChanged = false;

      Object.keys(updatedDrags).forEach(userId => {
        if (updatedDrags[userId].tokenId === payload.id) {
          delete updatedDrags[userId];
          dragsChanged = true;
        }
      });

      return {
        ...previousState,
        scenes: updatedScenes,
        remoteDrags: dragsChanged ? updatedDrags : previousState.remoteDrags
      };
    });
  };

  // Handler: token:add
  const handleTokenAdd = (payload: any) => {
    setState(previousState => ({
      ...previousState,
      scenes: StateHelpers.addItemToSceneList(
        previousState.scenes,
        payload.sceneId,
        'tokens',
        payload.token
      )
    }));
  };

  // Handler: token:remove
  const handleTokenRemove = (payload: any) => {
    setState(previousState => ({
      ...previousState,
      scenes: StateHelpers.removeItemFromSceneList(
        previousState.scenes,
        payload.sceneId,
        'tokens',
        payload.id
      )
    }));
  };

  // Handler: token:drag
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

  // Register listeners
  socketService.on('token:update', handleTokenUpdate);
  socketService.on('token:add', handleTokenAdd);
  socketService.on('token:remove', handleTokenRemove);
  socketService.on('token:drag', handleTokenDrag);

  // Return cleanup function
  return () => {
    socketService.off('token:update', handleTokenUpdate);
    socketService.off('token:add', handleTokenAdd);
    socketService.off('token:remove', handleTokenRemove);
    socketService.off('token:drag', handleTokenDrag);
  };
};
