import { useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { useUiStore } from '../../store/uiStore';
import { useSelectionStore } from '../../store/selectionStore';
import { Vector2 } from 'three';

export const useBoxSelect = () => {
  const { startBoxSelection } = useSelectionStore();
  const activeMode = useUiStore(state => state.activeMode);

  // Ref to track start point
  const startPoint = useRef<Vector2 | null>(null);

  // We need logic to track mouse down/drag/up globally or on a plane event
  // This usually integrates with GestureHandler or specific interaction layer.

  // For now, this hook will provide the state logic that the UI component uses.

  return {};
};
