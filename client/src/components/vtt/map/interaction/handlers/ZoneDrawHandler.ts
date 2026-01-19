/**
 * VTT Interaction Engine - Zone Draw Handler
 *
 * Handles drawing of light zones, audio zones, and trigger zones.
 * Supports both rectangle and polygon modes.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import { distance } from '../utils/coordConversion';
import { handleRightClickCancel } from '../utils/InteractionUtils';
import type { Point, LightZone, AudioZone, TriggerZone } from '../../../../../types';

type ZoneType = 'light' | 'audio' | 'trigger';

interface ZoneRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DrawingZoneState {
  zoneType: ZoneType;
  shapeType: 'rect' | 'polygon';
  p1?: Point;
  points?: Point[];
}

/**
 * ZoneDrawHandler - Drawing light, audio, and trigger zones.
 *
 * Priority: 600
 * Tools: draw-light-rect, draw-light-poly, draw-audio-rect, draw-audio-poly,
 *        draw-trigger-rect, draw-trigger-poly
 */
export class ZoneDrawHandler extends BaseHandler {
  private drawingState: DrawingZoneState | null = null;
  private currentRect: ZoneRect | null = null;

  constructor() {
    super({
      id: 'zone-draw',
      name: 'Zone Drawing',
      priority: 600,
      tools: [
        'draw-light-rect', 'draw-light-poly',
        'draw-audio-rect', 'draw-audio-poly',
        'draw-trigger-rect', 'draw-trigger-poly',
      ],
      description: 'Draw light, audio, and trigger zones',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    if (this.drawingState) return true;
    return this.isZoneTool(ctx.activeTool);
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    // Only GM can draw zones
    if (!ctx.isGM) return this.notHandled();

    // Right click cancels or commits
    if (ctx.button === 2) {
      return this.handleRightClick(ctx);
    }

    // Left click
    if (ctx.button === 0) {
      const toolInfo = this.parseToolName(ctx.activeTool);
      if (!toolInfo) return this.notHandled();

      if (toolInfo.shapeType === 'rect') {
        return this.startRectZone(ctx, toolInfo.zoneType);
      } else {
        return this.addPolyPoint(ctx, toolInfo.zoneType);
      }
    }

    return this.notHandled();
  }

  onMouseMove(ctx: InteractionContext): HandlerResult {
    // Update rectangle preview
    if (this.drawingState?.shapeType === 'rect' && this.drawingState.p1) {
      this.currentRect = {
        x: this.drawingState.p1.x,
        y: this.drawingState.p1.y,
        w: ctx.worldPos.x - this.drawingState.p1.x,
        h: ctx.worldPos.y - this.drawingState.p1.y,
      };
      return this.handled({ cursor: 'crosshair' });
    }

    return this.notHandled();
  }

  onMouseUp(ctx: InteractionContext): HandlerResult {
    // Commit rectangle zone
    if (this.drawingState?.shapeType === 'rect' && this.currentRect) {
      this.commitRectZone(ctx);
      return this.handled();
    }

    return this.notHandled();
  }

  onDoubleClick(ctx: InteractionContext): HandlerResult {
    // Double click commits polygon
    if (this.drawingState?.shapeType === 'polygon' &&
      this.drawingState.points && this.drawingState.points.length >= 3) {
      this.commitPolyZone();
      return this.handled();
    }
    return this.notHandled();
  }

  // =========================================================================
  // RECTANGLE MODE
  // =========================================================================

  private startRectZone(ctx: InteractionContext, zoneType: ZoneType): HandlerResult {
    this.drawingState = {
      zoneType,
      shapeType: 'rect',
      p1: { ...ctx.worldPos },
    };

    // Notify parent about drawing state
    this.updateParentDrawingState(zoneType, { p1: ctx.worldPos });

    return this.handled({ cursor: 'crosshair' });
  }

  private commitRectZone(ctx: InteractionContext): void {
    if (!this.drawingState || !this.currentRect) {
      this.resetAll();
      return;
    }

    // Normalize rectangle
    const x = this.currentRect.w < 0 ? this.currentRect.x + this.currentRect.w : this.currentRect.x;
    const y = this.currentRect.h < 0 ? this.currentRect.y + this.currentRect.h : this.currentRect.y;
    const w = Math.abs(this.currentRect.w);
    const h = Math.abs(this.currentRect.h);

    const rect = { x, y, w, h };
    const zoneType = this.drawingState.zoneType;

    // Create zone based on type
    if (zoneType === 'light') {
      this.callbacks?.addLightZones([{
        type: 'rect',
        rect,
        brightness: 1,
        color: '#ffffff',
      }]);
      this.resetAll();
      this.callbacks?.setActiveTool('select');
    } else if (zoneType === 'audio') {
      // Open modal for audio zone configuration
      const savedRect = { ...rect };
      this.callbacks?.openAudioZoneConfigModal?.((config) => {
        this.callbacks?.addAudioZones([{
          type: 'rect',
          rect: savedRect,
          ...config,
        }]);
      });
      this.resetAll();
      this.callbacks?.setActiveTool('select');
    } else if (zoneType === 'trigger') {
      // Open modal for trigger zone configuration
      const savedRect = { ...rect };
      this.callbacks?.openTriggerZoneConfigModal?.((handoutId) => {
        this.callbacks?.addTriggerZones([{
          type: 'rect',
          rect: savedRect,
          handoutId,
        }]);
      });
      this.resetAll();
      this.callbacks?.setActiveTool('select');
    }
  }

  // =========================================================================
  // POLYGON MODE
  // =========================================================================

  private addPolyPoint(ctx: InteractionContext, zoneType: ZoneType): HandlerResult {
    if (!this.drawingState || this.drawingState.zoneType !== zoneType) {
      this.drawingState = {
        zoneType,
        shapeType: 'polygon',
        points: [],
      };
    }

    const points = this.drawingState.points!;

    // Check if clicking near start point to close
    if (points.length >= 3) {
      const first = points[0];
      if (distance(ctx.worldPos, first) < 15 / ctx.zoom) {
        this.commitPolyZone();
        return this.handled({ cursor: 'crosshair' });
      }
    }

    points.push({ ...ctx.worldPos });
    this.callbacks?.setDraftPolyPoints([...points]);
    return this.handled({ cursor: 'crosshair' });
  }

  private commitPolyZone(): void {
    if (!this.drawingState?.points || this.drawingState.points.length < 3) {
      this.resetAll();
      return;
    }

    const points = [...this.drawingState.points];
    const zoneType = this.drawingState.zoneType;

    if (zoneType === 'light') {
      this.callbacks?.addLightZones([{
        type: 'polygon',
        points,
        brightness: 1,
        color: '#ffffff',
      }]);
      this.resetAll();
      this.callbacks?.setActiveTool('select');
    } else if (zoneType === 'audio') {
      // Open modal for audio zone configuration
      const savedPoints = [...points];
      this.callbacks?.openAudioZoneConfigModal?.((config) => {
        this.callbacks?.addAudioZones([{
          type: 'polygon',
          points: savedPoints,
          ...config,
        }]);
      });
      this.resetAll();
      this.callbacks?.setActiveTool('select');
    } else if (zoneType === 'trigger') {
      // Open modal for trigger zone configuration  
      const savedPoints = [...points];
      this.callbacks?.openTriggerZoneConfigModal?.((handoutId) => {
        this.callbacks?.addTriggerZones([{
          type: 'polygon',
          points: savedPoints,
          handoutId,
        }]);
      });
      this.resetAll();
      this.callbacks?.setActiveTool('select');
    }
  }

  private handleRightClick(ctx: InteractionContext): HandlerResult {
    // If polygon has enough points, commit it
    if (this.drawingState?.shapeType === 'polygon' &&
      this.drawingState.points && this.drawingState.points.length >= 3) {
      this.commitPolyZone();
      return this.handled();
    }

    // Otherwise cancel
    this.resetAll();
    return handleRightClickCancel(ctx, this.callbacks);
  }

  // =========================================================================
  // UTILITIES
  // =========================================================================

  private parseToolName(tool: string): { zoneType: ZoneType; shapeType: 'rect' | 'polygon'; } | null {
    const match = tool.match(/^draw-(light|audio|trigger)-(rect|poly)$/);
    if (!match) return null;
    return {
      zoneType: match[1] as ZoneType,
      shapeType: match[2] === 'poly' ? 'polygon' : 'rect',
    };
  }

  private isZoneTool(tool: string): boolean {
    return /^draw-(light|audio|trigger)-(rect|poly)$/.test(tool);
  }

  private updateParentDrawingState(zoneType: ZoneType, state: { p1: Point; } | null): void {
    if (zoneType === 'light') {
      this.callbacks?.setDrawingLightZone(state ? { type: 'rect', ...state } : null);
    } else if (zoneType === 'audio') {
      this.callbacks?.setDrawingAudioZone(state ? { type: 'rect', ...state } : null);
    } else if (zoneType === 'trigger') {
      this.callbacks?.setDrawingTriggerZone(state ? { type: 'rect', ...state } : null);
    }
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  getDrawingState(): Readonly<DrawingZoneState | null> {
    return this.drawingState;
  }

  getCurrentRect(): Readonly<ZoneRect | null> {
    return this.currentRect;
  }

  resetAll(): void {
    this.drawingState = null;
    this.currentRect = null;
    this.callbacks?.setDraftPolyPoints([]);
    this.callbacks?.setDrawingLightZone(null);
    this.callbacks?.setDrawingAudioZone(null);
    this.callbacks?.setDrawingTriggerZone(null);
  }

  onToolChange(from: string, to: string): void {
    if (this.isZoneTool(from) && !this.isZoneTool(to)) {
      this.resetAll();
    }
  }
}
