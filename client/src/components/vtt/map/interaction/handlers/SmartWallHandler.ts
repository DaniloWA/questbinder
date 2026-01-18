/**
 * VTT Interaction Engine - Smart Wall Handler
 *
 * Uses image processing to detect and draw walls from map image.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import { getContourFromPoint } from '../../../../../utils/imageProcessing';
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
    if (ctx.button !== 0) return this.notHandled();
    if (!ctx.isGM) return this.notHandled();

    // Get map image from cache
    const imageUrl = ctx.scene?.imageUrl;
    if (!imageUrl) return this.notHandled();

    const img = ctx.imageCache[imageUrl];
    if (!img || !img.complete) return this.notHandled();

    // Get wand settings
    const tolerance = ctx.wandSettings?.tolerance ?? 30;
    const resolution = ctx.wandSettings?.resolution ?? 512;
    const simplification = ctx.wandSettings?.simplification ?? 2.0;

    // Get image dimensions - use grid cols/rows if available, else use image dimensions as-is
    const grid = ctx.scene?.grid;
    const mapWidth = grid ? grid.cols * grid.size : img.naturalWidth;
    const mapHeight = grid ? grid.rows * grid.size : img.naturalHeight;
    const scaleX = img.naturalWidth / mapWidth;
    const scaleY = img.naturalHeight / mapHeight;

    const imgX = Math.floor(ctx.worldPos.x * scaleX);
    const imgY = Math.floor(ctx.worldPos.y * scaleY);

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
        // Convert back to world coordinates
        const worldContour: Point[] = contour.map(p => ({
          x: p.x / scaleX,
          y: p.y / scaleY,
        }));

        // Add as wall obstacle
        this.callbacks?.addObstacles([{
          type: 'wall',
          points: worldContour,
          blocksVision: true,
          blocksMovement: true,
        }]);

        return this.handled({ cursor: 'crosshair' });
      }
    } catch (error) {
      console.error('[SmartWallHandler] Error detecting contour:', error);
    }

    return this.notHandled();
  }
}
