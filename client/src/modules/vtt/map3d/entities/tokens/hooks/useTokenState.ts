import { useMemo } from 'react';
import { Token } from '../../../types/token.types';
import { useMapStore } from '../../../store/mapStore';
import { gridToWorld } from '../../../shared/utils/math/coordinates';

export const useTokenState = (token: Token) => {
  const { grid, width, height } = useMapStore(state => state.mapData);

  // Memoize world position calculation
  const position = useMemo(() => {
    const worldPos = gridToWorld(token.x, token.y, grid.size, width, height, token.z || 0.1);
    return [worldPos.x, worldPos.y, worldPos.z] as [number, number, number];
  }, [token.x, token.y, token.z, grid.size, width, height]);

  // Derived light radius if needed
  const lightRadius = useMemo(() => {
    if (!token.light?.enabled) return 0;
    // Map grid units to world units
    // e.g. 5ft bright = 1 grid square (if 5ft per square)
    // token.light.brightRadius (grid units) * grid.size
    return (token.light.dimRadius || 0) * grid.size;
  }, [token.light, grid.size]);

  return { position, lightRadius };
};
