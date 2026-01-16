/**
 * VTT Engine - Core Exports
 *
 * Public API for the modular rendering engine core.
 */

// Core classes
export { MapOrchestrator } from './MapOrchestrator';
export { BaseLayer } from './BaseLayer';
export { LayerRegistry } from './LayerRegistry';

// Types
export type {
  RenderContext,
  LayerOptions,
  LayerConfig,
  LayerPlugin,
  OrchestratorOptions,
  LayerState,
  OrchestratorEvent,
  OrchestratorEventHandler,
} from './types';
