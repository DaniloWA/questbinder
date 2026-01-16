/**
 * VTT Engine - Cursor Layer
 *
 * Renders remote player cursors, trails, click animations, pings, and explosions.
 * REUSES existing renderers from hooks/renderers for 100% feature parity.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { CursorMovePayload } from '../../../../../types/socket';

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
 * Physics state for smooth cursor interpolation.
 */
interface CursorPhysicsState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  velocity: number;
  angle: number;
  scaleX: number;
  scaleY: number;
  lastUpdateTime: number;
  trailHistory: TrailPoint[];
  lastTrailTime: number;
}

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
  // Trail history for each remote cursor
  private cursorStates: Map<string, CursorPhysicsState> = new Map();

  // Local cursor state for trail only (pointer handled by DOM)
  private localCursorState: CursorPhysicsState | null = null;

  // Explosion effects state
  private explosions: { x: number; y: number; time: number; colors: string[]; }[] = [];

  // Interpolation constants
  private readonly LERP_SPEED = 0.2;
  private readonly MAX_TRAIL_POINTS = 40;
  private readonly STRETCH_FACTOR = 0.015;
  private readonly MAX_STRETCH = 0.3;
  private readonly MAX_SQUASH = 0.15;

  constructor() {
    super('cursors', 'Cursors', {
      useCache: false,
      description: 'Remote cursors, trails, and animations',
    });
  }

  computeStateHash(): string {
    return 'dynamic';
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const {
      // remoteCursors, // Removed to prefer Ref version below
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
    } = context;

    // PERFORMANCE: Use Ref if available for 60fps updates without React rerenders
    const remoteCursors = context.remoteCursorsRef?.current || context.remoteCursors || {};

    if (!scene) return;

    const gridSize = scene.grid.size;

    ctx.save();

    // 1. Remote Viewports (GM only, render under everything)
    if (isGM && gmViewMode === 'gm' && remoteViewports && Object.keys(remoteViewports).length > 0) {
      renderRemoteViewports(
        ctx,
        remoteViewports,
        remoteCursors,
        currentUser?.id,
        context.permissions,
        isGM,
        zoom,
        players
      );
    }

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
    // DEBUG: Log remote cursor data
    const remoteCursorCount = Object.keys(remoteCursors).length;
    console.log('[CursorLayer] Rendering', remoteCursorCount, 'remote cursors', Object.keys(remoteCursors));

    // 6. Local User Trail
    // Render local trail ONLY if enabled. Pointer is handled by CustomCursor (DOM) for zero latency.
    if (cursorSettings?.trailEnabled !== false && cursorSettings?.showMyTrail !== false && context.localCursorPos) {
      if (!this.localCursorState) {
        this.localCursorState = this.createPhysicsState({
          x: context.localCursorPos.x,
          y: context.localCursorPos.y,
          userId: currentUser?.id || 'local',
        } as any);
      }

      // Update local physics purely for trail generation (no lerp delay needed for local pos, but needed for velocity calc)
      this.updateLocalPhysics(this.localCursorState, context.localCursorPos.x, context.localCursorPos.y, time);

      // Render local trail
      this.renderLocalTrail(ctx, this.localCursorState, cursorSettings, zoom);
    }

    for (const cursor of Object.values(remoteCursors)) {
      // Skip local user cursor
      if (cursor.userId === currentUser?.id) continue;

      // Get or create physics state
      let state = this.cursorStates.get(cursor.userId);
      if (!state) {
        state = this.createPhysicsState(cursor);
        this.cursorStates.set(cursor.userId, state);
      }

      // Update physics (interpolate position)
      this.updatePhysics(state, cursor, time);

      // Render trail first (under cursor) using existing renderer
      if (cursorSettings?.showOthersTrails !== false && cursor.trailEnabled !== false) {
        this.renderRemoteTrail(ctx, cursor, state, zoom);
      }

      // Render cursor using existing renderer
      renderCursor(
        ctx,
        state.x,
        state.y,
        state.angle,
        cursor.userColor || '#fbbf24',
        cursor.userShape || 'default',
        cursor.userName || '',
        false, // isLocal
        state.scaleX,
        state.scaleY,
        zoom
      );

      // Render overlays (AFK indicator)
      if (cursor.isAfk) {
        renderCursorOverlays(
          ctx,
          {
            position: { x: state.x, y: state.y },
            isAfk: cursor.isAfk || false,
          },
          zoom
        );
      }
    }

    // Cleanup stale cursor states
    this.cleanupStaleStates(remoteCursors);

    ctx.restore();
  }

  // =========================================================================
  // PHYSICS INTERPOLATION
  // =========================================================================

  private createPhysicsState(cursor: CursorMovePayload): CursorPhysicsState {
    return {
      x: cursor.x,
      y: cursor.y,
      targetX: cursor.x,
      targetY: cursor.y,
      velocity: 0,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
      lastUpdateTime: Date.now(),
      trailHistory: [],
      lastTrailTime: 0,
    };
  }

  private updatePhysics(state: CursorPhysicsState, cursor: CursorMovePayload, time: number): void {
    // Update target position
    state.targetX = cursor.x;
    state.targetY = cursor.y;

    // Calculate delta
    const dx = state.targetX - state.x;
    const dy = state.targetY - state.y;

    // Lerp interpolation
    state.x += dx * this.LERP_SPEED;
    state.y += dy * this.LERP_SPEED;

    // Calculate velocity
    state.velocity = Math.sqrt(dx * dx + dy * dy);

    // Calculate angle for rotation
    if (state.velocity > 0.5) {
      state.angle = Math.atan2(dy, dx) + Math.PI / 2;
    }

    // Squash & Stretch
    state.scaleY = 1 + Math.min(state.velocity * this.STRETCH_FACTOR, this.MAX_STRETCH);
    state.scaleX = 1 - Math.min(state.velocity * this.STRETCH_FACTOR * 0.5, this.MAX_SQUASH);

    // Add trail point
    const trailResult = addTrailPoint(
      state.trailHistory,
      state.x,
      state.y,
      state.velocity,
      state.lastTrailTime,
      this.MAX_TRAIL_POINTS
    );
    state.trailHistory = trailResult.history;
    state.lastTrailTime = trailResult.lastTime;

    // Cleanup old trail points
    state.trailHistory = cleanupTrailHistory(state.trailHistory);

    state.lastUpdateTime = time;
  }

  private updateLocalPhysics(state: CursorPhysicsState, x: number, y: number, time: number): void {
    const dx = x - state.x;
    const dy = y - state.y;
    // For local cursor, we set position directly (no lerp) to match mouse perfectly
    state.x = x;
    state.y = y;

    // But we still calculate velocity for trail effects
    const dt = time - state.lastUpdateTime;
    if (dt > 0) {
      // Simple velocity estimate
      state.velocity = Math.sqrt(dx * dx + dy * dy);
    }

    // Add trail point
    const trailResult = addTrailPoint(
      state.trailHistory,
      state.x,
      state.y,
      state.velocity,
      state.lastTrailTime,
      this.MAX_TRAIL_POINTS
    );
    state.trailHistory = trailResult.history;
    state.lastTrailTime = trailResult.lastTime;

    // Cleanup old trail points
    state.trailHistory = cleanupTrailHistory(state.trailHistory);
    state.lastUpdateTime = time;
  }

  private cleanupStaleStates(remoteCursors: Record<string, CursorMovePayload>): void {
    for (const userId of this.cursorStates.keys()) {
      if (!remoteCursors[userId]) {
        this.cursorStates.delete(userId);
      }
    }
  }

  // =========================================================================
  // TRAIL RENDERING (Uses existing trailRenderer)
  // =========================================================================

  private renderRemoteTrail(
    ctx: CanvasRenderingContext2D,
    cursor: CursorMovePayload,
    state: CursorPhysicsState,
    zoom: number
  ): void {
    if (state.trailHistory.length === 0) return;

    const config: TrailConfig = {
      enabled: true,
      color: cursor.trailColor || cursor.userColor || '#fbbf24',
      animation: (cursor.trailAnimation as any) || 'line',
      length: cursor.trailLength || 20,
      thickness: cursor.trailThickness || 1,
      size: cursor.trailSize || 4,
      customImage: cursor.trailCustomImage,
    };

    renderTrail(ctx, state.trailHistory, config, {
      zoom,
      currentPosition: { x: state.x, y: state.y },
      healthStatus: cursor.healthStatus as HealthStatus,
    });
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
