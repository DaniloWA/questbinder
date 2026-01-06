import React, { useRef, useState, useCallback } from 'react';
import { Group } from 'three';
import { Token } from '../../types/token.types';
import { useTokenState } from './hooks/useTokenState';
import { useTokenDrag } from './hooks/useTokenDrag';
import { useTokenSelection } from './hooks/useTokenSelection';
import { useUiStore } from '../../store/uiStore';
import { TokenVisuals } from './components/TokenVisuals';
import { TokenRing } from './components/TokenRing';
import { TokenLight } from './components/TokenLight';
import { TokenOverlays } from './components/TokenOverlays';
import { animated, useSpring } from '@react-spring/three';

interface Token3DProps {
  token: Token;
}

export const Token3D: React.FC<Token3DProps> = ({ token }) => {
  const groupRef = useRef<Group>(null);

  // 1. Calculate base position (world coordinates)
  const { position } = useTokenState(token);

  // 2. Dragging state - using ref for performance (no re-render during drag)
  const [isDragging, setIsDragging] = useState(false);
  const dragPositionRef = useRef<[number, number]>(position);

  // 3. Callback for immediate drag updates (no re-render, directly update spring)
  const handleDragUpdate = useCallback((x: number, z: number, dragging: boolean) => {
    dragPositionRef.current = [x, z];
    setIsDragging(dragging);
  }, []);

  // 4. Setup drag hook with callback
  const { bind: bindDrag } = useTokenDrag(token.id, position, handleDragUpdate);

  // 5. Selection
  const { isSelected, onClick } = useTokenSelection(token.id);
  const openContextMenu = useUiStore(state => state.openContextMenu);

  const handleContextMenu = (e: any) => {
    e.stopPropagation();
    const ne = e.nativeEvent;
    openContextMenu(token.id, ne.clientX, ne.clientY);
  };

  // 6. Animated position - uses spring for smooth interpolation
  // When dragging, update from dragPositionRef; otherwise from token position
  const targetPosition = isDragging ? dragPositionRef.current : position;

  const { animatedPos } = useSpring({
    animatedPos: targetPosition,
    config: isDragging
      ? { tension: 300, friction: 20 } // Snappy during drag
      : { tension: 120, friction: 14 }, // Smooth for remote updates
    immediate: isDragging // Skip animation during active drag for responsiveness
  });

  // 7. Elevation based on drag state (visual feedback)
  const elevation = isDragging ? 0.15 : 0.05;

  return (
    <animated.group
      ref={groupRef}
      // Position: [worldX, elevation, worldZ]
      position={animatedPos.to((x, z) => [x, elevation, z]) as any}
      // Rotate -90 deg on X to lie flat, apply token rotation on Z
      rotation={
        token.rotation
          ? [-Math.PI / 2, 0, (token.rotation * Math.PI) / 180]
          : [-Math.PI / 2, 0, 0]
      }
      onClick={onClick}
      onContextMenu={handleContextMenu}
      {...bindDrag()}
    >
      <TokenVisuals token={token} isDragging={isDragging} />
      <TokenRing token={token} visible={isSelected} />
      <TokenLight config={token.light} />
      <TokenOverlays token={token} />
    </animated.group>
  );
};
