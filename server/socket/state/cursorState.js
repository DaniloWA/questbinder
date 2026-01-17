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
  updateState(campaignId, userId, payload, socketId = null) {
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

    // Jitter/Redundant Filter:
    // If position is identical to last known position, detect if this is a "Stationary" update
    const lastPos = existing.history[existing.history.length - 1];

    // Check for significant state changes (Tool change, chat, context menu)
    // If these changed, we treat it as ACTIVE regardless of position
    const hasStateChange = (
      (payload.activeTool && payload.activeTool !== existing.activeTool) ||
      (payload.isContexting !== undefined && payload.isContexting !== existing.isContexting) ||
      (payload.isChatting !== undefined && payload.isChatting !== existing.isChatting) ||
      (payload.isClicking !== undefined && payload.isClicking !== existing.isClicking)
    );

    // Calculate movement delta
    const deltaX = lastPos ? Math.abs(lastPos.x - payload.x) : 0;
    const deltaY = lastPos ? Math.abs(lastPos.y - payload.y) : 0;

    // Definition of Stationary: Tiny movement (< 0.1) AND No State Change
    const isStationary = lastPos && deltaX < 0.1 && deltaY < 0.1 && !hasStateChange;

    if (isStationary) {
      // If Stationary, we treat this as a "Keep Alive" heartbeat.
      // It proves the user is connected, so we update the timestamp.
      existing.lastUpdate = now;
      existing.serverTimestamp = now;

      // CRITICAL LOGIC: 
      // If user is ALREADY AFK, a stationary packet (jitter/heartbeat) should NOT wake them up.
      // They must move significantly or change state to wake up.
      if (existing.isAfk) {
        // Return existing state (still AFK)
        return existing;
      }

      // If user is ACTIVE, this packet keeps them active (prevents timeout).
      return {
        ...existing,
        wasAfk: false,
        serverTimestamp: now
      };
    }

    // Track if user was previously AFK
    const wasAfk = existing.isAfk || false;

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
      warningSent: false, // Reset warning on movement
      isAfk: false,       // Force reset AFK on movement
    };

    if (socketId) updatedState.socketId = socketId;

    campaignCursors.set(userId, updatedState);

    // Auto-clear hidden/afk flags if we receive a fresh active update
    // But preserve them if the payload explicitly sets them (e.g. user manually went AFK)
    // Note: If client sends isHidden=false, we trust it. If client doesn't send it, we assume false on movement? 
    // Actually, client sends full state in cursor:move. 
    // However, for KEEP ALIVE, we might just bump the timestamp.

    // Return wasAfk so handlers can react (send notifications)
    updatedState.wasAfk = wasAfk;

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

  /**
   * Reset activity for a user (called on Click, etc)
   */
  resetActivity(campaignId, userId) {
    const state = this.getState(campaignId, userId);
    if (state) {
      const wasAfk = state.isAfk;
      state.lastUpdate = Date.now();
      state.warningSent = false;
      state.isAfk = false;
      return wasAfk;
    }
    return false;
  }

  /**
   * Check for presence (Heartbeat Watchdog)
   * Detects if users have stopped sending updates (frozen tab)
   * Stages:
   * 1. 1m: Mark AFK
   * 2. 2m: Warning Kick
   * 3. 5m: Kick
   */
  checkPresence(io) {
    const now = Date.now();
    const AFK_TIMEOUT = 60000;     // 1m
    const WARN_TIMEOUT = 120000;   // 2m
    const KICK_TIMEOUT = 300000;   // 5m

    for (const [campaignId, userStates] of this.states) {
      for (const [userId, state] of userStates) {
        const timeSinceLastUpdate = now - state.lastUpdate;

        // Stage 3: Kick (5m)
        if (timeSinceLastUpdate > KICK_TIMEOUT) {
          console.log(`[Presence] Kicking user ${userId} (Inactive > 5m)`);

          // 1. Notify EVERYONE (Public Kick Notification)
          io.to(campaignId).emit('system:notification', {
            message: `${state.userName || 'Um jogador'} foi desconectado por inatividade.`,
            type: 'warning'
          });

          if (state.socketId) {
            const socket = io.sockets.sockets.get(state.socketId);
            if (socket) {
              // Send kick event with redirect info BEFORE disconnecting
              socket.emit('me:kicked', {
                reason: 'afk',
                message: 'Você foi desconectado por inatividade (5 minutos).',
                redirectTo: `/join/${campaignId}`
              });
              // Increased delay to 5s to ensure client (which might be throttled in background)
              // has enough time to receive and process the event before socket closure.
              setTimeout(() => socket.disconnect(true), 5000);
            }
          }
          this.removeUser(campaignId, userId);
          io.to(campaignId).emit('player:leave', { userId, userName: state.userName || 'Jogador (AFK)' });
          continue; // User removed
        }

        // Stage 2: Warning (2m)
        if (timeSinceLastUpdate > WARN_TIMEOUT) {
          // Public Warning (One-time)
          if (!state.warningSent) {
            state.warningSent = true;
            io.to(campaignId).emit('system:notification', {
              message: `ATENÇÃO: ${state.userName || 'Um jogador'} será desconectado em 3 minutos por inatividade.`,
              type: 'warning'
            });
          }

          // Private Warning/Status Update (Periodic - every 10s via checkPresence)
          // Ensure we don't send this if we are about to kick (handled in Stage 3)
          if (timeSinceLastUpdate < KICK_TIMEOUT && state.socketId) {
            const userSocket = io.sockets.sockets.get(state.socketId);
            if (userSocket) {
              userSocket.emit('me:afk_status', {
                status: 'warning',
                timeLeft: Math.round((KICK_TIMEOUT - timeSinceLastUpdate) / 1000)
              });
            }
          }
        }

        // Stage 1: AFK (30s)
        if (timeSinceLastUpdate > AFK_TIMEOUT && !state.isAfk) {
          state.isAfk = true;
          io.to(campaignId).emit('cursor:move', {
            userId,
            userName: state.userName,
            userColor: state.userColor,
            x: state.x,
            y: state.y,
            isAfk: true,
            serverTimestamp: now
          });

          // Private AFK Status to User (MUST use sockets.get, not io.to)
          // Only send "afk" if we haven't reached "warning" stage yet to avoid downgrading status
          if (state.socketId && timeSinceLastUpdate < WARN_TIMEOUT) {
            const userSocket = io.sockets.sockets.get(state.socketId);
            if (userSocket) {
              userSocket.emit('me:afk_status', { status: 'afk' });
            }
          }
          state.afkNotificationSent = true; // Prevent duplicate notifications
        }
      }
    }
  }
}

// Singleton instance
export const cursorState = new CursorStateManager();
