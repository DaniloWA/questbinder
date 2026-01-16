/**
 * VTT Engine - Cursor Layer
 *
 * Renders remote player cursors, trails, click animations, pings, and explosions.
 * Fully dynamic layer - never cached.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { CursorMovePayload } from '../../../../../types/socket';

/**
 * CursorLayer - Renders multiplayer cursor visualization.
 *
 * Features:
 * - Remote player cursors with shape rendering
 * - Cursor trails with various animations
 * - Click ripple animations
 * - Ping animations (radar, beacon, etc.)
 * - Cursor collision explosions
 * - AFK/Ghost mode visualization
 */
export class CursorLayer extends BaseLayer {
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
    const { remoteCursors, currentUser, zoom, pings, clickAnimations, time } = context;

    ctx.save();

    // Render pings first (under cursors)
    this.renderPings(ctx, pings, context.scene?.grid.size || 70, zoom, time);

    // Render click animations
    this.renderClickAnimations(ctx, clickAnimations, zoom, time);

    // Render remote cursors
    for (const cursor of Object.values(remoteCursors)) {
      // Skip local user cursor
      if (cursor.userId === currentUser?.id) continue;

      this.renderRemoteCursor(ctx, cursor, zoom);
    }

    ctx.restore();
  }

  // =========================================================================
  // REMOTE CURSOR RENDERING
  // =========================================================================

  private renderRemoteCursor(ctx: CanvasRenderingContext2D, cursor: CursorMovePayload, zoom: number): void {
    const { x, y, userName, userColor, userShape, isAfk, isDragging } = cursor;

    // Skip if dragging (TokenLayer handles that)
    if (isDragging) return;

    ctx.save();
    ctx.translate(x, y);

    // Ghost mode for AFK
    const effectiveColor = isAfk ? '#9ca3af' : (userColor || '#fbbf24');
    const effectiveOpacity = isAfk ? 0.5 : 1.0;

    ctx.globalAlpha = effectiveOpacity;
    if (isAfk) {
      ctx.filter = 'blur(2px)';
    }

    // Render cursor shape
    this.renderCursorShape(ctx, userShape || 'default', effectiveColor, zoom);

    // Render name label
    this.renderCursorLabel(ctx, userName || '?', effectiveColor, zoom);

    ctx.restore();
  }

  private renderCursorShape(ctx: CanvasRenderingContext2D, shape: string, color: string, zoom: number): void {
    const size = 16 / zoom;

    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2 / zoom;

    switch (shape) {
      case 'arrow':
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(size * 0.3, size * 0.7);
        ctx.lineTo(size * 0.5, size * 1.2);
        ctx.lineTo(size * 0.7, size * 1.1);
        ctx.lineTo(size * 0.5, size * 0.6);
        ctx.lineTo(size, size * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'crosshair':
        const crossSize = size * 0.8;
        ctx.beginPath();
        ctx.moveTo(-crossSize, 0);
        ctx.lineTo(crossSize, 0);
        ctx.moveTo(0, -crossSize);
        ctx.lineTo(0, crossSize);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 / zoom;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, crossSize * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.6);
        ctx.lineTo(size * 0.4, 0);
        ctx.lineTo(0, size * 0.6);
        ctx.lineTo(-size * 0.4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      default: // 'default' pointer
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(size * 0.35, size * 0.75);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }
  }

  private renderCursorLabel(ctx: CanvasRenderingContext2D, name: string, color: string, zoom: number): void {
    const fontSize = 12 / zoom;
    const offsetY = 24 / zoom;
    const padding = 4 / zoom;

    ctx.font = `bold ${fontSize}px sans-serif`;
    const metrics = ctx.measureText(name);

    // Background
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(
      -metrics.width / 2 - padding,
      offsetY - padding,
      metrics.width + padding * 2,
      fontSize + padding * 2,
      4 / zoom
    );
    ctx.fill();

    // Text
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(name, 0, offsetY);
  }

  // =========================================================================
  // PING ANIMATIONS
  // =========================================================================

  private renderPings(ctx: CanvasRenderingContext2D, pings: any[], gridSize: number, zoom: number, time: number): void {
    const PING_DURATION = 2000;

    for (const ping of pings) {
      const elapsed = time - ping.createdAt;
      if (elapsed >= PING_DURATION) continue;

      const progress = elapsed / PING_DURATION;
      const alpha = 1 - progress;

      ctx.save();
      ctx.translate(ping.x * gridSize, ping.y * gridSize);
      ctx.globalAlpha = alpha;

      // Render based on animation style
      const style = ping.animationStyle || 'radar';
      this.renderPingStyle(ctx, style, ping.color, progress, zoom);

      ctx.restore();
    }
  }

  private renderPingStyle(ctx: CanvasRenderingContext2D, style: string, color: string, progress: number, zoom: number): void {
    const baseRadius = 30 / zoom;

    switch (style) {
      case 'beacon':
        const beaconRadius = baseRadius * (0.5 + progress * 1.5);
        ctx.beginPath();
        ctx.arc(0, 0, beaconRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = (1 - progress) * 0.3;
        ctx.fill();
        break;

      case 'target':
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 / zoom;
        // Outer circle
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * (1 + progress * 0.5), 0, Math.PI * 2);
        ctx.stroke();
        // Crosshair
        const size = baseRadius * 0.5;
        ctx.beginPath();
        ctx.moveTo(-size, 0);
        ctx.lineTo(size, 0);
        ctx.moveTo(0, -size);
        ctx.lineTo(0, size);
        ctx.stroke();
        break;

      default: // 'radar'
        for (let i = 0; i < 3; i++) {
          const ringProgress = (progress + i * 0.3) % 1;
          const ringRadius = baseRadius * (0.3 + ringProgress * 1.5);
          const ringAlpha = (1 - ringProgress) * 0.6;

          ctx.beginPath();
          ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 3 / zoom;
          ctx.globalAlpha = ringAlpha;
          ctx.stroke();
        }
        break;
    }
  }

  // =========================================================================
  // CLICK ANIMATIONS
  // =========================================================================

  private renderClickAnimations(
    ctx: CanvasRenderingContext2D,
    animations: { x: number; y: number; color: string; style?: string; startTime: number; }[],
    zoom: number,
    time: number
  ): void {
    const CLICK_DURATION = 500;

    for (const anim of animations) {
      const elapsed = time - anim.startTime;
      if (elapsed >= CLICK_DURATION) continue;

      const progress = elapsed / CLICK_DURATION;

      ctx.save();
      ctx.translate(anim.x, anim.y);

      this.renderClickStyle(ctx, anim.style || 'ripple', anim.color, progress, zoom);

      ctx.restore();
    }
  }

  private renderClickStyle(ctx: CanvasRenderingContext2D, style: string, color: string, progress: number, zoom: number): void {
    const baseSize = 20 / zoom;
    const alpha = 1 - progress;

    ctx.globalAlpha = alpha;

    switch (style) {
      case 'burst':
        const particles = 8;
        const expandRadius = baseSize * (1 + progress * 2);
        for (let i = 0; i < particles; i++) {
          const angle = (Math.PI * 2 / particles) * i;
          const x = Math.cos(angle) * expandRadius;
          const y = Math.sin(angle) * expandRadius;
          ctx.beginPath();
          ctx.arc(x, y, 3 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
        break;

      case 'sparkle':
        ctx.fillStyle = color;
        const sparkleSize = baseSize * (1 - progress * 0.5);
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI / 2) * i + progress * Math.PI;
          const dist = baseSize * progress * 1.5;
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, sparkleSize * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      default: // 'ripple'
        const rippleRadius = baseSize * (1 + progress * 2);
        ctx.beginPath();
        ctx.arc(0, 0, rippleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = (3 / zoom) * (1 - progress);
        ctx.stroke();
        break;
    }
  }
}
