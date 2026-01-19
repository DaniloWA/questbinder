import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { getMidPoint } from '../../../../../utils/geometry';
import { Point } from '../../../../../types';

/**
 * DrawingsLayer - Renders map drawings/annotations.
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

    // Helper to draw smooth path
    const drawSmoothPath = (points: Point[]) => {
      if (points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      if (points.length === 2) {
        ctx.lineTo(points[1].x, points[1].y);
      } else {
        // Use Quadratic Curves for smoothness
        for (let i = 1; i < points.length - 1; i++) {
          const mid = getMidPoint(points[i], points[i + 1]);
          ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
        }
        // Connect to last point
        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
      }
      ctx.stroke();
    };

    // Render persisted drawings
    if (scene.drawings) {
      for (const drawing of scene.drawings) {
        if (drawing.points.length < 2) continue;

        ctx.strokeStyle = drawing.color;
        ctx.lineWidth = drawing.width / zoom;
        ctx.globalAlpha = drawing.opacity ?? 1.0;

        drawSmoothPath(drawing.points);
      }
    }

    // Render live drawing (in-progress stroke)
    const { livePoints, settings, liveDrawingPointsRef } = drawingState;
    const pointsToRender = liveDrawingPointsRef?.current || livePoints;

    if (pointsToRender.length > 1) {
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

      drawSmoothPath(pointsToRender);
    }

    ctx.restore();
  }
}
