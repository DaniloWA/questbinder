import * as db from '../../db.js';

export const registerPermissionsHandlers = (socket, client, utils) => {
  const { safeEmitError, safeBroadcast, validatePayload } = utils;

  socket.on('campaign:updatePermissions', async (payload) => {

    try {
      const validation = validatePayload(payload, ['campaignId', 'permissions']);
      if (!validation.valid) {
        console.warn('[WS] campaign:updatePermissions validation failed:', validation.error);
        return safeEmitError('Dados inválidos para atualização de permissões.');
      }

      const { campaignId, permissions } = payload;

      // Verify campaign exists
      const campaign = await db.getById('campaigns', campaignId);
      if (!campaign) {
        console.warn('[WS] campaign:updatePermissions: campaign not found');
        return safeEmitError('Campanha não encontrada.');
      }

      // Update permissions in database
      const updatedCampaign = await db.update('campaigns', campaignId, { permissions });

      // Broadcast to everyone in the campaign (including sender)
      safeBroadcast('campaign:permissionsUpdated', { permissions });
    } catch (err) {
      console.error('[WS] campaign:updatePermissions error:', err);
      safeEmitError('Erro ao atualizar permissões.');
    }
  });
};
