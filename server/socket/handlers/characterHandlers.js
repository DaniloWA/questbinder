import * as db from '../../db.js';
import { v4 as uuidv4 } from 'uuid';

export const registerCharacterHandlers = (socket, client, utils) => {
  const { safeBroadcast, checkPermission } = utils;

  socket.on('character:update', async (payload) => {
    try {
      const { characterId, updates } = payload;
      if (!client.campaignId || !updates) return;

      // 1. Get character and campaign for permission checks
      const character = await db.get('characters', characterId);
      const campaign = await db.get('campaigns', client.campaignId);

      if (!character || !campaign) {
        console.error('[WS] Character or campaign not found');
        return;
      }

      // 2. Permission check: GM always allowed, owner needs sheetEdit permission
      const isGM = campaign.ownerId === client.userId;
      const isOwner = character.ownerId === client.userId;
      const hasSheetEditPerm = await checkPermission('sheetEdit');

      if (!isGM && !(isOwner && hasSheetEditPerm)) {
        console.log(`[WS] Permission denied: User ${client.userId} cannot edit character ${characterId}`);
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

        console.log(`[WS] Logged ${Object.keys(changeEntry.changes).length} changes to history for character ${characterId}`);
      }

      // 5. Update in Database
      await db.update('characters', characterId, filteredUpdates);

      // 6. Broadcast to everyone in the room (including sender for confirmation)
      safeBroadcast('character:update', {
        characterId,
        updates: filteredUpdates,
        updatedBy: client.userId
      });

      // Also emit to sender for immediate confirmation
      socket.emit('character:update', {
        characterId,
        updates: filteredUpdates,
        updatedBy: client.userId
      });

      console.log(`[WS] Character ${characterId} updated by ${client.userId}, broadcast to room ${client.campaignId}`);

    } catch (err) {
      console.error('[WS] character:update error:', err);
      socket.emit('error', { message: 'Erro ao atualizar personagem.' });
    }
  });
};
