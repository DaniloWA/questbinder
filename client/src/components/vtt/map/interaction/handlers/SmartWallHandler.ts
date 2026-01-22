/**
 * VTT Interaction Engine - Smart Wall Handler
 *
 * Uses image processing to detect and draw walls from map image.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import { getContourFromPoint } from '../../../../../utils/imageProcessing';
import { handleRightClickCancel } from '../utils/InteractionUtils';
import type { Point } from '../../../../../types';

/**
 * SmartWallHandler - Automatic wall detection from image.
 *
 * Priority: 600
 * Tools: smart-wall
 */
export class SmartWallHandler extends BaseHandler {
  constructor() {
    super({
      id: 'smart-wall',
      name: 'Smart Wall',
      priority: 600,
      tools: ['smart-wall'],
      description: 'Auto-detect walls from map image colors',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    return ctx.activeTool === 'smart-wall';
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    // Right-click: Exit tool (matches legacy behavior)
    if (ctx.button === 2) {
      return handleRightClickCancel(ctx, this.callbacks);
    }

    if (ctx.button !== 0) return this.notHandled();
    if (!ctx.isGM) return this.notHandled();

    // Get map image from cache
    const imageUrl = ctx.scene?.imageUrl;
    console.log('[SmartWall] 🔍 DEBUG START');
    console.log('[SmartWall] imageUrl:', imageUrl);
    console.log('[SmartWall] imageCache keys:', Object.keys(ctx.imageCache || {}));

    if (!imageUrl) {
      console.warn('[SmartWall] ❌ No imageUrl in scene!');
      return this.notHandled();
    }

    const img = ctx.imageCache[imageUrl];
    console.log('[SmartWall] img found:', !!img);
    console.log('[SmartWall] img.complete:', img?.complete);
    console.log('[SmartWall] img.width (CSS):', img?.width);
    console.log('[SmartWall] img.height (CSS):', img?.height);
    console.log('[SmartWall] img.naturalWidth:', img?.naturalWidth);
    console.log('[SmartWall] img.naturalHeight:', img?.naturalHeight);

    if (!img || !img.complete) {
      console.warn('[SmartWall] ❌ Image not loaded or not complete!');
      return this.notHandled();
    }

    // Get wand settings
    const tolerance = ctx.wandSettings?.tolerance ?? 30;
    const resolution = ctx.wandSettings?.resolution ?? 512;
    const simplification = ctx.wandSettings?.simplification ?? 2.0;
    console.log('[SmartWall] wandSettings:', { tolerance, resolution, simplification });

    // Get image dimensions
    const grid = ctx.scene?.grid;
    if (!grid) return this.notHandled();

    const mapWidth = grid.size * grid.cols;
    console.log('[SmartWall] grid:', { size: grid.size, cols: grid.cols, rows: grid.rows });
    console.log('[SmartWall] mapWidth:', mapWidth);

    // IMPORTANT: Map is rendered with uniform scale (aspect ratio preserved)
    // The image is scaled to fit mapWidth, so we use the same scale for both X and Y
    const scale = img.naturalWidth / mapWidth;
    console.log('[SmartWall] Uniform scale:', scale);
    console.log('[SmartWall] Image dimensions: ', img.naturalWidth, 'x', img.naturalHeight);
    console.log('[SmartWall] Effective map height in world coords:', img.naturalHeight / scale);

    console.log('[SmartWall] worldPos:', ctx.worldPos);
    const imgX = Math.floor(ctx.worldPos.x * scale);
    const imgY = Math.floor(ctx.worldPos.y * scale);
    console.log('[SmartWall] imgX:', imgX, 'imgY:', imgY);
    console.log('[SmartWall] 📍 Calling getContourFromPoint...');

    // Detect contour using marching squares
    try {
      const contour = getContourFromPoint(
        img,
        imgX,
        imgY,
        tolerance,
        resolution,
        simplification
      );

      if (contour && contour.length >= 3) {
        // Convert back to world coordinates using same uniform scale
        const worldContour: Point[] = contour.map(p => ({
          x: p.x / scale,
          y: p.y / scale,
        }));

        // Add as wall obstacle
        this.callbacks?.addObstacles([{
          type: 'wall',
          points: worldContour,
          blocksVision: true,
          blocksMovement: true,
          open: false,  // Closed polygon - matches legacy
        }]);

        return this.handled({ cursor: 'crosshair' });
      }
    } catch (error) {
      console.error('[SmartWallHandler] Error detecting contour:', error);
    }

    return this.notHandled();
  }
}
