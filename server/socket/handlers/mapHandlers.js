import * as db from '../../db.js';

export const registerMapHandlers = (socket, client, utils) => {
  console.log('[map] handlers registered');
  const { safeEmitError, validatePayload, checkPermission, safeBroadcast } = utils;

  // Ping Map - Ephemeral event with permission check
  socket.on('map:ping', async (payload) => {
    try {
      if (!client.campaignId) return;

      const validation = validatePayload(payload, ['x', 'y', 'color', 'userId']);
      if (!validation.valid) {
        console.warn('[WS] map:ping validation failed:', validation.error);
        return safeEmitError('Dados inválidos para ping.');
      }

      // Check permission (GM always allowed)
      if (!(await checkPermission('pingMap'))) {
        console.warn('[WS] map:ping denied for user:', client.userId);
        return safeEmitError('Sem permissão para pingar no mapa.');
      }

      // Broadcast ping to all clients in the room
      safeBroadcast('map:ping', payload);
      console.log('[WS] map:ping broadcasted from user:', client.userId);
    } catch (err) {
      console.error('[WS] map:ping error:', err);
      safeEmitError('Erro ao processar ping.');
    }
  });
};
