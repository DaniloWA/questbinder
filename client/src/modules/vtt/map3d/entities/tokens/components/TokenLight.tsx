import React, { useMemo } from 'react';
import { TokenLight as ITokenLight } from '../../../types/token.types';
import { useMapStore } from '../../../store/mapStore';

interface TokenLightProps {
  config?: ITokenLight;
}

export const TokenLight: React.FC<TokenLightProps> = ({ config }) => {
  const { grid } = useMapStore(state => state.mapData);

  const distance = useMemo(() => {
    if (!config) return 0;
    // If explicit distance is not set, calculate from grid radius
    // Heuristic: distance ~ max radius * multiplier to ensure falljoff covers it
    const radius = config.dimRadius || config.brightRadius || 0;
    return radius * grid.size * 2;
  }, [config, grid.size]);

  if (!config?.enabled) return null;

  const {
    color,
    intensity,
    distance: explicitDistance,
    decay = 2,
    castShadow = false,
  } = config;

  return (
    <pointLight
      color={color}
      intensity={intensity}
      distance={explicitDistance || distance}
      decay={decay}
      castShadow={castShadow}
      position={[0, 0, grid.size * 0.5]}
      shadow-mapSize-width={128}
      shadow-mapSize-height={128}
    />
  );
};
