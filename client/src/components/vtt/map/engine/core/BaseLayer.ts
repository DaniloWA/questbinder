/**
 * VTT Engine - Base Layer
 *
 * Abstract base class for all rendering layers.
 * Provides caching, dirty-checking, and lifecycle hooks.
 */

import { RenderContext, LayerOptions } from './types';
import type { MapOrchestrator } from './MapOrchestrator';

/**
 * Cache structure for offscreen rendering.
 */
interface LayerCache {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  hash: string;
  lastRenderTime: number;
}

/**
 * Abstract base class for all VTT layers.
 *
 * Subclasses must implement:
 * - `computeStateHash()`: Returns a string that changes when re-render is needed
 * - `render()`: Actual drawing logic
 *
 * The base class handles caching automatically via the `draw()` method.
 */
export abstract class BaseLayer {
  /** Unique layer identifier */
  readonly id: string;

  /** Human-readable layer name */
  readonly name: string;

  /** Optional description */
  readonly description?: string;

  /** Whether the layer is currently enabled */
  enabled: boolean = true;

  /** Layer opacity (0-1) */
  opacity: number = 1;

  /** Blend mode for compositing */
  blendMode: GlobalCompositeOperation = 'source-over';

  /** Caching strategy */
  cacheStrategy: 'screen' | 'world' = 'screen';

  /** Offscreen cache (if enabled) */
  protected cache: LayerCache | null = null;

  /** Reference to parent orchestrator (set on attach) */
  protected orchestrator: MapOrchestrator | null = null;

  /** Performance tracking */
  protected lastRenderDuration: number = 0;

  constructor(id: string, name: string, options: LayerOptions = {}) {
    this.id = id;
    this.name = name;
    this.description = options.description;
    this.opacity = options.opacity ?? 1;
    this.blendMode = options.blendMode ?? 'source-over';
    this.cacheStrategy = options.cacheStrategy ?? 'screen';

    if (options.useCache) {
      this.initCache();
    }
  }

  /**
   * Initialize offscreen canvas for caching.
   */
  private initCache(): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn(`[${this.id}] Failed to create cache canvas context`);
      return;
    }
    this.cache = {
      canvas,
      ctx,
      hash: '',
      lastRenderTime: 0,
    };
  }

  /**
   * Resize the cache canvas to match the main canvas.
   */
  protected resizeCache(width: number, height: number): void {
    if (!this.cache) return;
    // Don't resize if dimensions are effectively 0 (prevents clearing valid cache on glitches)
    if (width <= 0 || height <= 0) return;

    if (this.cache.canvas.width !== width || this.cache.canvas.height !== height) {
      this.cache.canvas.width = width;
      this.cache.canvas.height = height;
      this.cache.hash = ''; // Invalidate cache on resize
    }
  }

  /**
   * Compute a hash representing the current state that affects rendering.
   * Return 'dynamic' if the layer should never be cached (e.g., animations).
   *
   * @param context Current render context
   * @returns State hash string
   */
  abstract computeStateHash(context: RenderContext): string;

  /**
   * Render the layer content.
   *
   * @param ctx Canvas context to draw on (may be offscreen cache)
   * @param context Current render context
   */
  abstract render(ctx: CanvasRenderingContext2D, context: RenderContext): void;

  /**
   * Main draw method called by the orchestrator.
   * Handles caching logic automatically.
   *
   * @param mainCtx Main canvas context
   * @param context Current render context
   */
  draw(mainCtx: CanvasRenderingContext2D, context: RenderContext): void {
    if (!this.enabled) return;

    const startTime = performance.now();
    const hash = this.computeStateHash(context);

    // Using cache
    if (this.cache) {
      // Determine target cache size based on strategy
      const targetWidth = this.cacheStrategy === 'world' ? context.mapWidth : context.canvas.width;
      const targetHeight = this.cacheStrategy === 'world' ? context.mapHeight : context.canvas.height;

      this.resizeCache(targetWidth, targetHeight);

      if (hash !== this.cache.hash || hash === 'dynamic') {
        const cacheCtx = this.cache.ctx;
        cacheCtx.clearRect(0, 0, this.cache.canvas.width, this.cache.canvas.height);

        cacheCtx.save();
        // If World strategy, we render at 0,0 world coordinates (identity).
        // If Screen strategy, mainCtx is ALREADY transformed by orchestrator, 
        // BUT we are rendering to offscreen, which has identity.
        // Wait, 'render(ctx)' usually expects transformed coords if it's drawing relative to 0,0?
        // NO: 'BaseLayer' subclasses assume `render` logic draws in World Space for map layers.

        // ISSUE: Orchestrator applies viewport transform to `mainCtx`.
        // If we draw to `cacheCtx` (identity), we get world space drawing.
        // Then we draw `cacheCanvas` to `mainCtx` (transformed). 
        // This WORKS perfectly for 'world' strategy.

        // But for 'screen' strategy (like UI overlays), we want drawing relative to screen?
        // If 'screen' strategy, we usually want to draw relative to VIEWPORT.
        // But subclasses typically draw in World Coordinates.

        // Correction: If 'screen' strategy, we want the cache to capture CURRENT VIEWPORT VIEW.
        // So we must Apply Transform to cacheCtx same as mainCtx!
        if (this.cacheStrategy === 'screen') {
          cacheCtx.translate(context.viewport.x, context.viewport.y);
          cacheCtx.scale(context.zoom, context.zoom);
        }

        this.render(cacheCtx, context);
        cacheCtx.restore();
        this.cache.hash = hash;
        this.cache.lastRenderTime = performance.now();
      }

      // Composite cache to main canvas
      mainCtx.save();
      mainCtx.globalAlpha = this.opacity;
      mainCtx.globalCompositeOperation = this.blendMode;

      if (this.cacheStrategy === 'world') {
        // World cache is drawn at 0,0 world coordinates.
        // mainCtx is already transformed, so just draw image at 0,0
        mainCtx.drawImage(this.cache.canvas, 0, 0);
      } else {
        // Screen cache is drawn at 0,0 screen coordinates.
        // BUT mainCtx is transformed! We need to reset transform to draw screen-space cache?
        // YES. Screen cache corresponds to the camera view.
        mainCtx.resetTransform();
        // Note: resetTransform() clears Orchestrator's viewport transform.
        mainCtx.drawImage(this.cache.canvas, 0, 0);
        // Restore handled by mainCtx.restore() below?? No, mainCtx.restore() goes back to transformed state?
        // Actually mainCtx.restore() at line 149 will pop the save() from line 145.
        // So resetTransform is strictly local to this block.
      }

      mainCtx.restore();
    } else {
      // Direct render (no caching)
      mainCtx.save();
      mainCtx.globalAlpha = this.opacity;
      mainCtx.globalCompositeOperation = this.blendMode;
      this.render(mainCtx, context);
      mainCtx.restore();
    }

    this.lastRenderDuration = performance.now() - startTime;
  }

  /**
   * Get the current cache hash (for debugging).
   */
  getCacheHash(): string | null {
    return this.cache?.hash ?? null;
  }

  /**
   * Get the last render duration in ms (for performance monitoring).
   */
  getLastRenderDuration(): number {
    return this.lastRenderDuration;
  }

  /**
   * Force cache invalidation.
   */
  invalidateCache(): void {
    if (this.cache) {
      this.cache.hash = '';
    }
  }

  // =========================================================================
  // LIFECYCLE HOOKS (optional for subclasses)
  // =========================================================================

  /**
   * Called when the layer is attached to an orchestrator.
   */
  onAttach(orchestrator: MapOrchestrator): void {
    this.orchestrator = orchestrator;
  }

  /**
   * Called when the layer is detached from an orchestrator.
   */
  onDetach(): void {
    this.orchestrator = null;
  }

  /**
   * Called when the render context is updated.
   * Useful for reacting to specific state changes.
   */
  onContextUpdate?(context: RenderContext, changedKeys: string[]): void;

  /**
   * Called once per frame before render.
   * Useful for animations or pre-calculations.
   */
  onBeforeRender?(context: RenderContext): void;

  /**
   * Called once per frame after render.
   * Useful for cleanup or post-processing.
   */
  onAfterRender?(context: RenderContext): void;

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Create a simple hash from an object.
   * Useful for implementing computeStateHash().
   */
  protected hashObject(obj: Record<string, unknown>): string {
    return JSON.stringify(obj);
  }

  /**
   * Create a hash from specific values.
   */
  protected hashValues(...values: (string | number | boolean | null | undefined)[]): string {
    return values.map(v => String(v ?? '')).join('|');
  }
}
