// Socket handlers for Attack Zone events
// Attack zones are ephemeral (not persisted to DB) - cleared when GM disconnects

// In-memory store: Map<campaignId, AttackZoneConfig[]>
const campaignAttackZones = new Map();

export const registerAttackZoneHandlers = (socket, client, utils) => {
  const { safeEmitError, validatePayload, safeBroadcast } = utils;

  // Helper to get zones for current campaign
  const getZones = () => {
    if (!campaignAttackZones.has(client.campaignId)) {
      campaignAttackZones.set(client.campaignId, []);
    }
    return campaignAttackZones.get(client.campaignId);
  };

  // attackZone:add - Add a new attack zone
  socket.on('attackZone:add', (payload) => {
    try {
      if (!client.campaignId) return;

      // Only GM can create attack zones
      if (!client.isGM) {
        console.warn('[WS] attackZone:add denied: not GM');
        return safeEmitError('Apenas o GM pode criar zonas de ataque.');
      }

      const validation = validatePayload(payload, ['zone']);
      if (!validation.valid) {
        console.warn('[WS] attackZone:add validation failed:', validation.error);
        return safeEmitError('Dados inválidos para zona de ataque.');
      }

      const { zone } = payload;
      const zones = getZones();

      // Check for duplicate ID
      const existingIndex = zones.findIndex(z => z.id === zone.id);
      if (existingIndex >= 0) {
        zones[existingIndex] = zone;
      } else {
        zones.push(zone);
      }

      console.log(`[WS] attackZone:add - Zone ${zone.id} added to campaign ${client.campaignId}`);
      safeBroadcast('attackZone:add', { zone, userId: client.userId });
    } catch (err) {
      console.error('[WS] attackZone:add error:', err);
      safeEmitError('Erro ao adicionar zona de ataque.');
    }
  });

  // attackZone:update - Update an existing attack zone
  socket.on('attackZone:update', (payload) => {
    try {
      if (!client.campaignId) return;

      if (!client.isGM) {
        console.warn('[WS] attackZone:update denied: not GM');
        return safeEmitError('Apenas o GM pode editar zonas de ataque.');
      }

      const validation = validatePayload(payload, ['zoneId', 'updates']);
      if (!validation.valid) {
        console.warn('[WS] attackZone:update validation failed:', validation.error);
        return safeEmitError('Dados inválidos para atualização.');
      }

      const { zoneId, updates } = payload;
      const zones = getZones();

      const zoneIndex = zones.findIndex(z => z.id === zoneId);
      if (zoneIndex >= 0) {
        zones[zoneIndex] = { ...zones[zoneIndex], ...updates };
        console.log(`[WS] attackZone:update - Zone ${zoneId} updated`);
        safeBroadcast('attackZone:update', { zoneId, updates, userId: client.userId });
      } else {
        console.warn(`[WS] attackZone:update - Zone ${zoneId} not found`);
      }
    } catch (err) {
      console.error('[WS] attackZone:update error:', err);
      safeEmitError('Erro ao atualizar zona de ataque.');
    }
  });

  // attackZone:remove - Remove an attack zone
  socket.on('attackZone:remove', (payload) => {
    try {
      if (!client.campaignId) return;

      if (!client.isGM) {
        console.warn('[WS] attackZone:remove denied: not GM');
        return safeEmitError('Apenas o GM pode remover zonas de ataque.');
      }

      const validation = validatePayload(payload, ['zoneId']);
      if (!validation.valid) {
        console.warn('[WS] attackZone:remove validation failed:', validation.error);
        return safeEmitError('Dados inválidos para remoção.');
      }

      const { zoneId } = payload;
      const zones = getZones();

      const initialLength = zones.length;
      campaignAttackZones.set(
        client.campaignId,
        zones.filter(z => z.id !== zoneId)
      );

      if (getZones().length < initialLength) {
        console.log(`[WS] attackZone:remove - Zone ${zoneId} removed`);
        safeBroadcast('attackZone:remove', { zoneId, userId: client.userId });
      }
    } catch (err) {
      console.error('[WS] attackZone:remove error:', err);
      safeEmitError('Erro ao remover zona de ataque.');
    }
  });

  // attackZone:clear - Clear all attack zones
  socket.on('attackZone:clear', () => {
    try {
      if (!client.campaignId) return;

      if (!client.isGM) {
        console.warn('[WS] attackZone:clear denied: not GM');
        return safeEmitError('Apenas o GM pode limpar zonas de ataque.');
      }

      campaignAttackZones.set(client.campaignId, []);
      console.log(`[WS] attackZone:clear - All zones cleared for campaign ${client.campaignId}`);
      safeBroadcast('attackZone:clear', { userId: client.userId });
    } catch (err) {
      console.error('[WS] attackZone:clear error:', err);
      safeEmitError('Erro ao limpar zonas de ataque.');
    }
  });

  // attackZone:sync - Request current zones (for late joiners)
  socket.on('attackZone:sync', () => {
    try {
      if (!client.campaignId) return;

      const zones = getZones();
      socket.emit('attackZone:syncResponse', { zones });
      console.log(`[WS] attackZone:sync - Sent ${zones.length} zones to ${client.userId}`);
    } catch (err) {
      console.error('[WS] attackZone:sync error:', err);
    }
  });
};

// Export cleanup function to clear zones when GM disconnects
export const cleanupAttackZones = (campaignId) => {
  if (campaignAttackZones.has(campaignId)) {
    campaignAttackZones.delete(campaignId);
    console.log(`[WS] Attack zones cleared for campaign ${campaignId} (GM disconnected)`);
  }
};
