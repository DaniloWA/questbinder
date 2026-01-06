import React from 'react';
import { DoubleSide } from 'three';
import { useMapStore } from '../../store/mapStore';
import { useMapTexture } from './hooks/useMapTexture';
import { Z_INDEX } from '../../shared/constants/map.constants';

export const MapLayer: React.FC = () => {
  const { width, height } = useMapStore(state => state.mapData);
  const texture = useMapTexture();

  // If no texture or dimensions are zero, don't render or render placeholder
  if (!width || !height) return null;

  return (
    <mesh
      name="MapLayer"
      position={[0, 0, Z_INDEX.MAP]}
      receiveShadow
    >
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={texture}
        side={DoubleSide}
        roughness={0.8}
        metalness={0.1}
        transparent={false} // Improves performance if no transparency needed (maps usually opaque)
      />
    </mesh>
  );
};
