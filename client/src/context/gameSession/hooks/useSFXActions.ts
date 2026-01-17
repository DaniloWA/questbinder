import React from 'react';
import { GameSessionState } from '../types';
import { campaignService } from '../../../services/campaignService';
import { socketService } from '../../../services/socketService';
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

      optimisticUpdate: (prev) => {
        const campaign = prev.campaign;
        if (!campaign) return prev;

        const currentPresets = campaign.sfxPresets || [];
        // Check if updating existing
        const existingIndex = currentPresets.findIndex(p => p.id === preset.id);
        let newPresets;

        if (existingIndex >= 0) {
          newPresets = [...currentPresets];
          newPresets[existingIndex] = preset;
        } else {
          newPresets = [...currentPresets, preset];
        }

        return {
          ...prev,
          campaign: { ...campaign, sfxPresets: newPresets }
        };
      },

      apiCall: async () => {
        // We need to fetch latest to respect concurrent edits? 
        // For now, assuming we append/update based on current state provided by optimistic update logic closure?
        // Optimistic update logic runs synchronously.
        // However, campaignService update usually takes partial.
        // We prefer sending the *new* list.
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

        socketService.emit('campaign:update', { changes: { sfxPresets: newPresets } });
      }
    });
  };

  const deleteSFXPreset = (id: string) => {
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      isGMOnly: true,

      optimisticUpdate: (prev) => {
        const campaign = prev.campaign;
        if (!campaign) return prev;

        const newPresets = (campaign.sfxPresets || []).filter(p => p.id !== id);
        return {
          ...prev,
          campaign: { ...campaign, sfxPresets: newPresets }
        };
      },

      apiCall: async () => {
        const currentCampaign = state.campaign;
        if (!currentCampaign) return;
        const newPresets = (currentCampaign.sfxPresets || []).filter(p => p.id !== id);
        await campaignService.update(campaignId, { sfxPresets: newPresets });
      },

      // socketEmit handled by generic update usually, or we need specific event.
      // Assuming campaign:update handles this.
    });
  };

  return {
    saveSFXPreset,
    deleteSFXPreset
  };
};
