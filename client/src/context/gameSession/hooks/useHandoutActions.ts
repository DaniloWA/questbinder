import React from 'react';
import { GameSessionState } from '../types';

import { socketService } from '../../../services/socketService';
import { smartSync } from '../../../services/sync';
import { Handout } from '../../../types';

export const useHandoutActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  show: (notification: any) => void
) => {
  const sharedHandout = state.handouts.find(h => h.sharedWith.length > 0 && (state.isGM || h.sharedWith.includes(state.players.find(p => p.id === state.players[0]?.id)?.id || ''))) || null; // Logic simplified, actual user check is in context

  const createHandout = async (data: any) => {
    if (!state.campaign) return;
    // Use Socket directly to avoid double-write and redundant events
    // The server handler will generate ID and createdAt
    socketService.emit('handout:update', {
      operation: 'create',
      handout: { ...data, campaignId: state.campaign.id, sharedWith: [] }
    });
  };

  const updateHandout = async (id: string, data: any) => {
    smartSync.apply('handout', id, 'update', data);
  };

  const deleteHandout = async (id: string) => {
    smartSync.apply('handout', id, 'delete', {});
  };

  const shareHandout = async (id: string, playerIds: string[]) => {
    const handout = state.handouts.find(h => h.id === id);
    if (!handout) return;

    const updatedHandout = { ...handout, sharedWith: playerIds };
    console.log('[WS] Sharing handout:', { id, playerIds, handoutName: handout.name });

    smartSync.apply('handout', id, 'update', { sharedWith: playerIds });
    console.log('[WS] Handout share emitted:', updatedHandout);

    if (playerIds.length > 0) {
      show({ type: 'success', message: playerIds.length === state.players.length ? '✅ Compartilhado com todos.' : '✅ Compartilhado com selecionados.' });
    } else {
      show({ type: 'info', message: '🔒 Recurso ocultado de todos.' });
    }
  };

  const unshareHandout = () => {
    // We need the actual shared handout instance from the state
    // This function might need to be called with the ID, but to match interface we'll find it
    // Re-implementing finding shared handout here might be redundant if we pass it, but let's stick to state
    // Actually, the original used the derived `sharedHandout` variable.
    // We can find it in state.
    const currentShared = state.handouts.find(h => h.sharedWith.length > 0);
    if (state.isGM && currentShared) {
      shareHandout(currentShared.id, []);
    }
  };

  return {
    createHandout,
    updateHandout,
    deleteHandout,
    shareHandout,
    unshareHandout
  };
};
