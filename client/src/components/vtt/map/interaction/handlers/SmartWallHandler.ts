/**
 * VTT Interaction Engine - Smart Wall Handler
 *
 * Uses image processing to detect and draw walls from map image.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext } from '../core/types';
import { processImageInWorker } from '../../../../../utils/image-processing/workerBridge';
import { handleRightClickCancel } from '../utils/InteractionUtils';
import type { Point } from '../../../../../types';
import { DebugLogger } from '../../../../../utils/DebugLogger';

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
    DebugLogger.log('vision', 'SmartWall', 'Debug', 'Starting detection');
    DebugLogger.log('vision', 'SmartWall', 'Image', `URL: ${imageUrl}`);
    DebugLogger.log('vision', 'SmartWall', 'Cache', 'Keys available', Object.keys(ctx.imageCache || {}));

    if (!imageUrl) {
      DebugLogger.warn('vision', 'SmartWall', 'Image', 'No imageUrl in scene');
      return this.notHandled();
    }

    const img = ctx.imageCache[imageUrl];
    DebugLogger.log('vision', 'SmartWall', 'Image', `Found: ${!!img}, Complete: ${img?.complete}`);
    if (img) {
      DebugLogger.log('vision', 'SmartWall', 'Dimensions', `CSS: ${img.width}x${img.height}, Natural: ${img.naturalWidth}x${img.naturalHeight}`);
    }

    if (!img || !img.complete) {
      DebugLogger.warn('vision', 'SmartWall', 'Image', 'Image not loaded or not complete!');
      return this.notHandled();
    }

    // Get wand settings
    const tolerance = ctx.wandSettings?.tolerance ?? 30;
    const resolution = ctx.wandSettings?.resolution ?? 512;
    const simplification = ctx.wandSettings?.simplification ?? 2.0;
    DebugLogger.log('vision', 'SmartWall', 'Settings', 'Wand Settings', { tolerance, resolution, simplification });

    // Get image dimensions
    const grid = ctx.scene?.grid;
    if (!grid) return this.notHandled();

    const mapWidth = grid.size * grid.cols;
    DebugLogger.log('vision', 'SmartWall', 'Grid', 'Grid Config', { size: grid.size, cols: grid.cols, rows: grid.rows });
    DebugLogger.log('vision', 'SmartWall', 'Grid', `Map Width: ${mapWidth}`);

    // IMPORTANT: Map is rendered with uniform scale (aspect ratio preserved)
    // The image is scaled to fit mapWidth, so we use the same scale for both X and Y
    const scale = img.naturalWidth / mapWidth;
    DebugLogger.log('vision', 'SmartWall', 'Scale', `Uniform Scale: ${scale}`);
    DebugLogger.log('vision', 'SmartWall', 'Dimensions', `Image: ${img.naturalWidth}x${img.naturalHeight}`);
    DebugLogger.log('vision', 'SmartWall', 'Dimensions', `Effective Height: ${img.naturalHeight / scale}`);

    DebugLogger.log('vision', 'SmartWall', 'Coords', 'World Pos', ctx.worldPos);
    const imgX = Math.floor(ctx.worldPos.x * scale);
    const imgY = Math.floor(ctx.worldPos.y * scale);
    DebugLogger.log('vision', 'SmartWall', 'Coords', `Image Coords: ${imgX}, ${imgY}`);
    DebugLogger.log('vision', 'SmartWall', 'Process', 'Calling getContourFromPoint...');

    // Trigger loading state via callback
    this.callbacks?.setProcessing?.(true, 'Detecting wall...');

    // Use setTimeout to allow UI to render loading state before heavy processing
    setTimeout(() => {
      try {
        // Async execution via Worker
        processImageInWorker(
          img,
          imgX,
          imgY,
          {
            tolerance,
            maxDimension: resolution,
            simplification,
            smoothing: ctx.wandSettings?.smoothing ?? true,
            smoothingIterations: ctx.wandSettings?.smoothingIterations ?? 1
          }
        ).then(contour => {
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
          }
        }).catch(err => {
          console.error('[SmartWallHandler] Worker error:', err);
        }).finally(() => {
          // Clear loading state
          this.callbacks?.setProcessing?.(false);
        });
      } catch (error) {
        console.error('[SmartWallHandler] Error in setTimeout:', error);
        this.callbacks?.setProcessing?.(false);
      }
    }, 50); // Small delay to ensure render cycle happens

    return this.handled({ cursor: 'wait' });
  }
}
