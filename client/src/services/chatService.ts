
import { ChatMessage, ApiResponse, ChatLinkMetadata } from '../types';
import { apiService } from './apiService';

export const chatService = {
    getMessages: async (campaignId: string): Promise<ApiResponse<ChatMessage[]>> => {
        const res = await apiService.get<ChatMessage>('chat_messages', (m) => m.campaignId === campaignId);
        if (res.success && res.data) {
            // Ordenar por timestamp
            res.data.sort((a, b) => a.timestamp - b.timestamp);
        }
        return res;
    },

    sendMessage: async (
        campaignId: string,
        senderId: string,
        senderName: string,
        content: string,
        type: 'message' | 'roll' | 'system' = 'message',
        rollDetails?: any,
        link?: ChatLinkMetadata,
        visibility: 'public' | 'gm' | 'private' = 'public',
        options?: {
            characterId?: string;
            characterName?: string;
            characterAvatarUrl?: string;
            recipientId?: string;
            recipientName?: string;
        }
    ): Promise<ApiResponse<ChatMessage>> => {

        const messageData: Omit<ChatMessage, 'id'> = {
            campaignId,
            senderId,
            senderName,
            content,
            type,
            visibility,
            timestamp: Date.now(),
            rollDetails,
            link,
            reactions: {},
            ...options
        };

        return await apiService.post<ChatMessage>('chat_messages', messageData);
    },

    toggleReaction: async (message: ChatMessage, userId: string, reactionType: 'like' | 'dislike'): Promise<ApiResponse<ChatMessage>> => {
        // Logic to update the specific message's reaction in the "DB"
        // Ideally this is atomic on backend, here we simulate logic
        const reactions = message.reactions || {};
        const currentReaction = reactions[reactionType] || { type: reactionType, count: 0, users: [] };

        let newUsers = [...currentReaction.users];
        let newCount = currentReaction.count;

        if (newUsers.includes(userId)) {
            newUsers = newUsers.filter(id => id !== userId);
            newCount--;
        } else {
            newUsers.push(userId);
            newCount++;
        }

        const updatedReactions = {
            ...reactions,
            [reactionType]: { type: reactionType, count: newCount, users: newUsers }
        };

        return await apiService.put<ChatMessage>('chat_messages', message.id, { reactions: updatedReactions });
    },

    deleteMessage: async (id: string): Promise<ApiResponse<boolean>> => {
        return await apiService.delete<ChatMessage>('chat_messages', id);
    }
};
