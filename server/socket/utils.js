import * as db from '../db.js';

export const DEFAULT_PERMISSIONS = {
  tokenMovement: true,
  doorControl: true,
  drawings: true,
  drawingDelete: false,
  drawingClear: false,
  measure: true,
  pingMap: true,
  diceRolling: true,
  tokenCreate: false,
  tokenEdit: false,
  tokenDelete: false,
  fogReveal: false,
  compendiumBrowse: false, // GM only by default
  journalCreate: true,
  sheetEdit: true,
  initiativeRoll: true,
  shareCursor: true,
  allowSpectate: true,
  logConfig: { movement: 'public', combat: 'public', rolls: 'public', system: 'public' },
  userOverrides: {}
};

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
      console.log(`[WS] Broadcasted ${event} to room ${client.campaignId}`);
    } catch (err) {
      console.error(`[WS] Failed to broadcast ${event}:`, err);
    }
  };

  const checkPermission = async (perm) => {
    if (!client.campaignId) {
      console.warn('[WS] checkPermission: no campaign ID');
      return false;
    }
    if (client.isGM) return true;

    try {
      const campaign = await db.getById('campaigns', client.campaignId);
      if (!campaign) {
        console.warn('[WS] checkPermission: campaign not found');
        return false;
      }

      const perms = campaign.permissions || DEFAULT_PERMISSIONS;
      const override = perms.userOverrides?.[client.userId]?.[perm];
      const result = override !== undefined ? override : (perms[perm] !== undefined ? perms[perm] : DEFAULT_PERMISSIONS[perm]);

      console.log(`[WS] checkPermission ${perm} for ${client.userId}: ${result}`);
      return !!result;
    } catch (e) {
      console.error('[WS] checkPermission error:', e);
      return false;
    }
  };

  const requireGM = (handler) => async (payload) => {
    if (!client.campaignId || !client.isGM) {
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
    checkPermission,
    requireGM,
    validatePayload
  };
};
