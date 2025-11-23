import React, { useEffect } from 'react';
import { GameSessionState } from '../types';
import { socketService } from '../../../services/socketService';
import { audioService } from '../../../services/audioService';
import { StateHelpers } from '../helpers';
import {
  CampaignUpdatePayload,
  HandoutUpdatePayload,
  TokenUpdatePayload,
  TokenDragPayload,
  CursorMovePayload,
  DrawingAddPayload,
  DrawingRemovePayload,
  SceneUpdatePayload,
  SceneAddPayload,
  SceneDeletePayload,
  SceneSwitchPayload,
  CombatUpdatePayload,
  DiceRollPayload,
  ChatMessagePayload,
  SessionPermissionsPayload,
  MapPingPayload,
  AudioPlayPayload,
  Character,
  SocketEventMap
} from '../../../types';

export const useSocketListeners = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  user: any,
  show: (notification: any) => void
) => {
  useEffect(() => {
    if (!state.isConnected) return;

    // Handler para atualização de campanha
    const handleCampaignUpdate = (payload: CampaignUpdatePayload) => {
      console.log('[WS] Campaign update received:', payload);

      if (!payload.changes) return;

      setState(previousState => {
        const updatedCampaign = { ...previousState.campaign!, ...payload.changes };
        const newState = { ...previousState, campaign: updatedCampaign };

        if (payload.changes.permissions) {
          newState.permissions = payload.changes.permissions;
        }

        if (payload.changes.audioSettings) {
          console.log('[WS] Audio settings synced:', payload.changes.audioSettings);
          newState.audioSettings = payload.changes.audioSettings!;

          if (!previousState.isGM) {
            show({
              type: 'info',
              message: '🎵 Mestre atualizou o painel de áudio',
              duration: 3000
            });
          }
        }

        return newState;
      });
    };

    // Handler para atualização de handouts
    const handleHandoutUpdate = (payload: HandoutUpdatePayload) => {
      console.log('[WS] Handout update received:', payload);

      setState(previousState => {
        let updatedHandouts = [...previousState.handouts];
        const currentUserId = user?.id || '';

        // Operação: Criar
        if (payload.operation === 'create' && payload.handout) {
          const handoutExists = updatedHandouts.some(
            handout => handout.id === payload.handout!.id
          );

          if (!handoutExists) {
            updatedHandouts.push(payload.handout);
            console.log('[WS] Handout created:', payload.handout.name);
          }

          return { ...previousState, handouts: updatedHandouts };
        }

        // Operação: Atualizar
        if (payload.operation === 'update' && payload.handout) {
          const oldHandout = previousState.handouts.find(
            handout => handout.id === payload.handout!.id
          );

          updatedHandouts = updatedHandouts.map(handout =>
            handout.id === payload.handout!.id ? payload.handout! : handout
          );

          const wasSharedWithUser = oldHandout?.sharedWith.includes(currentUserId);
          const isNowSharedWithUser = payload.handout.sharedWith.includes(currentUserId);

          // Handout compartilhado com o jogador
          if (!previousState.isGM && isNowSharedWithUser && !wasSharedWithUser) {
            show({
              type: 'info',
              message: `📜 Mestre compartilhou: ${payload.handout.name}`,
              duration: 4000
            });

            return {
              ...previousState,
              handouts: updatedHandouts,
              triggeredHandoutId: payload.handout.id
            };
          }

          // Handout ocultado do jogador
          if (!previousState.isGM && !isNowSharedWithUser && wasSharedWithUser) {
            show({
              type: 'info',
              message: `🔒 Recurso "${payload.handout.name}" foi ocultado`,
              duration: 3000
            });

            const shouldCloseHandout = previousState.triggeredHandoutId === payload.handout.id;

            return {
              ...previousState,
              handouts: updatedHandouts,
              triggeredHandoutId: shouldCloseHandout ? null : previousState.triggeredHandoutId
            };
          }
        }

        // Operação: Deletar
        if (payload.operation === 'delete' && payload.handoutId) {
          updatedHandouts = updatedHandouts.filter(
            handout => handout.id !== payload.handoutId
          );
        }

        return { ...previousState, handouts: updatedHandouts };
      });
    };

    // Handler para atualização de cena
    const handleSceneUpdate = (payload: SceneUpdatePayload) => {
      if (!payload.id || !payload.changes) return;

      setState(previousState => ({
        ...previousState,
        scenes: StateHelpers.updateSceneInList(
          previousState.scenes,
          payload.id,
          payload.changes
        )
      }));
    };

    // Handler para adicionar cena
    const handleSceneAdd = (payload: SceneAddPayload) => {
      setState(previousState => {
        const sceneExists = previousState.scenes.some(
          scene => scene.id === payload.scene.id
        );

        if (sceneExists) return previousState;

        return {
          ...previousState,
          scenes: [...previousState.scenes, payload.scene]
        };
      });
    };

    // Handler para deletar cena
    const handleSceneDelete = (payload: SceneDeletePayload) => {
      setState(previousState => {
        const filteredScenes = previousState.scenes.filter(
          scene => scene.id !== payload.id
        );

        const newActiveSceneId = previousState.activeSceneId === payload.id
          ? (previousState.scenes[0]?.id || '')
          : previousState.activeSceneId;

        return {
          ...previousState,
          scenes: filteredScenes,
          activeSceneId: newActiveSceneId
        };
      });
    };

    // Handler para trocar de cena
    const handleSceneSwitch = (payload: SceneSwitchPayload) => {
      setState(previousState => ({
        ...previousState,
        activeSceneId: payload.id
      }));
    };

    // Handler para ping no mapa
    const handleMapPing = (payload: MapPingPayload) => {
      if (payload.userId === user?.id) return;

      const ping = {
        id: Math.random().toString(),
        x: payload.x,
        y: payload.y,
        color: payload.color,
        createdAt: Date.now(),
        userId: payload.userId
      };

      setState(previousState => ({
        ...previousState,
        pings: [...previousState.pings, ping]
      }));

      setTimeout(() => {
        setState(previousState => ({
          ...previousState,
          pings: previousState.pings.filter(existingPing => existingPing.id !== ping.id)
        }));
      }, 3000);
    };

    // Handler para atualização de token
    const handleTokenUpdate = (payload: TokenUpdatePayload) => {
      console.log('[WS] handleTokenUpdate received:', payload);
      setState(previousState => ({
        ...previousState,
        scenes: StateHelpers.updateItemInSceneList(
          previousState.scenes,
          payload.sceneId,
          'tokens',
          payload.id,
          payload.changes
        )
      }));
    };

    // Handler para adicionar token
    const handleTokenAdd = (payload: any) => {
      setState(previousState => ({
        ...previousState,
        scenes: StateHelpers.addItemToSceneList(
          previousState.scenes,
          payload.sceneId,
          'tokens',
          payload.token
        )
      }));
    };

    // Handler para remover token
    const handleTokenRemove = (payload: any) => {
      setState(previousState => ({
        ...previousState,
        scenes: StateHelpers.removeItemFromSceneList(
          previousState.scenes,
          payload.sceneId,
          'tokens',
          payload.id
        )
      }));
    };

    // Handler para atualização de combate
    const handleCombatUpdate = (payload: CombatUpdatePayload) => {
      setState(previousState => ({
        ...previousState,
        combat: payload.combat
      }));
    };

    // Handler para rolagem de dados
    const handleDiceRoll = (payload: DiceRollPayload) => {
      if (payload.user.id === user?.id) return;

      const rollContent = `Rolou ${payload.result.formula} = ${payload.result.total}`;
      const rollVisibility = payload.result.visibility === 'total'
        ? 'public'
        : payload.result.visibility || 'public';

      const chatMessage = {
        id: Date.now().toString(),
        campaignId,
        senderId: payload.user.id,
        senderName: payload.user.name,
        content: rollContent,
        type: 'roll',
        visibility: rollVisibility,
        timestamp: Date.now(),
        rollDetails: payload.result
      };

      setState(previousState => ({
        ...previousState,
        chatMessages: [...previousState.chatMessages, chatMessage]
      }));
    };

    // Handler para mensagem de chat
    const handleChatMessage = (payload: ChatMessagePayload) => {
      setState(previousState => {
        const messageExists = previousState.chatMessages.some(
          message => message.id === payload.message.id
        );

        if (messageExists) return previousState;

        return {
          ...previousState,
          chatMessages: [...previousState.chatMessages, payload.message]
        };
      });
    };

    // Handler para permissões de sessão
    const handleSessionPermissions = (payload: SessionPermissionsPayload) => {
      setState(previousState => ({
        ...previousState,
        permissions: payload.permissions
      }));
    };

    // Handler para arrastar token
    const handleTokenDrag = (payload: TokenDragPayload) => {
      if (payload.userId === user?.id) return;

      setState(previousState => ({
        ...previousState,
        remoteDrags: {
          ...previousState.remoteDrags,
          [payload.userId]: payload
        }
      }));

      setTimeout(() => {
        setState(previousState => {
          if (previousState.remoteDrags[payload.userId] !== payload) {
            return previousState;
          }

          const updatedDrags = { ...previousState.remoteDrags };
          delete updatedDrags[payload.userId];

          return { ...previousState, remoteDrags: updatedDrags };
        });
      }, 2000);
    };

    // Handler para movimento de cursor
    const handleCursorMove = (payload: CursorMovePayload) => {
      if (payload.userId === user?.id) return;

      setState(previousState => ({
        ...previousState,
        remoteCursors: {
          ...previousState.remoteCursors,
          [payload.userId]: payload
        }
      }));
    };

    // Handler para adicionar desenho
    const handleDrawingAdd = (payload: DrawingAddPayload) => {
      setState(previousState => ({
        ...previousState,
        scenes: StateHelpers.addItemToSceneList(
          previousState.scenes,
          payload.sceneId,
          'drawings',
          payload.drawing
        )
      }));
    };

    // Handler para remover desenho
    const handleDrawingRemove = (payload: DrawingRemovePayload) => {
      setState(previousState => ({
        ...previousState,
        scenes: StateHelpers.removeItemFromSceneList(
          previousState.scenes,
          payload.sceneId,
          'drawings',
          payload.id
        )
      }));
    };

    // Handler para tocar áudio
    const handleAudioPlay = (payload: AudioPlayPayload) => {
      if (!payload.url) return;

      audioService.playMusic(payload.url, payload.loop ?? true, payload.volume);

      if (!state.isGM) {
        show({
          type: 'info',
          message: '🎵 Mestre iniciou uma música',
          duration: 2000
        });
      }
    };

    // Handler para pausar áudio
    const handleAudioPause = () => {
      audioService.pauseMusic();
    };

    // Handler para parar áudio
    const handleAudioStop = () => {
      audioService.stopMusic();
    };

    // Handler para efeitos sonoros
    const handleAudioSfx = (payload: { url: string; action: 'start' | 'stop'; }) => {
      console.log('[WS] Received audio:sfx:', payload.url, payload.action);

      const isSfxCurrentlyLooping = audioService.getLoopingSfx().has(payload.url);
      const shouldStartSfx = payload.action === 'start' && !isSfxCurrentlyLooping;
      const shouldStopSfx = payload.action === 'stop' && isSfxCurrentlyLooping;

      if (shouldStartSfx) {
        audioService.toggleSfxLoop(payload.url);

        if (!state.isGM) {
          show({
            type: 'info',
            message: '🔊 Mestre ativou um efeito sonoro',
            duration: 2000
          });
        }
      } else if (shouldStopSfx) {
        audioService.toggleSfxLoop(payload.url);
      }
    };

    // Handler para adicionar personagem
    const handleCharacterAdd = (character: Character) => {
      setState(previousState => ({
        ...previousState,
        campaignCharacters: [...previousState.campaignCharacters, character]
      }));
    };

    // Helper: Calcular condições de token baseado em HP
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

    // Handler para atualização de personagem
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

            return { ...token, conditions: updatedConditions };
          })
        }));

        return {
          ...previousState,
          campaignCharacters: updatedCharacters,
          scenes: updatedScenes
        };
      });
    };

    // Handler para deletar personagem
    const handleCharacterDelete = (payload: { id: string; }) => {
      setState(previousState => ({
        ...previousState,
        campaignCharacters: previousState.campaignCharacters.filter(
          character => character.id !== payload.id
        )
      }));
    };

    // Handler para jogador entrar
    const handlePlayerJoin = (payload: { user: any; }) => {
      setState(previousState => {
        const playerExists = previousState.players.some(
          player => player.id === payload.user.id
        );

        if (playerExists) return previousState;

        return {
          ...previousState,
          players: [...previousState.players, payload.user]
        };
      });

      show({
        type: 'info',
        message: `${payload.user.name} entrou na sessão`,
        duration: 3000
      });
    };

    // Handler para jogador sair
    const handlePlayerLeave = (payload: { userId: string; }) => {
      setState(previousState => ({
        ...previousState,
        players: previousState.players.filter(
          player => player.id !== payload.userId
        )
      }));
    };

    // Mapa de handlers
    const handlers: Partial<{
      [K in keyof SocketEventMap]: (payload: SocketEventMap[K]) => void
    }> = {
      'campaign:update': handleCampaignUpdate,
      'handout:update': handleHandoutUpdate,
      'scene:update': handleSceneUpdate,
      'scene:add': handleSceneAdd,
      'scene:delete': handleSceneDelete,
      'scene:switch': handleSceneSwitch,
      'map:ping': handleMapPing,
      'token:update': handleTokenUpdate,
      'token:add': handleTokenAdd,
      'token:remove': handleTokenRemove,
      'token:drag': handleTokenDrag,
      'combat:update': handleCombatUpdate,
      'dice:roll': handleDiceRoll,
      'chat:message': handleChatMessage,
      'session:permissions': handleSessionPermissions,
      'cursor:move': handleCursorMove,
      'drawing:add': handleDrawingAdd,
      'drawing:remove': handleDrawingRemove,
      'audio:play': handleAudioPlay,
      'audio:pause': handleAudioPause,
      'audio:stop': handleAudioStop,
      'audio:sfx': handleAudioSfx,
      'character:add': handleCharacterAdd,
      'character:update': handleCharacterUpdate,
      'character:delete': handleCharacterDelete,
      'player:join': handlePlayerJoin,
      'player:leave': handlePlayerLeave
    };

    // Registrar listeners
    console.log('[WS] Registering socket listeners...');
    Object.entries(handlers).forEach(([event, handler]) => {
      if (handler) {
        socketService.on(event as keyof SocketEventMap, handler as any);
      }
    });

    // Cleanup ao desmontar
    return () => {
      console.log('[WS] Cleaning up socket listeners...');
      Object.entries(handlers).forEach(([event, handler]) => {
        if (handler) {
          socketService.off(event as keyof SocketEventMap, handler as any);
        }
      });
    };
  }, [state.isConnected, state.isGM, user, show, campaignId]);
};