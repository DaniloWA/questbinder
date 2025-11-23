// src/services/apiService.ts
import { MockDataLayer, initMockDatabase } from '../data/mockDataLayer';
import type { CollectionName } from '../data/mockDataLayer';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// MUDE PARA true QUANDO QUISER USAR O BACKEND REAL (só isso!)
const USE_REAL_BACKEND = true;

const API_BASE = 'http://localhost:3000/api';

const getHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
});

// Inicializa o mock só se estiver offline
if (!USE_REAL_BACKEND) initMockDatabase();

const handleError = (msg: string) => {
  console.error('[apiService]', msg);
  return { success: false, message: msg } as const;
};

export const apiService = {
  // GET ALL (com filtro opcional)
  get: async <T>(
    collection: CollectionName,
    filter?: (item: T) => boolean
  ): Promise<ApiResponse<T[]>> => {
    if (!USE_REAL_BACKEND) {
      const data = MockDataLayer.readTable(collection) as T[];
      return {
        success: true,
        data: filter ? data.filter(filter) : data,
      };
    }

    try {
      const res = await fetch(`${API_BASE}/${collection}`, {
        headers: getHeaders(),
      });

      if (!res.ok) return handleError(`HTTP ${res.status} - ${res.statusText}`);

      const data = (await res.json()) as T[];
      return {
        success: true,
        data: filter ? data.filter(filter) : data,
      };
    } catch (err) {
      return handleError('Sem conexão com o servidor');
    }
  },

  // GET BY ID
  getById: async <T extends { id: string; }>(
    collection: CollectionName,
    id: string
  ): Promise<ApiResponse<T>> => {
    if (!USE_REAL_BACKEND) {
      const items = MockDataLayer.readTable(collection) as T[];
      const item = items.find((i) => i.id === id);
      return item
        ? { success: true, data: item }
        : { success: false, message: 'Não encontrado' };
    }

    try {
      const res = await fetch(`${API_BASE}/${collection}/${id}`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        if (res.status === 404) return { success: false, message: 'Não encontrado' };
        return handleError(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as T;
      return { success: true, data };
    } catch (err) {
      return handleError('Erro de conexão');
    }
  },

  // CREATE
  post: async <T extends { id?: string; }>(
    collection: CollectionName,
    payload: Omit<T, 'id' | 'createdAt'>
  ): Promise<ApiResponse<T>> => {
    if (!USE_REAL_BACKEND) {
      const items = MockDataLayer.readTable(collection) as T[];
      const newItem = {
        ...(payload as any),
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      items.push(newItem);
      MockDataLayer.writeTable(collection, items);
      return { success: true, data: newItem };
    }

    try {
      const res = await fetch(`${API_BASE}/${collection}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) return handleError(`Falha ao criar (HTTP ${res.status})`);

      const data = (await res.json()) as T;
      return { success: true, data };
    } catch (err) {
      return handleError('Erro ao salvar no servidor');
    }
  },

  // UPDATE
  put: async <T extends { id: string; }>(
    collection: CollectionName,
    id: string,
    changes: Partial<T>
  ): Promise<ApiResponse<T>> => {
    if (!USE_REAL_BACKEND) {
      const items = MockDataLayer.readTable(collection) as T[];
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return { success: false, message: 'Não encontrado' };

      items[index] = { ...items[index], ...changes };
      MockDataLayer.writeTable(collection, items);
      return { success: true, data: items[index] };
    }

    try {
      const res = await fetch(`${API_BASE}/${collection}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(changes),
      });

      if (!res.ok) return handleError(`Falha ao atualizar (HTTP ${res.status})`);

      const data = (await res.json()) as T;
      return { success: true, data };
    } catch (err) {
      return handleError('Erro ao atualizar no servidor');
    }
  },

  // DELETE
  delete: async (
    collection: CollectionName,
    id: string
  ): Promise<ApiResponse<boolean>> => {
    if (!USE_REAL_BACKEND) {
      const items = MockDataLayer.readTable(collection) as any[];
      const filtered = items.filter((i) => i.id !== id);
      if (filtered.length === items.length)
        return { success: false, message: 'Não encontrado' };

      MockDataLayer.writeTable(collection, filtered);
      return { success: true, data: true };
    }

    try {
      const res = await fetch(`${API_BASE}/${collection}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      return { success: res.ok, data: res.ok };
    } catch (err) {
      return handleError('Erro ao deletar no servidor');
    }
  },
};