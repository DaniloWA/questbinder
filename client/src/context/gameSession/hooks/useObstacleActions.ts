import React from 'react';
import { GameSessionState } from '../types';
import { campaignService } from '../../../services/campaignService';
import { socketService } from '../../../services/socketService';
import { smartSync } from '../../../services/sync';
import { ActionHandlers, StateHelpers } from '../helpers';

export const useObstacleActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  user: any,
  permissionHelper?: any // REGRA MILENAR
) => {
  const addObstacles = (obstaclesData: any[]) => {
    if (!state.activeSceneId) return;
    const newObstacles = obstaclesData.map(o => ({ ...o, id: Math.random().toString(36).substr(2, 9) }));

    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      // Removed optimisticUpdate (SmartSync handles it)

      socketEmit: () => {
        // Note: The original code emitted the ENTIRE obstacle list. 
        // We should probably stick to that for now to avoid breaking changes if the server expects full list.
        // Or we can check if server supports incremental updates. 
        // Based on original code: socketService.emit('scene:update', { id: ..., changes: { obstacles: ... } });
        // It sends the FULL list.
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const currentObstacles = scene?.obstacles || [];
        const updatedObstacles = [...currentObstacles, ...newObstacles];
        smartSync.apply('scene', state.activeSceneId, 'update', { obstacles: updatedObstacles });
      },

      apiCall: async () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const currentObstacles = scene?.obstacles || [];
        const updatedObstacles = [...currentObstacles, ...newObstacles];
        const updatedScenes = StateHelpers.updateSceneInList(state.scenes, state.activeSceneId, { obstacles: updatedObstacles });
        await campaignService.update(campaignId, { scenes: updatedScenes });
      }
    });
  };

  const updateObstacle = (id: string, data: any) => {
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      user,
      permissionHelper,
      // Allow players with doorControl permission to update obstacles
      requiredPermission: 'doorControl',
      validate: () => {
        if (!permissionHelper || permissionHelper.isGameMaster()) return true;

        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const obstacle = scene?.obstacles.find(o => o.id === id);

        // 1. Must exist
        if (!obstacle) return false;

        // 2. Players cannot edit walls (Change type, points, etc)
        // If the obstacle is a wall, players can ONLY effectively do nothing? 
        // Actually doorControl applies to doors/windows. 
        // If target is WALL, strict GM only.
        if (obstacle.type === 'wall') return false;

        // 3. For doors, allow only specific fields (open, ds, locked, hidden)
        // We check what fields are present in 'data'.
        const allowedFields = ['open', 'ds', 'locked', 'hidden'];
        const keys = Object.keys(data);
        const isSafe = keys.every(k => allowedFields.includes(k));

        if (!isSafe) {
          console.warn('[Obstacle] Denied unsafe update by player', keys);
          return false;
        }

        return true;
      },

      // Removed optimisticUpdate (SmartSync handles it)

      socketEmit: () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedObstacles = scene?.obstacles.map(o => o.id === id ? { ...o, ...data } : o);
        smartSync.apply('scene', state.activeSceneId, 'update', { obstacles: updatedObstacles });
      },

      apiCall: async () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedObstacles = scene?.obstacles.map(o => o.id === id ? { ...o, ...data } : o);
        const updatedScenes = StateHelpers.updateSceneInList(state.scenes, state.activeSceneId, { obstacles: updatedObstacles });
        await campaignService.update(campaignId, { scenes: updatedScenes });
      }
    });
  };

  const removeObstacle = (id: string) => {
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      // Removed optimisticUpdate (SmartSync handles it)

      socketEmit: () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedObstacles = scene?.obstacles.filter(o => o.id !== id);
        smartSync.apply('scene', state.activeSceneId, 'update', { obstacles: updatedObstacles });
      },

      apiCall: async () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedObstacles = scene?.obstacles.filter(o => o.id !== id);
        const updatedScenes = StateHelpers.updateSceneInList(state.scenes, state.activeSceneId, { obstacles: updatedObstacles });
        await campaignService.update(campaignId, { scenes: updatedScenes });
      }
    });
  };

  const bulkUpdateObstacles = (data: any) => {
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        const scene = prev.scenes.find(s => s.id === prev.activeSceneId);
        if (!scene) return prev;
        const updatedObstacles = scene.obstacles.map(o => ({ ...o, ...data }));
        const updatedScenes = StateHelpers.updateSceneInList(prev.scenes, prev.activeSceneId, { obstacles: updatedObstacles });
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedObstacles = scene?.obstacles.map(o => ({ ...o, ...data }));
        smartSync.apply('scene', state.activeSceneId, 'update', { obstacles: updatedObstacles });
      },

      apiCall: async () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedObstacles = scene?.obstacles.map(o => ({ ...o, ...data }));
        const updatedScenes = StateHelpers.updateSceneInList(state.scenes, state.activeSceneId, { obstacles: updatedObstacles });
        await campaignService.update(campaignId, { scenes: updatedScenes });
      }
    });
  };

  const clearAllObstacles = () => {
    if (!state.activeSceneId) return;
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.updateSceneInList(prev.scenes, prev.activeSceneId, { obstacles: [] });
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        smartSync.apply('scene', state.activeSceneId, 'update', { obstacles: [] });
      },

      apiCall: async () => {
        const updatedScenes = StateHelpers.updateSceneInList(state.scenes, state.activeSceneId, { obstacles: [] });
        await campaignService.update(campaignId, { scenes: updatedScenes });
      }
    });
  };

  const undoLastObstacle = () => {
    if (!state.activeSceneId) return;
    const scene = state.scenes.find(s => s.id === state.activeSceneId);
    if (!scene || !scene.obstacles || scene.obstacles.length === 0) return;

    const lastObstacle = scene.obstacles[scene.obstacles.length - 1];
    removeObstacle(lastObstacle.id);
  };

  return {
    addObstacles,
    updateObstacle,
    removeObstacle,
    bulkUpdateObstacles,
    undoLastObstacle,
    clearAllObstacles
  };
};
