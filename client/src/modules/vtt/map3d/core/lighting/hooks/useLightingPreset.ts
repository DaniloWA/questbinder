import { useControls } from 'leva';
import { useMemo } from 'react';

export const useLightingPreset = () => {
  const { ambientIntensity, dirIntensity, dirPosition } = useControls('Lighting', {
    ambientIntensity: { value: 0.5, min: 0, max: 2, step: 0.1 },
    dirIntensity: { value: 0.8, min: 0, max: 2, step: 0.1 },
    dirPosition: { value: [10, 20, 10], step: 1 },
  });

  return useMemo(() => ({
    ambient: { intensity: ambientIntensity },
    directional: {
      intensity: dirIntensity,
      position: dirPosition as [number, number, number],
      castShadow: true
    }
  }), [ambientIntensity, dirIntensity, dirPosition]);
};
