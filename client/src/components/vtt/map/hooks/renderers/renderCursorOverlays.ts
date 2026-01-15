/**
 * Remote Cursor Overlay Renderer
 * 
 * Uses shared cursorOverlays module for consistent rendering with local cursor.
 */

import { renderOverlaysToCanvas, OverlayState } from '../../../../../utils/cursorOverlays';

export interface RenderOverlayData {
  position: { x: number; y: number; };
  isContexting?: boolean;
  activeTool?: string;
  isAfk?: boolean;
  isChatting?: boolean;
}

/**
 * Renders cursor overlays for remote cursors.
 * Uses the shared cursorOverlays module for consistent visuals with local cursor.
 */
export const renderCursorOverlays = (
  ctx: CanvasRenderingContext2D,
  renderData: RenderOverlayData,
  zoom: number
): void => {
  const { position, isContexting, activeTool, isAfk, isChatting } = renderData;

  // Build state object for shared renderer
  const state: OverlayState = {
    isContexting,
    activeTool,
    isAfk,
    isChatting,
  };

  // Call shared renderer
  renderOverlaysToCanvas(ctx, position, state, zoom);
};
