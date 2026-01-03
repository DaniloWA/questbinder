
import { CompendiumResult, ApiMonster, ApiSpell, ApiMagicItem, ApiSection } from '../types/compendium';

const BASE_URL = 'https://api.open5e.com';

class CompendiumService {
  private cache: Map<string, any> = new Map();

  private async fetchJson<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });

    const cacheKey = url.toString();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    
    const data = await response.json();
    this.cache.set(cacheKey, data);
    return data;
  }

  // --- MONSTERS ---
  async searchMonsters(query: string, page: number = 1): Promise<CompendiumResult<ApiMonster>> {
    return this.fetchJson<CompendiumResult<ApiMonster>>('/monsters/', {
      search: query,
      page,
      limit: 20,
      ordering: 'challenge_rating', // Easier for GMs
      document__slug: 'wotc-srd' // Only SRD content for legal safety/standard
    });
  }

  // --- SPELLS ---
  async searchSpells(query: string, page: number = 1): Promise<CompendiumResult<ApiSpell>> {
    return this.fetchJson<CompendiumResult<ApiSpell>>('/spells/', {
      search: query,
      page,
      limit: 20,
      ordering: 'level_int',
      document__slug: 'wotc-srd'
    });
  }

  // --- ITEMS ---
  async searchItems(query: string, page: number = 1): Promise<CompendiumResult<ApiMagicItem>> {
    return this.fetchJson<CompendiumResult<ApiMagicItem>>('/magicitems/', {
      search: query,
      page,
      limit: 20,
      document__slug: 'wotc-srd'
    });
  }

  // --- RULES ---
  async searchRules(query: string): Promise<CompendiumResult<ApiSection>> {
    return this.fetchJson<CompendiumResult<ApiSection>>('/sections/', {
      search: query,
      limit: 50,
      document__slug: 'wotc-srd'
    });
  }
}

export const compendiumService = new CompendiumService();
