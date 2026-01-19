/**
 * VTT Interaction Engine - Utilities
 */

import { InteractionContext, HandlerResult, HANDLED, NOT_HANDLED } from '../core/types';

/**
 * Handles right-click cancellation for tools.
 * Returns HANDLED if cancellation occurred, otherwise NOT_HANDLED.
 */
export const handleRightClickCancel = (ctx: InteractionContext, callbacks: any): HandlerResult => {
  if (ctx.button === 2) {
    // If tool is already select, let it bubble (context menu)
    if (ctx.activeTool === 'select') return NOT_HANDLED;

    // Otherwise switch to select and clear states
    callbacks?.setActiveTool('select');

    // Clear all potential states
    callbacks?.setDrawingObstacle(null);
    callbacks?.setDrawingLightZone(null);
    callbacks?.setDrawingAudioZone(null);
    callbacks?.setDrawingTriggerZone(null);
    callbacks?.setDraftPolyPoints([]);
    callbacks?.setMovementPath([]);
    callbacks?.updateDrawingState?.([]); // Clear brush preview

    return HANDLED;
  }
  return NOT_HANDLED;
};
