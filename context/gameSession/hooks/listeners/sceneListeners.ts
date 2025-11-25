import { socketService } from '../../../../services/socketService';
import {
  SceneUpdatePayload,
  SceneAddPayload,
  SceneDeletePayload,
  SceneSwitchPayload,
  MapPingPayload
} from '../../../../types';
import { StateHelpers } from '../../helpers';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for scene and map-related events
 * - scene:update
 * - scene:add
 * - scene:delete
 * - scene:switch
 * - map:ping
 */
export const registerSceneListeners = ({
  setState,
  user
}: ListenerDeps): ListenerCleanup => {

  // Handler: scene:update
  const handleSceneUpdate = (payload: SceneUpdatePayload) => {
    if (!payload.id || !payload.changes) return;

    setState(previousState => ({
      ...previousState,
      scenes: StateHelpers.updateSceneInList(
        previousState.scenes,
        payload.id,
        payload.changes
      )
    }));
  };

  // Handler: scene:add
  const handleSceneAdd = (payload: SceneAddPayload) => {
    setState(previousState => {
      const sceneExists = previousState.scenes.some(
        scene => scene.id === payload.scene.id
      );

      if (sceneExists) return previousState;

      return {
        ...previousState,
        scenes: [...previousState.scenes, payload.scene]
      };
    });
  };

  // Handler: scene:delete
  const handleSceneDelete = (payload: SceneDeletePayload) => {
    setState(previousState => {
      const filteredScenes = previousState.scenes.filter(
        scene => scene.id !== payload.id
      );

      const newActiveSceneId = previousState.activeSceneId === payload.id
        ? (previousState.scenes[0]?.id || '')
        : previousState.activeSceneId;

      return {
        ...previousState,
        scenes: filteredScenes,
        activeSceneId: newActiveSceneId
      };
    });
  };

  // Handler: scene:switch
  const handleSceneSwitch = (payload: SceneSwitchPayload) => {
    setState(previousState => ({
      ...previousState,
      activeSceneId: payload.id
    }));
  };

  // Handler: map:ping
  const handleMapPing = (payload: MapPingPayload) => {
    if (payload.userId === user?.id) return;

    const ping = {
      id: Math.random().toString(),
      x: payload.x,
      y: payload.y,
      color: payload.color,
      createdAt: Date.now(),
      userId: payload.userId
    };

    setState(previousState => ({
      ...previousState,
      pings: [...previousState.pings, ping]
    }));

    setTimeout(() => {
      setState(previousState => ({
        ...previousState,
        pings: previousState.pings.filter(existingPing => existingPing.id !== ping.id)
      }));
    }, 3000);
  };

  // Register listeners
  socketService.on('scene:update', handleSceneUpdate);
  socketService.on('scene:add', handleSceneAdd);
  socketService.on('scene:delete', handleSceneDelete);
  socketService.on('scene:switch', handleSceneSwitch);
  socketService.on('map:ping', handleMapPing);

  // Return cleanup function
  return () => {
    socketService.off('scene:update', handleSceneUpdate);
    socketService.off('scene:add', handleSceneAdd);
    socketService.off('scene:delete', handleSceneDelete);
    socketService.off('scene:switch', handleSceneSwitch);
    socketService.off('map:ping', handleMapPing);
  };
};
