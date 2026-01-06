import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Color } from 'three';
import { Ping } from '@/types';

interface Ping3DProps {
  ping: Ping;
}

export const Ping3D: React.FC<Ping3DProps> = ({ ping }) => {
  const meshRef = useRef<Mesh>(null);

  // Animation: Scale up and fade out
  useFrame((state) => {
    if (!meshRef.current) return;
    const elapsed = (Date.now() - ping.createdAt) / 1000;
    const duration = 2.0;

    if (elapsed > duration) return; // Should be removed by store logic essentially

    // Scale: 0 -> 3 (expanding ring)
    const scale = 1 + (elapsed * 5);
    meshRef.current.scale.set(scale, scale, 1);

    // Opacity: 1 -> 0
    const material = meshRef.current.material as any;
    if (material) {
      material.opacity = 1 - (elapsed / duration);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[ping.x, 0.1, ping.y]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[0.4, 0.5, 32]} />
      <meshBasicMaterial
        color={ping.color || '#ff0000'}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};
