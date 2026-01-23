/**
 * VTT Interaction Engine - Wall Hover Handler
 *
 * Dedicated handler for highlighting obstacles (walls, doors, windows) on hover.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import { findObstacleAt } from '../utils/hitTesting';

/**
 * WallHoverHandler - Highlights obstacles when hovered.
 *
 * Priority: 560 (Higher than DoorToggle, lower than Drap/Draw)
 * Tools: select, smart-wall, draw-wall, draw-door, draw-window, freehand-wall
 */
export class WallHoverHandler extends BaseHandler {
  constructor() {
    super({
      id: 'wall-hover',
      name: 'Wall Hover',
      priority: 560,
      tools: ['select', 'smart-wall', 'draw-wall', 'draw-door', 'draw-window', 'freehand-wall'],
      description: 'Highlight walls and obstacles on hover',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    return phase === 'move';
  }

  onMouseMove(ctx: InteractionContext): HandlerResult {
    const allowedTools = ['select', 'smart-wall', 'draw-wall', 'draw-door', 'draw-window', 'freehand-wall'];
    if (!allowedTools.includes(ctx.activeTool)) return this.notHandled();

    const obstacle = findObstacleAt(ctx.worldPos.x, ctx.worldPos.y, ctx);

    if (obstacle) {
      this.callbacks?.setHoveredObstacleId?.(obstacle.id);

      // If it's a door/window AND we are in select mode, show pointer to indicate interactivity
      if (ctx.activeTool === 'select' && (obstacle.type === 'door' || obstacle.type === 'window')) {
        const canControl = ctx.isGM || ctx.permissions?.doorControl;
        if (canControl) return { handled: false, cursor: 'pointer' };
      }

      return { handled: false }; // Side-effect only, don't block
    } else {
      this.callbacks?.setHoveredObstacleId?.(null);
    }

    return this.notHandled();
  }
}
