import { socketService } from '../../../../services/socketService';
import {
  ChatMessagePayload,
  DiceRollPayload,
  ChatMessage
} from '../../../../types';
import { ListenerDeps, ListenerCleanup } from './types';


export const registerChatListeners = ({
  setState,
  user,
  campaignId
}: ListenerDeps): ListenerCleanup => {

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

  const handleChatMessageUpdate = (payload: ChatMessage) => {
    setState(prev => ({
      ...prev,
      chatMessages: prev.chatMessages.map(msg =>
        msg.id === payload.id ? payload : msg
      )
    }));
  };

  const handleChatReaction = (payload: any) => {
    if (payload.messageId && payload.reaction) {
      setState(prev => ({
        ...prev,
        chatMessages: prev.chatMessages.map(msg => {
          if (msg.id !== payload.messageId) return msg;
          return msg;
        })
      }));
    }
  };


  socketService.on('chat:message', handleChatMessage);
  socketService.on('dice:roll', handleDiceRoll);
  socketService.on('chat_message:update', handleChatMessageUpdate);
  socketService.on('chat:reaction', handleChatReaction);


  return () => {
    socketService.off('chat:message', handleChatMessage);
    socketService.off('dice:roll', handleDiceRoll);
    socketService.off('chat_message:update', handleChatMessageUpdate);
    socketService.off('chat:reaction', handleChatReaction);
  };
};
