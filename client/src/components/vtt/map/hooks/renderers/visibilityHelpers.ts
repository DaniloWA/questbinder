import { Point } from './types';
import { isPointInPolygon } from '../../../../../utils/geometry';
import { getTokenBoundsPoints } from './tokenHelpers';

export const isPositionVisible = (
  pos: { x: number; y: number; size: number; },
  gridSize: number,
  visionPolygons: Point[][],
  fogPath?: string,
  ctx?: CanvasRenderingContext2D
): boolean => {
  // 1. Check dynamic vision polgyons (from tokens with vision)
  if (visionPolygons.length > 0) {
    const points = getTokenBoundsPoints(pos.x, pos.y, pos.size, gridSize);
    return points.some(p =>
      visionPolygons.some(poly => isPointInPolygon(p, poly))
    );
  }

  // 2. Check static fog path (fallback if no vision tokens)
  // This logic matches original useMapRenderer behavior exactly
  if (fogPath && ctx) {
    const center = {
      x: pos.x * gridSize + pos.size * gridSize / 2,
      y: pos.y * gridSize + pos.size * gridSize / 2
    };
    return ctx.isPointInPath(new Path2D(fogPath), center.x, center.y);
  }

  // If no fog and no vision polygons, default to visible (or according to original logic which assumes visible if no restrictions)
  // Original logic actually returns if NOT visible. 
  // If fogPath exists and we failed context check, it is not visible.

  return true;
};
