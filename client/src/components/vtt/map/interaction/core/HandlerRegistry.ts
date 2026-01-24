/**
 * VTT Interaction Engine - Handler Registry
 *
 * Manages handler instances, priority ordering, and plugin registration.
 * Inspired by LayerRegistry architecture.
 */

import { BaseHandler } from './BaseHandler';
import type { HandlerPlugin } from './types';
import { DebugLogger } from '../../../../../utils/DebugLogger';

/**
 * Internal handler entry with metadata.
 */
interface HandlerEntry {
  handler: BaseHandler;
  isPlugin: boolean;
  pluginId?: string;
}

/**
 * Handler state for debugging/inspection.
 */
export interface HandlerState {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  tools: string;
  lastHandleTime: number;
}

/**
 * Registry for managing VTT interaction handlers.
 *
 * Responsibilities:
 * - Store and retrieve handler instances
 * - Maintain priority order (higher = first)
 * - Handle plugin registration/unregistration
 * - Provide runtime control (enable/disable, priority)
 */
export class HandlerRegistry {
  private handlers: Map<string, HandlerEntry> = new Map();
  private plugins: Map<string, HandlerPlugin> = new Map();
  private sortedCache: BaseHandler[] | null = null;

  // =========================================================================
  // CORE REGISTRATION
  // =========================================================================

  /**
   * Register a core handler (built-in).
   */
  registerCore(handler: BaseHandler): void {
    if (this.handlers.has(handler.id)) {
      console.warn(`[HandlerRegistry] Handler '${handler.id}' already registered, replacing`);
      this.handlers.get(handler.id)?.handler._detach();
    }

    this.handlers.set(handler.id, {
      handler,
      isPlugin: false,
    });

    this.invalidateSortedCache();
  }

  /**
   * Unregister a handler by ID.
   */
  unregister(handlerId: string): boolean {
    const entry = this.handlers.get(handlerId);
    if (!entry) return false;

    entry.handler._detach();
    this.handlers.delete(handlerId);
    this.invalidateSortedCache();
    return true;
  }

  // =========================================================================
  // PLUGIN API
  // =========================================================================

  /**
   * Register an external plugin handler.
   */
  registerPlugin(plugin: HandlerPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[HandlerRegistry] Plugin '${plugin.id}' already registered`);
      return;
    }

    // Store plugin manifest
    this.plugins.set(plugin.id, plugin);

    // Create handler instance
    const handler = plugin.createHandler();
    handler.enabled = plugin.defaultEnabled ?? true;

    this.handlers.set(handler.id, {
      handler,
      isPlugin: true,
      pluginId: plugin.id,
    });

    this.invalidateSortedCache();
    DebugLogger.log('input', 'HandlerRegistry', 'Register', `Plugin registered: ${plugin.name} v${plugin.version}`);
  }

  /**
   * Unregister an external plugin.
   */
  unregisterPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    // Find and remove the handler
    for (const [handlerId, entry] of this.handlers.entries()) {
      if (entry.pluginId === pluginId) {
        entry.handler._detach();
        this.handlers.delete(handlerId);
        break;
      }
    }

    this.plugins.delete(pluginId);
    this.invalidateSortedCache();
    DebugLogger.log('input', 'HandlerRegistry', 'Unregister', `Plugin unregistered: ${plugin.name}`);
    return true;
  }

  /**
   * Get all registered plugins.
   */
  getPlugins(): HandlerPlugin[] {
    return Array.from(this.plugins.values());
  }

  // =========================================================================
  // HANDLER ACCESS
  // =========================================================================

  /**
   * Get a handler by ID.
   */
  getHandler<T extends BaseHandler = BaseHandler>(id: string): T | undefined {
    return this.handlers.get(id)?.handler as T | undefined;
  }

  /**
   * Get all handlers sorted by priority (highest first).
   */
  getHandlers(): BaseHandler[] {
    if (!this.sortedCache) {
      const entries = Array.from(this.handlers.values());
      // Sort by priority DESC (higher = first)
      entries.sort((a, b) => b.handler.priority - a.handler.priority);
      this.sortedCache = entries.map(e => e.handler);
    }
    return this.sortedCache;
  }

  /**
   * Get all enabled handlers sorted by priority.
   */
  getEnabledHandlers(): BaseHandler[] {
    return this.getHandlers().filter(h => h.enabled);
  }

  /**
   * Get handler IDs.
   */
  getHandlerIds(): string[] {
    return this.getHandlers().map(h => h.id);
  }

  /**
   * Check if a handler exists.
   */
  hasHandler(id: string): boolean {
    return this.handlers.has(id);
  }

  /**
   * Get handler count.
   */
  getHandlerCount(): number {
    return this.handlers.size;
  }

  // =========================================================================
  // RUNTIME CONTROL
  // =========================================================================

  /**
   * Enable or disable a handler.
   */
  setHandlerEnabled(id: string, enabled: boolean): boolean {
    const entry = this.handlers.get(id);
    if (!entry) return false;
    entry.handler.enabled = enabled;
    return true;
  }

  /**
   * Get handler states for debugging.
   */
  getHandlerStates(): HandlerState[] {
    return this.getHandlers().map(handler => ({
      id: handler.id,
      name: handler.name,
      priority: handler.priority,
      enabled: handler.enabled,
      tools: handler.tools === '*' ? '*' : handler.tools.join(', '),
      lastHandleTime: handler.getLastHandleTime(),
    }));
  }

  /**
   * Log handler states to console.
   */
  debugHandlers(): void {
    console.table(this.getHandlerStates());
  }

  // =========================================================================
  // PRIVATE
  // =========================================================================

  private invalidateSortedCache(): void {
    this.sortedCache = null;
  }

  /**
   * Clear all handlers (cleanup).
   */
  clear(): void {
    for (const entry of this.handlers.values()) {
      entry.handler._detach();
    }
    this.handlers.clear();
    this.plugins.clear();
    this.sortedCache = null;
  }
}
