import { useMemo } from 'react';
import { Token } from '../../../types/token.types';
import { useMapStore } from '../../../store/mapStore';

/**
 * Calculates derived state for a token including world position.
 * 
 * Coordinate System:
 * - Token stores grid position (col, row) in token.x, token.y
 * - World position: worldX = token.x * gridSize, worldZ = token.y * gridSize
 * - Map origin is at (0, 0) in world space
 * - Token is positioned at center of its grid cell
 */
export const useTokenState = (token: Token) => {
  const { grid } = useMapStore(state => state.mapData);

  // Calculate World Position
  // Token.x, token.y are grid coordinates (column, row)
  // World position = grid coords * gridSize + gridSize/2 (center of cell)
  const position = useMemo(() => {
    const worldX = token.x * grid.size + grid.size / 2;
    const worldZ = token.y * grid.size + grid.size / 2;
    return [worldX, worldZ] as [number, number];
  }, [token.x, token.y, grid.size]);

  // Calculate Light Radius in world units
  const lightRadius = useMemo(() => {
    if (!token.light?.enabled) return 0;
    return (token.light.dimRadius || 0) * grid.size;
  }, [token.light, grid.size]);

  return {
    position,
    lightRadius,
    rotation: [0, 0, 0],
    scale: 1,
  };
};
