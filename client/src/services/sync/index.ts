/**
 * SmartSync System - Public API
 * 
 * Export all sync-related utilities.
 */

// Core services
export { smartSync, SmartSyncService } from './SmartSyncService';
export { syncCache, SyncCache } from './SyncCache';
export { syncQueue, SyncQueue } from './SyncQueue';
export { retryManager, RetryManager } from './RetryManager';
export { connectionManager, ConnectionManager } from './ConnectionManager';

// Strategies
export {
  tokenMergeStrategy,
  sceneMergeStrategy,
  characterMergeStrategy,
  defaultMergeStrategy,
  getMergeStrategy,
  registerMergeStrategy,
  resolveConflict,
} from './strategies';
export type { MergeStrategy } from './strategies';

// Utilities
export {
  computeDiff,
  applyDiff,
  isDiffEmpty,
  mergeDiffs,
  estimateSize,
  shouldUseDelta,
} from './utils';
export type { EntityDiff } from './utils';

// React hooks
export {
  useSyncEntity,
  useSyncCollection,
  useSyncActions,
  useSyncStatus,
  useSyncSubscription,
} from './useSyncSubscription';

// Types
export type {
  EntityType,
  SyncPriority,
  ChangeType,
  PendingChange,
  SyncEvent,
  CacheEntry,
  CacheStats,
  ChangeCallback,
  CollectionCallback,
  SubscriptionOptions,
  Subscription,
  SyncConflict,
  ConflictStrategy,
  ConflictResolution,
  SmartSyncOptions,
  SyncStatus,
} from './types';

// Type utilities
export {
  ENTITY_PRIORITY,
  PRIORITY_CONFIG,
  generateChangeId,
  getEntityPriority,
  getPriorityConfig,
} from './types';

// Connection types
export type { ConnectionState, ConnectionStatus } from './ConnectionManager';

// Retry types
export type { RetryConfig } from './RetryManager';
