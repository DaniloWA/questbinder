/**
 * VTT Interaction Engine - Grid Alignment Handler
 *
 * Handles grid calibration tools (drag offset, 3-point calibration).
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import { emitGridLocalUpdate, emitGridPreview } from '../utils/eventBroadcast';
import type { Point } from '../../../../../types';

interface GridDragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
}

/**
 * GridAlignHandler - Grid calibration tools.
 *
 * Priority: 800 (high - takes precedence over most handlers)
 * Tools: map-align, map-align-drag, map-align-3point
 */
export class GridAlignHandler extends BaseHandler {
  private alignPoints: Point[] = [];
  private gridDragState: GridDragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  };

  constructor() {
    super({
      id: 'grid-align',
      name: 'Grid Alignment',
      priority: 800,
      tools: ['map-align', 'map-align-drag', 'map-align-3point'],
      description: 'Grid calibration with drag and 3-point modes',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    // Always handle events when grid align tool is active
    if (this.gridDragState.isDragging) return true;
    return ['map-align', 'map-align-drag', 'map-align-3point'].includes(ctx.activeTool);
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    if (ctx.activeTool === 'map-align-drag' && ctx.scene) {
      // Start grid drag
      this.gridDragState = {
        isDragging: true,
        startX: ctx.worldPos.x,
        startY: ctx.worldPos.y,
        startOffsetX: ctx.scene.grid.offsetX || 0,
        startOffsetY: ctx.scene.grid.offsetY || 0,
      };
      return this.handled({ cursor: 'move' });
    }

    if (ctx.activeTool === 'map-align-3point') {
      // Add calibration point (max 3)
      if (this.alignPoints.length < 3) {
        this.alignPoints.push({ ...ctx.worldPos });
      }
      return this.handled({ cursor: 'crosshair' });
    }

    // Inspect mode - no interaction
    if (ctx.activeTool === 'map-align') {
      return this.handled({ cursor: 'crosshair' });
    }

    return this.notHandled();
  }

  onMouseMove(ctx: InteractionContext): HandlerResult {
    if (!this.gridDragState.isDragging || ctx.activeTool !== 'map-align-drag') {
      return this.notHandled();
    }

    if (!ctx.scene) return this.notHandled();

    // Calculate new offsets
    const dx = ctx.worldPos.x - this.gridDragState.startX;
    const dy = ctx.worldPos.y - this.gridDragState.startY;
    const newOffsetX = this.gridDragState.startOffsetX + dx;
    const newOffsetY = this.gridDragState.startOffsetY + dy;

    // Emit local update for UI
    emitGridLocalUpdate(newOffsetX, newOffsetY);

    // Emit preview for renderer
    emitGridPreview(ctx.scene.grid.size, newOffsetX, newOffsetY);

    return this.handled({ cursor: 'move' });
  }

  onMouseUp(_ctx: InteractionContext): HandlerResult {
    if (this.gridDragState.isDragging) {
      this.gridDragState.isDragging = false;
      return this.handled();
    }
    return this.notHandled();
  }

  onMouseLeave(_ctx: InteractionContext): HandlerResult {
    if (this.gridDragState.isDragging) {
      this.gridDragState.isDragging = false;
      return this.handled();
    }
    return this.notHandled();
  }

  // =========================================================================
  // PUBLIC API (for PrecisionCursor)
  // =========================================================================

  /**
   * Get current calibration points (for visualization).
   */
  getAlignPoints(): Readonly<Point[]> {
    return this.alignPoints;
  }

  /**
   * Confirm 3-point calibration and calculate grid settings.
   */
  confirm3PointCalibration(): boolean {
    if (this.alignPoints.length !== 3) return false;

    const [p1, p2, p3] = this.alignPoints;

    // P1: Top-Left -> P2: Top-Right -> P3: Bottom-Left
    const distP1P2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const computedSize = Math.round(distP1P2);

    // Calculate offset (P1 should be an intersection point)
    const newOffsetX = ((p1.x % computedSize) + computedSize) % computedSize;
    const newOffsetY = ((p1.y % computedSize) + computedSize) % computedSize;

    // Emit local update (no server commit)
    emitGridLocalUpdate(newOffsetX, newOffsetY, computedSize);

    // Clear points after calibration
    this.alignPoints = [];

    // Switch back to inspector tool
    this.callbacks?.setActiveTool('map-align');

    return true;
  }

  /**
   * Cancel 3-point calibration.
   */
  cancel3PointCalibration(): void {
    this.alignPoints = [];
  }

  /**
   * Reset all state.
   */
  reset(): void {
    this.alignPoints = [];
    this.gridDragState = {
      isDragging: false,
      startX: 0,
      startY: 0,
      startOffsetX: 0,
      startOffsetY: 0,
    };
  }

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  onToolChange(from: string, to: string): void {
    // Reset when leaving grid tools
    if (from.startsWith('map-align') && !to.startsWith('map-align')) {
      this.reset();
    }
  }
}
