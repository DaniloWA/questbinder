import * as db from '../../db.js';
import crypto from 'crypto';

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

      const { id, changes } = payload;

      const helper = await getPermissionHelper();

      if (changes.fogPath !== undefined) {
        if (!helper.can('fogReveal')) {
          console.warn(`[WS] scene:update denied: lacks fogReveal permission`);
          return safeEmitError('Sem permissão para revelar neblina.');
        }
      }

      if (changes.obstacles !== undefined) {
        const campaign = await db.getById('campaigns', client.campaignId);
        const scene = campaign?.scenes.find(s => s.id === id);

        if (scene && !helper.isGameMaster()) {
          const oldObs = scene.obstacles || [];
          const newObs = changes.obstacles || [];

          let isDoorControl = false;

          if (oldObs.length === newObs.length && oldObs.length > 0) {
            isDoorControl = oldObs.every((oldO, i) => {
              const newO = newObs[i];
              if (!newO || oldO.id !== newO.id) return false;

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
            if (!helper.can('doorControl')) {
              console.warn(`[WS] scene:update denied: lacks doorControl permission`);
              return safeEmitError('Sem permissão para controlar portas.');
            }
          } else {
            console.warn(`[WS] scene:update denied: non-GM cannot modify obstacles`);
            return safeEmitError('Apenas o GM pode adicionar/remover/modificar obstáculos.');
          }
        }
      }

      const sensitiveFields = ['grid', 'ambientLight', 'lightZones', 'audioZones', 'triggerZones', 'imageUrl', 'name'];
      const hasSensitiveChanges = sensitiveFields.some(field => changes[field] !== undefined);

      if (hasSensitiveChanges && !helper.isGameMaster()) {
        console.warn(`[WS] scene:update denied: non-GM cannot modify scene settings`);
        return safeEmitError('Apenas o GM pode modificar configurações da cena.');
      }


      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return;

      const sceneIndex = campaign.scenes.findIndex(s => s.id === id);
      if (sceneIndex !== -1) {
        campaign.scenes[sceneIndex] = { ...campaign.scenes[sceneIndex], ...changes };
        await db.update('campaigns', client.campaignId, { scenes: campaign.scenes });
        safeBroadcast('scene:update', { id, changes });
      }
    } catch (err) {
      console.error('[WS] scene:update error:', err);
      safeEmitError('Erro ao atualizar cena.');
    }
  });

  socket.on('scene:add', requireGM(async (payload) => {
    try {
      const validation = validatePayload(payload, ['scene']);
      if (!validation.valid) return safeEmitError('Dados inválidos.');

      const { scene } = payload;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return safeEmitError('Campanha não encontrada.');

      if (!campaign) return safeEmitError('Campanha não encontrada.');

      if (!scene.id) scene.id = crypto.randomUUID();

      campaign.scenes.push(scene);
      await db.update('campaigns', client.campaignId, { scenes: campaign.scenes });

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
