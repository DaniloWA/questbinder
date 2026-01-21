import React from 'react';
import { GameSessionState } from '../types';
import { campaignService } from '../../../services/campaignService';
import { socketService } from '../../../services/socketService';
import { smartSync } from '../../../services/sync';
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

      // Removed optimisticUpdate (SmartSync handles it)

      socketEmit: () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const currentZones = scene?.lightZones || [];
        const updatedZones = [...currentZones, ...newZones];
        smartSync.apply('scene', state.activeSceneId, 'update', { lightZones: updatedZones });
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

      // Removed optimisticUpdate (SmartSync handles it)

      socketEmit: () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const currentZones = scene?.triggerZones || [];
        const updatedZones = [...currentZones, ...newZones];
        smartSync.apply('scene', state.activeSceneId, 'update', { triggerZones: updatedZones });
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

      // Removed optimisticUpdate (SmartSync handles it)

      socketEmit: () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedZones = scene?.triggerZones?.map(z => z.id === id ? { ...z, ...data } : z);
        smartSync.apply('scene', state.activeSceneId, 'update', { triggerZones: updatedZones });
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

      // Removed optimisticUpdate (SmartSync handles it)

      socketEmit: () => {
        const scene = state.scenes.find(s => s.id === state.activeSceneId);
        const updatedZones = scene?.triggerZones?.filter(z => z.id !== id);
        smartSync.apply('scene', state.activeSceneId, 'update', { triggerZones: updatedZones });
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
