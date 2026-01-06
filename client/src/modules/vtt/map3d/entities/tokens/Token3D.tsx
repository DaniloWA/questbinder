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

  // 1. Calculate derived state (position)
  const { position } = useTokenState(token);

  // 2. Setup interaction hooks
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
      position={animatedPos as any}
      rotation={[0, 0, token.rotation || 0]}
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
