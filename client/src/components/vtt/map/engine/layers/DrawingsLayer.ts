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
    const { livePoints, isDrawing, settings } = drawingState;
    if (isDrawing && livePoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(livePoints[0].x, livePoints[0].y);

      for (let i = 1; i < livePoints.length; i++) {
        ctx.lineTo(livePoints[i].x, livePoints[i].y);
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
