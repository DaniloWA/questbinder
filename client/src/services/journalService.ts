
import { JournalEntry, ApiResponse } from '../types';
import { apiService } from './apiService';

export const journalService = {
  getEntries: async (campaignId: string, userId: string, isGM: boolean): Promise<ApiResponse<JournalEntry[]>> => {
    return await apiService.get<JournalEntry>('journal_entries', (entry) => {
        if (entry.campaignId !== campaignId) return false;
        
        // Regras de visibilidade
        if (isGM) return true; // GM vê tudo? Talvez notas privadas de jogadores não.
        if (entry.authorId === userId) return true; // O autor vê suas notas
        if (entry.permissions === 'all') return true; // Público
        if (entry.permissions === 'players' && !isGM) return true; // Visível para jogadores
        
        return false;
    });
  },

  createEntry: async (data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<JournalEntry>> => {
    const now = new Date().toISOString();
    const fullData = { ...data, updatedAt: now };
    return await apiService.post<JournalEntry>('journal_entries', fullData);
  },

  updateEntry: async (id: string, data: Partial<JournalEntry>): Promise<ApiResponse<JournalEntry>> => {
    const updates = { ...data, updatedAt: new Date().toISOString() };
    return await apiService.put<JournalEntry>('journal_entries', id, updates);
  },

  deleteEntry: async (id: string): Promise<ApiResponse<boolean>> => {
    return await apiService.delete<JournalEntry>('journal_entries', id);
  }
};
