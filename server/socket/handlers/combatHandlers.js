// server/socket/handlers/combatHandlers.js
import * as db from '../../db.js';

export const registerCombatHandlers = (socket, client, utils) => {
  console.log('[combat] handlers registered');
  const { broadcast, broadcastToRoom, logChange, getPermissionHelper } = utils;

  // ==================== COMBAT:START ====================
  socket.on('combat:start', async (payload) => {
    try {
      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();
      if (!client.campaignId || !helper.isGameMaster()) {
        console.warn('[WS] combat:start: Unauthorized or no campaign');
        return;
      }

      const { combat } = payload;

      // Broadcast to all clients in the room
      broadcastToRoom('combat:start', { combat });

      logChange('combat', 'started', {
        round: combat.round,
        participants: combat.turnOrder.length
      });

      console.log(`[WS] Combat started in campaign ${client.campaignId} with ${combat.turnOrder.length} combatants`);
    } catch (err) {
      console.error('[WS] combat:start error:', err);
    }
  });

  // ==================== COMBAT:END ====================
  socket.on('combat:end', async (payload) => {
    try {
      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();
      if (!client.campaignId || !helper.isGameMaster()) {
        console.warn('[WS] combat:end: Unauthorized or no campaign');
        return;
      }

      const { stats } = payload;

      // Broadcast to all clients
      broadcastToRoom('combat:end', { stats });

      logChange('combat', 'ended', {
        duration: stats?.combatDuration,
        totalDamage: stats?.totalDamageDealt
      });

      console.log(`[WS] Combat ended in campaign ${client.campaignId}`);
    } catch (err) {
      console.error('[WS] combat:end error:', err);
    }
  });

  // ==================== COMBAT:UPDATE ====================
  socket.on('combat:update', async (payload) => {
    try {
      if (!client.campaignId) {
        console.warn('[WS] combat:update: No campaign');
        return;
      }

      const { combat } = payload;

      // Broadcast to all clients except sender
      broadcast('combat:update', { combat });

      console.log(`[WS] Combat updated in campaign ${client.campaignId}`);
    } catch (err) {
      console.error('[WS] combat:update error:', err);
    }
  });

  // ==================== COMBAT:NEXT-TURN ====================
  socket.on('combat:next-turn', async (payload) => {
    try {
      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();
      if (!client.campaignId || !helper.isGameMaster()) {
        console.warn('[WS] combat:next-turn: Unauthorized or no campaign');
        return;
      }

      const { combat } = payload;

      // Broadcast to all clients
      broadcastToRoom('combat:next-turn', { combat });

      const activeCombatant = combat.turnOrder[combat.activeTurnIndex];
      logChange('combat', 'turn-advanced', {
        round: combat.round,
        activeCombatant: activeCombatant?.name
      });

      console.log(`[WS] Combat turn advanced: Round ${combat.round}, ${activeCombatant?.name}'s turn`);
    } catch (err) {
      console.error('[WS] combat:next-turn error:', err);
    }
  });

  // ==================== COMBAT:COMBATANT:ADD ====================
  socket.on('combat:combatant:add', async (payload) => {
    try {
      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();
      if (!client.campaignId || !helper.isGameMaster()) {
        console.warn('[WS] combat:combatant:add: Unauthorized or no campaign');
        return;
      }

      const { combatant } = payload;

      // Broadcast to all clients
      broadcastToRoom('combat:combatant:add', { combatant });

      logChange('combat', 'combatant-added', {
        name: combatant.name,
        initiative: combatant.initiative
      });

      console.log(`[WS] Combatant added: ${combatant.name}`);
    } catch (err) {
      console.error('[WS] combat:combatant:add error:', err);
    }
  });

  // ==================== COMBAT:COMBATANT:UPDATE ====================
  socket.on('combat:combatant:update', async (payload) => {
    try {
      if (!client.campaignId) {
        console.warn('[WS] combat:combatant:update: No campaign');
        return;
      }

      const { id, updates } = payload;

      // Broadcast to all clients except sender
      broadcast('combat:combatant:update', { id, updates });

      console.log(`[WS] Combatant updated: ${id}`);
    } catch (err) {
      console.error('[WS] combat:combatant:update error:', err);
    }
  });

  // ==================== COMBAT:COMBATANT:REMOVE ====================
  socket.on('combat:combatant:remove', async (payload) => {
    try {
      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();
      if (!client.campaignId || !helper.isGameMaster()) {
        console.warn('[WS] combat:combatant:remove: Unauthorized or no campaign');
        return;
      }

      const { id } = payload;

      // Broadcast to all clients
      broadcastToRoom('combat:combatant:remove', { id });

      logChange('combat', 'combatant-removed', { id });

      console.log(`[WS] Combatant removed: ${id}`);
    } catch (err) {
      console.error('[WS] combat:combatant:remove error:', err);
    }
  });

  // ==================== COMBAT:ACTION ====================
  socket.on('combat:action', async (payload) => {
    try {
      if (!client.campaignId) {
        console.warn('[WS] combat:action: No campaign');
        return;
      }

      const { action } = payload;

      // Broadcast to all clients
      broadcastToRoom('combat:action', { action });

      console.log(`[WS] Combat action: ${action.type} - ${action.description}`);
    } catch (err) {
      console.error('[WS] combat:action error:', err);
    }
  });

  console.log('[WS] Combat handlers registered');
};
