/**
 * VTT Engine - Vision Layer
 *
 * Calculates and renders player visibility polygons using raycasting.
 * Clips the visible area for players based on token vision and obstacles.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { Token, Point, Obstacle } from '../../../../../types';
import { calculateVisibilityPolygon, isPointInPolygon } from '../../../../../utils/geometry';
import { DebugLogger } from '../../../../../utils/DebugLogger';

/**
 * VisionLayer - Handles player visibility and fog of war.
 *
 * Features:
 * - Raycasts visibility polygons for controlled tokens
 * - Clips view to visible area for players
 * - Respects GM-revealed fog areas
 * - Caches visibility polygons per token
 * - Dynamic based on token movement
 */
export class VisionLayer extends BaseLayer {
  // Cache for calculated vision polygons
  private visionPolygons: Map<string, Point[]> = new Map();
  private combinedVisionPath: Path2D | null = null;
  private lastObstacleHash: string = '';

  // Offscreen canvas for fog composition
  private fogCanvas: HTMLCanvasElement | null = null;
  private fogCtx: CanvasRenderingContext2D | null = null;

  constructor() {
    super('vision', 'Vision', {
      useCache: false, // Complex clipping, handled manually
      description: 'Player visibility raycasting',
    });
  }

  computeStateHash(context: RenderContext): string {
    return 'dynamic'; // Vision is always dynamic due to token positions
  }

  /**
   * Ensure offscreen canvas exists and is sized correctly.
   */
  private ensureFogCanvas(width: number, height: number): void {
    if (!this.fogCanvas) {
      this.fogCanvas = document.createElement('canvas');
      this.fogCtx = this.fogCanvas.getContext('2d');
    }

    if (this.fogCanvas.width !== width || this.fogCanvas.height !== height) {
      this.fogCanvas.width = width;
      this.fogCanvas.height = height;
    }
  }

  /**
   * Get the combined vision path for use by other layers (e.g., LightingLayer).
   */
  getCombinedVisionPath(): Path2D | null {
    return this.combinedVisionPath;
  }

  /**
   * Get all calculated vision polygons.
   */
  getVisionPolygons(): Point[][] {
    return Array.from(this.visionPolygons.values());
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { scene, isGM, gmViewMode, tokens, visionTokens, currentUser } = context;
    if (!scene) return;

    const effectiveIsGM = isGM && gmViewMode === 'gm';

    // GM sees everything - no vision clipping
    if (effectiveIsGM) {
      this.visionPolygons.clear();
      this.combinedVisionPath = null;
      return;
    }

    const gridSize = scene.grid.size;
    const obstacles = scene.obstacles;

    // Calculate obstacle hash for cache invalidation
    const obstacleHash = this.hashObstacles(obstacles);
    const obstaclesChanged = obstacleHash !== this.lastObstacleHash;
    this.lastObstacleHash = obstacleHash;

    // Determine which tokens provide vision
    const visibleTokens = visionTokens.length > 0
      ? visionTokens
      : this.getPlayerVisionTokens(tokens, currentUser?.id);

    // If no vision tokens, we still might see GM-revealed areas (fogPath)
    if (visibleTokens.length === 0) {
      if (scene.fogPath) {
        // We have GM revealed areas, so we shouldn't just render pitch black.
        // We need to render the "fog overlay" with an empty vision path.
        this.combinedVisionPath = new Path2D(); // Empty vision
        this.renderFogOverlay(ctx, context);
        return;
      }

      // No vision tokens AND no revealed fog -> Render complete darkness
      this.renderDarkness(ctx, context);
      return;
    }

    // Calculate vision polygons for each token
    this.visionPolygons.clear();

    // Use Legacy Unit Scale Calculation
    const unitsPerSquare = scene.grid.unitsPerSquare || 1.5;
    const unitScale = gridSize / unitsPerSquare;

    for (const token of visibleTokens) {
      const cx = (token.x + token.size / 2) * gridSize;
      const cy = (token.y + token.size / 2) * gridSize;

      // Legacy Calculation: Default to 0, use unitScale, ensure min radius
      const visionRangePx = (token.visionRange || 0) * unitScale;
      const darkvisionRangePx = (token.darkvisionRange || 0) * unitScale;

      // Ensure specific minimum radius so tokens always see their own space (gridSize * 0.6)
      // This prevents "self-occlusion" where a token is blocked by the wall they are standing next to
      const effectiveRadius = Math.max(gridSize * 0.6, Math.max(visionRangePx, darkvisionRangePx));

      if (effectiveRadius <= 0) continue;

      // Validar obstáculos antes do cálculo para evitar "visão infinita"
      if (!obstacles || obstacles.length === 0) continue;

      const polygon = calculateVisibilityPolygon(
        { x: cx, y: cy },
        obstacles,
        effectiveRadius
      );

      if (polygon.length > 0) {
        this.visionPolygons.set(token.id, polygon);
      }
    }

    // Share vision polygons with downstream layers (TokenLayer)
    context.visionPolygons = Array.from(this.visionPolygons.values());

    // Build combined vision path
    const startComposite = performance.now();
    this.combinedVisionPath = this.buildCombinedPath();

    // Render fog overlay (darkness outside vision)
    this.renderFogOverlay(ctx, context);

    // DEBUG: Render Performance
    if (Math.random() < 0.005) {
      const duration = performance.now() - startComposite;
      DebugLogger.log('vision', 'VisionLayer', 'Render', `Composited ${visibleTokens.length} tokens in ${duration.toFixed(2)}ms`, {
        polygons: this.visionPolygons.size,
        isGM: context.isGM,
        gmView: context.gmViewMode
      });
    }
  }

  /**
   * Get tokens that provide vision for the current user.
   */
  private getPlayerVisionTokens(tokens: Token[], userId?: string | null): Token[] {
    if (!userId) return [];

    return tokens.filter(t => {
      if (!t.isVisibleToPlayers) return false;
      if (t.ownerId === userId) return true;
      if (t.controlledBy?.includes(userId)) return true;
      return false;
    });
  }

  /**
   * Build a combined Path2D from all vision polygons.
   */
  private buildCombinedPath(): Path2D | null {
    const polygons = Array.from(this.visionPolygons.values());
    if (polygons.length === 0) return null;

    const path = new Path2D();

    for (const poly of polygons) {
      if (poly.length > 0) {
        path.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          path.lineTo(poly[i].x, poly[i].y);
        }
        path.closePath();
      }
    }

    return path;
  }

  /**
   * Render complete darkness (when no vision tokens).
   */
  private renderDarkness(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { mapWidth, mapHeight, scene } = context;
    // Respect ambient light (default to 1.0 = daylight if undefined)
    const ambientLevel = Math.max(0, Math.min(1, scene?.ambientLight ?? 1.0));
    const darknessAlpha = 1.0 - ambientLevel;

    ctx.fillStyle = `rgba(0, 0, 0, ${darknessAlpha})`;
    ctx.fillRect(0, 0, mapWidth, mapHeight);
  };

  /**
   * Render the fog overlay (darkness outside combined vision).
   */
  private renderFogOverlay(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { scene, mapWidth, mapHeight, zoom, viewport } = context;
    if (!scene || !this.combinedVisionPath) return;

    // Ensure offscreen canvas
    this.ensureFogCanvas(context.canvas.width, context.canvas.height);
    if (!this.fogCtx || !this.fogCanvas) return;

    const fogCtx = this.fogCtx;
    const effectiveViewport = context.viewportRef?.current || viewport;

    // Clear offscreen canvas
    fogCtx.setTransform(1, 0, 0, 1, 0, 0);
    fogCtx.clearRect(0, 0, fogCtx.canvas.width, fogCtx.canvas.height);

    // Apply viewport transform to offscreen canvas
    fogCtx.translate(effectiveViewport.x, effectiveViewport.y);
    fogCtx.scale(effectiveViewport.zoom, effectiveViewport.zoom);

    // 1. Fill entire map with darkness (Opaque to block vision)
    // VisionLayer handles "Visibility" (seeing things), not "Lighting" (brightness).
    // Therefore, areas outside the vision polygons must be completely hidden (opaque black).
    // LightingLayer adds the ambient darkness on top of the *visible* areas.
    fogCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    fogCtx.fillRect(0, 0, mapWidth, mapHeight);

    // 2. Cut out the vision area
    let revealPath = this.combinedVisionPath;

    if (scene.fogPath) {
      const fogPath = new Path2D(scene.fogPath);
      const combined = new Path2D();
      combined.addPath(this.combinedVisionPath);
      combined.addPath(fogPath);
      revealPath = combined;
    }

    fogCtx.globalCompositeOperation = 'destination-out';
    fogCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    fogCtx.fill(revealPath);
    fogCtx.globalCompositeOperation = 'source-over';

    // 3. Draw the composite fog layer onto the main canvas
    ctx.save();
    ctx.resetTransform();
    ctx.drawImage(this.fogCanvas, 0, 0);
    ctx.restore();
  }

  /**
   * Hash obstacles for cache invalidation.
   */
  private hashObstacles(obstacles: Obstacle[]): string {
    if (obstacles.length === 0) return 'empty';

    // Simple hash based on count and first/last obstacle IDs
    const ids = obstacles.map(o => o.id).slice(0, 5).join(',');
    return `${obstacles.length}-${ids}`;
  }

  /**
   * Check if a point is visible from any controlled token.
   */
  isPointVisible(point: Point): boolean {
    for (const polygon of this.visionPolygons.values()) {
      if (isPointInPolygon(point, polygon)) {
        return true;
      }
    }
    return false;
  }
}
