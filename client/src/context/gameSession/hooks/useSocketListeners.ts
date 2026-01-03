import { useEffect } from 'react';
import { GameSessionState } from '../types';
import {
  registerCampaignListeners,
  registerSceneListeners,
  registerTokenListeners,
  registerCombatListeners,
  registerChatListeners,
  registerDrawingListeners,
  registerAudioListeners,
  registerCharacterListeners,
  registerPlayerListeners
} from './listeners';
import React from 'react';

/**
 * Main hook to register all socket listeners
 * Orchestrates listener registration and cleanup
 */
export const useSocketListeners = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  user: any,
  show: (notification: any) => void
) => {
  useEffect(() => {
    if (!state.isConnected) return;

    // Create dependencies object for all listeners
    const deps = { state, setState, campaignId, user, show };

    // Register all listener modules and collect cleanup functions
    const cleanups = [
      registerCampaignListeners(deps),
      registerSceneListeners(deps),
      registerTokenListeners(deps),
      registerCombatListeners(deps),
      registerChatListeners(deps),
      registerDrawingListeners(deps),
      registerAudioListeners(deps),
      registerCharacterListeners(deps),
      registerPlayerListeners(deps)
    ];

    // Cleanup function called on unmount or when dependencies change
    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [state.isConnected, campaignId, user?.id]);
};
