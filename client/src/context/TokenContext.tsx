import React, { createContext, useContext } from 'react';
import { Token } from '../types';

export interface TokenContextType {
  moveToken: (id: string, x: number, y: number) => void;
  moveTokens: (updates: { id: string, x: number, y: number; }[]) => void;
  updateToken: (id: string, data: Partial<Token>) => void;
  addToken: (token: Partial<Token>) => void;
  removeToken: (id: string) => void;
  moveTokenToScene: (tokenId: string, sceneId: string) => void;
  selectToken: (id: string, multi: boolean) => void;
  clearSelection: () => void;
  emitTokenDrag: (id: string, x: number, y: number, path: { x: number, y: number; }[]) => void;
  emitCursorMove: (x: number, y: number) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider: React.FC<{ children: React.ReactNode, value: TokenContextType; }> = ({ children, value }) => {
  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokenContext = (): TokenContextType => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokenContext must be used within a TokenProvider');
  }
  return context;
};
