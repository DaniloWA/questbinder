/**
 * VTT Interaction Engine - Cursor Sync Handler
 *
 * Handles cursor "pressing" state for remote feedback.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';

/**
 * CursorSyncHandler - Remote cursor press state.
 *
 * Priority: 50 (very low - runs last)
 * Tools: All ('*')
 */
export class CursorSyncHandler extends BaseHandler {
  private pressingTimerRef: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super({
      id: 'cursor-sync',
      name: 'Cursor Sync',
      priority: 50,
      tools: '*',
      description: 'Syncs cursor press state for remote visibility',
    });
  }

  shouldHandle(phase: EventPhase, _ctx: InteractionContext): boolean {
    return phase === 'down' || phase === 'up' || phase === 'leave';
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
