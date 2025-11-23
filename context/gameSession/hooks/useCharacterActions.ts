import React from 'react';
import { GameSessionState } from '../types';
import { characterService } from '../../../services/characterService';
import { Character } from '../../../types';
import { socketService } from '../../../services/socketService';

export const useCharacterActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>
) => {
  const updateCharacter = async (id: string, data: Partial<Character>) => {
    setState(prev => ({
      ...prev,
      campaignCharacters: prev.campaignCharacters.map(c => c.id === id ? { ...c, ...data } : c)
    }));
    await characterService.update(id, data);
    socketService.emit('character:update', { characterId: id, updates: data });
  };

  return {
    updateCharacter
  };
};
