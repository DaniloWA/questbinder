import { useCallback } from 'react';
import { useSelectionStore } from '../../../store/selectionStore';
import { useUiStore } from '../../../store/uiStore';

export const useTokenSelection = (tokenId: string) => {
  const selectedTokenIds = useSelectionStore(state => state.selectedTokenIds);
  const selectToken = useSelectionStore(state => state.selectToken);
  const activeMode = useUiStore(state => state.activeMode);

  const isSelected = selectedTokenIds.has(tokenId);

  const onClick = useCallback((e: any) => {
    // Only select if in select mode (or default)
    if (activeMode !== 'select' && activeMode !== 'measure') return;

    e.stopPropagation(); // Stop click from hitting the map/grid

    // Support Shift/Ctrl for multi-select?
    const multi = e.shiftKey || e.ctrlKey;
    selectToken(tokenId, multi);

  }, [tokenId, activeMode, selectToken]);

  return { isSelected, onClick };
};
