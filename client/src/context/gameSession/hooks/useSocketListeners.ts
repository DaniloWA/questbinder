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
  registerPlayerListeners,
  registerAttackZoneListeners
} from './listeners';
import React from 'react';

import { CursorMovePayload } from '../../../types/socket';

/**
 * Main hook to register all socket listeners
 * Orchestrates listener registration and cleanup
 */
export const useSocketListeners = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  user: any,
  show: (notification: any) => void,
  setViewport: ((v: any) => void) | undefined,
  stateRef: React.MutableRefObject<GameSessionState>,
  remoteCursorsRef: React.MutableRefObject<Record<string, CursorMovePayload>>
) => {
  useEffect(() => {
    if (!state.isConnected) return;

    // Create dependencies object for all listeners
    const deps = { state, setState, campaignId, user, show, setViewport, stateRef, remoteCursorsRef };

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
      registerPlayerListeners(deps),
      registerAttackZoneListeners(deps)
    ];

    // Cleanup function called on unmount or when dependencies change
    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [state.isConnected, campaignId, user?.id]);
};
