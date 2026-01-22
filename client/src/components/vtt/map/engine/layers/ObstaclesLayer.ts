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
      cacheStrategy: 'world',
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

    // Professional Palette
    // Wall: Neutral almost-white (Architectural)
    // Door: Warm Amber (Interactive)
    // Window: Cool Cyan (Transparent-ish logic)
    const colors = {
      wall: isHovered ? '#b919e1ff' : '#cbd5e1', // Slate-300 -> Blue-400 (Hover)
      door: isHovered ? '#fbbf24' : '#d97706', // Amber-600 -> Amber-400 (Hover)
      window: isHovered ? '#38bdf8' : '#0284c7', // Sky-600 -> Sky-400 (Hover)
    };

    const color = colors[obstacle.type] || colors.wall;
    ctx.strokeStyle = color;

    // Scale line width slightly by zoom, but clamp it to stay sharp
    // Base width 3, max 5, min 1
    ctx.lineWidth = 3 / zoom;

    // Smooth corners for professional look
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Hover Glow Effect
    if (isHovered) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      // Increase width slightly
      ctx.lineWidth = 5 / zoom;
    }

    if ('points' in obstacle) {
      // Polygon obstacle (wall)
      this.renderPolygon(ctx, obstacle as PolygonObstacle, isHovered);
    } else if ('p1' in obstacle && 'p2' in obstacle) {
      // Line obstacle (door, window)
      this.renderLine(ctx, obstacle as LineObstacle, isHovered);
    }

    ctx.restore();
  }

  private renderPolygon(ctx: CanvasRenderingContext2D, obstacle: PolygonObstacle, isHovered: boolean): void {
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

    // Hover Effect: Subtle Fill
    if (isHovered) {
      ctx.save();
      // Disable shadow for fill to keep it clean
      ctx.shadowBlur = 0;
      ctx.fillStyle = ctx.strokeStyle as string;
      ctx.globalAlpha = 0.1; // Very subtle fill

      if (!open) {
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.stroke();

    // Draw vertices - Much smaller and cleaner
    const vertexRadius = (isHovered ? 3 : 2) / ((ctx as any).__zoom || 1);
    ctx.fillStyle = isHovered ? '#ffffff' : (ctx.strokeStyle as string);

    // Disable shadow for vertices to keep them crisp
    ctx.save();
    ctx.shadowBlur = 0;

    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, vertexRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderLine(ctx: CanvasRenderingContext2D, obstacle: LineObstacle, isHovered: boolean): void {
    const { p1, p2, type } = obstacle;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);

    // Different dash patterns for doors vs windows
    if (type === 'door') {
      ctx.setLineDash([10 / (ctx as any).__zoom, 5 / (ctx as any).__zoom]);
    } else if (type === 'window') {
      ctx.setLineDash([4 / (ctx as any).__zoom, 4 / (ctx as any).__zoom]);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Draw endpoints - Minimalist
    const endpointRadius = (isHovered ? 3.5 : 2.5) / ((ctx as any).__zoom || 1);
    ctx.fillStyle = isHovered ? '#ffffff' : (ctx.strokeStyle as string);

    ctx.save();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(p1.x, p1.y, endpointRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p2.x, p2.y, endpointRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
