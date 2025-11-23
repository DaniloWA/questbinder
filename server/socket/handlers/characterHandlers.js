import * as db from '../../db.js';

export const registerCharacterHandlers = (socket, client, utils) => {
  const { broadcastToRoom } = utils;

  socket.on('character:update', async (payload) => {
    try {
      const { characterId, updates } = payload;
      if (!client.campaignId || !updates) return;

      // 1. Update in Database
      await db.update('characters', characterId, updates);

      // 2. Broadcast to everyone in the room (including sender, to confirm save if needed, 
      // but usually optimistic UI handles sender. We broadcast to others.)
      // Actually, for consistency, we often broadcast to everyone or everyone else.
      // Let's broadcast to everyone else for now, assuming optimistic UI on client.
      socket.to(client.campaignId).emit('character:update', {
        characterId,
        updates,
        updatedBy: client.userId
      });

      console.log(`[WS] BROADCASTING CHARACTER UPDATE NOW: ${characterId}`);
      console.log(`[WS] Character ${characterId} updated by ${client.userId}`);

    } catch (err) {
      console.error('[WS] character:update error:', err);
    }
  });
};
