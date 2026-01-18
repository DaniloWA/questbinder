/**
 * VTT Interaction Engine - Fog of War Handler
 *
 * Handles fog of war drawing tools (rectangle and polygon).
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import { distance } from '../utils/coordConversion';
import type { Point } from '../../../../../types';

interface FogRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * FogOfWarHandler - Fog of war drawing.
 *
 * Priority: 600
 * Tools: fog-rect, fog-poly
 */
export class FogOfWarHandler extends BaseHandler {
  private fogRectStart: Point | null = null;
  private currentFogRect: FogRect | null = null;
  private draftPolyPoints: Point[] = [];

  constructor() {
    super({
      id: 'fog-of-war',
      name: 'Fog of War',
      priority: 600,
      tools: ['fog-rect', 'fog-poly'],
      description: 'Draw fog of war areas',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    if (this.fogRectStart) return true;
    if (this.draftPolyPoints.length > 0) return true;
    return ctx.activeTool === 'fog-rect' || ctx.activeTool === 'fog-poly';
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    // Right click commits or cancels
    if (ctx.button === 2) {
      return this.handleRightClick(ctx);
    }

    // Left click
    if (ctx.button === 0) {
      if (ctx.activeTool === 'fog-rect') {
        return this.startFogRect(ctx);
      }
      if (ctx.activeTool === 'fog-poly') {
        return this.addPolyPoint(ctx);
      }
    }

    return this.notHandled();
  }

  onMouseMove(ctx: InteractionContext): HandlerResult {
    // Update rectangle preview
    if (this.fogRectStart && ctx.activeTool === 'fog-rect') {
      this.currentFogRect = {
        x: this.fogRectStart.x,
        y: this.fogRectStart.y,
        w: ctx.worldPos.x - this.fogRectStart.x,
        h: ctx.worldPos.y - this.fogRectStart.y,
      };
      return this.handled({ cursor: 'crosshair' });
    }

    return this.notHandled();
  }

  onMouseUp(ctx: InteractionContext): HandlerResult {
    // Commit fog rectangle
    if (this.fogRectStart && this.currentFogRect && ctx.activeTool === 'fog-rect') {
      this.commitFogRect();
      return this.handled();
    }

    return this.notHandled();
  }

  onDoubleClick(ctx: InteractionContext): HandlerResult {
    // Double click commits polygon
    if (ctx.activeTool === 'fog-poly' && this.draftPolyPoints.length >= 3) {
      this.commitFogPoly();
      return this.handled();
    }
    return this.notHandled();
  }

  // =========================================================================
  // FOG RECTANGLE
  // =========================================================================

  private startFogRect(ctx: InteractionContext): HandlerResult {
    this.fogRectStart = { ...ctx.worldPos };
    return this.handled({ cursor: 'crosshair' });
  }

  private commitFogRect(): void {
    if (!this.currentFogRect) {
      this.resetRect();
      return;
    }

    // Normalize rectangle (handle negative w/h)
    const x = this.currentFogRect.w < 0
      ? this.currentFogRect.x + this.currentFogRect.w
      : this.currentFogRect.x;
    const y = this.currentFogRect.h < 0
      ? this.currentFogRect.y + this.currentFogRect.h
      : this.currentFogRect.y;
    const w = Math.abs(this.currentFogRect.w);
    const h = Math.abs(this.currentFogRect.h);

    // Create SVG path for rectangle
    const rectPath = `M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`;

    // Get current fog path and append
    // Note: This will be handled by the callback which knows the current fog state
    this.callbacks?.updateFog(rectPath);

    this.resetRect();
    this.callbacks?.setActiveTool('select');
  }

  private resetRect(): void {
    this.fogRectStart = null;
    this.currentFogRect = null;
  }

  // =========================================================================
  // FOG POLYGON
  // =========================================================================

  private addPolyPoint(ctx: InteractionContext): HandlerResult {
    const { worldPos } = ctx;

    // Check if clicking near start point to close
    if (this.draftPolyPoints.length >= 3) {
      const first = this.draftPolyPoints[0];
      if (distance(worldPos, first) < 15 / ctx.zoom) {
        this.commitFogPoly();
        return this.handled({ cursor: 'crosshair' });
      }
    }

    this.draftPolyPoints.push({ ...worldPos });
    this.callbacks?.setDraftPolyPoints([...this.draftPolyPoints]);
    return this.handled({ cursor: 'crosshair' });
  }

  private commitFogPoly(): void {
    if (this.draftPolyPoints.length < 3) {
      this.resetPoly();
      return;
    }

    // Create SVG path for polygon
    const points = this.draftPolyPoints;
    let polyPath = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      polyPath += ` L${points[i].x},${points[i].y}`;
    }
    polyPath += ' Z';

    this.callbacks?.updateFog(polyPath);

    this.resetPoly();
    this.callbacks?.setActiveTool('select');
  }

  private resetPoly(): void {
    this.draftPolyPoints = [];
    this.callbacks?.setDraftPolyPoints([]);
  }

  private handleRightClick(ctx: InteractionContext): HandlerResult {
    // If polygon has enough points, commit it
    if (ctx.activeTool === 'fog-poly' && this.draftPolyPoints.length >= 3) {
      this.commitFogPoly();
      return this.handled();
    }

    // Otherwise cancel
    this.resetAll();
    this.callbacks?.setActiveTool('select');
    return this.handled();
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  getFogRectStart(): Readonly<Point | null> {
    return this.fogRectStart;
  }

  getCurrentFogRect(): Readonly<FogRect | null> {
    return this.currentFogRect;
  }

  getDraftPolyPoints(): Readonly<Point[]> {
    return this.draftPolyPoints;
  }

  resetAll(): void {
    this.resetRect();
    this.resetPoly();
  }

  onToolChange(from: string, to: string): void {
    if (['fog-rect', 'fog-poly'].includes(from) && !['fog-rect', 'fog-poly'].includes(to)) {
      this.resetAll();
    }
  }
}
