import React from 'react';
import { GameSessionState } from '../types';
import { campaignService } from '../../../services/campaignService';
import { socketService } from '../../../services/socketService';
import { MapScene } from '../../../types';
import { ActionHandlers, StateHelpers } from '../helpers';

export const useSceneActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string
) => {
  const switchScene = (id: string) => {
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => ({ ...prev, activeSceneId: id }),

      apiCall: async () => {
        await campaignService.update(campaignId, { activeSceneId: id });
      },

      socketEmit: () => {
        socketService.emit('scene:switch', { id });
      }
    });
  };

  const addScene = (name: string) => {
    const newScene: MapScene = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      imageUrl: '',
      grid: { size: 70, color: '#FFFFFF', alpha: 0.2, cols: 40, rows: 30, unitsPerSquare: 1.5 },
      ambientLight: 1.0,
      fogPath: '',
      obstacles: [],
      lightZones: [],
      audioZones: [],
      triggerZones: [],
      drawings: [],
      tokens: []
    };

    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        const newScenes = [...prev.scenes, newScene];
        return { ...prev, scenes: newScenes, activeSceneId: newScene.id };
      },

      apiCall: async () => {
        const newScenes = [...state.scenes, newScene];
        await campaignService.update(campaignId, { scenes: newScenes, activeSceneId: newScene.id });
      },

      socketEmit: () => {
        socketService.emit('scene:add', { scene: newScene });
      }
    });
  };

  const deleteScene = (id: string) => {
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        const newScenes = prev.scenes.filter(s => s.id !== id);
        const nextSceneId = prev.activeSceneId === id ? (newScenes[0]?.id || '') : prev.activeSceneId;
        return { ...prev, scenes: newScenes, activeSceneId: nextSceneId };
      },

      apiCall: async () => {
        const newScenes = state.scenes.filter(s => s.id !== id);
        const nextSceneId = state.activeSceneId === id ? (newScenes[0]?.id || '') : state.activeSceneId;
        await campaignService.update(campaignId, { scenes: newScenes, activeSceneId: nextSceneId });
      },

      socketEmit: () => {
        socketService.emit('scene:delete', { id });
      }
    });
  };

  const updateSceneData = (id: string, data: Partial<MapScene>) => {
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.updateSceneInList(prev.scenes, id, data);
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        socketService.emit('scene:update', { id, changes: data });
      }
    });
  };

  const updateMapSettings = (settings: Partial<MapScene>) => {
    if (!state.activeSceneId) return;

    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.updateSceneInList(prev.scenes, prev.activeSceneId, settings);
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        console.log('[WS] Emitting scene:update', { id: state.activeSceneId, changes: settings });
        socketService.emit('scene:update', { id: state.activeSceneId, changes: settings });
      }
    });
  };

  const updateFog = (path: string) => {
    if (!state.activeSceneId) return;

    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.updateSceneInList(prev.scenes, prev.activeSceneId, { fogPath: path });
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        socketService.emit('scene:update', { id: state.activeSceneId, changes: { fogPath: path } });
      }
    });
  };

  return {
    switchScene,
    addScene,
    deleteScene,
    updateSceneData,
    updateMapSettings,
    updateFog
  };
};
