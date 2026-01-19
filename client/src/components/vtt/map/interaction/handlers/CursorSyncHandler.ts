/**
 * VTT Interaction Engine - Cursor Sync Handler
 *
 * Handles cursor "pressing" state and cursor position emission for remote feedback.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';

/**
 * CursorSyncHandler - Remote cursor press state and position emission.
 *
 * Priority: 50 (very low - runs last)
 * Tools: All ('*')
 */
export class CursorSyncHandler extends BaseHandler {
  private pressingTimerRef: ReturnType<typeof setTimeout> | null = null;
  private lastEmitTime: number = 0;

  constructor() {
    super({
      id: 'cursor-sync',
      name: 'Cursor Sync',
      priority: 50,
      tools: '*',
      description: 'Syncs cursor press state and position for remote visibility',
    });
  }

  shouldHandle(phase: EventPhase, _ctx: InteractionContext): boolean {
    return phase === 'down' || phase === 'move' || phase === 'up' || phase === 'leave';
  }

  onMouseDown(_ctx: InteractionContext): HandlerResult {
    // Clear any existing timer
    if (this.pressingTimerRef) {
      clearTimeout(this.pressingTimerRef);
    }

    // Start "pressing" state after 200ms (distinguish click vs hold)
    this.pressingTimerRef = setTimeout(() => {
      this.callbacks?.setCursorClickState(true);
    }, 200);

    // Don't handle - let other handlers process
    return this.notHandled();
  }

  onMouseMove(ctx: InteractionContext): HandlerResult {
    // Throttle cursor emission to 50ms (20fps) to avoid flooding
    const now = Date.now();
    if (now - this.lastEmitTime > 50) {
      this.callbacks?.emitCursorMove?.(ctx.worldPos.x, ctx.worldPos.y);
      this.lastEmitTime = now;
    }
    // Don't handle - let other handlers process
    return this.notHandled();
  }

  onMouseUp(_ctx: InteractionContext): HandlerResult {
    this.clearPressing();
    return this.notHandled();
  }

  onMouseLeave(_ctx: InteractionContext): HandlerResult {
    this.clearPressing();
    return this.notHandled();
  }

  private clearPressing(): void {
    if (this.pressingTimerRef) {
      clearTimeout(this.pressingTimerRef);
      this.pressingTimerRef = null;
    }
    this.callbacks?.setCursorClickState(false);
  }
}
