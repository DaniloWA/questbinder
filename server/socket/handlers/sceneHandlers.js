import * as db from '../../db.js';
import crypto from 'crypto';
import { SyncMiddleware } from '../sync/SyncMiddleware.js';

export const registerSceneHandlers = (socket, client, utils) => {
  const { safeEmitError, validatePayload, requireGM, safeBroadcast, getPermissionHelper } = utils;

  socket.on('campaign:update', requireGM(async (changes) => {
    await db.update('campaigns', client.campaignId, changes);
    safeBroadcast('campaign:update', changes);
  }));

  socket.on('scene:update', async (payload) => {
    try {

      const validation = validatePayload(payload, ['id', 'changes']);
      if (!validation.valid) return safeEmitError('Dados inválidos.');

      const { id, changes, clientVersion, changeId } = payload;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return;

      const sceneIndex = campaign.scenes.findIndex(s => s.id === id);
      if (sceneIndex === -1) return; // Scene not found

      const currentScene = campaign.scenes[sceneIndex];

      // Sync Check
      if (SyncMiddleware.hasConflict(clientVersion, currentScene.version)) {
        if (changeId) socket.emit('sync:reject', SyncMiddleware.createReject(changeId, currentScene.version, currentScene));
        // Force sync
        // Sending full scene might be heavy, but necessary on conflict? 
        // For partial updates, maybe just send the diverging fields + version?
        // Or just fail and let client fetch?
        // Let's send a scene:update with version to update client's version at least (and latest data).
        socket.emit('scene:update', { id, changes: currentScene, version: currentScene.version, userId: 'system' });
        return;
      }

      const helper = await getPermissionHelper();

      if (changes.fogPath !== undefined) {
        if (!helper.can('fogReveal')) {
          console.warn(`[WS] scene:update denied: lacks fogReveal permission`);
          return safeEmitError('Sem permissão para revelar neblina.');
        }
      }

      if (changes.obstacles !== undefined && !helper.isGameMaster()) {
        const oldObs = currentScene.obstacles || [];
        const newObs = changes.obstacles || [];
        // ... (Door Logic - retained but simplified for brevity of replacement if feasible, OR keep original logic)
        // To safely replace, I must keep the complex door logic.
        // Since I am replacing the whole block, I need to include it.
        // OR I can just insert the Sync Check at the top (done above) and then wrap the update at the bottom.
        // The snippet below keeps logic but uses 'currentScene'.

        let isDoorControl = false;
        if (oldObs.length === newObs.length && oldObs.length > 0) {
          isDoorControl = oldObs.every((oldO, i) => {
            const newO = newObs[i];
            if (!newO || oldO.id !== newO.id) return false;
            if (oldO.type !== 'door' && oldO.type !== 'window') return false;
            const onlyStateChanged =
              (oldO.blocksMovement !== newO.blocksMovement || oldO.blocksVision !== newO.blocksVision) &&
              oldO.type === newO.type &&
              JSON.stringify(oldO.p1) === JSON.stringify(newO.p1) &&
              JSON.stringify(oldO.p2) === JSON.stringify(newO.p2);
            return onlyStateChanged;
          });
        }

        if (isDoorControl) {
          if (!helper.can('doorControl')) return safeEmitError('Sem permissão para controlar portas.');
        } else {
          return safeEmitError('Apenas o GM pode adicionar/remover/modificar obstáculos.');
        }
      }

      const sensitiveFields = ['grid', 'ambientLight', 'lightZones', 'audioZones', 'triggerZones', 'imageUrl', 'name'];
      const hasSensitiveChanges = sensitiveFields.some(field => changes[field] !== undefined);

      if (hasSensitiveChanges && !helper.isGameMaster()) {
        return safeEmitError('Apenas o GM pode modificar configurações da cena.');
      }

      const nextVersion = SyncMiddleware.nextVersion(currentScene.version);
      campaign.scenes[sceneIndex] = { ...currentScene, ...changes, version: nextVersion };

      await db.update('campaigns', client.campaignId, { scenes: campaign.scenes });

      if (changeId) {
        socket.emit('sync:ack', SyncMiddleware.createAck(changeId, nextVersion));
      }

      safeBroadcast('scene:update', { id, changes, version: nextVersion });
    } catch (err) {
      console.error('[WS] scene:update error:', err);
      safeEmitError('Erro ao atualizar cena.');
    }
  });

  socket.on('scene:add', requireGM(async (payload) => {
    try {
      const validation = validatePayload(payload, ['scene']);
      if (!validation.valid) return safeEmitError('Dados inválidos.');

      const { scene, changeId } = payload;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return safeEmitError('Campanha não encontrada.');

      if (!scene.id) scene.id = crypto.randomUUID();
      scene.version = 1; // Start version

      campaign.scenes.push(scene);
      await db.update('campaigns', client.campaignId, { scenes: campaign.scenes });

      if (changeId) {
        socket.emit('sync:ack', SyncMiddleware.createAck(changeId, 1));
      }

      safeBroadcast('scene:add', { scene });
    } catch (err) {
      console.error('[WS] scene:add error:', err);
      safeEmitError('Erro ao criar cena.');
    }
  }));

  socket.on('scene:delete', requireGM(async (payload) => {
    try {
      const validation = validatePayload(payload, ['id']);
      if (!validation.valid) return safeEmitError('Dados inválidos.');

      const { id } = payload;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return safeEmitError('Campanha não encontrada.');

      campaign.scenes = campaign.scenes.filter(s => s.id !== id);
      await db.update('campaigns', client.campaignId, { scenes: campaign.scenes });

      safeBroadcast('scene:delete', { id });
    } catch (err) {
      console.error('[WS] scene:delete error:', err);
      safeEmitError('Erro ao deletar cena.');
    }
  }));

  socket.on('scene:switch', requireGM(async (payload) => {
    try {
      const validation = validatePayload(payload, ['id']);
      if (!validation.valid) return safeEmitError('Dados inválidos.');

      const { id } = payload;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return safeEmitError('Campanha não encontrada.');

      if (!campaign) return safeEmitError('Campanha não encontrada.');

      const sceneExists = campaign.scenes.some(s => s.id === id);
      if (!sceneExists) return safeEmitError('Cena não encontrada.');

      if (!sceneExists) return safeEmitError('Cena não encontrada.');

      campaign.activeSceneId = id;
      await db.update('campaigns', client.campaignId, { activeSceneId: id });

      safeBroadcast('scene:switch', { id });
    } catch (err) {
      console.error('[WS] scene:switch error:', err);
      safeEmitError('Erro ao trocar cena.');
    }
  }));
};
