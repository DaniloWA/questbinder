/**
 * Cursor State Manager - Server-side state management for cursor synchronization
 * 
 * Features:
 * - Position history buffer for lag compensation
 * - Latency estimation per user
 * - Anti-cheat validation (speed limits)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const POSITION_HISTORY_SIZE = 60; // ~1 second at 60 updates/sec
const MAX_CURSOR_SPEED = Infinity; // DISABLED - No speed limit
const MAX_LAG_COMPENSATION_MS = 500; // Maximum time to compensate

// ============================================================================
// CURSOR STATE MANAGER CLASS
// ============================================================================

class CursorStateManager {
  constructor() {
    // Map<campaignId, Map<userId, CursorState>>
    this.states = new Map();
  }

  /**
   * Get state for a specific user in a campaign
   */
  getState(campaignId, userId) {
    if (!this.states.has(campaignId)) {
      return null;
    }
    return this.states.get(campaignId).get(userId) || null;
  }

  /**
   * Get all cursors for a campaign
   */
  getCampaignCursors(campaignId) {
    return this.states.get(campaignId) || new Map();
  }

  /**
   * Update cursor state with new position data
   * Returns the updated state with server enrichment
   */
  updateState(campaignId, userId, payload) {
    // Ensure campaign map exists
    if (!this.states.has(campaignId)) {
      this.states.set(campaignId, new Map());
    }

    const campaignCursors = this.states.get(campaignId);
    const now = Date.now();
    const existing = campaignCursors.get(userId) || {
      history: [],
      latencySamples: [],
      estimatedLatency: 50,
      lastUpdate: 0,
    };

    // Calculate latency if client timestamp provided
    let latency = existing.estimatedLatency;
    if (payload.timestamp) {
      const measuredLatency = now - payload.timestamp;
      if (measuredLatency > 0 && measuredLatency < 1000) {
        existing.latencySamples.push(measuredLatency);
        if (existing.latencySamples.length > 5) {
          existing.latencySamples.shift();
        }
        latency = existing.latencySamples.reduce((a, b) => a + b, 0) / existing.latencySamples.length;
      }
    }

    // Add to position history
    const historyEntry = {
      x: payload.x,
      y: payload.y,
      velocityX: payload.velocityX || 0,
      velocityY: payload.velocityY || 0,
      clientTimestamp: payload.timestamp || now,
      serverTimestamp: now,
    };

    existing.history.push(historyEntry);

    // Limit history size
    if (existing.history.length > POSITION_HISTORY_SIZE) {
      existing.history.shift();
    }

    // Create updated state
    const updatedState = {
      ...existing,
      ...payload,
      estimatedLatency: latency,
      lastUpdate: now,
      serverTimestamp: now,
    };

    campaignCursors.set(userId, updatedState);
    return updatedState;
  }

  /**
   * Validate cursor movement (anti-cheat)
   * Returns { valid: boolean, reason?: string }
   */
  validateMovement(campaignId, userId, payload) {
    const state = this.getState(campaignId, userId);
    if (!state || !state.history || state.history.length === 0) {
      // First movement - always valid
      return { valid: true };
    }

    const lastPos = state.history[state.history.length - 1];
    const now = Date.now();
    const dt = now - lastPos.serverTimestamp;

    if (dt <= 0) {
      return { valid: true }; // Can't calculate speed
    }

    const distance = Math.hypot(payload.x - lastPos.x, payload.y - lastPos.y);
    const speed = distance / dt; // pixels/ms

    if (speed > MAX_CURSOR_SPEED && dt > 10) {
      console.warn(`[CursorState] Speed violation: ${speed.toFixed(2)}px/ms for user ${userId}`);
      return {
        valid: false,
        reason: `Speed violation: ${speed.toFixed(2)}px/ms exceeds limit of ${MAX_CURSOR_SPEED}px/ms`
      };
    }

    return { valid: true };
  }

  /**
   * Get position at a past time (for lag compensation)
   * Uses linear interpolation between history points
   */
  getPositionAtTime(campaignId, userId, targetTime) {
    const state = this.getState(campaignId, userId);
    if (!state || !state.history || state.history.length === 0) {
      return null;
    }

    const history = state.history;
    const now = Date.now();

    // Don't compensate too far back
    if (now - targetTime > MAX_LAG_COMPENSATION_MS) {
      targetTime = now - MAX_LAG_COMPENSATION_MS;
    }

    // Find two points bracketing the target time
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];

      if (targetTime >= prev.clientTimestamp && targetTime <= curr.clientTimestamp) {
        const totalTime = curr.clientTimestamp - prev.clientTimestamp;
        if (totalTime <= 0) return curr;

        const t = (targetTime - prev.clientTimestamp) / totalTime;
        return {
          x: prev.x + (curr.x - prev.x) * t,
          y: prev.y + (curr.y - prev.y) * t,
          interpolated: true,
          confidence: 1 - Math.abs(0.5 - t), // Higher confidence near actual points
        };
      }
    }

    // Target time is after last known position - return latest
    const latest = history[history.length - 1];
    return {
      x: latest.x,
      y: latest.y,
      interpolated: false,
      confidence: 0.5,
    };
  }

  /**
   * Remove a user from a campaign
   */
  removeUser(campaignId, userId) {
    const campaignCursors = this.states.get(campaignId);
    if (campaignCursors) {
      campaignCursors.delete(userId);
      console.log(`[CursorState] Removed user ${userId} from campaign ${campaignId}`);
    }
  }

  /**
   * Remove entire campaign data (when all users leave)
   */
  removeCampaign(campaignId) {
    this.states.delete(campaignId);
    console.log(`[CursorState] Removed campaign ${campaignId}`);
  }

  /**
   * Get debug info for all cursors in a campaign
   */
  getDebugInfo(campaignId) {
    const campaignCursors = this.states.get(campaignId);
    if (!campaignCursors) return {};

    const info = {};
    for (const [userId, state] of campaignCursors) {
      info[userId] = {
        position: { x: state.x, y: state.y },
        historySize: state.history?.length || 0,
        estimatedLatency: state.estimatedLatency,
        lastUpdate: state.lastUpdate,
      };
    }
    return info;
  }
}

// Singleton instance
export const cursorState = new CursorStateManager();
