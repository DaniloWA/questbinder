/**
 * VTT Interaction Engine - Measure Ruler Handler
 *
 * Handles the measurement ruler tool (measure-path).
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import { snapToGridCenter } from '../utils/coordConversion';
import { handleRightClickCancel } from '../utils/InteractionUtils';
import type { Point } from '../../../../../types';

/**
 * MeasureRulerHandler - Path measurement tool.
 *
 * Priority: 600
 * Tools: measure-path
 */
export class MeasureRulerHandler extends BaseHandler {
  private movementPath: Point[] = [];

  constructor() {
    super({
      id: 'measure-ruler',
      name: 'Measure Ruler',
      priority: 600,
      tools: ['measure-path'],
      description: 'Measure distances on the map',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    if (this.movementPath.length > 0) return true;
    return ctx.activeTool === 'measure-path';
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    // Right click logic
    if (ctx.button === 2) {
      if (this.movementPath.length > 0) {
        // If has measurements, clear them first
        this.clearPath();
        return this.handled();
      } else {
        // If no measurements, deactivate tool
        this.callbacks?.setActiveTool('select');
        return this.handled();
      }
    }

    // Left click adds point
    if (ctx.button === 0) {
      let pos = ctx.worldPos;

      // Snap to grid if enabled
      if (ctx.rulerSettings?.snapToGrid && ctx.scene) {
        pos = snapToGridCenter(pos, ctx.scene.grid.size);
      }

      this.movementPath.push({ ...pos });
      this.callbacks?.setMovementPath([...this.movementPath]);
      return this.handled({ cursor: 'crosshair' });
    }

    return this.notHandled();
  }

  onMouseMove(ctx: InteractionContext): HandlerResult {
    // We handle mouse move to ensure the cursor is updated and orchestrator knows we are active
    return this.handled({ cursor: 'crosshair' });
  }

  onDoubleClick(_ctx: InteractionContext): HandlerResult {
    // Double click clears path
    this.clearPath();
    this.callbacks?.setActiveTool('select');
    return this.handled();
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  getMovementPath(): Readonly<Point[]> {
    return this.movementPath;
  }

  clearPath(): void {
    this.movementPath = [];
    this.callbacks?.setMovementPath([]);
  }

  onToolChange(from: string, to: string): void {
    if (from === 'measure-path' && to !== 'measure-path') {
      this.clearPath();
    }
  }
}
