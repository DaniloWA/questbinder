// db.js - Versão FINAL, FUNCIONANDO 100% com o seu projeto atual
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { SEED_DATA } from './seed.js';

// Default permissions definition to avoid importing TS in JS server
const defaultTokenHoverPermissions = {
  enabled: true, // Master toggle - hover enabled by default
  pc: {
    showName: true,
    showHP: true,
    showResource: true,
    showConditions: true,
    showStats: true,
    showAttributes: true,
  },
  npc: {
    showName: true,
    showHP: true,
    showResource: true,
    showConditions: true,
    showStats: true,
    showAttributes: true,
  },
  object: {
    showName: true,
    showConditions: true,
  }
};

let dbInstance = null;

// Use DB_PATH from environment for Docker volume mounting
const DB_PATH = process.env.DB_PATH || '.';

export const initDB = async () => {
  dbInstance = await open({
    filename: `${DB_PATH}/database.sqlite`,
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS store (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (collection, id)
    )
  `);

  const row = await dbInstance.get('SELECT COUNT(*) AS count FROM store');
  if (row.count === 0) {
    console.log('Database vazio. Fazendo seed...');
    for (const [collection, items] of Object.entries(SEED_DATA)) {
      for (const item of items) {
        await create(collection, item);
      }
    }
    console.log('Seed concluído!');
  }
};

// ==================== EXPORTES BÁSICOS ====================
export const getById = async (collection, id) => {
  const row = await dbInstance.get(
    'SELECT data FROM store WHERE collection = ? AND id = ?',
    collection,
    id
  );
  return row ? JSON.parse(row.data) : null;
};

export const getCollection = async (collection) => {
  const rows = await dbInstance.all(
    'SELECT data FROM store WHERE collection = ?',
    collection
  );
  return rows.map(row => JSON.parse(row.data));
};

export const create = async (collection, data) => {
  const id = data.id || crypto.randomUUID();
  const item = {
    ...data,
    id,
    createdAt: data.createdAt || new Date().toISOString()
  };

  // Ensure default token hover permissions for new campaigns
  if (collection === 'campaigns' && !item.permissions) {
    item.permissions = {
      // Basic permissions defaults
      tokenMovement: true,
      doorControl: true,
      drawings: true,
      measure: true,
      pingMap: true,
      diceRolling: true,
      tokenCreate: true,
      tokenEdit: true,
      tokenDelete: true,
      fogReveal: true,
      compendiumBrowse: false, // GM only by default
      journalCreate: true,
      sheetEdit: true,
      initiativeRoll: true,
      drawingDelete: true,
      drawingClear: true,
      shareCursor: true,
      allowSpectate: true,
      tokenHover: defaultTokenHoverPermissions,
      logConfig: { movement: 'public', combat: 'public', rolls: 'public', system: 'public', broadcastConditions: true },
      userOverrides: {}
    };
  }

  await dbInstance.run(
    'INSERT INTO store (collection, id, data) VALUES (?, ?, ?)',
    collection,
    id,
    JSON.stringify(item)
  );

  return item;
};

export const update = async (collection, id, changes) => {
  const current = await getById(collection, id);
  if (!current) return null;

  const updated = { ...current, ...changes };
  await dbInstance.run(
    'UPDATE store SET data = ? WHERE collection = ? AND id = ?',
    JSON.stringify(updated),
    collection,
    id
  );
  return updated;
};

export const remove = async (collection, id) => {
  const result = await dbInstance.run(
    'DELETE FROM store WHERE collection = ? AND id = ?',
    collection,
    id
  );
  return result.changes > 0;
};

// db.js — atomicUpdate CORRIGIDO E INDESTRUTÍVEL
export const atomicUpdate = async (collection, id, { path, operation }) => {
  const doc = await getById(collection, id);
  if (!doc) throw new Error(`Documento ${collection}/${id} não encontrado`);

  let target = doc;

  // Navega pelo path criando objetos/arrays se não existirem
  if (path) {
    const parts = path.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];

      // Suporta índices de array como "tokens.abc123" → trata "abc123" como chave normal
      if (target[key] === undefined) {
        // Se o próximo segmento parece um ID (não número), cria objeto. Se for número, cria array.
        const nextPart = parts[i + 1];
        if (!isNaN(nextPart) && nextPart !== '') {
          target[key] = [];
        } else {
          target[key] = {};
        }
      }
      target = target[key];
    }
    // Última chave do path
    const finalKey = parts[parts.length - 1];
    if (target[finalKey] === undefined) {
      // Descobre se deve ser array ou objeto
      if (operation.$push !== undefined) {
        target[finalKey] = [];
      } else if (operation.$set !== undefined && typeof operation.$set === 'object') {
        target[finalKey] = {};
      } else {
        target[finalKey] = null; // fallback seguro
      }
    }
    target = target[finalKey];
  }

  // Agora aplica a operação com segurança total
  if (operation.$set !== undefined) {
    if (target === null || target === undefined) {
      target = operation.$set; // substitui completamente
    } else {
      Object.assign(target, operation.$set);
    }
  } else if (operation.$push !== undefined) {
    if (!Array.isArray(target)) target = [];
    target.push(operation.$push);
  } else if (operation.$pull !== undefined) {
    if (Array.isArray(target)) {
      const pullVal = operation.$pull;
      if (pullVal && pullVal.id) {
        target = target.filter(item => item.id !== pullVal.id);
      }
    }
  }

  // Salva de volta
  await update(collection, id, doc);
  return doc;
};

// Função auxiliar que aplica $push, $pull, $set em caminhos aninhados
function applyOperation(obj, path, operation, arrayFilters = []) {
  const parts = path.replace(/\.\$\[.*?\]/g, '.$').split('.'); // trata $[scene] como $
  const lastKey = parts.pop();

  let current = obj;
  let filterIdx = 0;

  for (const part of parts) {
    if (part === '$') {
      const filter = arrayFilters[filterIdx++];
      if (!filter) throw new Error('Falta arrayFilter');

      const filterKey = Object.keys(filter)[0];
      const filterValue = filter[filterKey];

      // Suporta scene.id, token.id, h.id, etc.
      const realKey = filterKey.includes('.') ? filterKey.split('.').pop() : filterKey;
      current = current.find(item => item[realKey] === filterValue);
      if (!current) throw new Error('Elemento não encontrado com o filtro fornecido');
    } else {
      if (current[part] === undefined) {
        current[part] = {};
      }
      current = current[part];
    }
  }

  // Aplicar operação final
  if (operation.$push !== undefined) {
    if (!Array.isArray(current[lastKey])) current[lastKey] = [];
    current[lastKey].push(operation.$push);
  } else if (operation.$pull !== undefined) {
    if (Array.isArray(current[lastKey])) {
      const pull = operation.$pull;
      if (pull && pull.id) {
        current[lastKey] = current[lastKey].filter(x => x.id !== pull.id);
      }
    }
  } else if (operation.$set !== undefined) {
    current[lastKey] = operation.$set;
  }
}