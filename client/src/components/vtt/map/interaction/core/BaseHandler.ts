/**
 * VTT Interaction Engine - Base Handler
 *
 * Abstract base class for all interaction handlers.
 * Inspired by BaseLayer architecture.
 */

import type { InteractionOrchestrator } from './InteractionOrchestrator';
import type {
  EventPhase,
  HandlerResult,
  HandlerOptions,
  InteractionContext,
  InteractionCallbacks,
  NOT_HANDLED,
} from './types';
import type { VTTTool } from '../../../../../types';

/**
 * Abstract base class for all VTT interaction handlers.
 *
 * Subclasses must implement:
 * - `shouldHandle()`: Check if handler should process the event
 *
 * Event handlers are optional - override as needed:
 * - `onMouseDown()`, `onMouseMove()`, `onMouseUp()`, etc.
 */
export abstract class BaseHandler {
  /** Unique handler identifier */
  readonly id: string;

  /** Human-readable handler name */
  readonly name: string;

  /** Priority (higher = processed first) */
  readonly priority: number;

  /** Tools this handler responds to */
  readonly tools: VTTTool[] | '*';

  /** Optional description */
  readonly description?: string;

  /** Whether the handler is currently enabled */
  enabled: boolean = true;

  /** Reference to parent orchestrator (set on attach) */
  protected orchestrator: InteractionOrchestrator | null = null;

  /** Callbacks provided by parent component */
  protected callbacks: InteractionCallbacks | null = null;

  /** Performance tracking */
  protected lastHandleTime: number = 0;

  constructor(options: HandlerOptions) {
    this.id = options.id;
    this.name = options.name;
    this.priority = options.priority;
    this.tools = options.tools;
    this.description = options.description;
  }

  // =========================================================================
  // ABSTRACT METHODS (required)
  // =========================================================================

  /**
   * Check if this handler should process the given event.
   *
   * Called before any event handler method.
   * Return true to receive the event, false to skip.
   */
  abstract shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean;

  // =========================================================================
  // EVENT HANDLERS (optional, override as needed)
  // =========================================================================

  /**
   * Handle mouse down event.
   */
  onMouseDown?(ctx: InteractionContext): HandlerResult;

  /**
   * Handle mouse move event.
   */
  onMouseMove?(ctx: InteractionContext): HandlerResult;

  /**
   * Handle mouse up event.
   */
  onMouseUp?(ctx: InteractionContext): HandlerResult;

  /**
   * Handle mouse leave event.
   */
  onMouseLeave?(ctx: InteractionContext): HandlerResult;

  /**
   * Handle wheel event.
   */
  onWheel?(ctx: InteractionContext, deltaY: number): HandlerResult;

  /**
   * Handle double click event.
   */
  onDoubleClick?(ctx: InteractionContext): HandlerResult;

  // =========================================================================
  // LIFECYCLE HOOKS (optional)
  // =========================================================================

  /**
   * Called when handler is attached to orchestrator.
   */
  onAttach?(orchestrator: InteractionOrchestrator): void;

  /**
   * Called when handler is detached from orchestrator.
   */
  onDetach?(): void;

  /**
   * Called when active tool changes.
   */
  onToolChange?(from: VTTTool, to: VTTTool): void;

  /**
   * Called when context is updated.
   */
  onContextUpdate?(ctx: InteractionContext, changedKeys: string[]): void;

  // =========================================================================
  // INTERNAL LIFECYCLE
  // =========================================================================

  /**
   * @internal Called by orchestrator when attaching.
   */
  _attach(orchestrator: InteractionOrchestrator, callbacks: InteractionCallbacks): void {
    this.orchestrator = orchestrator;
    this.callbacks = callbacks;
    this.onAttach?.(orchestrator);
  }

  /**
   * @internal Called by orchestrator when detaching.
   */
  _detach(): void {
    this.onDetach?.();
    this.orchestrator = null;
    this.callbacks = null;
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Check if this handler handles the given tool.
   */
  handlesTool(tool: VTTTool): boolean {
    if (this.tools === '*') return true;
    return this.tools.includes(tool);
  }

  /**
   * Get another handler by ID.
   */
  protected getOtherHandler<T extends BaseHandler>(id: string): T | undefined {
    return this.orchestrator?.getHandler<T>(id);
  }

  /**
   * Emit an event through the orchestrator.
   */
  protected emit(eventName: string, payload: any): void {
    // For now, use window events for cross-system communication
    window.dispatchEvent(new CustomEvent(`questbinder:${eventName}`, { detail: payload }));
  }

  /**
   * Get the last handle time for performance monitoring.
   */
  getLastHandleTime(): number {
    return this.lastHandleTime;
  }

  /**
   * Create a "handled" result.
   */
  protected handled(options?: { cursor?: string; preventDefault?: boolean; }): HandlerResult {
    return { handled: true, ...options };
  }

  /**
   * Create a "not handled" result.
   */
  protected notHandled(): HandlerResult {
    return { handled: false };
  }
}
