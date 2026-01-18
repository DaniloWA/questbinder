/**
 * VTT Interaction Engine - Pan & Zoom Handler
 *
 * Handles map panning (middle click, ctrl+click) and wheel zoom.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import type { Point } from '../../../../../types';
import { screenToWorld } from '../utils/coordConversion';

/**
 * PanZoomHandler - Map navigation via pan and zoom.
 *
 * Priority: 100 (low - fallback when no other handler takes the event)
 * Tools: All ('*')
 */
export class PanZoomHandler extends BaseHandler {
  private isPanning: boolean = false;
  private lastPanPos: Point = { x: 0, y: 0 };

  constructor() {
    super({
      id: 'pan-zoom',
      name: 'Pan & Zoom',
      priority: 100,
      tools: '*',
      description: 'Map panning and zooming navigation',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    // Always handle wheel for zoom
    if (phase === 'wheel') return true;

    // Handle if currently panning
    if (this.isPanning) return true;

    // Start panning on middle click, ctrl+left, or left on empty space
    if (phase === 'down') {
      // Middle click always pans
      if (ctx.button === 1) return true;
      // Ctrl+left always pans
      if (ctx.button === 0 && (ctx.ctrlKey || ctx.metaKey)) return true;
      // Left click may be fallback pan (if no token or drawing tool)
      if (ctx.button === 0 && ctx.activeTool === 'select') return true;
    }

    return false;
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    // Middle click or ctrl+left click starts pan
    if (ctx.button === 1 || (ctx.button === 0 && (ctx.ctrlKey || ctx.metaKey))) {
      this.startPan(ctx.screenPos);
      return this.handled({ cursor: 'grabbing' });
    }

    // Left click on empty space - fallback pan (only if no handlers above took it)
    if (ctx.button === 0 && !this.isDrawingTool(ctx.activeTool)) {
      this.startPan(ctx.screenPos);
      return this.handled({ cursor: 'grabbing' });
    }

    return this.notHandled();
  }

  onMouseMove(ctx: InteractionContext): HandlerResult {
    if (!this.isPanning) return this.notHandled();

    const dx = ctx.screenPos.x - this.lastPanPos.x;
    const dy = ctx.screenPos.y - this.lastPanPos.y;

    // Use ref for immediate update without React re-render
    if (ctx.viewportRef?.current) {
      ctx.viewportRef.current.x += dx;
      ctx.viewportRef.current.y += dy;
    } else {
      // Fallback to callback
      this.callbacks?.setViewport({
        x: ctx.viewport.x + dx,
        y: ctx.viewport.y + dy,
      });
    }

    this.lastPanPos = { ...ctx.screenPos };
    return this.handled({ cursor: 'grabbing' });
  }

  onMouseUp(_ctx: InteractionContext): HandlerResult {
    if (!this.isPanning) return this.notHandled();

    this.stopPan();
    return this.handled({ cursor: 'grab' });
  }

  onMouseLeave(_ctx: InteractionContext): HandlerResult {
    if (this.isPanning) {
      this.stopPan();
      return this.handled();
    }
    return this.notHandled();
  }

  onDetach(): void {
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }
  }

  private throttleTimer: ReturnType<typeof setTimeout> | null = null;

  onWheel(ctx: InteractionContext, deltaY: number): HandlerResult {
    // Calculate zoom
    const scale = deltaY > 0 ? 0.9 : 1.1;

    // Use the REF as the source of truth for the current viewport state, NOT the React context (which is stale)
    const currentViewport = ctx.viewportRef?.current || ctx.viewport;
    const currentZoom = currentViewport.zoom;

    const newZoom = Math.max(0.1, Math.min(5, currentZoom * scale));

    // ZOOM CENTERED ON CURSOR:
    // 1. Get current world position of cursor regarding the CURRENT viewport (Ref)
    // We pass currentViewport explicitly to ensure we aren't using stale state
    const worldPos = screenToWorld(ctx.screenPos.x, ctx.screenPos.y, currentViewport);

    // 2. The target position (new viewport x/y) is the screen point MINUS the world point scaled by new zoom
    const newX = ctx.screenPos.x - worldPos.x * newZoom;
    const newY = ctx.screenPos.y - worldPos.y * newZoom;

    // Use ref for immediate update without React re-render
    if (ctx.viewportRef?.current) {
      ctx.viewportRef.current.x = newX;
      ctx.viewportRef.current.y = newY;
      ctx.viewportRef.current.zoom = newZoom;
    }

    // Debounce the state sync to "pause" React updates until the zoom gesture "settles".
    // This removes the heavy React commit loop from the active interaction entirely.
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
    }

    this.throttleTimer = setTimeout(() => {
      const ref = ctx.viewportRef?.current || { x: newX, y: newY, zoom: newZoom };
      this.callbacks?.setViewport({
        x: ref.x,
        y: ref.y,
        zoom: ref.zoom,
      });
      this.throttleTimer = null;
    }, 100); // 100ms debounce = "Zoom End" detection

    return this.handled();
  }

  // Public accessors
  getIsPanning(): boolean {
    return this.isPanning;
  }

  // Private methods
  private startPan(screenPos: Point): void {
    this.isPanning = true;
    this.lastPanPos = { ...screenPos };
  }

  private stopPan(): void {
    this.isPanning = false;
  }

  private isDrawingTool(tool: string): boolean {
    return [
      'draw-wall', 'draw-door', 'draw-window',
      'fog-poly', 'fog-rect',
      'measure-path', 'eraser',
      'draw-light-rect', 'draw-light-poly',
      'draw-audio-rect', 'draw-audio-poly', 'eraser-audio',
      'draw-trigger-rect', 'draw-trigger-poly', 'eraser-trigger',
      'brush', 'eraser-drawing', 'smart-wall', 'freehand-wall',
    ].includes(tool);
  }
}
