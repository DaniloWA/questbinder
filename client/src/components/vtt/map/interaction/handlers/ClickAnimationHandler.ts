/**
 * VTT Interaction Engine - Click Animation Handler
 *
 * Creates click animations and broadcasts them to other clients.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import { createClickAnimation, type ClickAnimation } from '../utils/clickAnimations';
import { emitCursorClick } from '../utils/eventBroadcast';

/**
 * ClickAnimationHandler - Visual feedback for clicks.
 *
 * Priority: 200 (low - runs after main handlers, doesn't block)
 * Tools: All ('*') except map-align tools
 */
export class ClickAnimationHandler extends BaseHandler {
  private animationsRef: React.RefObject<ClickAnimation[]> | null = null;

  constructor() {
    super({
      id: 'click-animation',
      name: 'Click Animation',
      priority: 200,
      tools: '*',
      description: 'Visual feedback for mouse clicks',
    });
  }

  /**
   * Set the animations ref for adding animations.
   */
  setAnimationsRef(ref: React.RefObject<ClickAnimation[]>): void {
    this.animationsRef = ref;
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    // Only handle mouse down, and skip for grid tools
    if (phase !== 'down') return false;

    // Skip for precision tools (alignment, drawing, measuring)
    const isPrecisionTool = ctx.activeTool.startsWith('map-align') ||
      ['draw-', 'fog-', 'smart-', 'freehand-wall', 'measure-'].some(p => ctx.activeTool.startsWith(p));

    if (isPrecisionTool) return false;
    return ctx.button === 0 || ctx.button === 2;
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    // Skip for grid align tools
    if (ctx.activeTool.startsWith('map-align')) {
      return this.notHandled();
    }

    const isLeftClick = ctx.button === 0;

    // Get user overrides if available
    const userId = ctx.currentUser?.id || '';
    const overrides = ctx.permissions?.cursorOverrides?.[userId] as any;

    // Create animation
    const animation = createClickAnimation(
      ctx.worldPos,
      isLeftClick,
      ctx.cursorSettings,
      overrides
    );

    // Add to local animations ref
    if (this.animationsRef?.current) {
      this.animationsRef.current.push(animation);
    }

    // Broadcast to other clients
    if (ctx.currentUser) {
      emitCursorClick(
        ctx.currentUser.id,
        animation.x,
        animation.y,
        animation.color,
        animation.style
      );
    }

    // Don't handle - let other handlers process the click
    return this.notHandled();
  }
}
