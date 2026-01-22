/**
 * Smart Loader Module Re-exports
 * 
 * Clean barrel exports for the loading system.
 * Centralizes all public APIs for better tree-shaking and import organization.
 * 
 * @module loading
 * @example
 * // Import everything you need in one line
 * import { useAssetLoader, LOADER_CONFIG, type LoaderAsset } from './loading';
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Asset Types
  LoaderAssetType,
  AssetStatus,
  LoaderAsset,

  // Stage Types
  LoaderStage,
  LoaderStageConfig,

  // Progress Types
  LoaderProgress,
  OverallProgress,

  // Log Types
  LogEntry,

  // Hook Props & Returns
  SmartLoaderProps,
  UseAssetLoaderReturn,
  UseLoaderStagesReturn,
  UseSmartLoaderReturn,
} from './types';

// ============================================================================
// Constant Exports
// ============================================================================

export { LOADER_STAGES } from './types';

export {
  // Configuration
  LOADER_CONFIG,
  STAGE_WEIGHTS,
  STAGE_CONFIGS,
  CORE_MODULES,

  // Utilities
  generateLogId,
  getStageProgress,
} from './constants';

// ============================================================================
// Hook Exports
// ============================================================================

export { useAssetLoader } from './useAssetLoader';
export { useLoaderStages } from './useLoaderStages';

// ============================================================================
// Re-export Main Hook from Parent
// ============================================================================

/**
 * Main orchestrator hook - re-exported for convenience.
 * Prefer importing from './loading' rather than '../useSmartLoader'.
 */
export { useSmartLoader } from '../useSmartLoader';
export type { SmartLoaderProps as UseSmartLoaderProps } from '../useSmartLoader';