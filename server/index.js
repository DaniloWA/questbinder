// index.js (ou server.js) — VERSÃO FINAL 100% FUNCIONAL
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { initDB, getCollection, getById, create, update, remove } from './db.js';
import { setupSocket } from './socket.js';

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

// ======================= MIDDLEWARES =======================
const corsOrigins = [
  process.env.CORS_ORIGIN_1 || 'http://localhost:5173',
  process.env.CORS_ORIGIN_2 || 'http://127.0.0.1:5173'
];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(express.json({ limit: '50mb' })); // Mapas grandes, tokens com imagem, etc.
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ======================= DATABASE INIT =======================
await initDB(); // ← IMPORTANTÍSSIMO: await aqui!
console.log('Banco de dados inicializado com sucesso.');

// ======================= SOCKET.IO =======================
const io = setupSocket(server);

// ======================= REST API =======================
app.get('/api/:collection', async (req, res) => {
  try {
    const items = await getCollection(req.params.collection);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar coleção' });
  }
});

app.get('/api/:collection/:id', async (req, res) => {
  try {
    const item = await getById(req.params.collection, req.params.id);
    if (!item) return res.status(404).json({ error: 'Não encontrado' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar item' });
  }
});

app.post('/api/:collection', async (req, res) => {
  try {
    const newItem = await create(req.params.collection, req.body);

    // Broadcast para a sala da campanha se houver campaignId
    if (req.body.campaignId) {
      const eventName = `${req.params.collection.replace(/s$/, '')}:add`; // characters -> character:add
      io.to(req.body.campaignId).emit(eventName, newItem);
      console.log(`[API] Emitting ${eventName} to ${req.body.campaignId}`);
    }

    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar' });
  }
});

app.put('/api/:collection/:id', async (req, res) => {
  try {
    let dataToUpdate = req.body;

    // Special handling for characters: add change history
    if (req.params.collection === 'characters') {
      const { v4: uuidv4 } = await import('uuid');
      const currentCharacter = await getById('characters', req.params.id);

      if (currentCharacter) {
        // Build change history entry
        const changeEntry = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          userId: req.body.updatedBy || 'api-user',
          userName: req.body.updatedByName || 'API User',
          changes: {}
        };

        // Compare old vs new values
        for (const [key, newValue] of Object.entries(req.body)) {
          if (key !== 'changeHistory' && key !== 'updatedBy' && key !== 'updatedByName') {
            const oldValue = currentCharacter[key];
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
          const currentHistory = currentCharacter.changeHistory || [];
          const newHistory = [...currentHistory, changeEntry].slice(-100);
          dataToUpdate = { ...dataToUpdate, changeHistory: newHistory };

          console.log(`[API] Added ${Object.keys(changeEntry.changes).length} changes to history for character ${req.params.id}`);
        }
      }
    }

    const updated = await update(req.params.collection, req.params.id, dataToUpdate);
    if (!updated) return res.status(404).json({ error: 'Não encontrado' });

    if (updated.campaignId) {
      const eventName = `${req.params.collection.replace(/s$/, '')}:update`; // characters -> character:update
      io.to(updated.campaignId).emit(eventName, updated);
      console.log(`[API] Emitting ${eventName} to ${updated.campaignId}`);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

app.delete('/api/:collection/:id', async (req, res) => {
  try {
    // Precisamos buscar o item antes para saber a campaignId (se não vier no body, que num DELETE geralmente não vem)
    const item = await getById(req.params.collection, req.params.id);
    const success = await remove(req.params.collection, req.params.id);
    if (!success) return res.status(404).json({ error: 'Não encontrado' });

    if (item && item.campaignId) {
      const eventName = `${req.params.collection.replace(/s$/, '')}:delete`; // characters -> character:delete
      io.to(item.campaignId).emit(eventName, { id: req.params.id });
      console.log(`[API] Emitting ${eventName} to ${item.campaignId}`);
    }

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar' });
  }
});

// Endpoint específico para atualizar permissões da campanha
app.patch('/api/campaigns/:id/permissions', async (req, res) => {
  console.log('[API] ========== PATCH /api/campaigns/:id/permissions ==========');
  console.log('[API] Campaign ID:', req.params.id);
  console.log('[API] Permissions:', JSON.stringify(req.body.permissions, null, 2));

  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions) {
      console.warn('[API] Missing permissions object');
      return res.status(400).json({ error: 'Permissions object is required' });
    }

    const campaign = await getById('campaigns', id);
    if (!campaign) {
      console.warn('[API] Campaign not found:', id);
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Update permissions in DB
    const updatedCampaign = await update('campaigns', id, { permissions });
    console.log('[API] ✅ Permissions saved to database');

    // Broadcast update via Socket.IO
    const roomSize = io.sockets.adapter.rooms.get(id)?.size || 0;
    console.log(`[API] Broadcasting to room ${id} (${roomSize} clients)`);
    io.to(id).emit('campaign:permissionsUpdated', { permissions });
    console.log(`[API] ✅ Broadcasted campaign:permissionsUpdated to ${roomSize} clients`);

    res.json(updatedCampaign.permissions);
  } catch (err) {
    console.error('[API] Error updating permissions:', err);
    res.status(500).json({ error: 'Error updating permissions' });
  }
});

// ======================= START SERVER =======================
server.listen(PORT, HOST, () => {
  console.log(`\n🚀 QuestBinder Server`);
  console.log(`📍 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌐 CORS habilitado para: ${corsOrigins.join(', ')}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});