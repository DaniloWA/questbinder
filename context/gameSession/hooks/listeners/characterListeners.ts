import { socketService } from '../../../../services/socketService';
import { Character } from '../../../../types';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Helper: Calculate token conditions based on HP
 */
const calculateTokenConditions = (
  currentHp: number | undefined,
  maxHp: number,
  existingConditions: string[]
): string[] => {
  if (currentHp === undefined) return existingConditions;

  let updatedConditions = [...existingConditions];
  const isDead = currentHp === 0;
  const isBloodied = currentHp <= maxHp / 2 && currentHp > 0;

  // Lógica de "morto"
  if (isDead && !updatedConditions.includes('dead')) {
    updatedConditions.push('dead');
  } else if (!isDead && updatedConditions.includes('dead')) {
    updatedConditions = updatedConditions.filter(condition => condition !== 'dead');
  }

  // Lógica de "ensanguentado"
  if (isBloodied && !updatedConditions.includes('bloodied')) {
    updatedConditions.push('bloodied');
  } else if (!isBloodied && updatedConditions.includes('bloodied')) {
    updatedConditions = updatedConditions.filter(condition => condition !== 'bloodied');
  }

  return updatedConditions;
};

/**
 * Registers listeners for character-related events
 * - character:add
 * - character:update
 * - character:delete
 */
export const registerCharacterListeners = ({
  state,
  setState
}: ListenerDeps): ListenerCleanup => {

  // Handler: character:add
  const handleCharacterAdd = (character: Character) => {
    setState(previousState => ({
      ...previousState,
      campaignCharacters: [...previousState.campaignCharacters, character]
    }));
  };

  // Handler: character:update
  const handleCharacterUpdate = (payload: any) => {
    console.log('[WS] handleCharacterUpdate received:', payload);

    // Normalize payload
    let characterId: string;
    let updates: any;

    if (payload.updates && payload.characterId) {
      // Socket format
      characterId = payload.characterId;
      updates = payload.updates;
    } else if (payload.id) {
      // API format (full object)
      characterId = payload.id;
      updates = payload;
    } else {
      console.warn('[WS] Invalid character update payload:', payload);
      return;
    }

    setState(previousState => {
      const updatedCharacters = previousState.campaignCharacters.map(character =>
        character.id === characterId
          ? { ...character, ...updates }
          : character
      );

      const updatedScenes = previousState.scenes.map(scene => ({
        ...scene,
        tokens: scene.tokens.map(token => {
          if (token.linkedId !== characterId) return token;

          const character = previousState.campaignCharacters.find(
            char => char.id === characterId
          );

          const effectiveMaxHp = updates.hpMax ?? (character?.hpMax || 1);
          const effectiveCurrentHp = updates.hpCurrent;

          const updatedConditions = calculateTokenConditions(
            effectiveCurrentHp,
            effectiveMaxHp,
            token.conditions || []
          );

          return {
            ...token,
            conditions: updatedConditions,
            label: updates.name ?? token.label,
            hpCurrent: effectiveCurrentHp,
            hpMax: effectiveMaxHp,
            ac: updates.armorClass ?? token.ac
          };
        })
      }));

      return {
        ...previousState,
        campaignCharacters: updatedCharacters,
        scenes: updatedScenes
      };
    });
  };

  // Handler: character:delete
  const handleCharacterDelete = (payload: { id: string; }) => {
    setState(previousState => ({
      ...previousState,
      campaignCharacters: previousState.campaignCharacters.filter(
        character => character.id !== payload.id
      )
    }));
  };

  // Register listeners
  socketService.on('character:add', handleCharacterAdd);
  socketService.on('character:update', handleCharacterUpdate);
  socketService.on('character:delete', handleCharacterDelete);

  // Return cleanup function
  return () => {
    socketService.off('character:add', handleCharacterAdd);
    socketService.off('character:update', handleCharacterUpdate);
    socketService.off('character:delete', handleCharacterDelete);
  };
};
