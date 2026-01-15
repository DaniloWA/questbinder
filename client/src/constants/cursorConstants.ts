/**
 * Cursor Constants - Unified configuration for cursor animation system
 * 
 * These constants are shared between:
 * - Client: CustomCursor.tsx, cursorPhysicsEngine.ts, useMapRenderer.ts
 * - Server: cursorHandlers.js (partially)
 */

// ============================================================================
// NETWORK THROTTLING
// ============================================================================

/** Maximum cursor move events per second (1000 / 80 = ~12.5/s, relies on batch replay) */
export const EMIT_THROTTLE_MS = 80;

// ============================================================================
// SPRING PHYSICS
// ============================================================================

/** Spring stiffness - higher = faster response (typical: 100-500) */
export const SPRING_STIFFNESS = 400;

/** Spring damping - higher = less oscillation (typical: 10-30) */
export const SPRING_DAMPING = 28;

/** Spring mass - higher = more inertia (typical: 0.5-2) */
export const SPRING_MASS = 0.8;

/** Pre-configured spring for cursors */
export const CURSOR_SPRING_CONFIG = {
  stiffness: SPRING_STIFFNESS,
  damping: SPRING_DAMPING,
  mass: SPRING_MASS,
} as const;

// ============================================================================
// FIXED TIMESTEP (DETERMINISTIC PHYSICS)
// ============================================================================

/** Fixed delta time for physics simulation (60 FPS equivalent) */
export const FIXED_DT_MS = 16.67;

/** Maximum accumulated time before dropping frames (prevents spiral of death) */
export const MAX_ACCUMULATED_MS = 100;

// ============================================================================
// SERVER RECONCILIATION
// ============================================================================

/** Error threshold above which position snaps directly (in pixels) */
export const SNAP_THRESHOLD = 150;

/** How fast to blend towards server position (0.0-1.0) */
export const BLEND_SPEED = 0.15;

/** Maximum correction per frame (pixels) */
export const MAX_CORRECTION_PER_FRAME = 20;

// ============================================================================
// TRAIL RENDERING
// ============================================================================

/** How long trail particles live (ms) */
export const TRAIL_MAX_AGE_MS = 400;

/** Maximum trail history points */
export const TRAIL_MAX_POINTS = 120;

/** Minimum movement to add trail point (pixels) */
export const TRAIL_MIN_DISTANCE = 2;

/** Minimum time between trail points (ms) - ~60fps */
export const TRAIL_THROTTLE_MS = 16;

// ============================================================================
// MOVEMENT DETECTION
// ============================================================================

/** Minimum movement to consider "moving" (pixels) */
export const MIN_MOVEMENT_THRESHOLD = 0.5;

/** Velocity decay per frame when stopped */
export const VELOCITY_DECAY = 0.85;

/** Time without updates to consider cursor stopped (ms) */
export const STOPPED_THRESHOLD_MS = 150;

// ============================================================================
// SQUASH & STRETCH
// ============================================================================

/** How much stretch on fast movement */
export const STRETCH_FACTOR = 0.05;

/** Maximum stretch multiplier */
export const MAX_STRETCH = 0.5;

/** Maximum squash multiplier */
export const MAX_SQUASH = 0.2;

// ============================================================================
// CURSOR SIZING
// ============================================================================

/** Minimum cursor size in pixels */
export const CURSOR_MIN_SIZE = 48;

/** Maximum cursor size in pixels */
export const CURSOR_MAX_SIZE = 64;

/** Cursor size as ratio of smaller screen dimension */
export const CURSOR_SIZE_RATIO = 0.04;

/**
 * Calculates responsive cursor size based on screen dimensions.
 * Used by both local (CustomCursor) and remote (renderCursor) cursors.
 */
export const getDynamicCursorSize = (): number => {
  const screenMin = Math.min(window.innerWidth, window.innerHeight);
  return Math.max(CURSOR_MIN_SIZE, Math.min(CURSOR_MAX_SIZE, Math.round(screenMin * CURSOR_SIZE_RATIO)));
};

// ============================================================================
// VISUAL PHYSICS (for CustomCursor animation)
// ============================================================================

/** Lerp speed for cursor following mouse (0-1, higher = faster) */
export const VISUAL_LERP_SPEED = 0.75;

// ============================================================================
// LAG COMPENSATION
// ============================================================================

/** Maximum lag compensation window (ms) */
export const MAX_LAG_COMPENSATION_MS = 500;

/** Position history size for lag compensation (server-side) */
export const POSITION_HISTORY_SIZE = 20;

// ============================================================================
// ANTI-CHEAT
// ============================================================================

/** Maximum allowed cursor speed (DISABLED - No limit) */
export const MAX_CURSOR_SPEED = Infinity;

// ============================================================================
// BUNDLED CONFIG OBJECT
// ============================================================================

export const CURSOR_CONFIG = {
  // Network
  EMIT_THROTTLE_MS,

  // Spring
  SPRING_STIFFNESS,
  SPRING_DAMPING,
  SPRING_MASS,
  CURSOR_SPRING_CONFIG,

  // Fixed Timestep
  FIXED_DT_MS,
  MAX_ACCUMULATED_MS,

  // Reconciliation
  SNAP_THRESHOLD,
  BLEND_SPEED,
  MAX_CORRECTION_PER_FRAME,

  // Trail
  TRAIL_MAX_AGE_MS,
  TRAIL_MAX_POINTS,
  TRAIL_MIN_DISTANCE,

  // Movement
  MIN_MOVEMENT_THRESHOLD,
  VELOCITY_DECAY,
  STOPPED_THRESHOLD_MS,

  // Squash & Stretch
  STRETCH_FACTOR,
  MAX_STRETCH,
  MAX_SQUASH,

  // Cursor Sizing
  CURSOR_MIN_SIZE,
  CURSOR_MAX_SIZE,
  CURSOR_SIZE_RATIO,

  // Visual Physics
  VISUAL_LERP_SPEED,

  // Lag Compensation
  MAX_LAG_COMPENSATION_MS,
  POSITION_HISTORY_SIZE,

  // Anti-Cheat
  MAX_CURSOR_SPEED,
} as const;

export type CursorConfig = typeof CURSOR_CONFIG;
