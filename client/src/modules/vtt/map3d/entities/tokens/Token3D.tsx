import React, { useRef } from 'react';
import { Group } from 'three';
import { Token } from '../../types/token.types';
import { useTokenState } from './hooks/useTokenState';
import { useTokenDrag } from './hooks/useTokenDrag';
import { useTokenSelection } from './hooks/useTokenSelection';
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

  // 1. Calculate derived state (position is now [x, y] in world units)
  const { position } = useTokenState(token);

  // 2. Setup interaction hooks
  // bindDrag now expects a spring object or initial pos. 
  // We need to pass the spring value `animatedPos` if we want drag to update it,
  // or pass the raw `position` for initialization.
  const bindDrag = useTokenDrag(token.id, position);
  const { isSelected, onClick } = useTokenSelection(token.id);

  // 3. Animation (Smooth movement)
  const { animatedPos } = useSpring({
    animatedPos: position,
    config: { tension: 120, friction: 14 }
  });

  return (
    <animated.group
      ref={groupRef}
      // Position: [x, y, z] -> [x * gridSize, elevation, y * gridSize]
      // Lift slightly (0.05) to sit on top of grid
      position={animatedPos.to((x, y) => [x, 0.05, y]) as any}
      // Rotate -90 deg on X to lie flat on the map, then apply Z rotation for token facing
      rotation={token.rotation
        ? [-Math.PI / 2, 0, (token.rotation * Math.PI) / 180]
        : [-Math.PI / 2, 0, 0]
      }
      onClick={onClick}
      {...bindDrag()}
    >
      <TokenVisuals token={token} />
      <TokenRing token={token} visible={isSelected} />
      <TokenLight config={token.light} />
      <TokenOverlays token={token} />
    </animated.group>
  );
};
