/**
 * Cursor Physics Engine - Advanced physics for smooth cursor tracking
 * 
 * Features:
 * - Position history buffer for prediction
 * - Velocity-based movement interpolation
 * - Latency estimation and compensation
 * - Smooth reconciliation with server updates
 * - Spring physics for natural deceleration
 * - Batch Replay for exact movement reproduction
 * - Smart Buffering & Gap Stitching for zero stutter
 * - Adaptive Playback (Time Dilation) for "Live" feel
 */

import {
  Point2D,
  TimestampedPosition,
  SpringConfig,
  CURSOR_SPRING,
  springInterpolate2D,
  springInterpolateAngle,
  calculateVelocity,
  lerp,
  debugLog,
} from './animationEngine';
import {
  STOPPED_THRESHOLD_MS,
  SNAP_THRESHOLD,
  VELOCITY_DECAY,
  VISUAL_LERP_SPEED,
  STRETCH_FACTOR,
  MAX_STRETCH,
  MAX_SQUASH,
  TRAIL_MAX_POINTS,
  TRAIL_MIN_DISTANCE,
  TRAIL_THROTTLE_MS,
} from '../constants/cursorConstants';
import { cleanupTrailHistory, HealthStatus } from './trailRenderer';

// ============================================================================
// CONSTANTS (Local only - not shared)
// ============================================================================

const MAX_HISTORY_SIZE = 10;
const MAX_LATENCY_SAMPLES = 5;

// ============================================================================
// TYPES
// ============================================================================

export interface CursorState {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  targetX: number;
  targetY: number;
  predictedX: number;
  predictedY: number;
  velocityX: number;
  velocityY: number;
  angle: number;
  previousAngle: number;
  targetAngle: number;
  angleVelocity: number;
  history: TimestampedPosition[];
  trailHistory: { x: number; y: number; time: number; }[];
  lastTrailTime: number;
  lastUpdateTime: number;
  lastServerTime: number;
  estimatedLatencyMs: number;
  latencySamples: number[];
  isMoving: boolean;
  isVisible: boolean;
  isClicking: boolean;
  correctionApplied: boolean;
  healthStatus?: 'healthy' | 'bloodied' | 'unconscious';
  activeTool?: string;
  isContexting?: boolean;
  isChatting?: boolean;
  isAfk?: boolean;

  trailAnimation?: string;
  trailColor?: string;
  trailEnabled?: boolean;
  trailCustomImage?: string;
  trailLength?: number;
  trailThickness?: number;
  trailSize?: number;

  // Visual Decoupling State (The "Ghost" Cursor)
  visualX: number;
  visualY: number;
  visualAngle: number;
  stretchX: number;
  stretchY: number;

  // Batch Replay State
  replayQueue: { x: number; y: number; duration: number; }[];
  currentSegment?: {
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    targetAngle: number;
    duration: number;
  };
  segmentTimeElapsed: number;
  playbackRate: number;
  isReplaying: boolean;
  lastSenderTimestamp: number;

  // Smart Buffering State
  isBridgingGap: boolean;
  lastBridgingTime: number;
}

export interface CursorUpdatePayload {
  x: number;
  y: number;
  timestamp?: number;
  velocityX?: number;
  velocityY?: number;
  isClicking?: boolean;
  path?: { x: number; y: number; time: number; }[];
  healthStatus?: 'healthy' | 'bloodied' | 'unconscious';
  activeTool?: string;
  isContexting?: boolean;
  isChatting?: boolean;
  isAfk?: boolean;
  trailAnimation?: string;
  trailColor?: string;
  trailEnabled?: boolean;
  trailCustomImage?: string;
  trailLength?: number;
  trailThickness?: number;
  trailSize?: number;
}

// ============================================================================
// CURSOR PHYSICS ENGINE CLASS
// ============================================================================

export class CursorPhysicsEngine {
  private states: Map<string, CursorState> = new Map();
  private springConfig: SpringConfig;

  // Visual Physics Constants - now imported from cursorConstants.ts

  constructor(springConfig: SpringConfig = CURSOR_SPRING) {
    this.springConfig = springConfig;
  }

  getState(userId: string): CursorState | undefined {
    return this.states.get(userId);
  }

  has(userId: string): boolean {
    return this.states.has(userId);
  }

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

      // Initialize visual state same as physical to start
      visualX: initialPosition.x,
      visualY: initialPosition.y,
      visualAngle: 0,
      stretchX: 1,
      stretchY: 1,

      history: [{ ...initialPosition, timestamp: now }],
      trailHistory: [{ x: initialPosition.x, y: initialPosition.y, time: now }],
      lastTrailTime: now,
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

      // Batch Replay
      replayQueue: [],
      isReplaying: false,
      lastSenderTimestamp: 0,
      segmentTimeElapsed: 0,
      playbackRate: 1.0,

      // Smart Buffering
      isBridgingGap: false,
      lastBridgingTime: 0,
    };

    this.states.set(userId, state);
    return state;
  }

  processServerUpdate(
    userId: string,
    update: CursorUpdatePayload
  ): CursorState {
    const now = performance.now();
    let state = this.states.get(userId);

    if (!state) {
      state = this.initCursor(userId, { x: update.x, y: update.y });
    }

    // Latency estimation
    if (update.timestamp) {
      const latency = now - update.timestamp;
      if (latency > 0 && latency < 1000) {
        state.latencySamples.push(latency);
        if (state.latencySamples.length > MAX_LATENCY_SAMPLES) state.latencySamples.shift();
        state.estimatedLatencyMs = state.latencySamples.reduce((a, b) => a + b, 0) / state.latencySamples.length;
      }
    }

    // Discard out-of-order
    if (update.timestamp && update.timestamp < state.lastServerTime) {
      return state;
    }

    // Teleport Check
    const lastPos = state.history[state.history.length - 1];
    if (lastPos) {
      const jumpDist = Math.hypot(update.x - lastPos.x, update.y - lastPos.y);
      const timeSinceLast = update.timestamp && lastPos.timestamp ? (update.timestamp - lastPos.timestamp) : 0;
      const isMassiveJump = jumpDist > 5000;
      const isLagSpike = timeSinceLast > 300 && jumpDist > 500;

      if (isMassiveJump || isLagSpike) {
        // Hard teleport reset
        state.x = update.x;
        state.y = update.y;
        state.previousX = update.x;
        state.previousY = update.y;
        state.velocityX = 0;
        state.velocityY = 0;
        state.history = [];
        state.replayQueue = [];
        state.isReplaying = false;
        state.lastSenderTimestamp = 0;
        state.isBridgingGap = false;
        state.segmentTimeElapsed = 0;
        state.currentSegment = undefined;
      }
    }

    // --- INITIALIZE VISUAL STATE IF NEW ---
    if (!state.correctionApplied) {
      state.visualX = update.x;
      state.visualY = update.y;
      state.visualAngle = 0;
      state.stretchX = 1;
      state.stretchY = 1;
      state.correctionApplied = true;
    }

    // --- BATCH REPLAY PROCESSING ---
    // If update has a path, queue it up for replay
    if (update.path && update.path.length > 0) {
      const shouldStitch = state.isBridgingGap && state.replayQueue.length === 0;

      // Overflow protection
      if (state.replayQueue.length > 100) {
        state.replayQueue = [];
        state.x = update.x;
        state.y = update.y;
        state.lastSenderTimestamp = 0;
        state.isBridgingGap = false;
        state.segmentTimeElapsed = 0;
        state.currentSegment = undefined;
      }

      // Calculate reference time
      let referenceTime = state.lastSenderTimestamp;
      if (referenceTime === 0 || (update.path[0].time - referenceTime > 1000)) {
        referenceTime = update.path[0].time - 16;
      }

      // Prepare new segments
      const newSegments: { x: number, y: number, duration: number; }[] = [];
      update.path.forEach(p => {
        let dt = p.time - referenceTime;
        if (dt <= 0) dt = 16;
        if (dt > 500) dt = 100;
        newSegments.push({ x: p.x, y: p.y, duration: dt });
        referenceTime = p.time;
      });
      state.lastSenderTimestamp = referenceTime;

      // MOMENTUM PRESERVATION STITCHING
      if (shouldStitch && newSegments.length > 0) {
        const startTarget = newSegments[0];
        const stitchDist = Math.hypot(startTarget.x - state.x, startTarget.y - state.y);
        const currentSpeed = Math.hypot(state.velocityX, state.velocityY);

        let stitchDuration = 32;
        if (currentSpeed > 0.1) {
          const timeNeeded = (stitchDist / currentSpeed) * 1000;
          stitchDuration = Math.max(16, Math.min(120, timeNeeded));
        } else {
          stitchDuration = Math.min(50, Math.max(16, stitchDist));
        }

        state.replayQueue.push({ x: startTarget.x, y: startTarget.y, duration: stitchDuration });
        state.isBridgingGap = false;
      }

      // Append segments
      newSegments.forEach(s => state.replayQueue.push(s));
      state.isReplaying = true;
    } else {
      // Legacy update (no path)
      if (!state.isReplaying) {
        state.targetX = update.x;
        state.targetY = update.y;
      }
    }

    // History
    state.history.push({ x: update.x, y: update.y, timestamp: update.timestamp ?? now });
    if (state.history.length > MAX_HISTORY_SIZE) state.history.shift();

    // Angle
    const dx = update.x - state.x;
    const dy = update.y;
    if (Math.hypot(dx, dy) > 5 && !state.isReplaying) {
      state.targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
    }

    state.lastServerTime = now;
    state.isMoving = true;

    // Metadata updates
    // Update Status Flags (from Payload)
    if (update.isClicking !== undefined) state.isClicking = update.isClicking;
    if (update.activeTool !== undefined) state.activeTool = update.activeTool;
    if (update.isContexting !== undefined) state.isContexting = update.isContexting;
    if (update.isChatting !== undefined) state.isChatting = update.isChatting;
    if (update.isAfk !== undefined) state.isAfk = update.isAfk;

    if (update.healthStatus) state.healthStatus = update.healthStatus;

    // Trail Config Updates
    if (update.trailEnabled !== undefined) state.trailEnabled = update.trailEnabled;
    if (update.trailColor) state.trailColor = update.trailColor;
    if (update.trailAnimation) state.trailAnimation = update.trailAnimation;
    if (update.trailCustomImage) state.trailCustomImage = update.trailCustomImage;
    if (update.trailLength !== undefined) state.trailLength = update.trailLength;
    if (update.trailThickness !== undefined) state.trailThickness = update.trailThickness;
    if (update.trailSize !== undefined) state.trailSize = update.trailSize;

    // Note: Trail points are now added in tick() for consistency with local cursor

    return state;
  }

  tick(userId: string, deltaMs: number): Point2D | null {
    const state = this.states.get(userId);
    if (!state) return null;

    const now = performance.now();
    state.previousX = state.x; state.previousY = state.y; state.previousAngle = state.angle;

    // === REPLAY MODE ===
    if (state.isReplaying) {
      // CASE A: Queue has data -> Process Segment
      if (state.replayQueue.length > 0 || state.currentSegment) {
        state.isBridgingGap = false;

        // 1. ADAPTIVE PLAYBACK SPEED
        let bufferDuration = state.currentSegment ? (state.currentSegment.duration - state.segmentTimeElapsed) : 0;
        for (const item of state.replayQueue) bufferDuration += item.duration;

        const TARGET_BUFFER = 40;
        let targetRate = 1.0;

        if (bufferDuration > TARGET_BUFFER) {
          targetRate = 1.0 + (bufferDuration - TARGET_BUFFER) * 0.005;
          targetRate = Math.min(targetRate, 2.0);
        } else if (bufferDuration < TARGET_BUFFER && bufferDuration > 0) {
          targetRate = Math.max(0.95, 1.0 - (TARGET_BUFFER - bufferDuration) * 0.005);
        }
        state.playbackRate = lerp(state.playbackRate, targetRate, 0.05);

        // 2. Initialize Segment if needed
        if (!state.currentSegment) {
          const nextPoint = state.replayQueue.shift()!;
          const dx = nextPoint.x - state.x;
          const dy = nextPoint.y - state.y;
          let segAngle = state.angle;
          if (Math.hypot(dx, dy) > 1) {
            segAngle = Math.atan2(dy, dx) + Math.PI / 2;
          }

          state.currentSegment = {
            startX: state.x,
            startY: state.y,
            targetX: nextPoint.x,
            targetY: nextPoint.y,
            targetAngle: segAngle,
            duration: nextPoint.duration
          };
          state.segmentTimeElapsed = 0;
        }

        // 3. Process Animation
        const seg = state.currentSegment!;
        state.segmentTimeElapsed += deltaMs * state.playbackRate;
        const progress = Math.min(state.segmentTimeElapsed / seg.duration, 1.0);

        state.x = lerp(seg.startX, seg.targetX, progress);
        state.y = lerp(seg.startY, seg.targetY, progress);
        state.targetAngle = seg.targetAngle;

        if (seg.duration > 0) {
          state.velocityX = ((seg.targetX - seg.startX) / seg.duration) * 1000;
          state.velocityY = ((seg.targetY - seg.startY) / seg.duration) * 1000;
        }

        if (progress >= 1.0) {
          state.currentSegment = undefined;
        }
        state.lastUpdateTime = now;
        state.isMoving = true;
      }
      // CASE B: Queue Empty -> EXTRAPOLATE (Natural Slide)
      else {
        if (!state.isBridgingGap) {
          state.isBridgingGap = true;
          state.lastBridgingTime = now;
          state.playbackRate = 1.0;
        }

        // INFINITE SLIDE with FRICTION
        state.velocityX *= 0.92;
        state.velocityY *= 0.92;
        state.x += state.velocityX * (deltaMs / 1000);
        state.y += state.velocityY * (deltaMs / 1000);

        if (Math.hypot(state.velocityX, state.velocityY) < 5) {
          state.velocityX = 0;
          state.velocityY = 0;
          state.isMoving = false;
          state.isReplaying = false;
          state.isBridgingGap = false;
        } else {
          state.isMoving = true;
        }
      }
    } else {
      // === FALLBACK: SPRING PHYSICS (Legacy/Idle) ===
      const timeSinceUpdate = now - state.lastServerTime;
      if (timeSinceUpdate > STOPPED_THRESHOLD_MS) {
        state.velocityX *= VELOCITY_DECAY;
        state.velocityY *= VELOCITY_DECAY;
        if (Math.hypot(state.velocityX, state.velocityY) < 1) {
          state.isMoving = false;
        }
      }

      const effectiveTarget = { x: state.targetX, y: state.targetY };
      const posRes = springInterpolate2D(
        { x: state.x, y: state.y },
        effectiveTarget,
        { x: state.velocityX, y: state.velocityY },
        this.springConfig,
        deltaMs
      );

      const dist = Math.hypot(effectiveTarget.x - posRes.position.x, effectiveTarget.y - posRes.position.y);
      if (dist < SNAP_THRESHOLD && !state.isMoving) {
        state.x = state.targetX; state.y = state.targetY;
        state.velocityX = 0; state.velocityY = 0;
      } else {
        state.x = posRes.position.x; state.y = posRes.position.y;
        state.velocityX = posRes.velocity.x; state.velocityY = posRes.velocity.y;
      }
      state.lastUpdateTime = now;
    }

    state.lastUpdateTime = now;

    // =========================================================================
    // VISUAL PHYSICS LAYER (The Ghost Cursor)
    // =========================================================================
    // Decouples visual fluidity from network/physics reconcilliation.
    // The "Ghost" follows the "Physical Body" using exact logic from CustomCursor.tsx

    // 1. Calculate Distances
    const distX = state.x - state.visualX;
    const distY = state.y - state.visualY;

    // 2. Lerp Movement (Standard LERP like local cursor)
    state.visualX += distX * VISUAL_LERP_SPEED;
    state.visualY += distY * VISUAL_LERP_SPEED;

    // 3. Calculate Visual Velocity (px/frame normalized to ~60fps for consistency)
    // We treat deltaMs as roughly 16ms for the visual feel, but adapt if frames drop significantly
    // CustomCursor just moves per frame, so we normalize to that feel.
    const visualVelX = distX * VISUAL_LERP_SPEED;
    const visualVelY = distY * VISUAL_LERP_SPEED;
    const visualSpeed = Math.hypot(visualVelX, visualVelY);

    // 4. Calculate Visual Angle
    if (visualSpeed > 1) { // Threshold to prevent jitter when stopping
      // Direct angle set for responsiveness (matching CustomCursor)
      state.visualAngle = Math.atan2(visualVelY, visualVelX) + Math.PI / 2;
    }

    // 5. Calculate Squash & Stretch
    // CustomCursor: 1 + min(velocity * STRETCH_FACTOR, 0.5)
    // We use visualSpeed which effectively is "distance traveled this frame"
    const targetStretchY = 1 + Math.min(visualSpeed * STRETCH_FACTOR, MAX_STRETCH);
    const targetStretchX = 1 - Math.min(visualSpeed * STRETCH_FACTOR * 0.5, MAX_SQUASH);

    // Smooth stretch transition (optional, but good for stability)
    // CustomCursor sets it directly per frame based on velocity. Let's match that.
    state.stretchX = targetStretchX;
    state.stretchY = targetStretchY;

    // Apply Click Scale Effect to Stretch
    if (state.isClicking) {
      state.stretchX *= 0.6;
      state.stretchY *= 0.6;
    }

    // =========================================================================
    // TRAIL GENERATION (Matching CustomCursor.tsx logic)
    // =========================================================================
    // Add trail points in tick() to match local cursor frequency
    if (state.trailEnabled && visualSpeed > TRAIL_MIN_DISTANCE && now - state.lastTrailTime > TRAIL_THROTTLE_MS) {
      state.trailHistory.push({
        x: state.visualX,
        y: state.visualY,
        time: now
      });
      state.lastTrailTime = now;

      // Limit trail length (matching local cursor)
      if (state.trailHistory.length > TRAIL_MAX_POINTS) {
        state.trailHistory.shift();
      }
    }


    // Cleanup old trail points (matching local cursor behavior)
    // Default length is 20, so multiplier is trailLength / 20
    const lengthMultiplier = Math.max(0.1, Math.min(5, (state.trailLength || 20) / 20));
    state.trailHistory = cleanupTrailHistory(state.trailHistory, state.healthStatus as HealthStatus, lengthMultiplier);

    // Return the PHYSICAL position for logic/collisions, but rendering uses visual...
    // Actually, getRenderData should return VISUAL props.
    return { x: state.x, y: state.y };
  }

  getRenderData(userId: string) {
    const state = this.states.get(userId);
    if (!state) return null;

    return {
      // RETURN VISUAL STATE FOR RENDERING
      position: { x: state.visualX, y: state.visualY },
      previousPosition: { x: state.previousX, y: state.previousY }, // Keep for history/trails if needed
      angle: state.visualAngle, // visual angle
      scaleX: state.stretchX,   // visual stretch
      scaleY: state.stretchY,   // visual stretch

      previousAngle: state.previousAngle,
      isMoving: state.isMoving,
      velocity: { x: state.velocityX, y: state.velocityY }, // Keep physics velocity for logic if needed
      trailHistory: state.trailHistory,
      isClicking: state.isClicking,
      correctionApplied: state.correctionApplied,
      healthStatus: state.healthStatus,
      activeTool: state.activeTool,
      isContexting: state.isContexting,
      isChatting: state.isChatting,
      isAfk: state.isAfk,

      trailConfig: {
        enabled: state.trailEnabled,
        animation: state.trailAnimation,
        color: state.trailColor,
        customImage: state.trailCustomImage,
        length: state.trailLength,
        thickness: state.trailThickness,
        size: state.trailSize,
      }
    };
  }

  removeCursor(userId: string): void {
    this.states.delete(userId);
  };

  clear(): void {
    this.states.clear();
  };

  setVisibility(userId: string, visible: boolean): void {
    const state = this.states.get(userId);
    if (state) state.isVisible = visible;
  };

  getCursorIds(): string[] {
    return Array.from(this.states.keys());
  }

  getDebugInfo() { return {}; }
}

let globalCursorEngine: CursorPhysicsEngine | null = null;
export const getCursorPhysicsEngine = (): CursorPhysicsEngine => {
  if (!globalCursorEngine) globalCursorEngine = new CursorPhysicsEngine();
  return globalCursorEngine;
};

export const createCursorUpdateFromPayload = (payload: any) => ({
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
    trailLength: payload.trailLength,
    trailThickness: payload.trailThickness,
    path: payload.path,
    isAfk: payload.isAfk,
  },
});
