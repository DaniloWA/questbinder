import { useMemo } from 'react';
import { Token } from '../../../types/token.types';
import { useMapStore } from '../../../store/mapStore';

export const useTokenState = (token: Token) => {
  const { grid } = useMapStore(state => state.mapData);

  // 1. Calculate World Position (XZ Plane)
  // We map 2D grid coordinates (x, y) to World coordinates.
  // In our new XZ-plane setup: WorldX = GridX * Size, WorldZ = GridY * Size.
  // However, for the React Spring interpolation in Token3D, we pass just [x, y] values,
  // and let the component map them to [x, 0.05, y].
  const position = useMemo(() => {
    const worldX = token.x * grid.size;
    const worldY = token.y * grid.size;
    return [worldX, worldY] as [number, number];
  }, [token.x, token.y, grid.size]);

  // 2. Calculate Light Radius
  const lightRadius = useMemo(() => {
    if (!token.light?.enabled) return 0;
    return (token.light.dimRadius || 0) * grid.size;
  }, [token.light, grid.size]);

  return {
    position,
    lightRadius,
    rotation: [0, 0, 0], // Placeholder if we want derived rotation logic later
    scale: 1,
  };
};
