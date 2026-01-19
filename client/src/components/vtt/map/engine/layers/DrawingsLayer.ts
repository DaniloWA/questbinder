/**
 * VTT Engine - Drawings Layer
 *
 * Renders freehand drawings made by players and GM.
 * Includes both persisted drawings and live (in-progress) strokes.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';

/**
 * DrawingsLayer - Renders map drawings/annotations.
 *
 * Features:
 * - Persisted drawings from scene data
 * - Live drawing preview (in-progress strokes)
 * - Support for different colors, widths, opacity
 * - Cached for persisted drawings (live strokes are dynamic)
 */
export class DrawingsLayer extends BaseLayer {
  constructor() {
    super('drawings', 'Drawings', {
      useCache: false, // Live strokes need immediate updates
      description: 'Freehand drawings and annotations',
    });
  }

  computeStateHash(context: RenderContext): string {
    // Always re-render due to live drawing updates
    return 'dynamic';
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { scene, zoom, drawingState, activeTool } = context;
    if (!scene) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Render persisted drawings
    if (scene.drawings) {
      for (const drawing of scene.drawings) {
        if (drawing.points.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y);

        for (let i = 1; i < drawing.points.length; i++) {
          ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
        }

        ctx.strokeStyle = drawing.color;
        ctx.lineWidth = drawing.width / zoom;
        ctx.globalAlpha = drawing.opacity ?? 1.0;
        ctx.stroke();
      }
    }

    // Render live drawing (in-progress stroke)
    const { livePoints, settings, liveDrawingPointsRef } = drawingState;
    // Use Ref if available for immediate updates, fallback to synced state
    const pointsToRender = liveDrawingPointsRef?.current || livePoints;

    if (pointsToRender.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pointsToRender[0].x, pointsToRender[0].y);

      for (let i = 1; i < pointsToRender.length; i++) {
        ctx.lineTo(pointsToRender[i].x, pointsToRender[i].y);
      }

      // Special style for freehand wall tool
      if (activeTool === 'freehand-wall') {
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.globalAlpha = 1.0;
      } else {
        ctx.strokeStyle = settings.color;
        ctx.lineWidth = settings.width / zoom;
        ctx.globalAlpha = settings.opacity;
      }

      ctx.stroke();
    }

    ctx.restore();
  }
}
