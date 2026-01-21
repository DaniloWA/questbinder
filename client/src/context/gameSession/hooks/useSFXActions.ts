import React from 'react';
import { GameSessionState } from '../types';
import { campaignService } from '../../../services/campaignService';
import { socketService } from '../../../services/socketService';
import { smartSync } from '../../../services/sync';
import { SFXPreset } from '../../../types';
import { ActionHandlers } from '../helpers';

export const useSFXActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string
) => {

  const saveSFXPreset = (preset: SFXPreset) => {
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      // Removed optimisticUpdate (SmartSync handles it)

      apiCall: async () => {
        const currentCampaign = state.campaign;
        if (!currentCampaign) return;

        const currentPresets = currentCampaign.sfxPresets || [];
        const existingIndex = currentPresets.findIndex(p => p.id === preset.id);
        let newPresets;

        if (existingIndex >= 0) {
          newPresets = [...currentPresets];
          newPresets[existingIndex] = preset;
        } else {
          newPresets = [...currentPresets, preset];
        }

        await campaignService.update(campaignId, { sfxPresets: newPresets });
      },

      socketEmit: () => {
        const currentCampaign = state.campaign;
        if (!currentCampaign) return;

        const currentPresets = currentCampaign.sfxPresets || [];
        const existingIndex = currentPresets.findIndex(p => p.id === preset.id);
        let newPresets: SFXPreset[];

        if (existingIndex >= 0) {
          newPresets = [...currentPresets];
          newPresets[existingIndex] = preset;
        } else {
          newPresets = [...currentPresets, preset];
        }

        smartSync.apply('campaign', 'current', 'update', { sfxPresets: newPresets });
      }
    });
  };

  const deleteSFXPreset = (id: string) => {
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      // Removed optimisticUpdate (SmartSync handles it)

      apiCall: async () => {
        const currentCampaign = state.campaign;
        if (!currentCampaign) return;
        const newPresets = (currentCampaign.sfxPresets || []).filter(p => p.id !== id);
        await campaignService.update(campaignId, { sfxPresets: newPresets });
      },

      socketEmit: () => {
        const currentCampaign = state.campaign;
        if (!currentCampaign) return;
        const newPresets = (currentCampaign.sfxPresets || []).filter(p => p.id !== id);
        smartSync.apply('campaign', 'current', 'update', { sfxPresets: newPresets });
      }
    });
  };

  return {
    saveSFXPreset,
    deleteSFXPreset
  };
};
