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
    const obstacles = scene.obstacles.filter(o => !o.hidden);

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
    this.combinedVisionPath = this.buildCombinedPath();

    // Render fog overlay (darkness outside vision)
    this.renderFogOverlay(ctx, context);
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
    const { scene, mapWidth, mapHeight, zoom } = context;
    if (!scene || !this.combinedVisionPath) return;

    ctx.save();

    // Draw darkness over the entire map
    const ambientLevel = Math.max(0, Math.min(1, scene.ambientLight ?? 1.0));
    const darknessAlpha = 1.0 - ambientLevel;

    // If fully lit (daylight), darkness is invisible, so we don't need to render black overlay
    // UNLESS we want to support "Fog of War" (explored/unexplored) separate from lighting?
    // Legacy behavior in drawLightingLayer suggests simple ambient darkness.
    // If darknessAlpha is 0, we fillRect with 0 alpha.

    ctx.fillStyle = `rgba(0, 0, 0, ${darknessAlpha})`;
    ctx.fillRect(0, 0, mapWidth, mapHeight);

    // Combine with GM-revealed fog if present
    let revealPath = this.combinedVisionPath;

    if (scene.fogPath) {
      const fogPath = new Path2D(scene.fogPath);
      const combined = new Path2D();
      combined.addPath(this.combinedVisionPath);
      combined.addPath(fogPath);
      revealPath = combined;
    }

    // Cut out the visible area
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fill(revealPath);

    // Add soft edge to vision (optional)
    ctx.globalCompositeOperation = 'source-over';

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
