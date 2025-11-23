import * as db from '../../db.js';

export const registerSceneHandlers = (socket, client, utils) => {
  const { safeEmitError, validatePayload, requireGM, safeBroadcast } = utils;

  socket.on('campaign:update', requireGM(async (changes) => {
    await db.update('campaigns', client.campaignId, changes);
    safeBroadcast('campaign:update', changes);
  }));

  socket.on('scene:update', requireGM(async (payload) => {
    // FIX: Client sends 'id', not 'sceneId'
    const validation = validatePayload(payload, ['id', 'changes']);
    if (!validation.valid) return safeEmitError('Dados inválidos.');

    const { id, changes } = payload;

    const campaign = await db.getById('campaigns', client.campaignId);
    if (!campaign) return;

    const sceneIndex = campaign.scenes.findIndex(s => s.id === id);
    if (sceneIndex !== -1) {
      campaign.scenes[sceneIndex] = { ...campaign.scenes[sceneIndex], ...changes };
      // FIX: Pass only the scenes array, not the entire campaign object
      await db.update('campaigns', client.campaignId, { scenes: campaign.scenes });
      console.log('[scene:update] Updated scene:', id, 'with changes:', Object.keys(changes));
      safeBroadcast('scene:update', { id, changes });
    }
  }));
};
