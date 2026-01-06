import { create } from 'zustand';

type InteractionMode = 'select' | 'pan' | 'measure' | 'spell';

interface UiStoreState {
  activeMode: InteractionMode;
  isGridVisible: boolean;
  isUiVisible: boolean;

  // Actions
  setMode: (mode: InteractionMode) => void;
  toggleGrid: () => void;
  toggleUi: () => void;
}

export const useUiStore = create<UiStoreState>((set) => ({
  activeMode: 'select',
  isGridVisible: true,
  isUiVisible: true,

  setMode: (mode) => set({ activeMode: mode }),
  toggleGrid: () => set((state) => ({ isGridVisible: !state.isGridVisible })),
  toggleUi: () => set((state) => ({ isUiVisible: !state.isUiVisible })),
}));
