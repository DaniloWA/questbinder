import * as db from '../db.js';
import crypto from 'crypto';
import PermissionHelper from '../utils/PermissionHelper.js';



export const validatePayload = (payload, requiredFields) => {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid payload' };
  }
  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  return { valid: true };
};

export const createSocketUtils = (io, socket, client) => {
  const safeEmitError = (message) => {
    try {
      socket.emit('error', { message });
    } catch (err) {
      console.error('[WS] Failed to emit error:', err);
    }
  };

  const safeBroadcast = (event, payload) => {
    try {
      if (!client.campaignId) {
        console.warn('[WS] safeBroadcast: no campaign ID');
        return;
      }
      io.to(client.campaignId).emit(event, payload);
      console.log(`[WS] Emitting: ${event}`);
    } catch (err) {
      console.error(`[WS] Failed to broadcast ${event}:`, err);
    }
  };

  const broadcast = (event, payload) => {
    try {
      if (!client.campaignId) {
        console.warn('[WS] broadcast: no campaign ID');
        return;
      }
      socket.to(client.campaignId).emit(event, payload);
      console.log(`[WS] Emitting (others): ${event}`);
    } catch (err) {
      console.error(`[WS] Failed to broadcast ${event}:`, err);
    }
  };

  const broadcastToRoom = (event, payload) => {
    try {
      if (!client.campaignId) {
        console.warn('[WS] broadcastToRoom: no campaign ID');
        return;
      }
      io.to(client.campaignId).emit(event, payload);
      console.log(`[WS] Emitting (all): ${event}`);
    } catch (err) {
      console.error(`[WS] Failed to broadcast ${event}:`, err);
    }
  };

  const logChange = async (type, action, details) => {
    try {
      if (!client.campaignId) return;

      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) return;

      const log = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userId: client.userId,
        userName: client.userName || 'Unknown',
        type,
        action,
        details
      };

      const changeLog = campaign.changeLog || [];
      changeLog.push(log);

      changeLog.push(log);
      const trimmedLog = changeLog.slice(-500);

      await db.update('campaigns', client.campaignId, { changeLog: trimmedLog });
    } catch (err) {
      console.error('[WS] Failed to log change:', err);
    }
  };

  const getPermissionHelper = async () => {
    return await PermissionHelper.create(client);
  };

  const checkPermission = async (perm) => {
    const helper = await getPermissionHelper();
    return helper.can(perm);
  };

  const requireGM = (handler) => async (payload) => {
    const helper = await getPermissionHelper();
    if (!client.campaignId || !helper.isGameMaster()) {
      safeEmitError('Apenas o GM pode fazer isso.');
      return;
    }
    try {
      await handler(payload);
    } catch (err) {
      console.error('[WS] requireGM handler error:', err);
      safeEmitError('Erro ao processar ação do GM.');
    }
  };

  return {
    safeEmitError,
    safeBroadcast,
    broadcast,
    broadcastToRoom,
    logChange,
    logChange,
    getPermissionHelper,
    checkPermission,
    requireGM,
    validatePayload
  };
};
