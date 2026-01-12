/**
 * Cursor Handlers - Socket.io handlers for cursor events
 * 
 * Features:
 * - Validated cursor:move with state tracking
 * - Lag-compensated cursor:click
 * - Anti-cheat validation
 */

import { cursorState } from '../state/cursorState.js';

// ============================================================================
// THROTTLE SETTINGS
// ============================================================================

const CURSOR_MOVE_THROTTLE_MS = 50; // Batch Mode (~20/sec)

// ============================================================================
// HANDLER REGISTRATION
// ============================================================================

export const registerCursorHandlers = (socket, client, utils) => {
  // Track last emit time for throttling
  let lastCursorMoveTime = 0;

  /**
   * cursor:move - Validated and enriched cursor movement
   */
  socket.on('cursor:move', (payload) => {
    if (!client.campaignId || !client.userId) return;

    const now = Date.now();

    // Server-side throttle
    if (now - lastCursorMoveTime < CURSOR_MOVE_THROTTLE_MS) {
      return; // Drop throttled event
    }
    lastCursorMoveTime = now;

    // Validate payload
    if (typeof payload.x !== 'number' || typeof payload.y !== 'number') {
      console.warn(`[CursorHandler] Invalid payload from ${client.userId}:`, payload);
      return;
    }

    // Validate movement (anti-cheat)
    const validation = cursorState.validateMovement(client.campaignId, client.userId, payload);
    if (!validation.valid) {
      console.warn(`[CursorHandler] Movement rejected for ${client.userId}: ${validation.reason}`);
      // Don't block - just log for monitoring. Could add stricter enforcement later.
    }

    // Update server-side state
    const updatedState = cursorState.updateState(client.campaignId, client.userId, payload);

    // Broadcast to other clients with server enrichment
    socket.to(client.campaignId).emit('cursor:move', {
      ...payload,
      userId: client.userId,
      serverTimestamp: updatedState.serverTimestamp,
      estimatedLatency: updatedState.estimatedLatency,
    });
  });

  /**
   * cursor:click - Lag-compensated click events
   */
  socket.on('cursor:click', (payload) => {
    if (!client.campaignId || !client.userId) return;

    const now = Date.now();
    const { timestamp, x, y, color, style } = payload;

    // Default to provided position
    let compensatedPosition = { x, y };

    // If client provided timestamp, attempt lag compensation
    if (timestamp && (now - timestamp) < 500) {
      const historicalPos = cursorState.getPositionAtTime(
        client.campaignId,
        client.userId,
        timestamp
      );

      if (historicalPos) {
        compensatedPosition = {
          x: historicalPos.x,
          y: historicalPos.y,
        };
        console.log(`[CursorHandler] Lag compensated click for ${client.userId}: ` +
          `original=(${x.toFixed(0)},${y.toFixed(0)}) ` +
          `compensated=(${compensatedPosition.x.toFixed(0)},${compensatedPosition.y.toFixed(0)}) ` +
          `latency=${now - timestamp}ms`
        );
      }
    }

    // Broadcast lag-compensated click
    socket.to(client.campaignId).emit('cursor:click', {
      userId: client.userId,
      x: compensatedPosition.x,
      y: compensatedPosition.y,
      color: color || '#3b82f6',
      style: style || 'ripple',
      originalTimestamp: timestamp,
      serverTimestamp: now,
      lagCompensated: !!timestamp,
    });
  });

  /**
   * cursor:pressing - Unthrottled click state for visual feedback
   * Transmits mouse down/up state immediately without throttle
   */
  socket.on('cursor:pressing', (payload) => {
    if (!client.campaignId || !client.userId) return;

    const { pressing } = payload;

    // Immediate broadcast (no throttle for visual feedback)
    socket.to(client.campaignId).emit('cursor:pressing', {
      userId: client.userId,
      pressing: !!pressing,
      timestamp: Date.now(),
    });
  });

  /**
   * Clean up on disconnect
   */
  socket.on('disconnect', () => {
    if (client.campaignId && client.userId) {
      cursorState.removeUser(client.campaignId, client.userId);
    }
  });
};
