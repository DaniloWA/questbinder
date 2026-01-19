import { useEffect } from 'react';
import { GameSessionState } from '../types';
import { smartSync } from '../../../services/sync';
import { EntityType, ChangeType } from '../../../services/sync/types';
import { Token, MapScene, MapDrawing, Obstacle, Character } from '../../../types';

/**
 * useSmartSyncBridge
 * 
 * Bridges the gap between SmartSync Cache (Optimistic/Sync) and React State (UI).
 * Listens to changes from SmartSyncService via subscriptions and updates GameSessionState.
 * This effectively replaces/augments useSocketListeners for synced entities.
 */
export const useSmartSyncBridge = (
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>
) => {
  useEffect(() => {
    // Generic handler factory
    const createHandler = (entityType: EntityType) => (
      entityId: string,
      data: any,
      changeType: ChangeType,
      parentId?: string
    ) => {
      setState(prev => {
        const newState = { ...prev };

        switch (entityType) {
          case 'token': {
            // Tokens must belong to a scene
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
                // Update existing
                if (changeType === 'update') {
                  tokens[tokenIndex] = { ...tokens[tokenIndex], ...data };
                } else if (changeType === 'create') {
                  // Overwrite if exists
                  tokens[tokenIndex] = { ...data, id: entityId } as Token;
                }
              } else if (changeType === 'create' || changeType === 'update') {
                // Add new
                if (data) {
                  tokens.push({ ...data, id: entityId } as Token);
                }
              }
              scene.tokens = tokens;
            }

            newState.scenes = [...newState.scenes];
            newState.scenes[sceneIndex] = scene;
            break;
          }

          case 'scene': {
            // Scene updates (root level in scenes array)
            if (changeType === 'delete') {
              newState.scenes = newState.scenes.filter(s => s.id !== entityId);
              // Handle active scene deletion
              if (newState.activeSceneId === entityId) {
                newState.activeSceneId = newState.scenes[0]?.id || '';
              }
            } else if (changeType === 'create') {
              if (!newState.scenes.find(s => s.id === entityId) && data) {
                newState.scenes = [...newState.scenes, { ...data, id: entityId } as MapScene];
              }
            } else {
              // Update
              const sceneIndex = newState.scenes.findIndex(s => s.id === entityId);
              if (sceneIndex > -1) {
                newState.scenes = [...newState.scenes];
                newState.scenes[sceneIndex] = { ...newState.scenes[sceneIndex], ...data };
              }
            }
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
                // Update existing
                drawings[drawingIndex] = { ...drawings[drawingIndex], ...data };
              } else if (data) {
                // Add new
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
                const newObs = { ...data, id: entityId } as Obstacle;
                obstacles.push(newObs);
              }
              scene.obstacles = obstacles;
            }
            newState.scenes = [...newState.scenes];
            newState.scenes[sceneIndex] = scene;
            break;
          }

          case 'character': {
            // Updates campaignCharacters
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
        }

        return newState;
      });
    };

    // Subscriptions
    const unsubs = [
      smartSync.subscribe('token', createHandler('token')),
      smartSync.subscribe('scene', createHandler('scene')),
      smartSync.subscribe('drawing', createHandler('drawing')),
      smartSync.subscribe('obstacle', createHandler('obstacle')),
      smartSync.subscribe('character', createHandler('character')),
    ];

    return () => {
      // Unsubscribe all
      unsubs.forEach(unsubscribe => unsubscribe());
    };
  }, [setState]);
};
