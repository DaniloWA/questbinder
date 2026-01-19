/**
 * SmartSync - Strategies Index
 * 
 * Export all merge strategies.
 */

export {
  tokenMergeStrategy,
  sceneMergeStrategy,
  characterMergeStrategy,
  defaultMergeStrategy,
  getMergeStrategy,
  registerMergeStrategy,
  resolveConflict,
} from './mergeStrategies';

export type { MergeStrategy } from './mergeStrategies';
