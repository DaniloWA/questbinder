import { socketService } from '../../../../services/socketService';
import {
  SceneUpdatePayload,
  SceneAddPayload,
  SceneDeletePayload,
  SceneSwitchPayload,
  MapPingPayload
} from '../../../../types';
import { StateHelpers } from '../../helpers';
import { notifySmartSync } from '../../syncHelpers';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for scene and map-related events.
 * All handlers update React state AND notify SmartSync cache.
 */
export const registerSceneListeners = ({
  setState,
  user
}: ListenerDeps): ListenerCleanup => {

  // Handler: scene:update
  const handleSceneUpdate = (payload: SceneUpdatePayload) => {
    if (!payload.id || !payload.changes) return;

    notifySmartSync({
      entityType: 'scene',
      entityId: payload.id,
      changeType: 'update',
      data: payload.changes
    });
  };

  // Handler: scene:add
  const handleSceneAdd = (payload: SceneAddPayload) => {
    notifySmartSync({
      entityType: 'scene',
      entityId: payload.scene.id,
      changeType: 'create',
      data: payload.scene
    });
  };

  // Handler: scene:delete
  const handleSceneDelete = (payload: SceneDeletePayload) => {
    notifySmartSync({
      entityType: 'scene',
      entityId: payload.id,
      changeType: 'delete',
      data: {}
    });
  };

  // Handler: scene:switch (UI only, no cache)
  const handleSceneSwitch = (payload: SceneSwitchPayload) => {
    setState(previousState => ({
      ...previousState,
      activeSceneId: payload.id
    }));
  };

  // Handler: map:ping (ephemeral, no cache)
  const handleMapPing = (payload: MapPingPayload) => {
    if (payload.userId === user?.id) return;

    const ping = {
      id: Math.random().toString(),
      x: payload.x,
      y: payload.y,
      color: payload.color,
      createdAt: Date.now(),
      userId: payload.userId,
      userName: payload.userName,
      animationStyle: payload.animationStyle
    };

    setState(previousState => ({
      ...previousState,
      pings: [...previousState.pings, ping]
    }));

    setTimeout(() => {
      setState(previousState => ({
        ...previousState,
        pings: previousState.pings.filter(p => p.id !== ping.id)
      }));
    }, 3000);
  };

  // Register all listeners
  socketService.on('scene:update', handleSceneUpdate);
  socketService.on('scene:add', handleSceneAdd);
  socketService.on('scene:delete', handleSceneDelete);
  socketService.on('scene:switch', handleSceneSwitch);
  socketService.on('map:ping', handleMapPing);

  return () => {
    socketService.off('scene:update', handleSceneUpdate);
    socketService.off('scene:add', handleSceneAdd);
    socketService.off('scene:delete', handleSceneDelete);
    socketService.off('scene:switch', handleSceneSwitch);
    socketService.off('map:ping', handleMapPing);
  };
};
