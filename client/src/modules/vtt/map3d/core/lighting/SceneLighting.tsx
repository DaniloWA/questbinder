import React from 'react';
import { useLightingPreset } from './hooks/useLightingPreset';

export const SceneLighting: React.FC = () => {
  const { ambient, directional } = useLightingPreset();

  return (
    <group name="SceneLighting">
      <ambientLight intensity={ambient.intensity} />
      <directionalLight
        position={directional.position}
        intensity={directional.intensity}
        castShadow={directional.castShadow}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </group>
  );
};
