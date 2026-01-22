/**
 * Smart Loader Module Re-exports
 * 
 * Clean barrel exports for the loading system.
 * @module loading
 */

// Types
export type {
  LoaderAssetType,
  AssetStatus,
  LoaderAsset,
  LoaderStage,
  LoaderStageConfig,
  LoaderProgress,
  OverallProgress,
  LogEntry,
  SmartLoaderProps,
  UseAssetLoaderReturn,
  UseLoaderStagesReturn,
  UseSmartLoaderReturn,
} from './types';

export { LOADER_STAGES } from './types';

// Constants
export {
  LOADER_CONFIG,
  STAGE_WEIGHTS,
  STAGE_CONFIGS,
  CORE_MODULES,
  generateLogId,
  getStageProgress,
} from './constants';

// Hooks
export { useAssetLoader } from './useAssetLoader';
export { useLoaderStages } from './useLoaderStages';
