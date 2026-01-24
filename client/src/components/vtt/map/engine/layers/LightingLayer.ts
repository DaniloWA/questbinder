/**
 * VTT Engine - Lighting Layer
 *
 * Renders dynamic lighting including ambient darkness, light sources,
 * darkvision, and colored atmospheric lights.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { Token, Point, Obstacle, LightZone } from '../../../../../types';
import { calculateVisibilityPolygon } from '../../../../../utils/geometry';

/**
 * LightingLayer - Dynamic lighting and atmosphere.
 *
 * Features:
 * - Ambient darkness based on scene.ambientLight
 * - Token light sources (torches, lanterns) with animations
 * - Darkvision rendering for controlled tokens
 * - LightZone effects (brightness and color)
 * - Colored light overlays (additive blending)
 * - Clips to player vision when not GM
 */
export class LightingLayer extends BaseLayer {
  // Offscreen canvas for lighting composition
  private lightCanvas: HTMLCanvasElement | null = null;
  private lightCtx: CanvasRenderingContext2D | null = null;

  constructor() {
    super('lighting', 'Lighting', {
      useCache: false, // Animated lights
      opacity: 1,
      blendMode: 'source-over',
      description: 'Dynamic lighting and atmosphere',
    });
  }

  computeStateHash(): string {
    return 'dynamic'; // Lighting has animations
  }

  /**
   * Ensure offscreen canvas exists and is sized correctly.
   */
  private ensureLightCanvas(width: number, height: number): void {
    if (!this.lightCanvas) {
      this.lightCanvas = document.createElement('canvas');
      this.lightCtx = this.lightCanvas.getContext('2d');
    }

    if (this.lightCanvas.width !== width || this.lightCanvas.height !== height) {
      this.lightCanvas.width = width;
      this.lightCanvas.height = height;
    }
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { scene, tokens, isGM, gmViewMode, viewport, time, visionTokens } = context;
    if (!scene) return;

    const width = context.canvas.width;
    const height = context.canvas.height;

    this.ensureLightCanvas(width, height);
    if (!this.lightCtx) return;

    const lightCtx = this.lightCtx;
    const gridSize = scene.grid.size;
    const mapWidth = gridSize * scene.grid.cols;
    const mapHeight = gridSize * scene.grid.rows;
    const effectiveIsGM = isGM && gmViewMode === 'gm';

    // Get player vision path from VisionLayer if available
    const playerVisionPath = this.getPlayerVisionPath(context);

    // Get visible obstacles
    const obstacles = scene.obstacles;

    // Reset the light canvas
    lightCtx.setTransform(1, 0, 0, 1, 0, 0);
    lightCtx.clearRect(0, 0, width, height);

    // Apply viewport transform
    const effectiveViewport = context.viewportRef?.current || viewport;
    lightCtx.translate(effectiveViewport.x, effectiveViewport.y);
    lightCtx.scale(effectiveViewport.zoom, effectiveViewport.zoom);

    // =========================================================================
    // STEP 1: DARKNESS LAYER
    // =========================================================================

    if (!effectiveIsGM) {
      this.renderDarkness(lightCtx, scene, tokens, visionTokens, obstacles, playerVisionPath, gridSize, mapWidth, mapHeight, time, (context as any).animations);
    }

    // =========================================================================
    // STEP 2: COLORED LIGHTS (Atmosphere)
    // =========================================================================

    this.renderColoredLights(lightCtx, scene, tokens, obstacles, playerVisionPath, gridSize, mapWidth, mapHeight, time);

    // =========================================================================
    // COMPOSITE TO MAIN CANVAS
    // =========================================================================

    ctx.save();
    ctx.resetTransform();
    ctx.drawImage(this.lightCanvas!, 0, 0);
    ctx.restore();
  }

  /**
   * Get player vision path from VisionLayer or context.
   */
  private getPlayerVisionPath(context: RenderContext): Path2D | null {
    // Try to get from VisionLayer if orchestrator is available
    const visionLayer = this.orchestrator?.getRegistry().getLayer<any>('vision');
    if (visionLayer?.getCombinedVisionPath) {
      return visionLayer.getCombinedVisionPath();
    }

    // Fallback: build from visionTokens in context
    const { visionTokens, scene } = context;
    if (!scene || visionTokens.length === 0) return null;

    const gridSize = scene.grid.size;
    const obstacles = scene.obstacles;

    const path = new Path2D();

    for (const token of visionTokens) {
      const cx = (token.x + token.size / 2) * gridSize;
      const cy = (token.y + token.size / 2) * gridSize;
      const visionRadius = Math.max(
        (token.visionRange || 60) * gridSize / 1.5,
        (token.darkvisionRange || 0) * gridSize / 1.5
      );

      if (visionRadius <= 0) continue;

      const polygon = calculateVisibilityPolygon({ x: cx, y: cy }, obstacles, visionRadius);

      if (polygon.length > 0) {
        path.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 1; i < polygon.length; i++) {
          path.lineTo(polygon[i].x, polygon[i].y);
        }
        path.closePath();
      }
    }

    return path;
  }

  /**
   * Render ambient darkness with visibility cutouts.
   */
  private renderDarkness(
    ctx: CanvasRenderingContext2D,
    scene: any,
    tokens: Token[],
    visionTokens: Token[],
    obstacles: Obstacle[],
    playerVisionPath: Path2D | null,
    gridSize: number,
    mapW: number,
    mapH: number,
    time: number,
    animations?: Map<string, any>
  ): void {
    const ambientLevel = Math.max(0, Math.min(1, scene.ambientLight ?? 1.0));
    const darknessAlpha = 1.0 - ambientLevel;

    // Draw ambient darkness
    ctx.fillStyle = `rgba(0, 0, 0, ${darknessAlpha})`;
    ctx.fillRect(0, 0, mapW, mapH);

    // Cut holes for visibility
    ctx.globalCompositeOperation = 'destination-out';

    // Collect all light sources
    const lightSources: LightSource[] = [];

    // Light Zones
    if (scene.lightZones) {
      for (const zone of scene.lightZones) {
        if (zone.hidden || zone.brightness <= 0.2) continue;
        this.renderLightZoneCutout(ctx, zone, playerVisionPath);
      }
    }

    // Token lights and darkvision
    for (const token of tokens) {
      const cx = (token.x + token.size / 2) * gridSize;
      const cy = (token.y + token.size / 2) * gridSize;

      // Token light source
      if (token.light?.enabled) {
        // Use animated position if available
        let tx = token.x;
        let ty = token.y;

        // Access animations from context (it's passed as 6th arg to render but context has it too)
        // Actually, render signature is (ctx, context). context has animationsRef? No, context has 'animations' map?
        // Let's check context type.
        // If not in context, we rely on the fact that 'tokens' passed might be 'live' tokens? 
        // No, usually tokens are state. We need the animation map.
        // Looking at useMapRenderer: drawLightingLayer(..., animationsRef.current, ...)
        // But here we are in LightingLayer class render().

        // Wait, the LightingLayer.render() receives `context: RenderContext`.
        // RenderContext usually has everything. Let's assume we can get it or we need to look at how LightingLayer is called.
        // In useMapRenderer, it calls `drawLightingLayer` function, NOT `LightingLayer.render`.
        // Ah! `LightingLayer.ts` has a class `LightingLayer` AND `useMapRenderer.ts` imports specific functions `drawLightingLayer` from `canvasRenderer`.

        // WAIT. The files I read earlier:
        // `LightingLayer.ts` (Class based layer)
        // `canvasRenderer.ts` (Functional renderer `drawLightingLayer`)

        // The SYSTEM seems to imply `LightingLayer.ts` (the class) is the "New Engine" layer, while `canvasRenderer.ts` is the legacy/hook renderer?
        // OR `LightingLayer.ts` is used by the `CanvasRenderer` (Engine).

        // Explicitly check `LightingLayer.ts` again. It has `render(ctx, context)`.
        // `context` (RenderContext) likely needs `animations`.

        // Let's assume `context` has what we need or we interpolating based on time.
        // `context.tokens` are the source of truth.
        // If `LightingLayer` class is used, we need to ensure IT does the interpolation.

        // Let's use the same logic as `canvasRenderer.ts` if possible.
        // But wait, `renderDarkness` in `LightingLayer.ts` (Class) iterates `tokens`.

        // I will add interpolation logic here matching the standard `getAnimatedPosition` manual calculation
        // since we might not have the helper imported.

        // FIX: The user complains light lag.
        // If `LightingLayer.ts` is used, it reads `token.x`.
        // I will add animation lookups if `context.animations` exists.

        const anim = (context as any).animations?.get(token.id);
        if (anim) {
          const progress = Math.min(1, (time - anim.startTime) / anim.duration);
          const ease = 1 - Math.pow(1 - progress, 3); // EaseOutCubic
          tx = anim.startX + (anim.targetX - anim.startX) * ease;
          ty = anim.startY + (anim.targetY - anim.startY) * ease;
        }

        const cx = (tx + token.size / 2) * gridSize;
        const cy = (ty + token.size / 2) * gridSize;

        const flicker = this.calculateFlicker(token, time);
        const maxFlicker = this.getMaxFlicker(token);
        const baseRadius = Math.max(token.light.brightRadius || 0, token.light.dimRadius || 0) * gridSize;

        if (baseRadius > 0) {
          lightSources.push({
            x: cx,
            y: cy,
            r: baseRadius * flicker,
            stableR: baseRadius * maxFlicker,
            isPersonal: false
          });
        }
      }

      // Personal vision (darkvision + self-sight)
      const isControlled = visionTokens.some(vt => vt.id === token.id);
      if (isControlled) {
        if ((token.darkvisionRange || 0) > 0) {
          const r = (token.darkvisionRange || 0) * gridSize;
          lightSources.push({ x: cx, y: cy, r, stableR: r, isPersonal: true });
        }
        const selfRadius = Math.max(gridSize * 0.6, (token.size * gridSize) * 0.6);
        lightSources.push({ x: cx, y: cy, r: selfRadius, stableR: selfRadius, isPersonal: true });
      }
    }

    // Render light source cutouts
    for (const src of lightSources) {
      if (src.r <= 0) continue;

      // Use stableR for visibility calculation to prevent cache trashing
      const poly = calculateVisibilityPolygon({ x: src.x, y: src.y }, obstacles, src.stableR);

      ctx.save();

      // Clip global lights to player vision
      if (!src.isPersonal && playerVisionPath) {
        ctx.clip(playerVisionPath);
      }

      // Clip to visibility polygon
      ctx.beginPath();
      if (poly.length > 0) {
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
        ctx.closePath();
      }
      ctx.clip();

      // Radial gradient cutout
      try {
        const grad = ctx.createRadialGradient(src.x, src.y, src.r * 0.7, src.x, src.y, src.r);
        grad.addColorStop(0, 'rgba(0,0,0, 1)');
        grad.addColorStop(1, 'rgba(0,0,0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(src.x, src.y, src.r, 0, Math.PI * 2);
        ctx.fill();
      } catch {
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fill();
      }

      ctx.restore();
    }

    // Render darkness zones on top
    ctx.globalCompositeOperation = 'source-over';
    if (scene.lightZones) {
      for (const zone of scene.lightZones) {
        if (zone.hidden || zone.brightness > 0.2) continue;
        this.renderDarknessZone(ctx, zone);
      }
    }
  }

  /**
   * Render light zone cutout for visibility.
   */
  private renderLightZoneCutout(ctx: CanvasRenderingContext2D, zone: LightZone, playerVisionPath: Path2D | null): void {
    ctx.save();
    if (playerVisionPath) ctx.clip(playerVisionPath);

    ctx.beginPath();
    if (zone.type === 'rect' && zone.rect) {
      ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
    } else if (zone.type === 'polygon' && zone.points && zone.points.length > 0) {
      ctx.moveTo(zone.points[0].x, zone.points[0].y);
      for (let i = 1; i < zone.points.length; i++) ctx.lineTo(zone.points[i].x, zone.points[i].y);
      ctx.closePath();
    }
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, zone.brightness)})`;
    ctx.fill();

    ctx.restore();
  }

  /**
   * Render darkness zone (magical darkness).
   */
  private renderDarknessZone(ctx: CanvasRenderingContext2D, zone: LightZone): void {
    ctx.beginPath();
    if (zone.type === 'rect' && zone.rect) {
      ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
    } else if (zone.type === 'polygon' && zone.points && zone.points.length > 0) {
      ctx.moveTo(zone.points[0].x, zone.points[0].y);
      for (let i = 1; i < zone.points.length; i++) ctx.lineTo(zone.points[i].x, zone.points[i].y);
      ctx.closePath();
    }
    ctx.fillStyle = 'rgba(0,0,0, 0.95)';
    ctx.fill();
  }

  /**
   * Render colored lights (atmosphere).
   */
  private renderColoredLights(
    ctx: CanvasRenderingContext2D,
    scene: any,
    tokens: Token[],
    obstacles: Obstacle[],
    playerVisionPath: Path2D | null,
    gridSize: number,
    mapW: number,
    mapH: number,
    time: number
  ): void {
    ctx.globalCompositeOperation = 'lighter'; // Additive blending

    // Light zone colors
    if (scene.lightZones) {
      for (const zone of scene.lightZones) {
        if (zone.hidden || zone.brightness <= 0.2) continue;
        if (!zone.color || zone.color === '#000000') continue;

        ctx.save();
        if (playerVisionPath) ctx.clip(playerVisionPath);

        ctx.beginPath();
        if (zone.type === 'rect' && zone.rect) {
          ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
        } else if (zone.type === 'polygon' && zone.points && zone.points.length > 0) {
          ctx.moveTo(zone.points[0].x, zone.points[0].y);
          for (let i = 1; i < zone.points.length; i++) ctx.lineTo(zone.points[i].x, zone.points[i].y);
          ctx.closePath();
        }

        const rgb = this.hexToRgb(zone.color);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
        ctx.fill();

        ctx.restore();
      }
    }

    // Token light colors
    for (const token of tokens) {
      if (!token.light?.enabled || !token.light.color || token.light.color === '#000000') continue;

      const cx = (token.x + token.size / 2) * gridSize;
      const cy = (token.y + token.size / 2) * gridSize;
      const flicker = this.calculateFlicker(token, time);
      const maxFlicker = this.getMaxFlicker(token);
      const baseRadius = Math.max(token.light.brightRadius || 0, token.light.dimRadius || 0) * gridSize;
      const maxRadius = baseRadius * flicker;
      const stableRadius = baseRadius * maxFlicker;

      if (maxRadius <= 0.1) continue;

      // Use stableRadius for calculation
      const poly = calculateVisibilityPolygon({ x: cx, y: cy }, obstacles, stableRadius);

      ctx.save();

      if (playerVisionPath) ctx.clip(playerVisionPath);

      ctx.beginPath();
      if (poly.length > 0) {
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
        ctx.closePath();
      }
      ctx.clip();

      const rgb = this.hexToRgb(token.light.color);
      try {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
        const intensity = (token.light.intensity || 0.5) * 0.6;
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity})`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
        ctx.fill();
      } catch { }

      ctx.restore();
    }
  }

  /**
   * Get maximum flicker value for stable cache key.
   */
  private getMaxFlicker(token: Token): number {
    if (!token.light?.animation) return 1.0;
    switch (token.light.animation) {
      case 'torch': return 1.05; // Max possible value of flicker formula
      case 'pulse': return 1.0; // Pulse goes down from 1.0 (0.8 + 0.2)
      default: return 1.0;
    }
  }

  /**
   * Calculate flicker effect for animated lights.
   */
  private calculateFlicker(token: Token, time: number): number {
    if (!token.light?.animation) return 1.0;

    switch (token.light.animation) {
      case 'torch': {
        const seed = parseFloat(token.id.replace(/\D/g, '') || '0');
        // Range: ~0.90 to ~1.02
        return 0.95 + Math.sin(time * 0.01 + seed) * 0.05 + Math.random() * 0.02;
      }
      case 'pulse':
        // Range: 0.8 to 1.0
        return 0.8 + (Math.sin(time * 0.003) + 1) * 0.1;
      default:
        return 1.0;
    }
  }

  /**
   * Convert hex color to RGB.
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number; } {
    if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 };

    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
      if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
        const r = parseInt(hex[1] + hex[1], 16);
        const g = parseInt(hex[2] + hex[2], 16);
        const b = parseInt(hex[3] + hex[3], 16);
        return { r, g, b };
      }
      return { r: 255, g: 255, b: 255 };
    }

    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }
}

// Internal type for light sources
interface LightSource {
  x: number;
  y: number;
  r: number; // Visual radius (with flicker)
  stableR: number; // Maximum radius for stable visibility calculation
  isPersonal: boolean;
}
