import { socketService } from '../../../../services/socketService';
import {
  DrawingAddPayload,
  DrawingRemovePayload
} from '../../../../types';
import { StateHelpers } from '../../helpers';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for drawing-related events
 * - drawing:add
 * - drawing:remove
 */
export const registerDrawingListeners = ({
  setState
}: ListenerDeps): ListenerCleanup => {

  // Handler: drawing:add
  const handleDrawingAdd = (payload: DrawingAddPayload) => {
    setState(previousState => ({
      ...previousState,
      scenes: StateHelpers.addItemToSceneList(
        previousState.scenes,
        payload.sceneId,
        'drawings',
        payload.drawing
      )
    }));
  };

  // Handler: drawing:remove
  const handleDrawingRemove = (payload: DrawingRemovePayload) => {
    setState(previousState => ({
      ...previousState,
      scenes: StateHelpers.removeItemFromSceneList(
        previousState.scenes,
        payload.sceneId,
        'drawings',
        payload.id
      )
    }));
  };

  // Register listeners
  socketService.on('drawing:add', handleDrawingAdd);
  socketService.on('drawing:remove', handleDrawingRemove);

  // Return cleanup function
  return () => {
    socketService.off('drawing:add', handleDrawingAdd);
    socketService.off('drawing:remove', handleDrawingRemove);
  };
};
