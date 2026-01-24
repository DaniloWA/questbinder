/**
 * Animation Engine - Core utilities for smooth 60 FPS animations
 * 
 * Features:
 * - Frame-independent delta time
 * - Linear, cubic, and spring interpolation
 * - Movement prediction for latency compensation
 * - Visibility detection for performance
 */

import { DebugLogger } from './DebugLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface Point2D {
  x: number;
  y: number;
}

export interface TimestampedPosition extends Point2D {
  timestamp: number;
}

export interface SpringConfig {
  stiffness: number;  // Higher = faster response (100-500 typical)
  damping: number;    // Higher = less oscillation (10-30 typical)
  mass: number;       // Higher = more inertia (1-5 typical)
}

export interface InterpolationState {
  current: number;
  target: number;
  velocity: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Default spring config - snappy but smooth
export const DEFAULT_SPRING: SpringConfig = {
  stiffness: 280,
  damping: 26,
  mass: 1,
};

// Lighter spring for cursor movement - smooth following
export const CURSOR_SPRING: SpringConfig = {
  stiffness: 200,
  damping: 24,
  mass: 1,
};

// Target frame time (60 FPS)
export const TARGET_FRAME_MS = 1000 / 60; // 16.67ms

// Maximum delta time to prevent huge jumps after tab switch
export const MAX_DELTA_MS = 100;

// Minimum movement to consider "moving" (pixels)
export const MIN_MOVEMENT_THRESHOLD = 0.5;

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

/**
 * Linear interpolation between two values
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

/**
 * Linear interpolation for 2D points
 */
export const lerp2D = (start: Point2D, end: Point2D, t: number): Point2D => ({
  x: lerp(start.x, end.x, t),
  y: lerp(start.y, end.y, t),
});

/**
 * Ease-out cubic - fast start, slow end
 */
export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * Ease-in-out cubic - smooth start and end
 */
export const easeInOutCubic = (t: number): number => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Ease-out quintic - very fast start, very slow end
 */
export const easeOutQuint = (t: number): number => {
  return 1 - Math.pow(1 - t, 5);
};

/**
 * Ease-out elastic - bouncy overshoot
 */
export const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 :
    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

// ============================================================================
// CUBIC INTERPOLATION (Catmull-Rom Spline)
// ============================================================================

/**
 * Cubic interpolation between 4 values using Catmull-Rom spline
 * p0, p1, p2, p3 are control points, t is 0-1 between p1 and p2
 */
export const cubicInterpolate = (
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number => {
  const t2 = t * t;
  const t3 = t2 * t;

  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
};

/**
 * Cubic interpolation for 2D points
 */
export const cubicInterpolate2D = (
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): Point2D => ({
  x: cubicInterpolate(p0.x, p1.x, p2.x, p3.x, t),
  y: cubicInterpolate(p0.y, p1.y, p2.y, p3.y, t),
});

// ============================================================================
// SPRING PHYSICS
// ============================================================================

/**
 * Spring physics interpolation - simulates a damped spring
 * Returns new position and velocity
 */
export const springInterpolate = (
  current: number,
  target: number,
  velocity: number,
  config: SpringConfig,
  deltaMs: number
): { value: number; velocity: number; } => {
  // Clamp delta time to prevent explosion
  const dt = Math.min(deltaMs, MAX_DELTA_MS) / 1000; // Convert to seconds

  const { stiffness, damping, mass } = config;

  // Spring force: F = -k * x (where x is displacement from target)
  const displacement = current - target;
  const springForce = -stiffness * displacement;

  // Damping force: F = -c * v
  const dampingForce = -damping * velocity;

  // Total acceleration: a = F / m
  const acceleration = (springForce + dampingForce) / mass;

  // Integration (semi-implicit Euler for stability)
  const newVelocity = velocity + acceleration * dt;
  const newValue = current + newVelocity * dt;

  // Snap to target if very close and slow (prevents jitter)
  const isSettled =
    Math.abs(newValue - target) < MIN_MOVEMENT_THRESHOLD &&
    Math.abs(newVelocity) < 1;

  if (isSettled) {
    return { value: target, velocity: 0 };
  }

  return { value: newValue, velocity: newVelocity };
};

/**
 * Spring interpolation for 2D points
 */
export const springInterpolate2D = (
  current: Point2D,
  target: Point2D,
  velocity: Point2D,
  config: SpringConfig,
  deltaMs: number
): { position: Point2D; velocity: Point2D; } => {
  const xResult = springInterpolate(current.x, target.x, velocity.x, config, deltaMs);
  const yResult = springInterpolate(current.y, target.y, velocity.y, config, deltaMs);

  return {
    position: { x: xResult.value, y: yResult.value },
    velocity: { x: xResult.velocity, y: yResult.velocity },
  };
};

// ============================================================================
// MOVEMENT PREDICTION
// ============================================================================

/**
 * Predict future position based on position history
 * Uses linear extrapolation from velocity
 */
export const predictPosition = (
  history: TimestampedPosition[],
  lookAheadMs: number
): Point2D | null => {
  if (history.length < 2) return null;

  // Get the two most recent positions
  const latest = history[history.length - 1];
  const prev = history[history.length - 2];

  const timeDelta = latest.timestamp - prev.timestamp;
  if (timeDelta <= 0) return null;

  // Calculate velocity (pixels per ms)
  const velocityX = (latest.x - prev.x) / timeDelta;
  const velocityY = (latest.y - prev.y) / timeDelta;

  // Extrapolate position
  return {
    x: latest.x + velocityX * lookAheadMs,
    y: latest.y + velocityY * lookAheadMs,
  };
};

/**
 * Calculate average velocity from history
 */
export const calculateVelocity = (
  history: TimestampedPosition[],
  sampleCount: number = 3
): Point2D => {
  if (history.length < 2) return { x: 0, y: 0 };

  const samples = Math.min(sampleCount, history.length - 1);
  let totalVx = 0;
  let totalVy = 0;

  for (let i = history.length - 1; i > history.length - 1 - samples; i--) {
    const curr = history[i];
    const prev = history[i - 1];
    const dt = curr.timestamp - prev.timestamp;

    if (dt > 0) {
      totalVx += (curr.x - prev.x) / dt;
      totalVy += (curr.y - prev.y) / dt;
    }
  }

  return {
    x: totalVx / samples,
    y: totalVy / samples,
  };
};

// ============================================================================
// DELTA TIME & FRAME MANAGEMENT
// ============================================================================

/**
 * Creates a frame-time tracker for consistent animations
 */
export const createFrameTimer = () => {
  let lastFrameTime = performance.now();
  let deltaTime = TARGET_FRAME_MS;
  let frameCount = 0;
  let fpsAccumulator = 0;
  let currentFps = 60;

  return {
    /**
     * Call at the start of each frame
     * Returns delta time in milliseconds
     */
    tick: (): number => {
      const now = performance.now();
      deltaTime = Math.min(now - lastFrameTime, MAX_DELTA_MS);
      lastFrameTime = now;

      // FPS calculation (running average)
      frameCount++;
      fpsAccumulator += deltaTime;
      if (fpsAccumulator >= 1000) {
        currentFps = Math.round((frameCount / fpsAccumulator) * 1000);
        frameCount = 0;
        fpsAccumulator = 0;
      }

      return deltaTime;
    },

    /**
     * Get current delta time (for components that don't call tick)
     */
    getDeltaTime: (): number => deltaTime,

    /**
     * Get time-based multiplier for frame-independent animation
     * 1.0 at 60 FPS, 2.0 at 30 FPS, 0.5 at 120 FPS
     */
    getTimeScale: (): number => deltaTime / TARGET_FRAME_MS,

    /**
     * Get current estimated FPS
     */
    getFps: (): number => currentFps,

    /**
     * Reset timer (call after long pause)
     */
    reset: (): void => {
      lastFrameTime = performance.now();
      deltaTime = TARGET_FRAME_MS;
    },
  };
};

// ============================================================================
// VISIBILITY / VIEWPORT DETECTION
// ============================================================================

/**
 * Check if a point is within the viewport bounds
 */
export const isPointInViewport = (
  point: Point2D,
  viewport: { x: number; y: number; width: number; height: number; zoom: number; }
): boolean => {
  // Convert world point to screen space
  const screenX = point.x * viewport.zoom + viewport.x;
  const screenY = point.y * viewport.zoom + viewport.y;

  // Check if within screen bounds (with margin)
  const margin = 100; // Extra margin for smooth entry
  return (
    screenX >= -margin &&
    screenX <= viewport.width + margin &&
    screenY >= -margin &&
    screenY <= viewport.height + margin
  );
};

/**
 * Calculate distance from viewport center (for LOD priorities)
 */
export const distanceFromViewportCenter = (
  point: Point2D,
  viewport: { x: number; y: number; width: number; height: number; zoom: number; }
): number => {
  const screenX = point.x * viewport.zoom + viewport.x;
  const screenY = point.y * viewport.zoom + viewport.y;
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;

  return Math.hypot(screenX - centerX, screenY - centerY);
};

// ============================================================================
// ANGLE INTERPOLATION
// ============================================================================

/**
 * Interpolate between two angles (handles wraparound)
 */
export const lerpAngle = (start: number, end: number, t: number): number => {
  // Normalize to -PI to PI
  let delta = ((end - start + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return start + delta * t;
};

/**
 * Spring interpolation for angles
 */
export const springInterpolateAngle = (
  current: number,
  target: number,
  velocity: number,
  config: SpringConfig,
  deltaMs: number
): { angle: number; velocity: number; } => {
  // Calculate shortest path delta
  let delta = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;

  const effectiveTarget = current + delta;
  const result = springInterpolate(current, effectiveTarget, velocity, config, deltaMs);

  return { angle: result.value, velocity: result.velocity };
};

// ============================================================================
// SMOOTH RECONCILIATION
// ============================================================================

export interface ReconciliationConfig {
  /** Error threshold above which position snaps directly (pixels) */
  snapThreshold: number;
  /** How fast to blend towards server position (0.0-1.0) */
  blendSpeed: number;
  /** Maximum correction per frame (pixels) */
  maxCorrection: number;
}

export const DEFAULT_RECONCILIATION_CONFIG: ReconciliationConfig = {
  snapThreshold: 500,
  blendSpeed: 0.15,
  maxCorrection: 20,
};

/**
 * Smoothly blend between local prediction and server correction
 * Avoids jarring snaps when server update arrives
 * 
 * @param local - Current local/predicted position
 * @param server - Authoritative server position
 * @param config - Reconciliation configuration
 * @returns Reconciled position and whether correction was applied
 */
export const reconcilePositionSmooth = (
  local: Point2D,
  server: Point2D,
  config: ReconciliationConfig = DEFAULT_RECONCILIATION_CONFIG
): { position: Point2D; correctionApplied: boolean; error: number; } => {
  const error = Math.hypot(server.x - local.x, server.y - local.y);

  // Small error - no correction needed
  if (error < 2) {
    return { position: local, correctionApplied: false, error };
  }

  // Large error - snap directly to server position
  if (error > config.snapThreshold) {
    return { position: server, correctionApplied: true, error };
  }

  // Medium error - blend smoothly
  const blend = Math.min(config.blendSpeed, config.maxCorrection / error);
  return {
    position: lerp2D(local, server, blend),
    correctionApplied: true,
    error
  };
};

/**
 * Legacy reconcilePosition for backwards compatibility
 */
export const reconcilePosition = (
  predicted: Point2D,
  serverPosition: Point2D,
  blendFactor: number = 0.3
): Point2D => {
  const result = reconcilePositionSmooth(predicted, serverPosition, {
    snapThreshold: 150,
    blendSpeed: blendFactor,
    maxCorrection: 20
  });
  return result.position;
};

// ============================================================================
// FIXED TIMESTEP ACCUMULATOR (DETERMINISTIC PHYSICS)
// ============================================================================

export interface FixedTimestepState {
  previous: Point2D;
  current: Point2D;
}

/**
 * Creates a fixed timestep accumulator for deterministic physics
 * 
 * This ensures physics runs at a consistent rate regardless of framerate,
 * preventing different results on 30fps vs 144fps monitors.
 * 
 * Usage:
 * ```
 * const accumulator = createFixedTimestepAccumulator();
 * 
 * // In render loop:
 * const alpha = accumulator.update(deltaMs, (fixedDt) => {
 *   // Physics simulation with consistent dt
 *   physics.tick(fixedDt);
 * });
 * 
 * // Use alpha for visual interpolation
 * const renderX = lerp(prevX, currX, alpha);
 * ```
 */
export const createFixedTimestepAccumulator = (
  fixedDtMs: number = 16.67,  // 60 FPS equivalent
  maxAccumulatedMs: number = 100  // Prevent spiral of death
) => {
  let accumulator = 0;

  return {
    /**
     * Update the accumulator with frame delta time
     * @param deltaMs - Time since last frame
     * @param tickFn - Physics tick function called with fixed dt
     * @returns Alpha value (0-1) for visual interpolation
     */
    update: (deltaMs: number, tickFn: (fixedDt: number) => void): number => {
      // Clamp to prevent spiral of death
      accumulator += Math.min(deltaMs, maxAccumulatedMs);

      let tickCount = 0;
      while (accumulator >= fixedDtMs) {
        tickFn(fixedDtMs);
        accumulator -= fixedDtMs;
        tickCount++;

        // Safety: limit ticks per frame to prevent freezing
        if (tickCount > 10) {
          accumulator = 0;
          break;
        }
      }

      // Return interpolation alpha
      return accumulator / fixedDtMs;
    },

    /**
     * Reset accumulator (call after long pause/tab switch)
     */
    reset: () => {
      accumulator = 0;
    },

    /**
     * Get current accumulator value
     */
    getAccumulator: () => accumulator,
  };
};

/**
 * Interpolate between previous and current state for smooth rendering
 */
export const interpolateState = (
  previous: Point2D,
  current: Point2D,
  alpha: number
): Point2D => lerp2D(previous, current, alpha);

// ============================================================================
// DEBUG UTILITIES (Development Only)
// ============================================================================

// Enable via: window.__DEBUG_ANIMATION = true
export const debugLog = (message: string, data?: any): void => {
  if (typeof window !== 'undefined' && (window as any).__DEBUG_ANIMATION) {
    DebugLogger.log('render', 'AnimationEngine', 'Debug', message, data);
  }
};

// Global frame timer singleton
let globalFrameTimer: ReturnType<typeof createFrameTimer> | null = null;

export const getGlobalFrameTimer = (): ReturnType<typeof createFrameTimer> => {
  if (!globalFrameTimer) {
    globalFrameTimer = createFrameTimer();
  }
  return globalFrameTimer;
};
