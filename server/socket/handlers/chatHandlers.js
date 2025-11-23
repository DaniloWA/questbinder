import * as db from '../../db.js';
import crypto from 'crypto';

export const registerChatHandlers = (socket, client, utils) => {
  const { safeEmitError, safeBroadcast, checkPermission } = utils;

  socket.on('chat:message', async (message) => {
    try {
      if (!client.campaignId) return;

      // Check permission for dice rolling
      if (message.type === 'roll' && !(await checkPermission('diceRolling'))) {
        console.warn('[WS] chat:message (roll) denied for user:', client.userId);
        return safeEmitError('Sem permissão para rolar dados.');
      }

      const msg = {
        ...message,
        id: crypto.randomUUID(),
        userId: client.userId,
        timestamp: Date.now(),
      };

      await db.atomicUpdate('campaigns', client.campaignId, {
        path: 'chatMessages',
        operation: { $push: msg }
      });

      safeBroadcast('chat:message', msg);
    } catch (err) {
      console.error('[WS] chat:message error:', err);
      safeEmitError('Erro ao enviar mensagem.');
    }
  });
};
