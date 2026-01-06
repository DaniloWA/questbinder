import React from 'react';
import { useMapStore } from '../../../store/mapStore';
import { TOKEN_SELECTION_RING_COLOR, TOKEN_SELECTION_RING_WIDTH } from '../../../shared/constants/token.constants';
import { Token } from '../../../types/token.types';

interface TokenRingProps {
  token: Token;
  visible?: boolean;
}

export const TokenRing: React.FC<TokenRingProps> = ({ token, visible }) => {
  const { grid } = useMapStore(state => state.mapData);

  if (!visible) return null;

  const worldSize = token.size * grid.size;
  const radius = (worldSize / 2) + 2; // Slightly larger than token

  return (
    <mesh position={[0, 0, 0.05]}>
      <ringGeometry args={[radius, radius + (TOKEN_SELECTION_RING_WIDTH * grid.size), 32]} />
      <meshBasicMaterial color={TOKEN_SELECTION_RING_COLOR} />
    </mesh>
  );
};
