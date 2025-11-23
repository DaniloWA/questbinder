import React from 'react';
import { GameSessionState, BooleanPermissionKey } from '../types';
import { chatService } from '../../../services/chatService';
import { socketService } from '../../../services/socketService';
import { diceEngine } from '../../../utils/dice';
import { ChatMessage, RollResult, ChatLinkMetadata } from '../../../types';

export const useChatActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  user: any,
  checkPermission: (perm: BooleanPermissionKey) => boolean,
  show: (notification: any) => void,
  setIsCompendiumOpen: (val: boolean) => void,
  setViewport: (v: any) => void,
  addPing: (x: number, y: number) => void,
  selectToken: (id: string, multi: boolean) => void
) => {
  const activeScene = state.scenes.find(s => s.id === state.activeSceneId) || null;

  const sendChatMessage = (content: string, type: any = 'message', rollDetails?: any, link?: any) => {
    const msg: ChatMessage = {
      id: Date.now().toString(),
      campaignId: campaignId,
      senderId: user?.id || '',
      senderName: user?.name || 'User',
      content,
      type,
      visibility: 'public',
      timestamp: Date.now(),
      rollDetails,
      link
    };

    chatService.sendMessage(campaignId, user?.id || '', user?.name || 'User', content, type, rollDetails, link);
    setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, msg] }));
    socketService.emit('chat:message', { message: msg });
  };

  const toggleChatReaction = async (msg: ChatMessage, type: 'like' | 'dislike') => {
    if (!user) return;
    // Optimistic update
    const updatedMsgs = state.chatMessages.map(m => {
      if (m.id !== msg.id) return m;
      const reactions = m.reactions || {};
      const current = reactions[type] || { type, count: 0, users: [] };
      let newUsers = [...current.users];
      let newCount = current.count;
      if (newUsers.includes(user.id)) {
        newUsers = newUsers.filter(u => u !== user.id);
        newCount--;
      } else {
        newUsers.push(user.id);
        newCount++;
      }
      return { ...m, reactions: { ...reactions, [type]: { ...current, count: newCount, users: newUsers } } };
    });

    setState(prev => ({ ...prev, chatMessages: updatedMsgs }));
    await chatService.toggleReaction(msg, user.id, type);
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
    setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, msg] }));
    chatService.sendMessage(campaignId, user?.id || '', user?.name || 'User', msg.content, 'roll', result);
    socketService.emit('dice:roll', { result, user: { id: user?.id || '', name: user?.name || '', color: '#fff' } });
  };

  const rollDice = (label: string, formula: string) => {
    if (!state.isGM && !checkPermission('diceRolling')) {
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
