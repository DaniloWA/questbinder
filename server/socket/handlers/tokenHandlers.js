import * as db from '../../db.js';
import crypto from 'crypto';
import { SyncMiddleware } from '../sync/SyncMiddleware.js';

export const registerTokenHandlers = (socket, client, utils) => {
  const { safeEmitError, validatePayload, getPermissionHelper, safeBroadcast } = utils;

  socket.on('token:update', async (payload) => {
    try {
      const validation = validatePayload(payload, ['sceneId', 'id', 'changes']);
      if (!validation.valid) {
        console.warn('[WS] token:update validation failed:', validation.error);
        return safeEmitError('Dados inválidos para atualização de token.');
      }

      if (!client.campaignId) return;

      const { sceneId, id, changes, clientVersion, changeId } = payload;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return safeEmitError('Campanha não encontrada.');

      const scene = campaign.scenes?.find(s => s.id === sceneId);
      if (!scene) return safeEmitError('Cena não encontrada.');

      const tokenIndex = scene.tokens.findIndex(t => t.id === id);
      if (tokenIndex === -1) return safeEmitError('Token não encontrado.');

      const token = scene.tokens[tokenIndex];

      // Sync Check
      if (SyncMiddleware.hasConflict(clientVersion, token.version)) {
        console.warn('[WS] token:update conflict detected', { client: clientVersion, server: token.version });
        if (changeId) {
          socket.emit('sync:reject', SyncMiddleware.createReject(changeId, token.version, token));
        }
        // Send latest state to client to force sync
        socket.emit('token:update', { sceneId, id, changes: token, userId: 'system', version: token.version });
        return;
      }

      const helper = await getPermissionHelper();
      const isMovement = changes.x !== undefined || changes.y !== undefined;
      const canPerform = isMovement ? helper.canMoveToken(token) : helper.canEditToken(token);

      if (!canPerform) {
        return safeEmitError('Sem permissão.');
      }

      const nextVersion = SyncMiddleware.nextVersion(token.version);
      const updatedToken = { ...token, ...changes, version: nextVersion };
      scene.tokens[tokenIndex] = updatedToken;

      await db.update('campaigns', client.campaignId, campaign);

      if (changeId) {
        socket.emit('sync:ack', SyncMiddleware.createAck(changeId, nextVersion));
      }

      safeBroadcast('token:update', { sceneId, id, changes, userId: client.userId, version: nextVersion });
    } catch (err) {
      console.error('[WS] token:update error:', err);
      safeEmitError('Erro ao atualizar token.');
    }
  });

  socket.on('token:add', async (payload) => {
    try {
      const validation = validatePayload(payload, ['sceneId', 'token']);
      if (!validation.valid) return safeEmitError('Dados inválidos.');

      const helper = await getPermissionHelper();
      if (!helper.can('tokenCreate')) return safeEmitError('Sem permissão.');

      const { sceneId, token, changeId } = payload;
      token.id = token.id || crypto.randomUUID();
      token.version = 1; // Start version
      if (!helper.isGameMaster()) token.ownerId = client.userId;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return safeEmitError('Campanha não encontrada.');

      const scene = campaign.scenes?.find(s => s.id === sceneId);
      if (!scene) return safeEmitError('Cena não encontrada.');

      scene.tokens.push(token);
      await db.update('campaigns', client.campaignId, campaign);

      if (changeId) {
        socket.emit('sync:ack', SyncMiddleware.createAck(changeId, 1));
      }

      safeBroadcast('token:add', { sceneId, token, userId: client.userId }); // Broadcast specific event
    } catch (err) {
      console.error('[WS] token:add error:', err);
      safeEmitError('Erro ao criar token.');
    }
  });

  socket.on('token:remove', async (payload) => {
    try {
      const validation = validatePayload(payload, ['sceneId', 'id']);
      if (!validation.valid) return safeEmitError('Dados inválidos.');

      const { sceneId, id, changeId, clientVersion } = payload;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return safeEmitError('Campanha não encontrada.');

      const scene = campaign.scenes?.find(s => s.id === sceneId);
      if (!scene) return safeEmitError('Cena não encontrada.');

      const token = scene.tokens.find(t => t.id === id);
      if (!token) {
        if (changeId) socket.emit('sync:ack', SyncMiddleware.createAck(changeId, 0)); // Already gone
        safeBroadcast('token:remove', { sceneId, id });
        return;
      }

      // Conflict on delete? maybe if strict mode. For now, flexible.

      const helper = await getPermissionHelper();
      if (!helper.canDeleteToken(token)) return safeEmitError('Sem permissão.');

      scene.tokens = scene.tokens.filter(t => t.id !== id);
      await db.update('campaigns', client.campaignId, campaign);

      if (changeId) {
        socket.emit('sync:ack', SyncMiddleware.createAck(changeId, 0));
      }

      safeBroadcast('token:remove', { sceneId, id });
    } catch (err) {
      console.error('[WS] token:remove error:', err);
      safeEmitError('Erro ao remover token.');
    }
  });
};
