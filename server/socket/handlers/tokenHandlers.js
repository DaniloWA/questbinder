import * as db from '../../db.js';
import crypto from 'crypto';

export const registerTokenHandlers = (socket, client, utils) => {
  console.log('[token] handlers registered');
  const { safeEmitError, validatePayload, getPermissionHelper, safeBroadcast } = utils;

  socket.on('token:update', async (payload) => {
    try {
      console.log(`[WS] token:update from ${client.userId}`);

      const validation = validatePayload(payload, ['sceneId', 'id', 'changes']);
      if (!validation.valid) {
        console.warn('[WS] token:update validation failed:', validation.error);
        return safeEmitError('Dados inválidos para atualização de token.');
      }

      if (!client.campaignId) {
        console.warn('[WS] token:update: no campaign');
        return;
      }

      const { sceneId, id, changes } = payload;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) {
        console.warn('[WS] token:update: campaign not found');
        return safeEmitError('Campanha não encontrada.');
      }

      const scene = campaign.scenes?.find(s => s.id === sceneId);
      if (!scene) {
        console.warn('[WS] token:update: scene not found');
        return safeEmitError('Cena não encontrada.');
      }

      const tokenIndex = scene.tokens.findIndex(t => t.id === id);
      if (tokenIndex === -1) {
        console.warn('[WS] token:update: token not found');
        return safeEmitError('Token não encontrado.');
      }

      const token = scene.tokens[tokenIndex];

      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();

      // Determine which permission to check based on changes
      const isMovement = changes.x !== undefined || changes.y !== undefined;
      const canPerform = isMovement ? helper.canMoveToken(token) : helper.canEditToken(token);

      if (!canPerform) {
        const action = isMovement ? 'mover' : 'editar';
        console.warn(`[WS] token:update denied: cannot ${action} token`);
        return safeEmitError(`Sem permissão para ${action} este token.`);
      }

      scene.tokens[tokenIndex] = { ...token, ...changes };
      await db.update('campaigns', client.campaignId, campaign);

      safeBroadcast('token:update', { sceneId, id, changes, userId: client.userId });
    } catch (err) {
      console.error('[WS] token:update error:', err);
      safeEmitError('Erro ao atualizar token.');
    }
  });

  socket.on('token:add', async (payload) => {
    console.log('[WS] ========== TOKEN:ADD EVENT RECEIVED ==========');
    console.log('[WS] Payload:', JSON.stringify(payload, null, 2));
    console.log('[WS] Client:', { userId: client.userId, campaignId: client.campaignId, isGM: client.isGM });

    try {
      console.log(`[WS] token:add from ${client.userId}`);

      const validation = validatePayload(payload, ['sceneId', 'token']);
      if (!validation.valid) {
        console.warn('[WS] token:add validation failed:', validation.error);
        return safeEmitError('Dados inválidos para criação de token.');
      }

      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();
      if (!helper.can('tokenCreate')) {
        console.warn('[WS] token:add denied: missing tokenCreate permission');
        return safeEmitError('Sem permissão para criar tokens.');
      }

      const { sceneId, token } = payload;

      token.id = token.id || crypto.randomUUID();
      if (!client.isGM) token.ownerId = client.userId;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) {
        console.warn('[WS] token:add: campaign not found');
        return safeEmitError('Campanha não encontrada.');
      }

      const scene = campaign.scenes?.find(s => s.id === sceneId);
      if (!scene) {
        console.warn('[WS] token:add: scene not found');
        return safeEmitError('Cena não encontrada.');
      }

      scene.tokens.push(token);
      await db.update('campaigns', client.campaignId, campaign);
      console.log('[WS] token:add saved to database');

      safeBroadcast('token:add', { sceneId, token });
    } catch (err) {
      console.error('[WS] token:add error:', err);
      safeEmitError('Erro ao criar token.');
    }
  });

  socket.on('token:remove', async (payload) => {
    try {
      console.log(`[WS] token:remove from ${client.userId}`);

      const validation = validatePayload(payload, ['sceneId', 'id']);
      if (!validation.valid) {
        console.warn('[WS] token:remove validation failed:', validation.error);
        return safeEmitError('Dados inválidos para remoção de token.');
      }

      const { sceneId, id } = payload;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return safeEmitError('Campanha não encontrada.');

      const scene = campaign.scenes?.find(s => s.id === sceneId);
      if (!scene) return safeEmitError('Cena não encontrada.');

      const token = scene.tokens.find(t => t.id === id);
      if (!token) return safeEmitError('Token não encontrado.');

      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();
      if (!helper.canDeleteToken(token)) {
        console.warn('[WS] token:remove denied: cannot delete token');
        return safeEmitError('Sem permissão para deletar este token.');
      }

      scene.tokens = scene.tokens.filter(t => t.id !== id);
      await db.update('campaigns', client.campaignId, campaign);

      safeBroadcast('token:remove', { sceneId, id });
    } catch (err) {
      console.error('[WS] token:remove error:', err);
      safeEmitError('Erro ao remover token.');
    }
  });
};
