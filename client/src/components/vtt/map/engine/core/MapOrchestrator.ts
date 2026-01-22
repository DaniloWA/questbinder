/**
 * VTT Engine - Map Orchestrator
 *
 * Central controller for the modular rendering engine.
 * Manages the render loop, coordinates layers, and provides shared context.
 */

import { BaseLayer } from './BaseLayer';
import { LayerRegistry } from './LayerRegistry';
import {
  RenderContext,
  OrchestratorOptions,
  OrchestratorEvent,
  OrchestratorEventHandler,
  LayerPlugin,
} from './types';
import { Viewport, MapScene, Token, VTTTool, Ping, Character, User, SessionPermissions } from '../../../../../types';
import { CursorMovePayload, TokenDragPayload } from '../../../../../types/socket';

/**
 * Default background color for the canvas.
 */
const DEFAULT_BG_COLOR = '#18181b';

/**
 * MapOrchestrator - Central rendering controller.
 *
 * Responsibilities:
 * - Own and manage the main canvas render loop
 * - Coordinate layer registration and ordering
 * - Provide shared RenderContext to all layers
 * - Handle layer compositing
 * - Emit events for debugging/monitoring
 */
export class MapOrchestrator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private registry: LayerRegistry;
  private context: RenderContext;
  private options: Required<OrchestratorOptions>;

  // Render loop state
  private running: boolean = false;
  private frameId: number = 0;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsLastTime: number = 0;
  private currentFps: number = 0;

  // Event handlers
  private eventHandlers: Set<OrchestratorEventHandler> = new Set();

  constructor(canvas: HTMLCanvasElement, options: OrchestratorOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('[MapOrchestrator] Failed to get 2D context');
    }
    this.ctx = ctx;
    this.registry = new LayerRegistry();

    this.options = {
      targetFps: options.targetFps ?? 60,
      debug: options.debug ?? false,
      backgroundColor: options.backgroundColor ?? DEFAULT_BG_COLOR,
    };

    // Initialize empty context
    this.context = this.createEmptyContext();
  }

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  /**
   * Start the render loop.
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.fpsLastTime = this.lastTime;
    this.frameId = requestAnimationFrame((t) => this.render(t));
    if (this.options.debug) {
      console.log('[MapOrchestrator] Started');
    }
  }

  /**
   * Stop the render loop.
   */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }
    if (this.options.debug) {
      console.log('[MapOrchestrator] Stopped');
    }
  }

  /**
   * Destroy the orchestrator and clean up resources.
   */
  destroy(): void {
    this.stop();
    this.registry.clear();
    this.eventHandlers.clear();
  }

  /**
   * Check if the orchestrator is currently running.
   */
  isRunning(): boolean {
    return this.running;
  }

  // =========================================================================
  // CONTEXT MANAGEMENT
  // =========================================================================

  /**
   * Update the render context with new data.
   * This is typically called from React when props change.
   */
  updateContext(partial: Partial<RenderContext>): void {
    const changedKeys = Object.keys(partial);
    Object.assign(this.context, partial);

    // Notify layers of context update
    for (const layer of this.registry.getLayers()) {
      layer.onContextUpdate?.(this.context, changedKeys);
    }

    this.emit({ type: 'context:updated', keys: changedKeys });
  }

  /**
   * Get the current render context (read-only).
   */
  getContext(): Readonly<RenderContext> {
    return this.context;
  }

  // =========================================================================
  // LAYER MANAGEMENT
  // =========================================================================

  /**
   * Get the layer registry for direct manipulation.
   */
  getRegistry(): LayerRegistry {
    return this.registry;
  }

  /**
   * Convenience: Register a core layer.
   */
  addLayer(layer: BaseLayer, order: number): void {
    layer.onAttach?.(this);
    this.registry.registerCore(layer, order);
    this.emit({ type: 'layer:added', layerId: layer.id });
  }

  /**
   * Convenience: Remove a layer.
   */
  removeLayer(layerId: string): boolean {
    const removed = this.registry.unregister(layerId);
    if (removed) {
      this.emit({ type: 'layer:removed', layerId });
    }
    return removed;
  }

  /**
   * Convenience: Register a plugin.
   */
  registerPlugin(plugin: LayerPlugin): void {
    this.registry.registerPlugin(plugin);
    const layer = this.registry.getLayers().find(l => l.id === plugin.id);
    if (layer) {
      layer.onAttach?.(this);
    }
  }

  /**
   * Convenience: Unregister a plugin.
   */
  unregisterPlugin(pluginId: string): boolean {
    return this.registry.unregisterPlugin(pluginId);
  }

  // =========================================================================
  // EVENTS
  // =========================================================================

  /**
   * Subscribe to orchestrator events.
   */
  on(handler: OrchestratorEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: OrchestratorEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (e) {
        console.error('[MapOrchestrator] Event handler error:', e);
      }
    }
  }

  // =========================================================================
  // DEBUGGING
  // =========================================================================

  /**
   * Get current FPS.
   */
  getFps(): number {
    return this.currentFps;
  }

  /**
   * Get layer states for debugging.
   */
  getLayerStates() {
    return this.registry.getLayerStates();
  }

  /**
   * Log debug info to console.
   */
  debug(): void {
    console.group('[MapOrchestrator] Debug');
    console.log('Running:', this.running);
    console.log('FPS:', this.currentFps);
    console.log('Canvas:', this.canvas.width, 'x', this.canvas.height);
    this.registry.debugLayers();
    console.groupEnd();
  }

  // =========================================================================
  // RENDER LOOP
  // =========================================================================

  private render(timestamp: number): void {
    if (!this.running) return;

    this.emit({ type: 'render:start' });
    const frameStart = performance.now();

    // Calculate delta time
    const now = Date.now();
    this.context.time = now;
    this.context.deltaMs = now - this.lastTime;
    this.lastTime = now;

    // Update canvas reference in context
    this.context.canvas = this.canvas;
    this.context.ctx = this.ctx;

    // Clear canvas
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Use immediate viewport ref if available to bypass React render cycle lag
    if (!this.context.viewportRef && this.context.viewport && this.options.debug) {
      console.warn('[MapOrchestrator] Missing viewportRef! Dragging may lag.');
    }
    const effectiveViewport = this.context.viewportRef?.current || this.context.viewport;
    const effectiveZoom = effectiveViewport.zoom;

    // Apply viewport transform
    this.ctx.save();
    this.ctx.translate(effectiveViewport.x, effectiveViewport.y);
    this.ctx.scale(effectiveZoom, effectiveZoom);

    // Update zoom in context for layers that need it (like GridLayer)
    // Note: We don't mutate this.context.viewport to avoid desync, but layers should trust zoom/transform
    this.context.zoom = effectiveZoom;

    // Render all layers in order
    const layers = this.registry.getLayers();

    for (const layer of layers) {
      layer.onBeforeRender?.(this.context);
      layer.draw(this.ctx, this.context);
      layer.onAfterRender?.(this.context);
    }

    this.ctx.restore();

    // FPS calculation
    this.frameCount++;
    if (timestamp - this.fpsLastTime >= 1000) {
      this.currentFps = Math.round(this.frameCount * 1000 / (timestamp - this.fpsLastTime));
      this.frameCount = 0;
      this.fpsLastTime = timestamp;
    }

    const frameTime = performance.now() - frameStart;
    this.emit({ type: 'render:complete', frameTime });

    // Schedule next frame
    this.frameId = requestAnimationFrame((t) => this.render(t));
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  private createEmptyContext(): RenderContext {
    return {
      canvas: this.canvas,
      ctx: this.ctx,
      viewport: { x: 0, y: 0, zoom: 1 },
      zoom: 1,
      mapWidth: 0,
      mapHeight: 0,
      time: Date.now(),
      deltaMs: 0,
      scene: null,
      tokens: [],
      imageCache: {},
      isGM: false,
      gmViewMode: 'player',
      currentUser: null,
      permissions: null,
      players: [],
      activeTool: 'select',
      selectedTokenIds: [],
      remoteCursors: {},
      remoteDrags: {},
      localCursorPos: { x: 0, y: 0 },
      cursorSettings: null,
      ui: {
        showGridCoordinates: false,
        showVisionRanges: false,
        gmHideObstacles: false,
      },
      drawingSettings: {
        color: '#ffffff',
        width: 3,
        opacity: 1,
      },
      drawingState: {
        livePoints: [],
        isDrawing: false,
        settings: { color: '#ffffff', width: 3, opacity: 1 },
      },
      toolState: {
        movementPath: [],
        draftPolyPoints: [],
        drawingObstacle: null,
        drawingLightZone: null,
        drawingAudioZone: null,
        drawingTriggerZone: null,
        currentFogRect: null,
        draggedAttackZone: null,
        mapAlignPoints: [],
        mapAlignDragging: false,
        mapAlignPreviewGrid: null,
      },
      attackZoneResults: [],
      previewZoneResult: null,
      pings: [],
      clickAnimations: [],
      campaignCharacters: [],
      remoteViewports: {},
      rulerSettings: { snapToGrid: true, metric: 'chebyshev' },
      dragState: {
        isDragging: false,
        token: null,
        draggedGroup: [],
        offset: { x: 0, y: 0 },
      },
      hoveredTokenId: null,
      hoveredObstacleId: null,
      calculatedPath: [],
      visionTokens: [],
    };
  }
}
