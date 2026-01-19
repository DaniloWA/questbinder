import * as db from '../../db.js';
import { v4 as uuidv4 } from 'uuid';
import { SyncMiddleware } from '../sync/SyncMiddleware.js';

export const registerCharacterHandlers = (socket, client, utils) => {
  console.log('[character] handlers registered');
  const { safeBroadcast, getPermissionHelper } = utils;

  socket.on('character:update', async (payload) => {
    try {
      const { characterId, updates } = payload;
      if (!client.campaignId || !updates) return;

      // 1. Get character and campaign for permission checks
      const character = await db.getById('characters', characterId);
      const campaign = await db.getById('campaigns', client.campaignId);

      if (!character || !campaign) {
        console.error('[WS] Character or campaign not found');
        return;
      }

      // 0. Sync Check
      const clientVersion = payload.clientVersion;
      const changeId = payload.changeId;
      const currentVersion = character.version || 0;

      if (SyncMiddleware.hasConflict(clientVersion, currentVersion)) {
        if (changeId) socket.emit('sync:reject', SyncMiddleware.createReject(changeId, currentVersion, character));
        // Force refresh
        socket.emit('character:update', { characterId, updates: character, updatedBy: 'system', version: currentVersion });
        return;
      }

      // REGRA MILENAR: Use PermissionHelper
      const helper = await getPermissionHelper();

      // 2. Permission check: GM always allowed, owner needs sheetEdit permission
      const isGM = helper.isGameMaster();
      const isOwner = character.ownerId === client.userId;
      const hasSheetEditPerm = helper.can('sheetEdit');

      if (!isGM && !(isOwner && hasSheetEditPerm)) {
        console.log(`[WS] Permission denied: cannot edit character ${characterId}`);
        socket.emit('error', { message: 'Você não tem permissão para editar esta ficha.' });
        return;
      }

      // 3. Filter out gmNotes if user is not GM
      let filteredUpdates = { ...updates };
      if (!isGM && filteredUpdates.gmNotes !== undefined) {
        delete filteredUpdates.gmNotes;
      }

      // 4. Log changes to history (before applying updates)
      const changeEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        userId: client.userId,
        userName: client.userName || 'Unknown',
        changes: {}
      };

      // Build diff of changes using JSON comparison for deep equality
      for (const [key, newValue] of Object.entries(filteredUpdates)) {
        if (key !== 'changeHistory') {
          const oldValue = character[key];
          // Use JSON comparison for objects/arrays, direct comparison for primitives
          const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

          if (hasChanged) {
            changeEntry.changes[key] = {
              old: oldValue,
              new: newValue
            };
          }
        }
      }

      // Only add to history if there are actual changes
      if (Object.keys(changeEntry.changes).length > 0) {
        const currentHistory = character.changeHistory || [];
        const newHistory = [...currentHistory, changeEntry].slice(-100); // Keep last 100 entries
        filteredUpdates.changeHistory = newHistory;
      }

      // 5. Update in Database
      const nextVersion = SyncMiddleware.nextVersion(currentVersion);
      filteredUpdates.version = nextVersion;

      await db.update('characters', characterId, filteredUpdates);

      if (changeId) {
        socket.emit('sync:ack', SyncMiddleware.createAck(changeId, nextVersion));
      }

      // 6. Broadcast to everyone in the room (including sender for confirmation)
      safeBroadcast('character:update', {
        characterId,
        updates: filteredUpdates,
        updatedBy: client.userId,
        version: nextVersion
      });

      // Also emit to sender for immediate confirmation (redundant if using Ack? kept for legacy compatibility)
      socket.emit('character:update', {
        characterId,
        updates: filteredUpdates,
        updatedBy: client.userId,
        version: nextVersion
      });

      console.log(`[WS] Character ${characterId} updated by ${client.userId}, broadcast to room ${client.campaignId}`);

    } catch (err) {
      console.error('[WS] character:update error:', err);
      socket.emit('error', { message: 'Erro ao atualizar personagem.' });
    }
  });
};
