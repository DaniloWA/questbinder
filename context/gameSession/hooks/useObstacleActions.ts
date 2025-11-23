import React from 'react';
import { GameSessionState } from '../types';
import { campaignService } from '../../../services/campaignService';
import { socketService } from '../../../services/socketService';
import { ActionHandlers, StateHelpers } from '../helpers';

export const useObstacleActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string
) => {
  const addObstacles = (obstaclesData: any[]) => {
    if (!state.activeSceneId) return;
    const newObstacles = obstaclesData.map(o => ({ ...o, id: Math.random().toString(36).substr(2, 9) }));

    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        let updatedScenes = prev.scenes;
        for (const obs of newObstacles) {
          updatedScenes = StateHelpers.addItemToSceneList(updatedScenes, prev.activeSceneId, 'obstacles', obs);
        }
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        // Note: The original code emitted the ENTIRE obstacle list. 
        // We should probably stick to that for now to avoid breaking changes if the server expects full list.
        // Or we can check if server supports incremental updates. 
        // Based on original code: socketService.emit('scene:update', { id: ..., changes: { obstacles: ... } });
        // It sends the FULL list.
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const currentObstacles = scene?.obstacles || [];
        const updatedObstacles = [...currentObstacles, ...newObstacles];
        socketService.emit('scene:update', { id: state.activeSceneId, changes: { obstacles: updatedObstacles } });
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
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.updateItemInSceneList(prev.scenes, prev.activeSceneId, 'obstacles', id, data);
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        // Re-calculating full list for emit as per original pattern
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedObstacles = scene?.obstacles.map(o => o.id === id ? { ...o, ...data } : o);
        socketService.emit('scene:update', { id: state.activeSceneId, changes: { obstacles: updatedObstacles } });
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

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.removeItemFromSceneList(prev.scenes, prev.activeSceneId, 'obstacles', id);
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedObstacles = scene?.obstacles.filter(o => o.id !== id);
        socketService.emit('scene:update', { id: state.activeSceneId, changes: { obstacles: updatedObstacles } });
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
        socketService.emit('scene:update', { id: state.activeSceneId, changes: { obstacles: updatedObstacles } });
      },

      apiCall: async () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedObstacles = scene?.obstacles.map(o => ({ ...o, ...data }));
        const updatedScenes = StateHelpers.updateSceneInList(state.scenes, state.activeSceneId, { obstacles: updatedObstacles });
        await campaignService.update(campaignId, { scenes: updatedScenes });
      }
    });
  };

  return {
    addObstacles,
    updateObstacle,
    removeObstacle,
    bulkUpdateObstacles
  };
};
