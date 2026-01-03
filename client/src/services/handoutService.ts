import { Handout, ApiResponse } from '../types';
import { apiService } from './apiService';

export const handoutService = {
  getByCampaign: async (campaignId: string): Promise<ApiResponse<Handout[]>> => {
    return await apiService.get<Handout>('handouts', (h) => h.campaignId === campaignId);
  },

  create: async (data: Omit<Handout, 'id' | 'createdAt' | 'sharedWith'>): Promise<ApiResponse<Handout>> => {
    const fullData = { ...data, sharedWith: [] };
    return await apiService.post<Handout>('handouts', fullData);
  },

  update: async (id: string, data: Partial<Omit<Handout, 'id' | 'campaignId' | 'createdAt'>>): Promise<ApiResponse<Handout>> => {
    return await apiService.put<Handout>('handouts', id, data);
  },

  delete: async (id: string): Promise<ApiResponse<boolean>> => {
    return await apiService.delete<Handout>('handouts', id);
  }
};
