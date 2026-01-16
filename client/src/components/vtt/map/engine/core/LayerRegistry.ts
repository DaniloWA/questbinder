/**
 * VTT Engine - Layer Registry
 *
 * Manages layer instances, ordering, and plugin registration.
 * Provides the API for external plugins to register custom layers.
 */

import { BaseLayer } from './BaseLayer';
import { LayerConfig, LayerPlugin, LayerState } from './types';

/**
 * Internal layer entry with configuration.
 */
interface LayerEntry {
  layer: BaseLayer;
  order: number;
  isPlugin: boolean;
  pluginId?: string;
}

/**
 * Registry for managing VTT layers.
 *
 * Responsibilities:
 * - Store and retrieve layer instances
 * - Maintain z-order for rendering
 * - Handle plugin registration/unregistration
 * - Provide runtime layer control (enable/disable, opacity, order)
 */
export class LayerRegistry {
  private layers: Map<string, LayerEntry> = new Map();
  private plugins: Map<string, LayerPlugin> = new Map();
  private sortedCache: BaseLayer[] | null = null;

  // =========================================================================
  // CORE LAYER REGISTRATION (Internal)
  // =========================================================================

  /**
   * Register a core layer (built-in, not from plugin).
   *
   * @param layer Layer instance
   * @param order Z-order (lower = bottom)
   */
  registerCore(layer: BaseLayer, order: number): void {
    if (this.layers.has(layer.id)) {
      console.warn(`[LayerRegistry] Layer '${layer.id}' already registered, replacing`);
    }

    this.layers.set(layer.id, {
      layer,
      order,
      isPlugin: false,
    });

    this.invalidateSortedCache();
  }

  /**
   * Unregister a layer by ID.
   *
   * @param layerId Layer ID to remove
   */
  unregister(layerId: string): boolean {
    const entry = this.layers.get(layerId);
    if (!entry) return false;

    entry.layer.onDetach?.();
    this.layers.delete(layerId);
    this.invalidateSortedCache();
    return true;
  }

  // =========================================================================
  // PLUGIN API (External)
  // =========================================================================

  /**
   * Register an external plugin layer.
   *
   * @param plugin Plugin manifest
   */
  registerPlugin(plugin: LayerPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[LayerRegistry] Plugin '${plugin.id}' already registered`);
      return;
    }

    // Store plugin manifest
    this.plugins.set(plugin.id, plugin);

    // Create and register layer instance
    const layer = plugin.createLayer();
    layer.enabled = plugin.defaultEnabled ?? true;

    this.layers.set(layer.id, {
      layer,
      order: plugin.defaultOrder,
      isPlugin: true,
      pluginId: plugin.id,
    });

    this.invalidateSortedCache();
    console.log(`[LayerRegistry] Plugin registered: ${plugin.name} v${plugin.version}`);
  }

  /**
   * Unregister an external plugin and its layer.
   *
   * @param pluginId Plugin ID to remove
   */
  unregisterPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    // Find and remove the layer
    for (const [layerId, entry] of this.layers.entries()) {
      if (entry.pluginId === pluginId) {
        entry.layer.onDetach?.();
        this.layers.delete(layerId);
        break;
      }
    }

    this.plugins.delete(pluginId);
    this.invalidateSortedCache();
    console.log(`[LayerRegistry] Plugin unregistered: ${plugin.name}`);
    return true;
  }

  /**
   * Get all registered plugin manifests.
   */
  getPlugins(): LayerPlugin[] {
    return Array.from(this.plugins.values());
  }

  // =========================================================================
  // LAYER ACCESS
  // =========================================================================

  /**
   * Get a layer by ID.
   *
   * @param id Layer ID
   */
  getLayer<T extends BaseLayer = BaseLayer>(id: string): T | undefined {
    return this.layers.get(id)?.layer as T | undefined;
  }

  /**
   * Get all layers sorted by z-order (for rendering).
   */
  getLayers(): BaseLayer[] {
    if (!this.sortedCache) {
      const entries = Array.from(this.layers.values());
      entries.sort((a, b) => a.order - b.order);
      this.sortedCache = entries.map(e => e.layer);
    }
    return this.sortedCache;
  }

  /**
   * Get layer IDs in order.
   */
  getLayerIds(): string[] {
    return this.getLayers().map(l => l.id);
  }

  /**
   * Check if a layer exists.
   */
  hasLayer(id: string): boolean {
    return this.layers.has(id);
  }

  /**
   * Get the count of registered layers.
   */
  getLayerCount(): number {
    return this.layers.size;
  }

  // =========================================================================
  // RUNTIME CONTROL
  // =========================================================================

  /**
   * Enable or disable a layer.
   */
  setLayerEnabled(id: string, enabled: boolean): boolean {
    const entry = this.layers.get(id);
    if (!entry) return false;
    entry.layer.enabled = enabled;
    return true;
  }

  /**
   * Set layer z-order.
   */
  setLayerOrder(id: string, order: number): boolean {
    const entry = this.layers.get(id);
    if (!entry) return false;
    entry.order = order;
    this.invalidateSortedCache();
    return true;
  }

  /**
   * Set layer opacity.
   */
  setLayerOpacity(id: string, opacity: number): boolean {
    const entry = this.layers.get(id);
    if (!entry) return false;
    entry.layer.opacity = Math.max(0, Math.min(1, opacity));
    return true;
  }

  /**
   * Set layer blend mode.
   */
  setLayerBlendMode(id: string, blendMode: GlobalCompositeOperation): boolean {
    const entry = this.layers.get(id);
    if (!entry) return false;
    entry.layer.blendMode = blendMode;
    return true;
  }

  /**
   * Invalidate cache for a specific layer.
   */
  invalidateLayerCache(id: string): boolean {
    const entry = this.layers.get(id);
    if (!entry) return false;
    entry.layer.invalidateCache();
    return true;
  }

  /**
   * Invalidate cache for all layers.
   */
  invalidateAllCaches(): void {
    for (const entry of this.layers.values()) {
      entry.layer.invalidateCache();
    }
  }

  // =========================================================================
  // DEBUGGING / INSPECTION
  // =========================================================================

  /**
   * Get detailed state of all layers for debugging.
   */
  getLayerStates(): LayerState[] {
    return this.getLayers().map(layer => {
      const entry = this.layers.get(layer.id)!;
      return {
        id: layer.id,
        name: layer.name,
        order: entry.order,
        enabled: layer.enabled,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        cacheHash: layer.getCacheHash(),
        lastRenderTime: layer.getLastRenderDuration(),
      };
    });
  }

  /**
   * Log layer state to console.
   */
  debugLayers(): void {
    console.table(this.getLayerStates());
  }

  // =========================================================================
  // PRIVATE
  // =========================================================================

  private invalidateSortedCache(): void {
    this.sortedCache = null;
  }

  /**
   * Clear all layers (for cleanup).
   */
  clear(): void {
    for (const entry of this.layers.values()) {
      entry.layer.onDetach?.();
    }
    this.layers.clear();
    this.plugins.clear();
    this.sortedCache = null;
  }
}
