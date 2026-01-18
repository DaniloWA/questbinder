/**
 * VTT Interaction Engine - Eraser Handler
 *
 * Handles all eraser tools for removing elements.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import {
  findObstacleAt,
  findAudioZoneAt,
  findTriggerZoneAt,
  findDrawingAt,
} from '../utils/hitTesting';

/**
 * EraserHandler - Remove various elements.
 *
 * Priority: 600
 * Tools: eraser, eraser-audio, eraser-trigger, eraser-drawing
 */
export class EraserHandler extends BaseHandler {
  constructor() {
    super({
      id: 'eraser',
      name: 'Eraser',
      priority: 600,
      tools: ['eraser', 'eraser-audio', 'eraser-trigger', 'eraser-drawing'],
      description: 'Remove obstacles, zones, and drawings',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    return ['eraser', 'eraser-audio', 'eraser-trigger', 'eraser-drawing'].includes(ctx.activeTool);
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    if (ctx.button !== 0) return this.notHandled();

    const tool = ctx.activeTool;

    // Eraser for obstacles (walls, doors, windows)
    if (tool === 'eraser') {
      const obstacle = findObstacleAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
      if (obstacle && ctx.isGM) {
        this.callbacks?.removeObstacle(obstacle.id);
        return this.handled({ cursor: 'crosshair' });
      }
    }

    // Eraser for audio zones
    if (tool === 'eraser-audio') {
      const zone = findAudioZoneAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
      if (zone && ctx.isGM) {
        this.callbacks?.removeAudioZone(zone.id);
        return this.handled({ cursor: 'crosshair' });
      }
    }

    // Eraser for trigger zones
    if (tool === 'eraser-trigger') {
      const zone = findTriggerZoneAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
      if (zone && ctx.isGM) {
        this.callbacks?.removeTriggerZone(zone.id);
        return this.handled({ cursor: 'crosshair' });
      }
    }

    // Eraser for drawings
    if (tool === 'eraser-drawing') {
      const drawing = findDrawingAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
      if (drawing) {
        // Check permission - GM or owner can delete
        if (ctx.isGM || drawing.userId === ctx.currentUser?.id) {
          this.callbacks?.removeDrawing(drawing.id);
          return this.handled({ cursor: 'crosshair' });
        }
      }
    }

    return this.notHandled();
  }
}
