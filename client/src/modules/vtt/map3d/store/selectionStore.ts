import { create } from 'zustand';

interface SelectionStoreState {
  selectedTokenIds: Set<string>;

  // Actions
  selectToken: (id: string, multi?: boolean) => void;
  deselectToken: (id: string) => void;
  clearSelection: () => void;
  startBoxSelection: () => void; // Placeholder for box selection state
}

export const useSelectionStore = create<SelectionStoreState>((set) => ({
  selectedTokenIds: new Set(),

  selectToken: (id, multi = false) => set((state) => {
    const newSet = multi ? new Set(state.selectedTokenIds) : new Set<string>();
    newSet.add(id);
    return { selectedTokenIds: newSet };
  }),

  deselectToken: (id) => set((state) => {
    const newSet = new Set(state.selectedTokenIds);
    newSet.delete(id);
    return { selectedTokenIds: newSet };
  }),

  clearSelection: () => set({ selectedTokenIds: new Set() }),

  startBoxSelection: () => {
    // TODO: Implement box selection logic
  },
}));
