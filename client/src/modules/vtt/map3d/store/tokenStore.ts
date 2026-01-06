import { create } from 'zustand';
import { Token } from '../types/token.types';

interface TokenStoreState {
  tokens: Record<string, Token>;

  // Actions
  addToken: (token: Token) => void;
  removeToken: (id: string) => void;
  updateToken: (id: string, updates: Partial<Token>) => void;
  setTokens: (tokens: Token[]) => void;
}

export const useTokenStore = create<TokenStoreState>((set) => ({
  tokens: {},

  addToken: (token) => set((state) => ({
    tokens: { ...state.tokens, [token.id]: token }
  })),

  removeToken: (id) => set((state) => {
    const newTokens = { ...state.tokens };
    delete newTokens[id];
    return { tokens: newTokens };
  }),

  updateToken: (id, updates) => set((state) => {
    const existing = state.tokens[id];
    if (!existing) return {};
    return {
      tokens: {
        ...state.tokens,
        [id]: { ...existing, ...updates }
      }
    };
  }),

  setTokens: (tokensList) => {
    const tokensRecord = tokensList.reduce((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {} as Record<string, Token>);

    set({ tokens: tokensRecord });
  },
}));
