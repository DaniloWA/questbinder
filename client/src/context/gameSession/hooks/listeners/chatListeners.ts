import { socketService } from '../../../../services/socketService';
import {
  ChatMessagePayload,
  DiceRollPayload,
  ChatMessage
} from '../../../../types';
import { notifySmartSync } from '../../syncHelpers';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for chat-related events.
 * All handlers update React state AND notify SmartSync cache.
 */
export const registerChatListeners = ({
  setState,
  user,
  campaignId
}: ListenerDeps): ListenerCleanup => {

  const handleChatMessage = (payload: ChatMessagePayload) => {
    // Notify SmartSync cache (Bridge updates state)
    notifySmartSync({
      entityType: 'chatMessage',
      entityId: payload.message.id,
      changeType: 'create',
      data: payload.message
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
    } as ChatMessage;

    notifySmartSync({
      entityType: 'chatMessage',
      entityId: chatMessage.id,
      changeType: 'create',
      data: chatMessage
    });
  };

  const handleChatMessageUpdate = (payload: ChatMessage) => {
    notifySmartSync({
      entityType: 'chatMessage',
      entityId: payload.id,
      changeType: 'update',
      data: payload
    });
  };

  const handleChatReaction = (payload: any) => {
    if (payload.messageId && payload.reaction) {
      notifySmartSync({
        entityType: 'chatMessage',
        entityId: payload.messageId,
        changeType: 'update',
        data: { reactions: payload.reaction }
      });
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
