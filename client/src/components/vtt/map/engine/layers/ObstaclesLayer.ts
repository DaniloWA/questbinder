/**
 * VTT Engine - Obstacles Layer
 *
 * Renders walls, doors, and windows (obstacles).
 * Only visible to GM in GM view mode.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { Obstacle, LineObstacle, PolygonObstacle } from '../../../../../types';

/**
 * ObstaclesLayer - Renders vision-blocking obstacles.
 *
 * Features:
 * - Walls (polygons) with configurable appearance
 * - Doors and windows (line segments)
 * - Hover highlighting for selected obstacles
 * - GM-only visibility
 * - Cached until obstacles change
 */
export class ObstaclesLayer extends BaseLayer {
  constructor() {
    super('obstacles', 'Obstacles', {
      useCache: true,
      description: 'Walls, doors, and windows',
    });
  }

  computeStateHash(context: RenderContext): string {
    const { scene, isGM, gmViewMode, hoveredObstacleId, ui, zoom } = context;
    if (!scene) return 'no-scene';

    // Don't render for players
    if (!isGM || gmViewMode !== 'gm') return 'hidden';

    // Don't render if GM has hidden obstacles
    if (ui.gmHideObstacles) return 'hidden';

    return this.hashValues(
      scene.obstacles.length,
      scene.obstacles.map(o => o.id).join(','),
      hoveredObstacleId || '',
      zoom
    );
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { scene, isGM, gmViewMode, hoveredObstacleId, ui, zoom } = context;
    if (!scene) return;

    // Only render for GM in GM view mode
    if (!isGM || gmViewMode !== 'gm') return;
    if (ui.gmHideObstacles) return;

    ctx.save();

    for (const obstacle of scene.obstacles) {
      if (obstacle.hidden) continue;

      const isHovered = obstacle.id === hoveredObstacleId;
      this.renderObstacle(ctx, obstacle, zoom, isHovered);
    }

    ctx.restore();
  }

  private renderObstacle(
    ctx: CanvasRenderingContext2D,
    obstacle: Obstacle,
    zoom: number,
    isHovered: boolean
  ): void {
    ctx.save();

    // Set style based on type
    const colors = {
      wall: isHovered ? '#a855f7' : '#ec4899',
      door: isHovered ? '#84cc16' : '#22c55e',
      window: isHovered ? '#38bdf8' : '#0ea5e9',
    };

    const color = colors[obstacle.type] || colors.wall;
    ctx.strokeStyle = color;
    ctx.lineWidth = (isHovered ? 4 : 3) / zoom;

    if ('points' in obstacle) {
      // Polygon obstacle (wall)
      this.renderPolygon(ctx, obstacle as PolygonObstacle);
    } else if ('p1' in obstacle && 'p2' in obstacle) {
      // Line obstacle (door, window)
      this.renderLine(ctx, obstacle as LineObstacle);
    }

    ctx.restore();
  }

  private renderPolygon(ctx: CanvasRenderingContext2D, obstacle: PolygonObstacle): void {
    const { points, open } = obstacle;
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    if (!open) {
      ctx.closePath();
    }

    ctx.stroke();

    // Draw vertices
    const vertexRadius = 4 / (ctx as any).__zoom || 4;
    ctx.fillStyle = ctx.strokeStyle as string;
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, vertexRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderLine(ctx: CanvasRenderingContext2D, obstacle: LineObstacle): void {
    const { p1, p2, type } = obstacle;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);

    // Different dash patterns for doors vs windows
    if (type === 'door') {
      ctx.setLineDash([10, 5]);
    } else if (type === 'window') {
      ctx.setLineDash([4, 4]);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Draw endpoints
    const endpointRadius = 5 / (ctx as any).__zoom || 5;
    ctx.fillStyle = ctx.strokeStyle as string;

    ctx.beginPath();
    ctx.arc(p1.x, p1.y, endpointRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p2.x, p2.y, endpointRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}
