import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

interface MapPlaneProps {
  imageUrl: string;
  width: number;
  height: number;
}

export const MapPlane: React.FC<MapPlaneProps> = ({ imageUrl, width, height }) => {
  // Load texture
  const texture = useLoader(THREE.TextureLoader, imageUrl);

  // Optimize texture settings for pixel art or clean lines if needed
  // texture.minFilter = THREE.LinearFilter;

  // Center the map? In 2D canvas (0,0) is usually top-left or center.
  // Three.js (0,0) is center. Let's stick to center for now.

  return (
    <mesh position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  );
};
