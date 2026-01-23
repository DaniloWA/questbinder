/**
 * VTT Interaction Engine - Interaction Orchestrator
 *
 * Central controller for the modular interaction system.
 * Manages event routing, handler coordination, and shared context.
 * Inspired by MapOrchestrator architecture.
 */

import { BaseHandler } from './BaseHandler';
import { HandlerRegistry } from './HandlerRegistry';
import type {
  EventPhase,
  HandlerResult,
  InteractionContext,
  InteractionCallbacks,
  InteractionEvent,
  InteractionEventHandler,
  HandlerPlugin,
  NOT_HANDLED,
} from './types';
import { screenToWorld, getMousePos } from '../utils/coordConversion';
import type { Viewport, VTTTool, Point } from '../../../../../types';

/**
 * InteractionOrchestrator - Central interaction controller.
 *
 * Responsibilities:
 * - Route mouse/wheel events to handlers by priority
 * - Manage shared InteractionContext
 * - Handle event propagation (stop on handled)
 * - Emit interaction events for monitoring
 */
export class InteractionOrchestrator {
  private canvas: HTMLCanvasElement;
  private registry: HandlerRegistry;
  private context: Partial<InteractionContext>;
  private callbacks: InteractionCallbacks | null = null;

  // Event handlers
  private eventHandlers: Set<InteractionEventHandler> = new Set();

  // Throttling
  private lastCursorEmit: number = 0;
  private cursorThrottleMs: number = 50;

  // Current tool tracking
  private currentTool: VTTTool = 'select';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.registry = new HandlerRegistry();
    this.context = this.createEmptyContext();
  }

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  /**
   * Set callbacks from parent component.
   */
  setCallbacks(callbacks: InteractionCallbacks): void {
    this.callbacks = callbacks;

    // Update all handlers with callbacks
    for (const handler of this.registry.getHandlers()) {
      handler._attach(this, callbacks);
    }
  }

  /**
   * Destroy the orchestrator and clean up.
   */
  destroy(): void {
    this.registry.clear();
    this.eventHandlers.clear();
    this.callbacks = null;
  }

  // =========================================================================
  // CONTEXT MANAGEMENT
  // =========================================================================

  /**
   * Update the interaction context.
   */
  updateContext(partial: Partial<InteractionContext>): void {
    const changedKeys = Object.keys(partial);
    Object.assign(this.context, partial);

    // Check for tool change
    if (partial.activeTool && partial.activeTool !== this.currentTool) {
      const oldTool = this.currentTool;
      this.currentTool = partial.activeTool;

      // Notify handlers
      for (const handler of this.registry.getHandlers()) {
        handler.onToolChange?.(oldTool, this.currentTool);
      }

      this.emit({ type: 'tool:changed', from: oldTool, to: this.currentTool });
    }

    // Notify handlers
    for (const handler of this.registry.getHandlers()) {
      handler.onContextUpdate?.(this.context as InteractionContext, changedKeys);
    }

    // if (changedKeys.includes('tokens')) {
    //   console.log('[Orchestrator] Context Tokens Updated:', this.context.tokens?.length);
    // }

    this.emit({ type: 'context:updated', keys: changedKeys });
  }

  /**
   * Get current context (read-only).
   */
  getContext(): Readonly<InteractionContext> {
    return this.context as InteractionContext;
  }

  // =========================================================================
  // HANDLER MANAGEMENT
  // =========================================================================

  /**
   * Add a handler.
   */
  addHandler(handler: BaseHandler): void {
    this.registry.registerCore(handler);
    if (this.callbacks) {
      handler._attach(this, this.callbacks);
    }
    this.emit({ type: 'handler:added', handlerId: handler.id });
  }

  /**
   * Remove a handler.
   */
  removeHandler(id: string): boolean {
    const removed = this.registry.unregister(id);
    if (removed) {
      this.emit({ type: 'handler:removed', handlerId: id });
    }
    return removed;
  }

  /**
   * Get a handler by ID.
   */
  getHandler<T extends BaseHandler>(id: string): T | undefined {
    return this.registry.getHandler<T>(id);
  }

  /**
   * Register a plugin.
   */
  registerPlugin(plugin: HandlerPlugin): void {
    this.registry.registerPlugin(plugin);
    const handler = this.registry.getHandler(plugin.id);
    if (handler && this.callbacks) {
      handler._attach(this, this.callbacks);
    }
  }

  /**
   * Unregister a plugin.
   */
  unregisterPlugin(pluginId: string): boolean {
    return this.registry.unregisterPlugin(pluginId);
  }

  /**
   * Get registry for direct access.
   */
  getRegistry(): HandlerRegistry {
    return this.registry;
  }

  // =========================================================================
  // EVENT PROCESSING
  // =========================================================================

  /**
   * Process mouse down event.
   */
  handleMouseDown(e: React.MouseEvent): void {
    const ctx = this.buildEventContext(e);
    this.processEvent('down', ctx, handler => handler.onMouseDown?.(ctx));
  }

  /**
   * Process mouse move event.
   */
  handleMouseMove(e: React.MouseEvent): void {
    const ctx = this.buildEventContext(e);

    // Update refs immediately for performance
    if (this.context.mouseWorldPosRef) {
      (this.context.mouseWorldPosRef as any).current = ctx.worldPos;
    }
    if (this.context.lastMousePos) {
      (this.context.lastMousePos as any).current = ctx.screenPos;
    }

    this.processEvent('move', ctx, handler => handler.onMouseMove?.(ctx));

    // Throttled cursor broadcast
    const now = Date.now();
    if (now - this.lastCursorEmit > this.cursorThrottleMs) {
      // Don't emit cursor move if dragging a token (TokenDragHandler handles emission)
      // This prevents "ghost path" and double events
      if (!this.context.dragState?.isDragging) {
        this.callbacks?.emitCursorMove(ctx.worldPos.x, ctx.worldPos.y);
      }
      this.lastCursorEmit = now;
    }
  }

  /**
   * Process mouse up event.
   */
  handleMouseUp(e: React.MouseEvent): void {
    const ctx = this.buildEventContext(e);
    this.processEvent('up', ctx, handler => handler.onMouseUp?.(ctx));

    // Force immediate cursor update on release
    // If we were dragging, this puts the cursor at the drop location, which is good.
    this.callbacks?.emitCursorMove(ctx.worldPos.x, ctx.worldPos.y, true);
  }

  /**
   * Process mouse leave event.
   */
  handleMouseLeave(e: React.MouseEvent): void {
    const ctx = this.buildEventContext(e);
    this.processEvent('leave', ctx, handler => handler.onMouseLeave?.(ctx));
  }

  /**
   * Process wheel event.
   */
  handleWheel(e: React.WheelEvent): void {
    const ctx = this.buildEventContext(e);
    this.processEvent('wheel', ctx, handler => handler.onWheel?.(ctx, e.deltaY));
  }

  /**
   * Process double click event.
   */
  handleDoubleClick(e: React.MouseEvent): void {
    const ctx = this.buildEventContext(e);
    this.processEvent('dblclick', ctx, handler => handler.onDoubleClick?.(ctx));
  }

  // =========================================================================
  // EVENT ROUTING
  // =========================================================================

  /**
   * Route event to handlers by priority.
   */
  private processEvent(
    phase: EventPhase,
    ctx: InteractionContext,
    invoke: (handler: BaseHandler) => HandlerResult | undefined
  ): void {
    const startTime = performance.now();
    const handlers = this.registry.getEnabledHandlers();

    for (const handler of handlers) {
      // Check if handler handles current tool
      if (!handler.handlesTool(ctx.activeTool)) continue;

      // Ask handler if it wants to process this event
      if (!handler.shouldHandle(phase, ctx)) continue;

      // Invoke the handler
      const result = invoke(handler);

      // Track performance
      (handler as any).lastHandleTime = performance.now() - startTime;

      // Stop propagation if handled
      if (result?.handled) {
        return;
      }
    }
  }

  // =========================================================================
  // EVENTS
  // =========================================================================

  /**
   * Subscribe to orchestrator events.
   */
  on(handler: InteractionEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Emit an event.
   */
  emit(event: InteractionEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (e) {
        console.error('[InteractionOrchestrator] Event handler error:', e);
      }
    }
  }

  // =========================================================================
  // DEBUGGING
  // =========================================================================

  /**
   * Get handler states for debugging.
   */
  getHandlerStates() {
    return this.registry.getHandlerStates();
  }

  /**
   * Log debug info.
   */
  debug(): void {
    console.group('[InteractionOrchestrator] Debug');
    console.log('Current Tool:', this.currentTool);
    console.log('Handlers:', this.registry.getHandlerCount());
    this.registry.debugHandlers();
    console.groupEnd();
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  /**
   * Build context for event processing.
   */
  private buildEventContext(e: React.MouseEvent | React.WheelEvent): InteractionContext {
    const screenPos = getMousePos(e, this.canvas);
    const viewport = this.context.viewportRef?.current || this.context.viewport || { x: 0, y: 0, zoom: 1 };
    const worldPos = screenToWorld(screenPos.x, screenPos.y, viewport);

    return {
      ...this.context,
      canvas: this.canvas,
      screenPos,
      worldPos,
      zoom: viewport.zoom,
      gridSize: this.context.scene?.grid.size || 70,
      button: (e as React.MouseEvent).button ?? 0,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      time: Date.now(),
      deltaMs: 0,
    } as InteractionContext;
  }

  /**
   * Create empty initial context.
   */
  private createEmptyContext(): Partial<InteractionContext> {
    return {
      viewport: { x: 0, y: 0, zoom: 1 },
      zoom: 1,
      scene: null,
      tokens: [],
      imageCache: {},
      isGM: false,
      gmViewMode: 'player',
      currentUser: null,
      permissions: null,
      activeTool: 'select',
      selectedTokenIds: [],
      dragState: { isDragging: false, token: null, draggedGroup: [], offset: { x: 0, y: 0 }, dragStartX: 0, dragStartY: 0, lastValidGridX: 0, lastValidGridY: 0, lastCheckedGridX: -1, lastCheckedGridY: -1 },
      remoteDrags: {},
      remoteCursors: {},
      cursorSettings: null,
      rulerSettings: { snapToGrid: true, metric: 'chebyshev' },
      wandSettings: {
        tolerance: 30,
        resolution: 512,
        simplification: 2.0,
        smoothing: true,
        smoothingIterations: 1
      },
      drawingSettings: { color: '#ffffff', width: 3, opacity: 1 },
      attackZoneResults: [],
      isPlacingAttackZone: false,
      campaignCharacters: [],
    };
  }
}
