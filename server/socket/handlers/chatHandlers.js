import * as db from '../../db.js';
import crypto from 'crypto';

export const registerChatHandlers = (socket, client, utils) => {
  console.log('[chat] handlers registered');
  const { safeEmitError, safeBroadcast, getPermissionHelper } = utils;

  socket.on('chat:message', async (message) => {
    try {
      if (!client.campaignId) return;

      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();

      // Check permission for dice rolling
      if (message.type === 'roll' && !helper.can('diceRolling')) {
        console.warn('[WS] chat:message (roll) denied - lacks diceRolling permission');
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

  socket.on('dice:roll', async (payload) => {
    try {
      if (!client.campaignId) return;

      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();

      // Check permission for dice rolling
      if (!helper.can('diceRolling')) {
        console.warn('[WS] dice:roll denied - lacks diceRolling permission');
        return safeEmitError('Sem permissão para rolar dados.');
      }

      const { result, user } = payload;

      // Broadcast roll to all clients
      safeBroadcast('dice:roll', { result, user });

      console.log(`[WS] Dice roll from ${user.name}: ${result.formula} = ${result.total}`);
    } catch (err) {
      console.error('[WS] dice:roll error:', err);
      safeEmitError('Erro ao processar rolagem.');
    }
  });
};
