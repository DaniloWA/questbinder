/**
 * VTT Interaction Engine - Event Broadcast Utilities
 *
 * Functions for broadcasting interaction events to remote clients.
 */

import { socketService } from '../../../../../services/socketService';
import type { Point } from '../../../../../types';
import type { ClickAnimationStyle } from '../core/types';

/**
 * Emit cursor movement to other clients.
 * Note: The server handles adding userId, userName, userColor.
 */
export const emitCursorMove = (
  x: number,
  y: number,
  activeTool: string,
  forceImmediate?: boolean
): void => {
  // The server enriches this payload with user info
  (socketService as any).emit('cursor:move', { x, y, activeTool });
};

/**
 * Emit token drag state to other clients.
 */
export const emitTokenDrag = (
  userId: string,
  tokenId: string,
  x: number,
  y: number,
  path: Point[],
  color?: string
): void => {
  socketService.emit('token:drag', {
    userId,
    tokenId,
    x,
    y,
    path,
    color,
  });
};

/**
 * Emit click animation to other clients.
 */
export const emitCursorClick = (
  userId: string,
  x: number,
  y: number,
  color: string,
  style: ClickAnimationStyle
): void => {
  socketService.emit('cursor:click', { userId, x, y, color, style });
};

/**
 * Emit grid update for local preview (via CustomEvent).
 */
export const emitGridLocalUpdate = (
  offsetX: number,
  offsetY: number,
  size?: number
): void => {
  window.dispatchEvent(new CustomEvent('questbinder:grid-local-update', {
    detail: { offsetX, offsetY, size },
  }));
};

/**
 * Emit grid preview for renderer (via CustomEvent).
 */
export const emitGridPreview = (
  size: number,
  offsetX: number,
  offsetY: number
): void => {
  window.dispatchEvent(new CustomEvent('questbinder:grid-preview', {
    detail: { size, offsetX, offsetY },
  }));
};
