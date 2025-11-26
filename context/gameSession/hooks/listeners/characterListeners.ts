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

      // Find the updated character to get all current values
      const updatedCharacter = updatedCharacters.find(char => char.id === characterId);

      const updatedScenes = previousState.scenes.map(scene => ({
        ...scene,
        tokens: scene.tokens.map(token => {
          if (token.linkedId !== characterId) return token;

          // Get the character BEFORE the update for fallback values
          const previousCharacter = previousState.campaignCharacters.find(
            char => char.id === characterId
          );

          // Calculate effective values (prioritize updates, then current character, then previous)
          const effectiveMaxHp = updates.hpMax ?? (updatedCharacter?.hpMax || previousCharacter?.hpMax || 1);
          const effectiveCurrentHp = updates.hpCurrent ?? (updatedCharacter?.hpCurrent ?? previousCharacter?.hpCurrent);
          const effectiveMaxMana = updates.manaMax ?? (updatedCharacter?.manaMax || previousCharacter?.manaMax || 0);
          const effectiveCurrentMana = updates.manaCurrent ?? (updatedCharacter?.manaCurrent ?? previousCharacter?.manaCurrent);

          const updatedConditions = calculateTokenConditions(
            effectiveCurrentHp,
            effectiveMaxHp,
            token.conditions || []
          );

          // Build the token update object with ALL relevant character fields
          const tokenUpdate: any = {
            ...token,
            conditions: updatedConditions,
          };

          // Sync name
          if (updates.name !== undefined) {
            tokenUpdate.name = updates.name;
          }

          // Sync HP bars
          if (updates.hpCurrent !== undefined || updates.hpMax !== undefined) {
            tokenUpdate.bars = {
              ...token.bars,
              bar1: {
                ...(token.bars?.bar1 || { visible: true, color: '#ef4444' }),
                value: effectiveCurrentHp ?? (token.bars?.bar1?.value || 0),
                max: effectiveMaxHp
              }
            };
          }

          // Sync Mana/Resource bars
          if (updates.manaCurrent !== undefined || updates.manaMax !== undefined) {
            tokenUpdate.bars = {
              ...(tokenUpdate.bars || token.bars),
              bar2: {
                ...(token.bars?.bar2 || { visible: true, color: '#3b82f6' }),
                value: effectiveCurrentMana ?? (token.bars?.bar2?.value || 0),
                max: effectiveMaxMana
              }
            };
          }

          // Sync stats object for TokenHoverCard
          if (updates.armorClass !== undefined ||
            updates.speed !== undefined ||
            updates.attributes !== undefined ||
            updates.passivePerception !== undefined) {

            tokenUpdate.stats = {
              ...(token.stats || {}),
              ac: updates.armorClass ?? (updatedCharacter?.armorClass || token.stats?.ac || 10),
              speed: updates.speed !== undefined
                ? `${updates.speed}m`
                : (updatedCharacter?.speed ? `${updatedCharacter.speed}m` : token.stats?.speed || '9m'),
              attributes: updates.attributes ?? (updatedCharacter?.attributes || token.stats?.attributes || {
                str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, cou: 10
              })
            };
          }

          // Sync vision ranges
          if (updates.visionRange !== undefined) {
            tokenUpdate.visionRange = updates.visionRange;
          }
          if (updates.darkvisionRange !== undefined) {
            tokenUpdate.darkvisionRange = updates.darkvisionRange;
          }

          // Sync speed (for movement ruler)
          if (updates.speed !== undefined) {
            tokenUpdate.speed = updates.speed;
          }

          return tokenUpdate;
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
