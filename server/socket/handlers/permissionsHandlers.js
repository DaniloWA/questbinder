import * as db from '../../db.js';

export const registerPermissionsHandlers = (socket, client, utils) => {
  console.log('[permissions] handlers registered');

  socket.on('campaign:updatePermissions', async (payload) => {
    console.log('[WS] campaign:updatePermissions payload:', payload);
    try {
      const { campaignId, permissions } = payload;
      // Validation could be added here

      // Broadcast to everyone in the campaign
      io.to(campaignId).emit('campaign:permissionsUpdated', { permissions });
      console.log(`[WS] Permissions updated for campaign ${campaignId}`);
    } catch (err) {
      console.error('[WS] campaign:updatePermissions error:', err);
    }
  });
};
