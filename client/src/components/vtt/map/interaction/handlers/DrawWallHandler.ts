/**
 * VTT Interaction Engine - Draw Wall Handler
 *
 * Handles drawing of walls, doors, and windows.
 * Supports both polygon mode (walls) and line mode (doors/windows).
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import { distance } from '../utils/coordConversion';
import { handleRightClickCancel } from '../utils/InteractionUtils';
import type { Point, Obstacle } from '../../../../../types';

type ObstacleType = 'wall' | 'door' | 'window';

interface DrawingObstacleState {
  type: ObstacleType;
  p1: Point;
}

/**
 * DrawWallHandler - Drawing walls, doors, and windows.
 *
 * Priority: 600
 * Tools: draw-wall, draw-door, draw-window, freehand-wall
 */
export class DrawWallHandler extends BaseHandler {
  private draftPoints: Point[] = [];
  private drawingObstacle: DrawingObstacleState | null = null;
  private freehandPoints: Point[] = [];
  private isDrawingFreehand: boolean = false;

  constructor() {
    super({
      id: 'draw-wall',
      name: 'Wall Drawing',
      priority: 600,
      tools: ['draw-wall', 'draw-door', 'draw-window', 'freehand-wall'],
      description: 'Draw walls (polygon), doors/windows (line)',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    // Handle ongoing drawing
    if (this.draftPoints.length > 0) return true;
    if (this.drawingObstacle) return true;
    if (this.isDrawingFreehand) return true;

    // Check for relevant tool
    return ['draw-wall', 'draw-door', 'draw-window', 'freehand-wall'].includes(ctx.activeTool);
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    const tool = ctx.activeTool;

    // Right click cancels or commits
    if (ctx.button === 2) {
      return this.handleRightClick(ctx);
    }

    // Left click
    if (ctx.button === 0) {
      if (tool === 'freehand-wall') {
        return this.startFreehandWall(ctx);
      }

      if (tool === 'draw-wall') {
        return this.addWallPoint(ctx);
      }

      if (tool === 'draw-door' || tool === 'draw-window') {
        return this.startDoorWindow(ctx, tool === 'draw-door' ? 'door' : 'window');
      }
    }

    return this.notHandled();
  }

  onMouseMove(ctx: InteractionContext): HandlerResult {
    // Freehand drawing
    if (this.isDrawingFreehand) {
      const lastPoint = this.freehandPoints[this.freehandPoints.length - 1];
      if (!lastPoint || distance(lastPoint, ctx.worldPos) > 5) {
        this.freehandPoints.push({ ...ctx.worldPos });
        // Emit live preview for rendering
        this.callbacks?.updateDrawingState?.([...this.freehandPoints]);
      }
      return this.handled({ cursor: 'crosshair' });
    }

    return this.notHandled();
  }

  onMouseUp(ctx: InteractionContext): HandlerResult {
    // Commit freehand wall
    if (this.isDrawingFreehand && this.freehandPoints.length > 1) {
      this.commitFreehandWall();
      return this.handled();
    }

    // Commit door/window on release
    if (this.drawingObstacle) {
      return this.commitDoorWindow(ctx);
    }

    return this.notHandled();
  }

  onDoubleClick(ctx: InteractionContext): HandlerResult {
    // Double click commits polygon wall
    if (ctx.activeTool === 'draw-wall' && this.draftPoints.length >= 2) {
      // Remove duplicate last point if present (from double-click)
      let points = [...this.draftPoints];
      if (points.length >= 2) {
        const last = points[points.length - 1];
        const secondLast = points[points.length - 2];
        if (Math.abs(last.x - secondLast.x) < 1 && Math.abs(last.y - secondLast.y) < 1) {
          points.pop();
        }
      }
      this.draftPoints = points;
      this.commitOpenWallPolygon();
      return this.handled();
    }
    return this.notHandled();
  }

  // =========================================================================
  // WALL POLYGON MODE
  // =========================================================================

  private addWallPoint(ctx: InteractionContext): HandlerResult {
    const { worldPos } = ctx;

    // Check if clicking near start point to close (closed polygon)
    if (this.draftPoints.length >= 3) {
      const first = this.draftPoints[0];
      if (distance(worldPos, first) < 15 / ctx.zoom) {
        this.commitClosedWallPolygon();
        return this.handled({ cursor: 'crosshair' });
      }
    }

    // Add point
    this.draftPoints.push({ ...worldPos });
    this.callbacks?.setDraftPolyPoints([...this.draftPoints]);
    return this.handled({ cursor: 'crosshair' });
  }

  /** Commit wall as closed polygon (clicking near first point) */
  private commitClosedWallPolygon(): void {
    if (this.draftPoints.length < 2) {
      this.resetWall();
      return;
    }

    this.callbacks?.addObstacles([{
      type: 'wall',
      points: [...this.draftPoints],
      blocksVision: true,
      blocksMovement: true,
      open: false,  // Closed polygon loop
    }]);

    this.resetWall();
    this.callbacks?.setActiveTool('select');
  }

  /** Commit wall as open polygon (right-click or double-click) */
  private commitOpenWallPolygon(): void {
    if (this.draftPoints.length < 2) {
      this.resetWall();
      return;
    }

    this.callbacks?.addObstacles([{
      type: 'wall',
      points: [...this.draftPoints],
      blocksVision: true,
      blocksMovement: true,
      open: true,  // Open line chain
    }]);

    this.resetWall();
    this.callbacks?.setActiveTool('select');
  }

  private commitWallPolygon(): void {
    if (this.draftPoints.length < 2) {
      this.resetWall();
      return;
    }

    this.callbacks?.addObstacles([{
      type: 'wall',
      points: [...this.draftPoints],
      blocksVision: true,
      blocksMovement: true,
    }]);

    this.resetWall();
    this.callbacks?.setActiveTool('select');
  }

  private handleRightClick(ctx: InteractionContext): HandlerResult {
    // If drawing wall with points, first right-click clears the drawing
    if (ctx.activeTool === 'draw-wall' && this.draftPoints.length > 0) {
      // First right-click: Clear points but stay in tool
      this.resetWall();
      return this.handled();
    }

    // If drawing door/window, cancel it
    if (this.drawingObstacle) {
      this.drawingObstacle = null;
      this.callbacks?.setDrawingObstacle(null);
      return this.handled();
    }

    // Second right-click (no drawing in progress): Exit the tool
    this.resetAll();
    return handleRightClickCancel(ctx, this.callbacks);
  }

  private resetWall(): void {
    this.draftPoints = [];
    this.callbacks?.setDraftPolyPoints([]);
  }

  // =========================================================================
  // DOOR/WINDOW LINE MODE
  // =========================================================================

  private startDoorWindow(ctx: InteractionContext, type: 'door' | 'window'): HandlerResult {
    this.drawingObstacle = {
      type,
      p1: { ...ctx.worldPos },
    };
    this.callbacks?.setDrawingObstacle(this.drawingObstacle);
    return this.handled({ cursor: 'crosshair' });
  }

  private commitDoorWindow(ctx: InteractionContext): HandlerResult {
    if (!this.drawingObstacle) return this.notHandled();

    const p2 = ctx.worldPos;
    const dist = distance(this.drawingObstacle.p1, p2);

    // Minimum distance check
    if (dist > 10 / ctx.zoom) {
      this.callbacks?.addObstacles([{
        type: this.drawingObstacle.type,
        p1: { ...this.drawingObstacle.p1 },
        p2: { ...p2 },
        blocksVision: this.drawingObstacle.type === 'door',  // Doors block vision, windows don't
        blocksMovement: true,
        hidden: false,
      }]);
    }

    this.drawingObstacle = null;
    this.callbacks?.setDrawingObstacle(null);
    this.callbacks?.setActiveTool('select');
    return this.handled();
  }

  // =========================================================================
  // FREEHAND WALL MODE
  // =========================================================================

  private startFreehandWall(ctx: InteractionContext): HandlerResult {
    this.isDrawingFreehand = true;
    this.freehandPoints = [{ ...ctx.worldPos }];
    return this.handled({ cursor: 'crosshair' });
  }

  private commitFreehandWall(): void {
    if (this.freehandPoints.length >= 2) {
      this.callbacks?.addObstacles([{
        type: 'wall',
        points: [...this.freehandPoints],
        blocksVision: true,
        blocksMovement: true,
        open: true,  // Freehand walls are always open (line chain)
      }]);
    }

    this.isDrawingFreehand = false;
    this.freehandPoints = [];
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  getDraftPoints(): Readonly<Point[]> {
    return this.draftPoints;
  }

  getDrawingObstacle(): Readonly<DrawingObstacleState | null> {
    return this.drawingObstacle;
  }

  getFreehandPoints(): Readonly<Point[]> {
    return this.freehandPoints;
  }

  resetAll(): void {
    this.draftPoints = [];
    this.drawingObstacle = null;
    this.freehandPoints = [];
    this.isDrawingFreehand = false;
    this.callbacks?.setDraftPolyPoints([]);
    this.callbacks?.setDrawingObstacle(null);
  }

  onToolChange(from: string, to: string): void {
    // Reset when leaving drawing tools
    if (['draw-wall', 'draw-door', 'draw-window', 'freehand-wall'].includes(from) &&
      !['draw-wall', 'draw-door', 'draw-window', 'freehand-wall'].includes(to)) {
      this.resetAll();
    }
  }
}
