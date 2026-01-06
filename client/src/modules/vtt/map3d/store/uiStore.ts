import { create } from 'zustand';

type InteractionMode = 'select' | 'pan' | 'measure' | 'spell';

interface UiStoreState {
  activeMode: InteractionMode;
  isGridVisible: boolean;
  isUiVisible: boolean;
  contextMenu: { visible: boolean; x: number; y: number; tokenId: string | null; };

  // Actions
  setMode: (mode: InteractionMode) => void;
  toggleGrid: () => void;
  toggleUi: () => void;
  openContextMenu: (tokenId: string, x: number, y: number) => void;
  closeContextMenu: () => void;
}

export const useUiStore = create<UiStoreState>((set) => ({
  activeMode: 'select',
  isGridVisible: true,
  isUiVisible: true,
  contextMenu: { visible: false, x: 0, y: 0, tokenId: null },

  setMode: (mode) => set({ activeMode: mode }),
  toggleGrid: () => set((state) => ({ isGridVisible: !state.isGridVisible })),
  toggleUi: () => set((state) => ({ isUiVisible: !state.isUiVisible })),

  openContextMenu: (tokenId, x, y) => set({ contextMenu: { visible: true, x, y, tokenId } }),
  closeContextMenu: () => set((state) => ({ contextMenu: { ...state.contextMenu, visible: false } })),
}));
