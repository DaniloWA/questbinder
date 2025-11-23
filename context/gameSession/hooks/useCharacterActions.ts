import React, { useRef, useCallback } from 'react';
import { GameSessionState } from '../types';
import { characterService } from '../../../services/characterService';
import { Character } from '../../../types';
import { socketService } from '../../../services/socketService';

export const useCharacterActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>
) => {
  const updateTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingUpdates = useRef<Record<string, Partial<Character>>>({});

  // Immediate update (for critical actions like HP changes, rest, etc)
  const updateCharacterImmediate = async (id: string, data: Partial<Character>) => {
    console.log('[CharacterActions] Immediate update for', id, data);

    // Clear any pending debounced updates for this character
    if (updateTimers.current[id]) {
      clearTimeout(updateTimers.current[id]);
      delete updateTimers.current[id];
      delete pendingUpdates.current[id];
    }

    // Update local state immediately
    setState(prev => ({
      ...prev,
      campaignCharacters: prev.campaignCharacters.map(c => c.id === id ? { ...c, ...data } : c)
    }));

    // Send to API and WebSocket
    try {
      await characterService.update(id, data);
      socketService.emit('character:update', { characterId: id, updates: data });
    } catch (err) {
      console.error('[CharacterActions] Failed to update character:', err);
      // TODO: Show error to user and rollback optimistic update
    }
  };

  // Debounced update (for text inputs, incremental changes)
  const updateCharacterDebounced = useCallback((id: string, data: Partial<Character>, delay: number = 500) => {
    console.log('[CharacterActions] Debounced update scheduled for', id, data);

    // Update local state immediately for responsive UI
    setState(prev => ({
      ...prev,
      campaignCharacters: prev.campaignCharacters.map(c => c.id === id ? { ...c, ...data } : c)
    }));

    // Accumulate updates
    pendingUpdates.current[id] = {
      ...pendingUpdates.current[id],
      ...data
    };

    // Clear existing timer
    if (updateTimers.current[id]) {
      clearTimeout(updateTimers.current[id]);
    }

    // Set new timer for API/WebSocket update
    updateTimers.current[id] = setTimeout(async () => {
      const updates = pendingUpdates.current[id];
      delete pendingUpdates.current[id];
      delete updateTimers.current[id];

      console.log('[CharacterActions] Executing debounced update for', id, updates);

      try {
        await characterService.update(id, updates);
        socketService.emit('character:update', { characterId: id, updates });
      } catch (err) {
        console.error('[CharacterActions] Failed to update character:', err);
        // TODO: Show error to user and rollback optimistic update
      }
    }, delay);
  }, [setState]);

  // Generic update (uses debounce by default, can be overridden)
  const updateCharacter = async (id: string, data: Partial<Character>, immediate: boolean = false) => {
    if (immediate) {
      await updateCharacterImmediate(id, data);
    } else {
      updateCharacterDebounced(id, data);
    }
  };

  return {
    updateCharacter,
    updateCharacterImmediate,
    updateCharacterDebounced
  };
};
