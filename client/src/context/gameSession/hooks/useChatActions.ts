import React from 'react';
import { GameSessionState, BooleanPermissionKey } from '../types';
import { socketService } from '../../../services/socketService';
import { diceEngine } from '../../../utils/dice';
import { ChatMessage, RollResult, ChatLinkMetadata } from '../../../types';
import { smartSync } from '../../../services/sync';

export const useChatActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  user: any,
  show: (notification: any) => void,
  setIsCompendiumOpen: (val: boolean) => void,
  setViewport: (v: any) => void,
  addPing: (x: number, y: number) => void,
  selectToken: (id: string, multi: boolean) => void,
  permissionHelper?: any // REGRA MILENAR
) => {
  const activeScene = state.scenes.find(s => s.id === state.activeSceneId) || null;

  const sendChatMessage = (
    content: string,
    type: any = 'message',
    rollDetails?: any,
    link?: any,
    options?: {
      characterId?: string;
      characterName?: string;
      characterAvatarUrl?: string;
      recipientId?: string;
      recipientName?: string;
    }
  ) => {
    const isPrivate = !!options?.recipientId;
    const isPublic = !isPrivate;

    // Check permissions
    if (permissionHelper && !permissionHelper.isGameMaster()) {
      if (isPublic && !permissionHelper.canAsGMOr('chatGlobalAllowed')) {
        show({ type: 'warning', message: 'Você não pode enviar mensagens no chat global.' });
        return;
      }
      if (isPrivate && !permissionHelper.canAsGMOr('chatPrivateAllowed')) {
        show({ type: 'warning', message: 'Mensagens privadas estão desativadas pelo Mestre.' });
        return;
      }
    }

    const msg: ChatMessage = {
      id: Date.now().toString(),
      campaignId: campaignId,
      senderId: user?.id || '',
      senderName: user?.name || 'User',
      content,
      type,
      visibility: isPrivate ? 'private' : 'public',
      timestamp: Date.now(),
      rollDetails,
      link,
      characterId: options?.characterId,
      characterName: options?.characterName,
      characterAvatarUrl: options?.characterAvatarUrl,
      recipientId: options?.recipientId,
      recipientName: options?.recipientName,
    };

    // SmartSync handles Create + Optimistic Update + Persistence
    smartSync.apply('chatMessage', msg.id, 'create', msg);
  };

  const toggleChatReaction = async (msg: ChatMessage, type: 'like' | 'dislike') => {
    // Get latest version of message from state to avoid stale closure
    const latestMsg = state.chatMessages.find(m => m.id === msg.id) || msg;

    const reactions = latestMsg.reactions || {};
    const current = reactions[type] || { type, count: 0, users: [] };

    let newUsers = [...current.users];
    let newCount = current.count;

    if (newUsers.includes(user?.id || '')) {
      newUsers = newUsers.filter(id => id !== user?.id);
      newCount = Math.max(0, newCount - 1);
    } else {
      newUsers.push(user?.id || '');
      newCount++;
    }

    const newReactions = {
      ...reactions,
      [type]: { ...current, count: newCount, users: newUsers }
    };

    // SmartSync handles Update + Optimistic Update + Persistence
    smartSync.apply('chatMessage', msg.id, 'update', { reactions: newReactions });
  };

  const broadcastRoll = (result: RollResult) => {
    const msg: ChatMessage = {
      id: Date.now().toString(),
      campaignId,
      senderId: user?.id || '',
      senderName: user?.name || 'User',
      content: `Rolou ${result.formula} = ${result.total}`,
      type: 'roll',
      visibility: (result.visibility === 'total' ? 'public' : result.visibility) || 'public',
      timestamp: Date.now(),
      rollDetails: result
    };

    // SmartSync for persistent chat log
    smartSync.apply('chatMessage', msg.id, 'create', msg);

    // Direct socket emit for ephemeral 3D dice animation
    socketService.emit('dice:roll', { result, user: { id: user?.id || '', name: user?.name || '', color: '#fff' } });
  };

  const rollDice = (label: string, formula: string) => {
    // REGRA MILENAR: Use PermissionHelper
    const canRoll = permissionHelper ? permissionHelper.canAsGMOr('diceRolling') : false;

    if (!canRoll) {
      show({ type: 'warning', message: 'Rolagem de dados bloqueada pelo Mestre.' });
      return;
    }
    const result = diceEngine.roll(formula, 'normal', label);
    broadcastRoll(result);
  };

  const handleChatLinkClick = (link: ChatLinkMetadata) => {
    if (link.type === 'compendium' && link.compendiumSlug && link.compendiumCategory) {
      setState(prev => ({ ...prev, compendiumTarget: { slug: link.compendiumSlug!, category: link.compendiumCategory! } }));
      setIsCompendiumOpen(true);
    } else if (link.type === 'position' && link.data) {
      // Correct viewport centering
      const gridSize = activeScene?.grid.size || 70;
      const targetX = link.data.x * gridSize + gridSize / 2;
      const targetY = link.data.y * gridSize + gridSize / 2;

      // Viewport X/Y is the Translation value
      const newX = (window.innerWidth / 2) - (targetX * state.viewport.zoom);
      const newY = (window.innerHeight / 2) - (targetY * state.viewport.zoom);

      setViewport({ x: newX, y: newY });
      addPing(targetX, targetY);
    } else if (link.type === 'token' && link.id) {
      const token = activeScene?.tokens.find(t => t.id === link.id);
      if (token) {
        const gridSize = activeScene?.grid.size || 70;
        const targetX = (token.x + token.size / 2) * gridSize;
        const targetY = (token.y + token.size / 2) * gridSize;

        const newX = (window.innerWidth / 2) - (targetX * state.viewport.zoom);
        const newY = (window.innerHeight / 2) - (targetY * state.viewport.zoom);

        setViewport({ x: newX, y: newY });
        addPing(targetX, targetY);
        selectToken(token.id, false);
      } else {
        show({ type: 'warning', message: 'Token não encontrado nesta cena.' });
      }
    }
  };

  return {
    sendChatMessage,
    toggleChatReaction,
    handleChatLinkClick,
    rollDice,
    broadcastRoll
  };
};
