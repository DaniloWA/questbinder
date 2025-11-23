// index.js (ou server.js) — VERSÃO FINAL 100% FUNCIONAL
import express from 'express';
import http from 'http';
import cors from 'cors';
import { initDB, getCollection, getById, create, update, remove } from './db.js';
import { setupSocket } from './socket.js';

const app = express();
const server = http.createServer(app);
const PORT = 3001;

// ======================= MIDDLEWARES =======================
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite default
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

// ======================= START SERVER =======================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nServidor rodando em http://localhost:${PORT}`);
  console.log(`API REST: http://localhost:${PORT}/api/campaigns`);
  console.log(`WebSocket: ws://localhost:${PORT}\n`);
});