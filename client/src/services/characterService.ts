

import { Character, ApiResponse } from '../types';
import { apiService } from './apiService';

export const characterService = {
  getAll: async (ownerId: string): Promise<ApiResponse<Character[]>> => {
    return await apiService.get<Character>('characters', (c) => c.ownerId === ownerId);
  },

  getUnassignedCharacters: async (ownerId: string): Promise<ApiResponse<Character[]>> => {
    const res = await apiService.get<Character>('characters', (c) => c.ownerId === ownerId);
    if (res.success && res.data) {
      // Filter manually to debug/ensure correctness
      const unassigned = res.data.filter(c => !c.campaignId || c.campaignId === '' || c.campaignId === 'undefined');
      return { success: true, data: unassigned };
    }
    return res;
  },

  getByCampaign: async (campaignId: string): Promise<ApiResponse<Character[]>> => {
    return await apiService.get<Character>('characters', (c) => c.campaignId === campaignId);
  },

  getById: async (id: string): Promise<ApiResponse<Character>> => {
    return await apiService.getById<Character>('characters', id);
  },

  create: async (data: Omit<Character, 'id' | 'createdAt'>): Promise<ApiResponse<Character>> => {
    if (!data.name) return { success: false, message: 'O nome do herói é obrigatório.' };
    return await apiService.post<Character>('characters', data);
  },

  update: async (id: string, data: Partial<Character>): Promise<ApiResponse<Character>> => {
    return await apiService.put<Character>('characters', id, data);
  },

  delete: async (id: string): Promise<ApiResponse<boolean>> => {
    return await apiService.delete<Character>('characters', id);
  }
};