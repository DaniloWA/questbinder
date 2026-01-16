/**
 * VTT Engine - Main Exports
 *
 * Public API for the modular VTT rendering engine.
 */

// Core
export * from './core';

// Layers
export * from './layers';

// Plugin API
export type { LayerPlugin, RenderContext } from './core/types';
export { BaseLayer } from './core/BaseLayer';
