/**
 * VTT Interaction Engine - Door Toggle Handler
 *
 * Handles clicking on doors/windows to toggle open/closed state.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import { findObstacleAt } from '../utils/hitTesting';

/**
 * DoorToggleHandler - Toggle door/window open/closed state.
 *
 * Priority: 550 (between token drag and pan)
 * Tools: select
 */
export class DoorToggleHandler extends BaseHandler {
  constructor() {
    super({
      id: 'door-toggle',
      name: 'Door Toggle',
      priority: 550,
      tools: ['select'],
      description: 'Toggle doors and windows open/closed',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    // Handle hover
    if (phase === 'move') return true;

    if (phase !== 'down' || ctx.button !== 0) return false;
    if (ctx.activeTool !== 'select') return false;

    const obstacle = findObstacleAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
    return obstacle !== null && (obstacle.type === 'door' || obstacle.type === 'window');
  }

  onMouseMove(ctx: InteractionContext): HandlerResult {
    // Only process hover if not dragging
    if (ctx.activeTool !== 'select') return this.notHandled();

    const obstacle = findObstacleAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
    if (obstacle) {
      this.callbacks?.setHoveredObstacleId?.(obstacle.id);
      // Change cursor if it's a door/window we can toggle
      if (obstacle.type === 'door' || obstacle.type === 'window') {
        const canControl = ctx.isGM || ctx.permissions?.doorControl;
        if (canControl) return { handled: false, cursor: 'pointer' };
      }
    } else {
      this.callbacks?.setHoveredObstacleId?.(null);
    }

    return this.notHandled();
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    const obstacle = findObstacleAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
    if (!obstacle) return this.notHandled();

    if (obstacle.type !== 'door' && obstacle.type !== 'window') {
      return this.notHandled();
    }

    // Check permission - GM or if doorControl is enabled
    const canControl = ctx.isGM || ctx.permissions?.doorControl;

    if (!canControl) {
      return this.notHandled();
    }

    // Toggle blocksMovement (open/closed)
    this.callbacks?.updateObstacle(obstacle.id, {
      blocksMovement: !obstacle.blocksMovement,
    });

    return this.handled();
  }
}
