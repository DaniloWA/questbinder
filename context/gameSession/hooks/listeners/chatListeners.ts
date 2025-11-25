import { socketService } from '../../../../services/socketService';
import {
  ChatMessagePayload,
  DiceRollPayload,
  ChatMessage
} from '../../../../types';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for chat and dice-related events
 * - chat:message
 * - chat_message:update
 * - chat:reaction
 * - dice:roll
 */
export const registerChatListeners = ({
  setState,
  user,
  campaignId
}: ListenerDeps): ListenerCleanup => {

  // Handler: chat:message
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

  // Handler: dice:roll
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

  // Handler: chat_message:update
  const handleChatMessageUpdate = (payload: ChatMessage) => {
    // Handle updates to chat messages (e.g. reactions)
    setState(prev => ({
      ...prev,
      chatMessages: prev.chatMessages.map(msg =>
        msg.id === payload.id ? payload : msg
      )
    }));
  };

  // Handler: chat:reaction
  const handleChatReaction = (payload: any) => {
    // Handle ephemeral reactions if they come via socket
    console.log('[WS] chat:reaction received:', payload);
    if (payload.messageId && payload.reaction) {
      setState(prev => ({
        ...prev,
        chatMessages: prev.chatMessages.map(msg => {
          if (msg.id !== payload.messageId) return msg;
          // Simple optimistic-like update for ephemeral event
          return msg;
        })
      }));
    }
  };

  // Register listeners
  socketService.on('chat:message', handleChatMessage);
  socketService.on('dice:roll', handleDiceRoll);
  socketService.on('chat_message:update', handleChatMessageUpdate);
  socketService.on('chat:reaction', handleChatReaction);

  // Return cleanup function
  return () => {
    socketService.off('chat:message', handleChatMessage);
    socketService.off('dice:roll', handleDiceRoll);
    socketService.off('chat_message:update', handleChatMessageUpdate);
    socketService.off('chat:reaction', handleChatReaction);
  };
};
