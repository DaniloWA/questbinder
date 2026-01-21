import { useEffect } from 'react';
import { GameSessionState } from '../types';
import { smartSync } from '../../../services/sync';
import { EntityType, ChangeType } from '../../../services/sync/types';
import { Token, MapScene, MapDrawing, Obstacle, Character, Handout, ChatMessage } from '../../../types';
import { AttackZoneConfig } from '../../../types/attackZone';

/**
 * useSmartSyncBridge
 * 
 * Bridges SmartSync Cache and React State.
 * Subscribes to ALL entity types from SmartSync and updates GameSessionState accordingly.
 * 
 * NOTE: Direct listeners (useSocketListeners) also update React state.
 * This bridge handles optimistic update confirmations and cache conflicts.
 */
export const useSmartSyncBridge = (
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>
) => {
  useEffect(() => {
    // Generic handler factory for all entity types
    const createHandler = (entityType: EntityType) => (
      entityId: string,
      data: any,
      changeType: ChangeType,
      parentId?: string
    ) => {
      setState(prev => {
        const newState = { ...prev };

        switch (entityType) {
          // ===== Scene-scoped entities =====
          case 'token': {
            if (!parentId) return prev;
            const sceneIndex = newState.scenes.findIndex(s => s.id === parentId);
            if (sceneIndex === -1) return prev;

            const scene = { ...newState.scenes[sceneIndex] };
            const tokens = [...scene.tokens];

            if (changeType === 'delete') {
              scene.tokens = tokens.filter(t => t.id !== entityId);
            } else {
              const tokenIndex = tokens.findIndex(t => t.id === entityId);
              if (tokenIndex > -1) {
                if (changeType === 'update') {
                  tokens[tokenIndex] = { ...tokens[tokenIndex], ...data };
                } else if (changeType === 'create') {
                  tokens[tokenIndex] = { ...data, id: entityId } as Token;
                }
              } else if (data) {
                tokens.push({ ...data, id: entityId } as Token);
              }
              scene.tokens = tokens;
            }

            newState.scenes = [...newState.scenes];
            newState.scenes[sceneIndex] = scene;
            break;
          }

          case 'drawing': {
            if (!parentId) return prev;
            const sceneIndex = newState.scenes.findIndex(s => s.id === parentId);
            if (sceneIndex === -1) return prev;

            const scene = { ...newState.scenes[sceneIndex] };
            const drawings = [...(scene.drawings || [])];

            if (changeType === 'delete') {
              scene.drawings = drawings.filter(d => d.id !== entityId);
            } else {
              const drawingIndex = drawings.findIndex(d => d.id === entityId);
              if (drawingIndex > -1) {
                drawings[drawingIndex] = { ...drawings[drawingIndex], ...data };
              } else if (data) {
                drawings.push({ ...data, id: entityId } as MapDrawing);
              }
              scene.drawings = drawings;
            }
            newState.scenes = [...newState.scenes];
            newState.scenes[sceneIndex] = scene;
            break;
          }

          case 'obstacle': {
            if (!parentId) return prev;
            const sceneIndex = newState.scenes.findIndex(s => s.id === parentId);
            if (sceneIndex === -1) return prev;

            const scene = { ...newState.scenes[sceneIndex] };
            const obstacles = [...(scene.obstacles || [])];

            if (changeType === 'delete') {
              scene.obstacles = obstacles.filter(o => o.id !== entityId);
            } else {
              const obsIndex = obstacles.findIndex(o => o.id === entityId);
              if (obsIndex > -1) {
                obstacles[obsIndex] = { ...obstacles[obsIndex], ...data };
              } else if (data) {
                obstacles.push({ ...data, id: entityId } as Obstacle);
              }
              scene.obstacles = obstacles;
            }
            newState.scenes = [...newState.scenes];
            newState.scenes[sceneIndex] = scene;
            break;
          }

          // ===== Root-level entities =====
          case 'scene': {
            if (changeType === 'delete') {
              newState.scenes = newState.scenes.filter(s => s.id !== entityId);
              if (newState.activeSceneId === entityId) {
                newState.activeSceneId = newState.scenes[0]?.id || '';
              }
            } else if (changeType === 'create') {
              if (!newState.scenes.find(s => s.id === entityId) && data) {
                newState.scenes = [...newState.scenes, { ...data, id: entityId } as MapScene];
              }
            } else {
              const sceneIndex = newState.scenes.findIndex(s => s.id === entityId);
              if (sceneIndex > -1) {
                newState.scenes = [...newState.scenes];
                newState.scenes[sceneIndex] = { ...newState.scenes[sceneIndex], ...data };
              }
            }
            break;
          }

          case 'character': {
            if (changeType === 'delete') {
              newState.campaignCharacters = newState.campaignCharacters.filter(c => c.id !== entityId);
            } else {
              const charIndex = newState.campaignCharacters.findIndex(c => c.id === entityId);
              if (charIndex > -1) {
                const chars = [...newState.campaignCharacters];
                chars[charIndex] = { ...chars[charIndex], ...data };
                newState.campaignCharacters = chars;
              } else if (changeType === 'create' && data) {
                newState.campaignCharacters = [...newState.campaignCharacters, { ...data, id: entityId } as Character];
              }
            }
            break;
          }

          case 'combat': {
            if (changeType === 'delete') {
              newState.combat = null;
            } else if (data) {
              newState.combat = { ...newState.combat, ...data };
            }
            break;
          }

          case 'combatant': {
            if (!newState.combat) return prev;
            const turnOrder = [...newState.combat.turnOrder];

            if (changeType === 'delete') {
              newState.combat = {
                ...newState.combat,
                turnOrder: turnOrder.filter(c => c.id !== entityId)
              };
            } else {
              const combatantIndex = turnOrder.findIndex(c => c.id === entityId);
              if (combatantIndex > -1) {
                turnOrder[combatantIndex] = { ...turnOrder[combatantIndex], ...data };
              } else if (data) {
                turnOrder.push({ ...data, id: entityId });
              }
              newState.combat = { ...newState.combat, turnOrder };
            }
            break;
          }

          case 'attackZone': {
            if (changeType === 'delete') {
              newState.attackZones = newState.attackZones.filter(z => z.id !== entityId);
            } else {
              const zoneIndex = newState.attackZones.findIndex(z => z.id === entityId);
              if (zoneIndex > -1) {
                const zones = [...newState.attackZones];
                zones[zoneIndex] = { ...zones[zoneIndex], ...data };
                newState.attackZones = zones;
              } else if (data) {
                newState.attackZones = [...newState.attackZones, { ...data, id: entityId } as AttackZoneConfig];
              }
            }
            break;
          }

          case 'campaign': {
            if (newState.campaign && data) {
              newState.campaign = { ...newState.campaign, ...data };
              if (data.permissions) {
                newState.permissions = data.permissions;
              }
            }
            break;
          }

          case 'handout': {
            if (changeType === 'delete') {
              newState.handouts = newState.handouts.filter(h => h.id !== entityId);
            } else {
              const handoutIndex = newState.handouts.findIndex(h => h.id === entityId);
              if (handoutIndex > -1) {
                const handouts = [...newState.handouts];
                handouts[handoutIndex] = { ...handouts[handoutIndex], ...data };
                newState.handouts = handouts;
              } else if (data) {
                newState.handouts = [...newState.handouts, { ...data, id: entityId } as Handout];
              }
            }
            break;
          }

          case 'chatMessage': {
            if (changeType === 'delete') {
              newState.chatMessages = newState.chatMessages.filter(m => m.id !== entityId);
            } else {
              const msgIndex = newState.chatMessages.findIndex(m => m.id === entityId);
              if (msgIndex > -1) {
                const messages = [...newState.chatMessages];
                messages[msgIndex] = { ...messages[msgIndex], ...data };
                newState.chatMessages = messages;
              } else if (data) {
                newState.chatMessages = [...newState.chatMessages, { ...data, id: entityId } as ChatMessage];
              }
            }
            break;
          }

          case 'player': {
            if (changeType === 'delete') {
              newState.players = newState.players.filter(p => p.id !== entityId);
            } else {
              const playerIndex = newState.players.findIndex(p => p.id === entityId);
              if (playerIndex > -1) {
                const players = [...newState.players];
                players[playerIndex] = { ...players[playerIndex], ...data };
                newState.players = players;
              } else if (data) {
                newState.players = [...newState.players, { ...data, id: entityId }];
              }
            }
            break;
          }

          // Zone types (not currently used but included for completeness)
          case 'lightZone':
          case 'audioZone':
          case 'triggerZone':
            // These would follow similar scene-scoped patterns
            break;
        }

        return newState;
      });
    };

    // Subscribe to ALL entity types
    const unsubs = [
      // Scene-scoped entities
      smartSync.subscribe('token', createHandler('token')),
      smartSync.subscribe('drawing', createHandler('drawing')),
      smartSync.subscribe('obstacle', createHandler('obstacle')),
      // Root-level entities
      smartSync.subscribe('scene', createHandler('scene')),
      smartSync.subscribe('character', createHandler('character')),
      smartSync.subscribe('combat', createHandler('combat')),
      smartSync.subscribe('combatant', createHandler('combatant')),
      smartSync.subscribe('attackZone', createHandler('attackZone')),
      smartSync.subscribe('campaign', createHandler('campaign')),
      smartSync.subscribe('handout', createHandler('handout')),
      smartSync.subscribe('chatMessage', createHandler('chatMessage')),
      smartSync.subscribe('player', createHandler('player')),
    ];

    return () => {
      unsubs.forEach(unsubscribe => unsubscribe());
    };
  }, [setState]);
};
