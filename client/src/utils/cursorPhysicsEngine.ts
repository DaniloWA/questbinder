/**
 * Cursor Physics Engine - Advanced physics for smooth cursor tracking
 * 
 * Features:
 * - Position history buffer for prediction
 * - Velocity-based movement interpolation
 * - Latency estimation and compensation
 * - Smooth reconciliation with server updates
 * - Spring physics for natural deceleration
 */

import {
  Point2D,
  TimestampedPosition,
  SpringConfig,
  CURSOR_SPRING,
  springInterpolate2D,
  springInterpolateAngle,
  predictPosition,
  calculateVelocity,
  reconcilePositionSmooth,
  lerp,
  lerp2D,
  debugLog,
  createFixedTimestepAccumulator,
  DEFAULT_RECONCILIATION_CONFIG,
} from './animationEngine';
import {
  CURSOR_CONFIG,
} from '../constants/cursorConstants';

// ============================================================================
// TYPES
// ============================================================================

export interface CursorState {
  // Current interpolated position (what we render)
  x: number;
  y: number;

  // Previous position (for fixed timestep interpolation)
  previousX: number;
  previousY: number;

  // Target position from server
  targetX: number;
  targetY: number;

  // Predicted position (for latency compensation)
  predictedX: number;
  predictedY: number;

  // Velocity (pixels per millisecond)
  velocityX: number;
  velocityY: number;

  // Rotation angle (radians)
  angle: number;
  previousAngle: number;
  targetAngle: number;
  angleVelocity: number;

  // Position history for prediction
  history: TimestampedPosition[];

  // Trail history for particle effect (more positions, with color)
  trailHistory: { x: number; y: number; time: number; }[];

  // Timing
  lastUpdateTime: number;
  lastServerTime: number;

  // Latency estimation
  estimatedLatencyMs: number;
  latencySamples: number[];

  // State flags
  isMoving: boolean;
  isVisible: boolean;
  isClicking: boolean; // Mouse button pressed
  correctionApplied: boolean; // For debug visualization

  // New Fields
  healthStatus?: 'healthy' | 'bloodied' | 'unconscious';
  activeTool?: string; // New: Tool being used (ruler, fog, etc.)
  isContexting?: boolean; // New: Is context menu open?
  isChatting?: boolean; // New: Is user typing in chat?
  trailAnimation?: string;
  trailColor?: string;
  trailEnabled?: boolean;
  trailLength?: number;
  trailCustomImage?: string;
}

export interface CursorUpdatePayload {
  x: number;
  y: number;
  timestamp?: number;
  velocityX?: number;
  velocityY?: number;
  isClicking?: boolean;
  healthStatus?: 'healthy' | 'bloodied' | 'unconscious';
  activeTool?: string;
  isContexting?: boolean;
  isChatting?: boolean;
  trailAnimation?: string;
  trailColor?: string;
  trailEnabled?: boolean;
  trailCustomImage?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Maximum positions to keep in history
const MAX_HISTORY_SIZE = 10;

// How far ahead to predict (based on estimated latency)
const PREDICTION_LOOKAHEAD_FACTOR = 0.5;

// Maximum latency samples to average
const MAX_LATENCY_SAMPLES = 5;

// Minimum time between server updates to consider "stopped"
const STOPPED_THRESHOLD_MS = 150;

// Snap threshold (if error is below this, snap to target)
const SNAP_THRESHOLD = 2;

// Velocity decay when stopped (per frame)
const VELOCITY_DECAY = 0.85;

// ============================================================================
// CURSOR PHYSICS ENGINE CLASS
// ============================================================================

export class CursorPhysicsEngine {
  private states: Map<string, CursorState> = new Map();
  private springConfig: SpringConfig;

  constructor(springConfig: SpringConfig = CURSOR_SPRING) {
    this.springConfig = springConfig;
  }

  /**
   * Get or create state for a cursor
   */
  getState(userId: string): CursorState | undefined {
    return this.states.get(userId);
  }

  /**
   * Check if a cursor exists
   */
  has(userId: string): boolean {
    return this.states.has(userId);
  }

  /**
   * Initialize a new cursor state
   */
  initCursor(userId: string, initialPosition: Point2D): CursorState {
    const now = performance.now();
    const state: CursorState = {
      x: initialPosition.x,
      y: initialPosition.y,
      previousX: initialPosition.x,
      previousY: initialPosition.y,
      targetX: initialPosition.x,
      targetY: initialPosition.y,
      predictedX: initialPosition.x,
      predictedY: initialPosition.y,
      velocityX: 0,
      velocityY: 0,
      angle: 0,
      previousAngle: 0,
      targetAngle: 0,
      angleVelocity: 0,
      history: [{ ...initialPosition, timestamp: now }],
      trailHistory: [{ x: initialPosition.x, y: initialPosition.y, time: now }],
      lastUpdateTime: now,
      lastServerTime: now,
      estimatedLatencyMs: 50,
      latencySamples: [],
      isMoving: false,
      isVisible: true,
      isClicking: false,
      correctionApplied: false,
      healthStatus: 'healthy',
      trailEnabled: false,
    };

    this.states.set(userId, state);
    debugLog(`Initialized cursor for ${userId}`, initialPosition);
    return state;
  }

  /**
   * Process server update for a cursor
   */
  processServerUpdate(
    userId: string,
    update: CursorUpdatePayload
  ): CursorState {
    const now = performance.now();
    let state = this.states.get(userId);

    // Initialize if new cursor
    if (!state) {
      state = this.initCursor(userId, { x: update.x, y: update.y });
    }

    // Update latency estimation if timestamp provided
    if (update.timestamp) {
      const latency = now - update.timestamp;
      if (latency > 0 && latency < 1000) { // Sanity check
        state.latencySamples.push(latency);
        if (state.latencySamples.length > MAX_LATENCY_SAMPLES) {
          state.latencySamples.shift();
        }
        state.estimatedLatencyMs =
          state.latencySamples.reduce((a, b) => a + b, 0) / state.latencySamples.length;
      }
    }

    // Add to history
    state.history.push({
      x: update.x,
      y: update.y,
      timestamp: update.timestamp ?? now,
    });
    if (state.history.length > MAX_HISTORY_SIZE) {
      state.history.shift();
    }

    // Update target position
    state.targetX = update.x;
    state.targetY = update.y;

    // Use velocity hints if provided, otherwise calculate from history
    if (update.velocityX !== undefined && update.velocityY !== undefined) {
      // Blend server velocity with our estimate for stability
      const ourVelocity = calculateVelocity(state.history);
      state.velocityX = lerp(ourVelocity.x, update.velocityX, 0.6);
      state.velocityY = lerp(ourVelocity.y, update.velocityY, 0.6);
    }

    // Calculate predicted position (compensate for latency)
    const lookAhead = state.estimatedLatencyMs * PREDICTION_LOOKAHEAD_FACTOR;
    const predicted = predictPosition(state.history, lookAhead);
    if (predicted) {
      state.predictedX = predicted.x;
      state.predictedY = predicted.y;
    } else {
      state.predictedX = update.x;
      state.predictedY = update.y;
    }

    // Calculate target angle from movement direction
    const dx = update.x - state.x;
    const dy = update.y - state.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 5) { // Only update angle if significant movement
      state.targetAngle = Math.atan2(dy, dx) + Math.PI / 2; // Point cursor tip forward
    }

    // Update timing
    state.lastServerTime = now;
    state.isMoving = true;

    // Update clicking state
    if (update.isClicking !== undefined) {
      state.isClicking = update.isClicking;
    }

    // Update new fields
    if (update.healthStatus) state.healthStatus = update.healthStatus;
    if (update.activeTool) state.activeTool = update.activeTool; // New
    if (update.isContexting !== undefined) state.isContexting = update.isContexting; // New
    if (update.isChatting !== undefined) state.isChatting = update.isChatting; // New
    if (update.trailAnimation) state.trailAnimation = update.trailAnimation;
    if (update.trailColor) state.trailColor = update.trailColor;
    if (update.trailEnabled !== undefined) state.trailEnabled = update.trailEnabled;
    if (update.trailCustomImage) state.trailCustomImage = update.trailCustomImage;

    // Add to trail history (for particle effects)
    if (dist > 3) { // Only add if movement is significant
      state.trailHistory.push({ x: state.x, y: state.y, time: now });
      // Keep trail history limited (last 25 positions)
      if (state.trailHistory.length > 25) {
        state.trailHistory.shift();
      }
    }

    debugLog(`Server update for ${userId}`, {
      target: { x: update.x, y: update.y },
      predicted: { x: state.predictedX, y: state.predictedY },
      latency: state.estimatedLatencyMs,
    });

    return state;
  }

  /**
   * Tick animation for a cursor (call every frame)
   * Returns the interpolated position to render
   * 
   * For fixed timestep rendering, use the returned position with alpha interpolation:
   * renderPos = lerp(state.previousX, state.x, alpha)
   */
  tick(userId: string, deltaMs: number): Point2D | null {
    const state = this.states.get(userId);
    if (!state) return null;

    const now = performance.now();

    // Store previous positions for visual interpolation
    state.previousX = state.x;
    state.previousY = state.y;
    state.previousAngle = state.angle;

    // Check if cursor stopped receiving updates
    const timeSinceUpdate = now - state.lastServerTime;
    if (timeSinceUpdate > CURSOR_CONFIG.STOPPED_THRESHOLD_MS) {
      state.isMoving = false;
      // Decay velocity when stopped
      state.velocityX *= CURSOR_CONFIG.VELOCITY_DECAY;
      state.velocityY *= CURSOR_CONFIG.VELOCITY_DECAY;
    }

    // Use predicted position as interpolation target for smoother feel
    const effectiveTarget: Point2D = state.isMoving
      ? { x: state.predictedX, y: state.predictedY }
      : { x: state.targetX, y: state.targetY };

    // Spring interpolation for position
    const positionResult = springInterpolate2D(
      { x: state.x, y: state.y },
      effectiveTarget,
      { x: state.velocityX, y: state.velocityY },
      this.springConfig,
      deltaMs
    );

    // Check for snap threshold (prevent jitter when close)
    const dist = Math.hypot(
      effectiveTarget.x - positionResult.position.x,
      effectiveTarget.y - positionResult.position.y
    );

    if (dist < SNAP_THRESHOLD && !state.isMoving) {
      // Snap to target
      state.x = state.targetX;
      state.y = state.targetY;
      state.velocityX = 0;
      state.velocityY = 0;
    } else {
      // Apply interpolation
      state.x = positionResult.position.x;
      state.y = positionResult.position.y;
      state.velocityX = positionResult.velocity.x;
      state.velocityY = positionResult.velocity.y;
    }

    // Spring interpolation for angle
    const angleResult = springInterpolateAngle(
      state.angle,
      state.targetAngle,
      state.angleVelocity,
      { ...this.springConfig, stiffness: this.springConfig.stiffness * 0.6 },
      deltaMs
    );
    state.angle = angleResult.angle;
    state.angleVelocity = angleResult.velocity;

    state.lastUpdateTime = now;

    return { x: state.x, y: state.y };
  }

  /**
   * Get render data for a cursor (includes previous positions for interpolation)
   */
  getRenderData(userId: string): {
    position: Point2D;
    previousPosition: Point2D;
    angle: number;
    previousAngle: number;
    isMoving: boolean;
    velocity: Point2D;
    trailHistory: { x: number; y: number; time: number; }[];
    isClicking: boolean;
    correctionApplied: boolean;
    healthStatus?: 'healthy' | 'bloodied' | 'unconscious';
    activeTool?: string;
    isContexting?: boolean;
    isChatting?: boolean;
    trailConfig: {
      enabled?: boolean;
      animation?: string;
      color?: string;
      image?: string;
    };
  } | null {
    const state = this.states.get(userId);
    if (!state) return null;

    return {
      position: { x: state.x, y: state.y },
      previousPosition: { x: state.previousX, y: state.previousY },
      angle: state.angle,
      previousAngle: state.previousAngle,
      isMoving: state.isMoving,
      velocity: { x: state.velocityX, y: state.velocityY },
      trailHistory: state.trailHistory,
      isClicking: state.isClicking,
      correctionApplied: state.correctionApplied,
      healthStatus: state.healthStatus,
      activeTool: state.activeTool, // New
      isContexting: state.isContexting, // New
      isChatting: state.isChatting, // New
      trailConfig: {
        enabled: state.trailEnabled,
        animation: state.trailAnimation,
        color: state.trailColor,
        image: state.trailCustomImage
      }
    };
  }

  /**
   * Remove a cursor (player left)
   */
  removeCursor(userId: string): void {
    this.states.delete(userId);
    debugLog(`Removed cursor for ${userId}`);
  }

  /**
   * Clear all cursors
   */
  clear(): void {
    this.states.clear();
  }

  /**
   * Set visibility for a cursor (for viewport culling)
   */
  setVisibility(userId: string, visible: boolean): void {
    const state = this.states.get(userId);
    if (state) {
      state.isVisible = visible;
    }
  }

  /**
   * Get all cursor IDs
   */
  getCursorIds(): string[] {
    return Array.from(this.states.keys());
  }

  /**
   * Get debug info for all cursors
   */
  getDebugInfo(): Record<string, {
    position: Point2D;
    target: Point2D;
    predicted: Point2D;
    velocity: Point2D;
    latency: number;
    isMoving: boolean;
  }> {
    const info: Record<string, any> = {};
    this.states.forEach((state, userId) => {
      info[userId] = {
        position: { x: state.x, y: state.y },
        target: { x: state.targetX, y: state.targetY },
        predicted: { x: state.predictedX, y: state.predictedY },
        velocity: { x: state.velocityX, y: state.velocityY },
        latency: state.estimatedLatencyMs,
        isMoving: state.isMoving,
      };
    });
    return info;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalCursorEngine: CursorPhysicsEngine | null = null;

export const getCursorPhysicsEngine = (): CursorPhysicsEngine => {
  if (!globalCursorEngine) {
    globalCursorEngine = new CursorPhysicsEngine();
  }
  return globalCursorEngine;
};

// ============================================================================
// UTILITY: Create cursor from server payload format
// ============================================================================

export const createCursorUpdateFromPayload = (payload: {
  userId: string;
  x: number;
  y: number;
  timestamp?: number;
  velocityX?: number;
  velocityY?: number;
  isClicking?: boolean;
  healthStatus?: 'healthy' | 'bloodied' | 'unconscious';
  trailAnimation?: string;
  trailColor?: string;
  trailEnabled?: boolean;
  trailCustomImage?: string;
  // Fallback for legacy calls
  [key: string]: any;
}): { userId: string; update: CursorUpdatePayload; } => ({
  userId: payload.userId,
  update: {
    x: payload.x,
    y: payload.y,
    timestamp: payload.timestamp,
    velocityX: payload.velocityX,
    velocityY: payload.velocityY,
    isClicking: payload.isClicking,
    healthStatus: payload.healthStatus,
    activeTool: payload.activeTool,
    isContexting: payload.isContexting,
    isChatting: payload.isChatting,
    trailAnimation: payload.trailAnimation,
    trailColor: payload.trailColor,
    trailEnabled: payload.trailEnabled,
    trailCustomImage: payload.trailCustomImage,
  },
});
