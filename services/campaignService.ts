
import { Campaign, ApiResponse, User } from '../types';
import { apiService } from './apiService';

export const campaignService = {
  getAll: async (userId: string): Promise<ApiResponse<Campaign[]>> => {
    // Busca todas e filtra no cliente (ou simula filtro de backend)
    // Regra: Dono da campanha OU está na lista de jogadores
    return await apiService.get<Campaign>('campaigns', (c) =>
      c.ownerId === userId || c.players.list.includes(userId)
    );
  },

  getById: async (id: string): Promise<ApiResponse<Campaign>> => {
    return await apiService.getById<Campaign>('campaigns', id);
  },

  getAllUsers: async (): Promise<ApiResponse<User[]>> => {
    // Endpoint auxiliar para buscar lista de usuários (para convites, etc)
    return await apiService.get<User>('users');
  },

  getPlayers: async (campaignId: string): Promise<ApiResponse<User[]>> => {
    const campRes = await apiService.getById<Campaign>('campaigns', campaignId);
    if (!campRes.success || !campRes.data) return { success: false, message: 'Campanha não encontrada' };

    const campaign = campRes.data;
    const allUsersRes = await apiService.get<User>('users');

    if (!allUsersRes.success || !allUsersRes.data) return { success: false, message: 'Erro ao buscar usuários' };

    // Filtra usuários que são jogadores ou o mestre
    const players = allUsersRes.data.filter(u =>
      campaign.players.list.includes(u.id) || u.id === campaign.ownerId
    );

    return { success: true, data: players };
  },

  create: async (data: Omit<Campaign, 'id' | 'createdAt'>): Promise<ApiResponse<Campaign>> => {
    if (!data.name) return { success: false, message: 'Nome obrigatório.' };
    return await apiService.post<Campaign>('campaigns', data);
  },

  update: async (id: string, data: Partial<Campaign>): Promise<ApiResponse<Campaign>> => {
    return await apiService.put<Campaign>('campaigns', id, data);
  },

  delete: async (id: string): Promise<ApiResponse<boolean>> => {
    return await apiService.delete('campaigns', id);
  },

  // --- Métodos Específicos de Lógica de Negócio ---

  addPlayer: async (campaignId: string, userId: string): Promise<ApiResponse<boolean>> => {
    const campRes = await apiService.getById<Campaign>('campaigns', campaignId);
    if (!campRes.data) return { success: false, message: 'Campanha não encontrada' };

    const campaign = campRes.data;

    if (campaign.players.list.includes(userId)) {
      return { success: false, message: 'Jogador já está na campanha.' };
    }
    if (campaign.players.current >= campaign.players.max) {
      return { success: false, message: 'Campanha cheia.' };
    }

    const newList = [...campaign.players.list, userId];

    await apiService.put<Campaign>('campaigns', campaignId, {
      players: { ...campaign.players, current: newList.length, list: newList }
    });

    return { success: true };
  },

  removePlayer: async (campaignId: string, userId: string): Promise<ApiResponse<boolean>> => {
    const campRes = await apiService.getById<Campaign>('campaigns', campaignId);
    if (!campRes.data) return { success: false, message: 'Campanha não encontrada' };

    const campaign = campRes.data;
    const newList = campaign.players.list.filter(id => id !== userId);

    await apiService.put<Campaign>('campaigns', campaignId, {
      players: { ...campaign.players, current: newList.length, list: newList }
    });

    return { success: true };
  },

  updatePermissions: async (campaignId: string, permissions: any): Promise<ApiResponse<any>> => {
    return await apiService.patch<any>(`campaigns/${campaignId}/permissions`, { permissions });
  }
};