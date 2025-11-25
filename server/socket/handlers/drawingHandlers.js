import * as db from '../../db.js';
import crypto from 'crypto';

export const registerDrawingHandlers = (socket, client, utils) => {
  console.log('[drawing] handlers registered');
  const { safeEmitError, validatePayload, getPermissionHelper, safeBroadcast } = utils;

  socket.on('drawing:add', async (payload) => {
    try {
      if (!client.campaignId) return;

      const validation = validatePayload(payload, ['sceneId', 'drawing']);
      if (!validation.valid) return safeEmitError('Dados inválidos.');

      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();
      if (!helper.can('drawings')) {
        return safeEmitError('Sem permissão para desenhar.');
      }

      const { sceneId, drawing } = payload;

      const d = {
        ...drawing,
        id: drawing.id || crypto.randomUUID(),
        userId: client.userId,
        timestamp: Date.now(),
      };

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return;

      const scene = campaign.scenes?.find(s => s.id === sceneId);
      if (!scene) return;

      scene.drawings.push(d);
      await db.update('campaigns', client.campaignId, campaign);

      safeBroadcast('drawing:add', { sceneId, drawing: d });
    } catch (err) {
      console.error('[WS] drawing:add error:', err);
      safeEmitError('Erro ao adicionar desenho.');
    }
  });

  socket.on('drawing:remove', async (payload) => {
    try {
      if (!client.campaignId) return;

      // FIXED: Expect 'id' instead of 'drawingId' to match client emission
      const validation = validatePayload(payload, ['sceneId', 'id']);
      if (!validation.valid) return safeEmitError('Dados inválidos.');

      const { sceneId, id } = payload;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return;

      const scene = campaign.scenes?.find(s => s.id === sceneId);
      if (!scene) return;

      const drawing = scene.drawings.find(d => d.id === id);
      if (!drawing) return safeEmitError('Desenho não encontrado.');

      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();
      if (!helper.canDeleteDrawing(drawing.userId)) {
        console.warn('[WS] drawing:remove denied: cannot delete drawing');
        return safeEmitError('Sem permissão para apagar este desenho.');
      }

      scene.drawings = scene.drawings.filter(d => d.id !== id);
      await db.update('campaigns', client.campaignId, campaign);

      safeBroadcast('drawing:remove', { sceneId, id });
    } catch (err) {
      console.error('[WS] drawing:remove error:', err);
      safeEmitError('Erro ao remover desenho.');
    }
  });
};
