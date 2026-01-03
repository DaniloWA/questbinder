import { Token, Obstacle, Viewport } from '../../types';
import { distanceToSegment, isPointInPolygon } from '../../utils/geometry';

export class MapInteractionService {
  /**
   * Converts screen coordinates to world coordinates based on viewport.
   */
  static screenToWorld(screenX: number, screenY: number, viewport: Viewport): { x: number, y: number; } {
    return {
      x: (screenX - viewport.x) / viewport.zoom,
      y: (screenY - viewport.y) / viewport.zoom,
    };
  }

  /**
   * Converts world coordinates to screen coordinates.
   */
  static worldToScreen(worldX: number, worldY: number, viewport: Viewport): { x: number, y: number; } {
    return {
      x: worldX * viewport.zoom + viewport.x,
      y: worldY * viewport.zoom + viewport.y
    };
  }

  /**
   * Finds the top-most token at a given world position.
   * Assumes tokens are rendered in order, so we search in reverse for hit testing (top first).
   */
  static findTokenAt(worldX: number, worldY: number, tokens: Token[], gridSize: number): Token | null {
    // Reverse to find the one rendered on top (last in array)
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t = tokens[i];
      // Simple AABB check for now. Tokens are typically 1x1 grid or larger.
      // t.x, t.y are in grid units.
      const tokenWorldX = t.x * gridSize;
      const tokenWorldY = t.y * gridSize;
      const tokenSize = (t.size || 1) * gridSize;

      if (worldX >= tokenWorldX && worldX < tokenWorldX + tokenSize &&
        worldY >= tokenWorldY && worldY < tokenWorldY + tokenSize) {
        return t;
      }
    }
    return null;
  }

  /**
   * Finds an obstacle at a given world position.
   */
  static findObstacleAt(worldX: number, worldY: number, obstacles: Obstacle[], zoom: number): Obstacle | null {
    const clickRadius = 10 / zoom;
    const p = { x: worldX, y: worldY };

    for (const obs of obstacles) {
      if (obs.type === 'wall') {
        if (!obs.points || obs.points.length < 2) continue;

        // Check all segments of the wall
        for (let i = 0; i < obs.points.length; i++) {
          if (obs.open && i === obs.points.length - 1) continue; // Don't close loop if open

          const p1 = obs.points[i];
          const p2 = obs.points[(i + 1) % obs.points.length];

          if (!p1 || !p2) continue;
          if (distanceToSegment(p, p1, p2) < clickRadius) return obs;
        }
      } else {
        // Door or Window (Line segment)
        if (!obs.p1 || !obs.p2) continue;
        if (distanceToSegment(p, obs.p1, obs.p2) < clickRadius) return obs;
      }
    }
    return null;
  }
}
