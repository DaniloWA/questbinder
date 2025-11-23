import React from 'react';
import { GameSessionState } from '../types';
import { campaignService } from '../../../services/campaignService';
import { socketService } from '../../../services/socketService';
import { TriggerZone, Token } from '../../../types';
import { ActionHandlers, StateHelpers } from '../helpers';

export const useZoneActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  addToken: (token: Partial<Token>) => void
) => {
  const addLightZones = (zones: any[]) => {
    if (!state.activeSceneId) return;
    const newZones = zones.map(z => ({ ...z, id: Math.random().toString(36).substr(2, 9) }));

    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        let updatedScenes = prev.scenes;
        for (const zone of newZones) {
          updatedScenes = StateHelpers.addItemToSceneList(updatedScenes, prev.activeSceneId, 'lightZones', zone);
        }
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const currentZones = scene?.lightZones || [];
        const updatedZones = [...currentZones, ...newZones];
        socketService.emit('scene:update', { id: state.activeSceneId, changes: { lightZones: updatedZones } });
      },

      apiCall: async () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const currentZones = scene?.lightZones || [];
        const updatedZones = [...currentZones, ...newZones];
        const updatedScenes = StateHelpers.updateSceneInList(state.scenes, state.activeSceneId, { lightZones: updatedZones });
        await campaignService.update(campaignId, { scenes: updatedScenes });
      }
    });
  };

  const addLightToken = (x: number, y: number) => {
    const token: Partial<Token> = {
      name: 'Fonte de Luz',
      type: 'object',
      x, y,
      size: 1,
      imgUrl: '',
      isVisibleToPlayers: true,
      light: { enabled: true, brightRadius: 9, dimRadius: 18, color: '#fbbf24', intensity: 0.5, animation: 'torch' }
    };
    addToken(token);
  };

  const addTriggerZones = (zones: Omit<TriggerZone, 'id'>[]) => {
    if (!state.activeSceneId) return;
    const newZones: TriggerZone[] = zones.map(z => ({ ...z, id: Math.random().toString(36).substr(2, 9) }));

    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        let updatedScenes = prev.scenes;
        for (const zone of newZones) {
          updatedScenes = StateHelpers.addItemToSceneList(updatedScenes, prev.activeSceneId, 'triggerZones', zone);
        }
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const currentZones = scene?.triggerZones || [];
        const updatedZones = [...currentZones, ...newZones];
        socketService.emit('scene:update', { id: state.activeSceneId, changes: { triggerZones: updatedZones } });
      },

      apiCall: async () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const currentZones = scene?.triggerZones || [];
        const updatedZones = [...currentZones, ...newZones];
        const updatedScenes = StateHelpers.updateSceneInList(state.scenes, state.activeSceneId, { triggerZones: updatedZones });
        await campaignService.update(campaignId, { scenes: updatedScenes });
      }
    });
  };

  const updateTriggerZone = (id: string, data: Partial<TriggerZone>) => {
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.updateItemInSceneList(prev.scenes, prev.activeSceneId, 'triggerZones', id, data);
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedZones = scene?.triggerZones?.map(z => z.id === id ? { ...z, ...data } : z);
        socketService.emit('scene:update', { id: state.activeSceneId, changes: { triggerZones: updatedZones } });
      },

      apiCall: async () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedZones = scene?.triggerZones?.map(z => z.id === id ? { ...z, ...data } : z);
        const updatedScenes = StateHelpers.updateSceneInList(state.scenes, state.activeSceneId, { triggerZones: updatedZones });
        await campaignService.update(campaignId, { scenes: updatedScenes });
      }
    });
  };

  const removeTriggerZone = (id: string) => {
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.removeItemFromSceneList(prev.scenes, prev.activeSceneId, 'triggerZones', id);
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedZones = scene?.triggerZones?.filter(z => z.id !== id);
        socketService.emit('scene:update', { id: state.activeSceneId, changes: { triggerZones: updatedZones } });
      },

      apiCall: async () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedZones = scene?.triggerZones?.filter(z => z.id !== id);
        const updatedScenes = StateHelpers.updateSceneInList(state.scenes, state.activeSceneId, { triggerZones: updatedZones });
        await campaignService.update(campaignId, { scenes: updatedScenes });
      }
    });
  };

  const closeTriggeredHandout = () => setState(prev => ({ ...prev, triggeredHandoutId: null }));

  return {
    addLightZones,
    addLightToken,
    addTriggerZones,
    updateTriggerZone,
    removeTriggerZone,
    closeTriggeredHandout
  };
};
