/**
 * VTT Engine - Cursor Layer
 *
 * Renders remote player cursors, trails, click animations, pings, and explosions.
 * REUSES existing renderers from hooks/renderers for 100% feature parity.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { CursorMovePayload } from '../../../../../types/socket';
import {
  CursorPhysicsEngine,
  createCursorUpdateFromPayload,
  CursorState as CursorPhysicsState
} from '../../../../../utils/cursorPhysicsEngine';

// Import existing renderers for full feature parity
import {
  renderCursor,
  renderPingAnimations,
  renderClickAnimations,
  renderExplosions,
  renderCursorOverlays,
  ClickAnimation,
  renderRemoteViewports,
} from '../../hooks/renderers';
import {
  renderTrail,
  TrailPoint,
  TrailConfig,
  addTrailPoint,
  cleanupTrailHistory,
  HealthStatus,
} from '../../../../../utils/trailRenderer';

/**
 * CursorLayer - Renders multiplayer cursor visualization with physics.
 *
 * Uses existing renderers for 100% feature parity:
 * - renderCursor() for cursor shapes
 * - renderPingAnimations() for pings
 * - renderClickAnimations() for click effects
 * - renderCursorTrails() for trails
 * - renderExplosions() for collision effects
 * - renderRemoteViewports() for viewport indicators
 */
export class CursorLayer extends BaseLayer {
  // Physics Engine instance for REMOTE cursors
  private physicsEngine: CursorPhysicsEngine;

  // Local cursor logic (simple, instant)
  private localCursorState: CursorPhysicsState | null = null;

  // Explosion effects state
  private explosions: { x: number; y: number; time: number; colors: string[]; }[] = [];

  // Constants for local trail only
  private readonly MAX_TRAIL_POINTS = 40;

  // Track last processed timestamp per user to avoid duplicate updates
  private processedTimestamps: Map<string, number> = new Map();

  constructor() {
    super('cursors', 'Cursors', {
      useCache: false,
      description: 'Remote cursors, trails, and animations',
    });
    // Initialize legacy physics engine for remote cursors
    this.physicsEngine = new CursorPhysicsEngine();
  }

  computeStateHash(): string {
    return 'dynamic';
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const {
      currentUser,
      zoom,
      pings,
      clickAnimations,
      time,
      cursorSettings,
      scene,
      isGM,
      gmViewMode,
      remoteViewports,
      players,
      deltaMs
    } = context;

    // PERFORMANCE: Use Ref if available for 60fps updates without React rerenders
    const remoteCursors = context.remoteCursorsRef?.current || context.remoteCursors || {};

    if (!scene) return;

    const gridSize = scene.grid.size;

    ctx.save();

    // 2. Pings (Use existing renderer)
    if (pings && pings.length > 0) {
      renderPingAnimations(ctx, pings, gridSize, zoom);
    }

    // 3. Click Animations (Use existing renderer)
    if (clickAnimations && clickAnimations.length > 0) {
      renderClickAnimations(ctx, clickAnimations as ClickAnimation[], zoom);
    }

    // 4. Explosions (Use existing renderer)
    if (this.explosions.length > 0) {
      renderExplosions(ctx, this.explosions, zoom);
      // Cleanup old explosions
      const now = Date.now();
      this.explosions = this.explosions.filter(e => now - e.time < 500);
    }

    // 5. Remote Cursors with Physics
    // We use the legacy CursorPhysicsEngine to ensure identical fluidity

    // Process each remote cursor
    for (const [userId, cursor] of Object.entries(remoteCursors)) {
      if (userId === currentUser?.id) continue;

      // Feed update to engine
      // We must deduplicate updates because this loop runs at ~60fps but socket updates happen rarely.
      // If we feed identical updates, the engine queues duplicate segments causing massive lag/jitter.
      const lastTs = this.processedTimestamps.get(userId) || 0;

      // Only process if we have a newer timestamp (standard case)
      // OR if we have NO timestamp but the values changed (fallback)
      if (cursor.timestamp && cursor.timestamp > lastTs) {
        const updateWrapper = createCursorUpdateFromPayload({ ...cursor, userId });
        this.physicsEngine.processServerUpdate(userId, updateWrapper.update);
        this.processedTimestamps.set(userId, cursor.timestamp);

        // Ensure status like 'pressing' is synced if it came with the update
        this.physicsEngine.updateStatus(userId, { isClicking: cursor.isClicking, isAfk: cursor.isAfk });
      } else {
        // Even if no new move packet (due to throttle or dedup),
        // we must sync 'isClicking' because it might have been updated by 'cursor:pressing' event
        // which updates the ref but doesn't necessarily change the movement timestamp.
        this.physicsEngine.updateStatus(userId, { isClicking: cursor.isClicking, isAfk: cursor.isAfk });
      }

      // Hide cursor if user is making a drag (ruler handles visualization)
      const isRemoteDragging = context.remoteDrags && context.remoteDrags[userId];
      if (isRemoteDragging) continue;

      // Advance physics regardless of update
      this.physicsEngine.tick(userId, deltaMs);

      // Get render data (visual state)
      const renderData = this.physicsEngine.getRenderData(userId);
      if (!renderData) continue;

      // Render trail first
      if (renderData.trailConfig.enabled && cursorSettings?.showOthersTrails !== false) {
        const config: TrailConfig = {
          enabled: true,
          color: renderData.trailConfig.color || '#fbbf24',
          animation: (renderData.trailConfig.animation as any) || 'line',
          length: renderData.trailConfig.length || 20,
          thickness: renderData.trailConfig.thickness || 1,
          size: renderData.trailConfig.size || 4,
          customImage: renderData.trailConfig.customImage,
        };

        renderTrail(ctx, renderData.trailHistory, config, {
          zoom,
          currentPosition: renderData.position,
          healthStatus: renderData.healthStatus as HealthStatus,
        });
      }

      // Render cursor
      ctx.save();
      if (renderData.isAfk) {
        ctx.globalAlpha = 0.5; // Ghost effect for AFK
      }
      renderCursor(
        ctx,
        renderData.position.x,
        renderData.position.y,
        renderData.angle,
        cursor.userColor || '#fbbf24',
        cursor.userShape || 'default',
        cursor.userName || '',
        false, // isLocal
        renderData.scaleX,
        renderData.scaleY,
        zoom
      );
      ctx.restore();

      // Render overlays (AFK)
      if (renderData.isAfk) {
        renderCursorOverlays(
          ctx,
          {
            position: renderData.position,
            isAfk: renderData.isAfk,
          },
          zoom
        );
      }
    }

    // Cleanup stale cursors in physics engine
    const currentIds = Object.keys(remoteCursors);
    const engineIds = this.physicsEngine.getCursorIds();
    for (const id of engineIds) {
      if (!currentIds.includes(id) && id !== currentUser?.id) {
        this.physicsEngine.removeCursor(id);
      }
    }

    // 6. Local User Trail
    // Render local trail ONLY if enabled. Pointer is handled by CustomCursor (DOM) for zero latency.
    if (cursorSettings?.trailEnabled !== false && cursorSettings?.showMyTrail !== false && context.localCursorPos && !context.dragState?.isDragging) {
      if (!this.localCursorState) {
        this.localCursorState = this.createLocalPhysicsState({
          x: context.localCursorPos.x,
          y: context.localCursorPos.y,
        });
      }

      this.updateLocalPhysics(this.localCursorState, context.localCursorPos.x, context.localCursorPos.y, time);
      this.renderLocalTrail(ctx, this.localCursorState, cursorSettings, zoom);
    }

    ctx.restore();
  }

  // =========================================================================
  // LOCAL PHYSICS (Simple, Instant)
  // =========================================================================

  private createLocalPhysicsState(pos: { x: number, y: number; }): CursorPhysicsState {
    return {
      x: pos.x, y: pos.y, targetX: pos.x, targetY: pos.y,
      velocityX: 0, velocityY: 0,
      angle: 0, lastUpdateTime: Date.now(),
      trailHistory: [], lastTrailTime: 0,
      visualX: pos.x, visualY: pos.y, // Required by type
      previousX: pos.x, previousY: pos.y,
      targetAngle: 0, previousAngle: 0, angleVelocity: 0,
      visualAngle: 0, stretchX: 1, stretchY: 1,
      predictedX: pos.x, predictedY: pos.y, history: [],
      lastServerTime: 0, estimatedLatencyMs: 0, latencySamples: [],
      isMoving: false, isVisible: true, isClicking: false, correctionApplied: true,
      replayQueue: [], isReplaying: false, lastSenderTimestamp: 0, segmentTimeElapsed: 0, playbackRate: 1,
      isBridgingGap: false, lastBridgingTime: 0
    };
  }

  private updateLocalPhysics(state: CursorPhysicsState, x: number, y: number, time: number): void {
    const dx = x - state.x;
    const dy = y - state.y;
    // For local cursor, we set position directly (no lerp) to match mouse perfectly
    state.x = x;
    state.y = y;
    state.visualX = x; // Ensure visual matches physical
    state.visualY = y;

    // But we still calculate velocity for trail effects
    const dt = time - state.lastUpdateTime;
    let speed = 0;
    if (dt > 0) {
      speed = Math.sqrt(dx * dx + dy * dy);
    }

    // Add trail point
    const trailResult = addTrailPoint(
      state.trailHistory,
      state.x,
      state.y,
      speed,
      state.lastTrailTime,
      this.MAX_TRAIL_POINTS
    );
    state.trailHistory = trailResult.history;
    state.lastTrailTime = trailResult.lastTime;

    // Cleanup old trail points
    state.trailHistory = cleanupTrailHistory(state.trailHistory);
    state.lastUpdateTime = time;
  }

  private renderLocalTrail(
    ctx: CanvasRenderingContext2D,
    state: CursorPhysicsState,
    settings: any,
    zoom: number
  ): void {
    if (state.trailHistory.length === 0) return;

    const config: TrailConfig = {
      enabled: true,
      color: settings?.trailColor || settings?.color || '#fbbf24',
      animation: settings?.trailAnimation || 'line',
      length: settings?.trailLength || 20,
      thickness: settings?.trailThickness || 1,
      size: settings?.trailSize || 4,
      customImage: settings?.trailCustomImage,
    };

    renderTrail(ctx, state.trailHistory, config, {
      zoom,
      currentPosition: { x: state.x, y: state.y },
      healthStatus: 'healthy',
    });
  }

  // =========================================================================
  // EXPLOSION EFFECTS (Collision Detection)
  // =========================================================================

  /**
   * Add an explosion effect at the given position.
   * Called when cursors collide.
   */
  addExplosion(x: number, y: number, colors: string[]): void {
    this.explosions.push({
      x,
      y,
      time: Date.now(),
      colors,
    });
  }
}
