import React from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader, DoubleSide } from 'three';
import { Token } from '../../../types/token.types';
import { useMapStore } from '../../../store/mapStore';
import { TOKEN_SIZE_DEFAULT, TOKEN_COLOR_DEFAULT } from '../../../shared/constants/token.constants';

interface TokenVisualsProps {
  token: Token;
  isDragging?: boolean;
}

export const TokenVisuals: React.FC<TokenVisualsProps> = ({ token, isDragging }) => {
  const { grid } = useMapStore(state => state.mapData);

  // Calculate size in world units
  // token.size is grid units (e.g. 1). 
  // grid.size is world units per grid (e.g. 60).
  const worldSize = token.size * grid.size;
  const radius = worldSize / 2;

  // Only load texture if URL is present. 
  // IMPORTANT: useLoader throws promise for suspense. If file is missing, it crashes.
  const map = token.imgUrl ? useLoader(TextureLoader, token.imgUrl) : null;

  return (
    <group>
      {/* Base Token Mesh */}
      <mesh
        castShadow
        receiveShadow
        position={[0, 0, 0]} // Render at local 0, parent handles position
        // Lift slightly if dragging for visual feedback
        position-z={isDragging ? 5 : 0.1}
      >
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial
          map={map}
          color={token.color || TOKEN_COLOR_DEFAULT}
          side={DoubleSide}
          transparent
        />
      </mesh>
    </group>
  );
};
