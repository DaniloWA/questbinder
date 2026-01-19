/**
 * VTT Interaction Engine - Brush Canvas Handler
 *
 * Handles freehand drawing on the canvas.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import { distance } from '../utils/coordConversion';
import { handleRightClickCancel } from '../utils/InteractionUtils';
import type { Point } from '../../../../../types';

/**
 * BrushCanvasHandler - Freehand drawing tool.
 *
 * Priority: 600
 * Tools: brush
 */
export class BrushCanvasHandler extends BaseHandler {
  private isDrawing: boolean = false;
  private drawingPoints: Point[] = [];

  constructor() {
    super({
      id: 'brush-canvas',
      name: 'Brush Canvas',
      priority: 600,
      tools: ['brush'],
      description: 'Freehand drawing on the map',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    if (this.isDrawing) return true;
    return ctx.activeTool === 'brush';
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    const cancelResult = handleRightClickCancel(ctx, this.callbacks);
    if (cancelResult.handled) return cancelResult;

    if (ctx.button !== 0) return this.notHandled();

    this.isDrawing = true;
    this.drawingPoints = [{ ...ctx.worldPos }];
    return this.handled({ cursor: 'crosshair' });
  }

  onMouseMove(ctx: InteractionContext): HandlerResult {
    if (!this.isDrawing) return this.notHandled();

    // Add point if far enough from last point
    const lastPoint = this.drawingPoints[this.drawingPoints.length - 1];
    if (distance(lastPoint, ctx.worldPos) > 3) {
      this.drawingPoints.push({ ...ctx.worldPos });
      // EMIT LIVE PREVIEW
      this.callbacks?.updateDrawingState?.(this.drawingPoints);
    }

    return this.handled({ cursor: 'crosshair' });
  }

  onMouseUp(ctx: InteractionContext): HandlerResult {
    if (!this.isDrawing) return this.notHandled();

    // Commit drawing
    if (this.drawingPoints.length > 1) {
      this.callbacks?.addDrawing({
        points: [...this.drawingPoints],
        color: ctx.drawingSettings?.color || '#ffffff',
        width: ctx.drawingSettings?.width || 3,
        opacity: ctx.drawingSettings?.opacity || 1,
        userId: ctx.currentUser?.id || '',
      });
      // Clear live preview
      this.callbacks?.updateDrawingState?.([]);
    }

    this.isDrawing = false;
    this.drawingPoints = [];
    return this.handled();
  }

  onMouseLeave(_ctx: InteractionContext): HandlerResult {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.drawingPoints = [];
      return this.handled();
    }
    return this.notHandled();
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  getDrawingPoints(): Readonly<Point[]> {
    return this.drawingPoints;
  }

  isCurrentlyDrawing(): boolean {
    return this.isDrawing;
  }
}
