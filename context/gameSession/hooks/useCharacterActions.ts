import React, { useRef, useCallback } from 'react';
import { GameSessionState } from '../types';
import { characterService } from '../../../services/characterService';
import { Character, User } from '../../../types';
import { socketService } from '../../../services/socketService';
import { PermissionHelper } from '../helpers/PermissionHelper';

export const useCharacterActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  user: User | null,
  permissionHelper: PermissionHelper,
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
) => {
  const updateTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingUpdates = useRef<Record<string, Partial<Character>>>({});

  const canEditCharacter = (character: Character): boolean => {
    if (!user) return false;
    if (permissionHelper.isGameMaster()) return true;

    const isOwner = character.ownerId === user.id;
    const hasSheetEditPerm = permissionHelper.can('sheetEdit');

    return isOwner && hasSheetEditPerm;
  };

  // Immediate update (for critical actions like HP changes, rest, etc)
  const updateCharacterImmediate = async (id: string, data: Partial<Character>) => {
    console.log('[CharacterActions] Immediate update for', id, data);

    const character = state.campaignCharacters.find(c => c.id === id);
    if (!character) {
      console.error('[CharacterActions] Character not found:', id);
      return;
    }

    if (!canEditCharacter(character)) {
      console.warn('[CharacterActions] Permission denied: cannot edit character', id);
      showNotification('Você não tem permissão para editar esta ficha.', 'error');
      return;
    }

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

    const character = state.campaignCharacters.find(c => c.id === id);
    if (!character) {
      console.error('[CharacterActions] Character not found:', id);
      return;
    }

    if (!canEditCharacter(character)) {
      console.warn('[CharacterActions] Permission denied: cannot edit character', id);
      showNotification('Você não tem permissão para editar esta ficha.', 'error');
      return;
    }

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
  }, [state.campaignCharacters, setState, user, permissionHelper, showNotification]); // Added dependencies

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
