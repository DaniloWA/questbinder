import { socketService } from '../../../../services/socketService';
import { Character } from '../../../../types';
import { notifySmartSync } from '../../syncHelpers';
import { ListenerDeps, ListenerCleanup } from './types';


const calculateTokenConditions = (
  currentHp: number | undefined,
  maxHp: number,
  existingConditions: string[]
): string[] => {
  if (currentHp === undefined) return existingConditions;

  let updatedConditions = [...existingConditions];
  const isDead = currentHp === 0;
  const isBloodied = currentHp <= maxHp / 2 && currentHp > 0;

  if (isDead && !updatedConditions.includes('dead')) {
    updatedConditions.push('dead');
  } else if (!isDead && updatedConditions.includes('dead')) {
    updatedConditions = updatedConditions.filter(condition => condition !== 'dead');
  }

  if (isBloodied && !updatedConditions.includes('bloodied')) {
    updatedConditions.push('bloodied');
  } else if (!isBloodied && updatedConditions.includes('bloodied')) {
    updatedConditions = updatedConditions.filter(condition => condition !== 'bloodied');
  }

  return updatedConditions;
};

/**
 * Registers listeners for character events.
 * Handlers update React state AND notify SmartSync cache.
 * 
 * Special handling: Character updates cascade to linked tokens.
 */
export const registerCharacterListeners = ({
  setState
}: ListenerDeps): ListenerCleanup => {

  const handleCharacterAdd = (character: Character) => {
    setState(previousState => ({
      ...previousState,
      campaignCharacters: [...previousState.campaignCharacters, character]
    }));

    notifySmartSync({
      entityType: 'character',
      entityId: character.id,
      changeType: 'create',
      data: character
    });
  };

  const handleCharacterUpdate = (payload: any) => {
    let characterId: string;
    let updates: any;

    if (payload.updates && payload.characterId) {
      characterId = payload.characterId;
      updates = payload.updates;
    } else if (payload.id) {
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

      const updatedCharacter = updatedCharacters.find(char => char.id === characterId);

      // Cascade to linked tokens
      const updatedScenes = previousState.scenes.map(scene => ({
        ...scene,
        tokens: scene.tokens.map(token => {
          if (token.linkedId !== characterId) return token;

          const previousCharacter = previousState.campaignCharacters.find(
            char => char.id === characterId
          );

          const effectiveMaxHp = updates.hpMax ?? (updatedCharacter?.hpMax || previousCharacter?.hpMax || 1);
          const effectiveCurrentHp = updates.hpCurrent ?? (updatedCharacter?.hpCurrent ?? previousCharacter?.hpCurrent);
          const effectiveMaxMana = updates.manaMax ?? (updatedCharacter?.manaMax || previousCharacter?.manaMax || 0);
          const effectiveCurrentMana = updates.manaCurrent ?? (updatedCharacter?.manaCurrent ?? previousCharacter?.manaCurrent);

          const updatedConditions = calculateTokenConditions(
            effectiveCurrentHp,
            effectiveMaxHp,
            token.conditions || []
          );

          const tokenChanges: any = {
            conditions: updatedConditions,
          };

          if (updates.name !== undefined) {
            tokenChanges.name = updates.name;
          }

          if (updates.hpCurrent !== undefined || updates.hpMax !== undefined) {
            tokenChanges.bars = {
              ...token.bars,
              bar1: {
                ...(token.bars?.bar1 || { visible: true, color: '#ef4444' }),
                value: effectiveCurrentHp ?? (token.bars?.bar1?.value || 0),
                max: effectiveMaxHp
              }
            };
          }

          if (updates.manaCurrent !== undefined || updates.manaMax !== undefined) {
            tokenChanges.bars = {
              ...(tokenChanges.bars || token.bars),
              bar2: {
                ...(token.bars?.bar2 || { visible: true, color: '#3b82f6' }),
                value: effectiveCurrentMana ?? (token.bars?.bar2?.value || 0),
                max: effectiveMaxMana
              }
            };
          }

          if (updates.armorClass !== undefined ||
            updates.speed !== undefined ||
            updates.attributes !== undefined ||
            updates.passivePerception !== undefined) {

            tokenChanges.stats = {
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

          if (updates.visionRange !== undefined) {
            tokenChanges.visionRange = updates.visionRange;
          }
          if (updates.darkvisionRange !== undefined) {
            tokenChanges.darkvisionRange = updates.darkvisionRange;
          }
          if (updates.speed !== undefined) {
            tokenChanges.speed = updates.speed;
          }

          return { ...token, ...tokenChanges };
        })
      }));

      return {
        ...previousState,
        campaignCharacters: updatedCharacters,
        scenes: updatedScenes
      };
    });

    notifySmartSync({
      entityType: 'character',
      entityId: characterId,
      changeType: 'update',
      data: updates
    });
  };

  const handleCharacterDelete = (payload: { id: string; }) => {
    setState(previousState => ({
      ...previousState,
      campaignCharacters: previousState.campaignCharacters.filter(
        character => character.id !== payload.id
      )
    }));

    notifySmartSync({
      entityType: 'character',
      entityId: payload.id,
      changeType: 'delete',
      data: {}
    });
  };

  // Register listeners
  socketService.on('character:add', handleCharacterAdd);
  socketService.on('character:update', handleCharacterUpdate);
  socketService.on('character:delete', handleCharacterDelete);

  return () => {
    socketService.off('character:add', handleCharacterAdd);
    socketService.off('character:update', handleCharacterUpdate);
    socketService.off('character:delete', handleCharacterDelete);
  };
};
