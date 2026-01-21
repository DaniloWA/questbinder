import React, { useRef, useCallback } from 'react';
import { GameSessionState } from '../types';
import { characterService } from '../../../services/characterService';
import { Character, User } from '../../../types';
import { socketService } from '../../../services/socketService';
import { smartSync } from '../../../services/sync';
import { PermissionHelper } from '../helpers/PermissionHelper';
import { useLatestRef } from '../../../hooks/useLatestRef';

// Critical fields that should bypass debounce for instant updates
const CRITICAL_FIELDS = new Set([
  'hpCurrent', 'hpMax', 'hpTemp',
  'manaCurrent', 'manaMax',
  'conditions', 'deathSaves',
  'heroicInspiration', 'exhaustion'
]);

export const useCharacterActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  user: User | null,
  permissionHelper: PermissionHelper,
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
) => {
  // State ref to always have access to latest state in callbacks (prevents stale closures)
  const stateRef = useLatestRef(state);

  const updateTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingUpdates = useRef<Record<string, Partial<Character>>>({});
  const lastSentUpdates = useRef<Record<string, Partial<Character>>>({});

  const canEditCharacter = (character: Character): boolean => {
    if (!user) return false;
    if (permissionHelper.isGameMaster()) return true;

    const isOwner = character.ownerId === user.id;
    const hasSheetEditPerm = permissionHelper.can('sheetEdit');

    return isOwner && hasSheetEditPerm;
  };

  // Helper: Check if update contains critical fields
  const hasCriticalFields = (data: Partial<Character>): boolean => {
    return Object.keys(data).some(key => CRITICAL_FIELDS.has(key));
  };

  // Helper: Get only changed fields (diff from last sent)
  const getChangedFields = (characterId: string, data: Partial<Character>): Partial<Character> => {
    const lastSent = lastSentUpdates.current[characterId] || {};
    const changed: Partial<Character> = {};

    Object.keys(data).forEach(key => {
      const typedKey = key as keyof Character;
      if (JSON.stringify(data[typedKey]) !== JSON.stringify(lastSent[typedKey])) {
        (changed as any)[key] = data[typedKey];
      }
    });

    return changed;
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

    // Get only changed fields to minimize payload
    const changedFields = getChangedFields(id, data);
    if (Object.keys(changedFields).length === 0) {
      console.log('[CharacterActions] No changes detected, skipping update');
      return;
    }

    // REMOVED: Immediate setState. SmartSync.apply will trigger the Bridge update.

    // Track what we sent (Important for diffing)
    lastSentUpdates.current[id] = { ...lastSentUpdates.current[id], ...changedFields };

    // Send to API and WebSocket
    try {
      await characterService.update(id, changedFields);
      smartSync.apply('character', id, 'update', changedFields);
      console.log('[CharacterActions] Sent immediate update:', changedFields);
    } catch (err: any) {
      console.error('[CharacterActions] Failed to update character:', err);
      console.error('[CharacterActions] Failed to update character:', err);
      showNotification(err?.message || 'Erro ao atualizar ficha.', 'error');

      // Rollback is handled by SmartSync cache if socket fails, 
      // though API failure logic here implies we might want to reload?
      // Since SmartSync is the source of truth, we trust its state.
    }
  };

  // Debounced update (for text inputs, incremental changes)
  const updateCharacterDebounced = useCallback((id: string, data: Partial<Character>, delay: number = 800) => {
    console.log('[CharacterActions] Debounced update scheduled for', id, data);

    // Use stateRef to get the latest state (avoids stale closure)
    const currentState = stateRef.current;
    const character = currentState.campaignCharacters.find(c => c.id === id);
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

      // Get only changed fields
      const changedFields = getChangedFields(id, updates);
      if (Object.keys(changedFields).length === 0) {
        console.log('[CharacterActions] No changes detected in debounced update, skipping');
        return;
      }

      console.log('[CharacterActions] Executing debounced update for', id, changedFields);

      // Track what we sent
      lastSentUpdates.current[id] = { ...lastSentUpdates.current[id], ...changedFields };

      try {
        await characterService.update(id, changedFields);
        smartSync.apply('character', id, 'update', changedFields);
        console.log('[CharacterActions] Sent debounced update:', changedFields);
      } catch (err: any) {
        console.error('[CharacterActions] Failed to update character:', err);
        showNotification(err?.message || 'Erro ao atualizar ficha.', 'error');

        // Rollback optimistic update
        setState(prev => ({
          ...prev,
          campaignCharacters: prev.campaignCharacters.map(c => c.id === id ? character : c)
        }));
      }
    }, delay);
  }, [state.campaignCharacters, setState, user, permissionHelper, showNotification]);

  // Generic update (smart routing based on field criticality)
  const updateCharacter = async (id: string, data: Partial<Character>, immediate: boolean = false) => {
    // Force immediate if explicitly requested OR if contains critical fields
    const shouldBeImmediate = immediate || hasCriticalFields(data);

    if (shouldBeImmediate) {
      await updateCharacterImmediate(id, data);
    } else {
      updateCharacterDebounced(id, data);
    }
  };

  // Toggle field privacy
  const toggleFieldPrivacy = async (characterId: string, fieldName: string) => {
    const character = state.campaignCharacters.find(c => c.id === characterId);
    if (!character) return;

    const privateFields = character.privateFields || [];
    const isPrivate = privateFields.includes(fieldName);

    const newPrivateFields = isPrivate
      ? privateFields.filter(f => f !== fieldName)
      : [...privateFields, fieldName];

    await updateCharacterImmediate(characterId, { privateFields: newPrivateFields });
  };

  return {
    updateCharacter,
    updateCharacterImmediate,
    updateCharacterDebounced,
    toggleFieldPrivacy
  };
};
