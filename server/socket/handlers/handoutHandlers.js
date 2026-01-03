import * as db from '../../db.js';
import crypto from 'crypto';

export const registerHandoutHandlers = (socket, client, utils) => {
  console.log('[handout] handlers registered');
  const { requireGM, safeBroadcast } = utils;

  socket.on('handout:update', requireGM(async (payload) => {
    const campaign = await db.getById('campaigns', client.campaignId);
    if (!campaign) return;

    if (!campaign.handouts) campaign.handouts = [];

    if (payload.operation === 'create') {
      payload.handout.id = crypto.randomUUID();
      payload.handout.createdAt = Date.now();
      if (!payload.handout.sharedWith) payload.handout.sharedWith = [];
      campaign.handouts.push(payload.handout);
    } else if (payload.operation === 'update') {
      const idx = campaign.handouts.findIndex(h => h.id === payload.handout.id);
      if (idx !== -1) campaign.handouts[idx] = payload.handout;
    } else if (payload.operation === 'delete') {
      campaign.handouts = campaign.handouts.filter(h => h.id !== payload.handoutId);
    } else {
      return;
    }

    await db.update('campaigns', client.campaignId, campaign);
    safeBroadcast('handout:update', payload);
  }));
};
