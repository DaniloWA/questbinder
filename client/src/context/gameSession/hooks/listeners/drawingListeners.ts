import { socketService } from '../../../../services/socketService';
import {
  DrawingAddPayload,
  DrawingRemovePayload
} from '../../../../types';
import { StateHelpers } from '../../helpers';
import { notifySmartSync } from '../../syncHelpers';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for drawing-related events.
 * Handlers update React state AND notify SmartSync cache.
 */
export const registerDrawingListeners = ({
  setState
}: ListenerDeps): ListenerCleanup => {

  // Handler: drawing:add
  const handleDrawingAdd = (payload: DrawingAddPayload) => {
    notifySmartSync({
      entityType: 'drawing',
      entityId: payload.drawing.id,
      changeType: 'create',
      data: payload.drawing,
      parentId: payload.sceneId
    });
  };

  // Handler: drawing:remove
  const handleDrawingRemove = (payload: DrawingRemovePayload) => {
    notifySmartSync({
      entityType: 'drawing',
      entityId: payload.id,
      changeType: 'delete',
      data: {},
      parentId: payload.sceneId
    });
  };

  // Register listeners
  socketService.on('drawing:add', handleDrawingAdd);
  socketService.on('drawing:remove', handleDrawingRemove);

  return () => {
    socketService.off('drawing:add', handleDrawingAdd);
    socketService.off('drawing:remove', handleDrawingRemove);
  };
};
