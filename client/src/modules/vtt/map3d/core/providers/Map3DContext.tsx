import React, { createContext, useContext, ReactNode } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useTokenStore } from '../../store/tokenStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useUiStore } from '../../store/uiStore';

// For now, we reuse the Zustand stores, but we wrap them in a context 
// if we ever want to support multiple independent maps or mock them effectively.
// This context primarily serves as the Dependency Injection root.

interface Map3DContextValue {
  mapStore: typeof useMapStore;
  tokenStore: typeof useTokenStore;
  selectionStore: typeof useSelectionStore;
  uiStore: typeof useUiStore;
}

const Map3DContext = createContext<Map3DContextValue | null>(null);

export const Map3DProvider: React.FC<{ children: ReactNode; }> = ({ children }) => {
  const value = {
    mapStore: useMapStore,
    tokenStore: useTokenStore,
    selectionStore: useSelectionStore,
    uiStore: useUiStore
  };

  return (
    <Map3DContext.Provider value={value}>
      {children}
    </Map3DContext.Provider>
  );
};

export const useMap3D = () => {
  const context = useContext(Map3DContext);
  if (!context) {
    throw new Error('useMap3D must be used within a Map3DProvider');
  }
  return context;
};
