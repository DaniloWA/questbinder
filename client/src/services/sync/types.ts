/**
 * SmartSync System - Type Definitions
 * 
 * Core types for the intelligent sync system with versioning,
 * caching, and batched updates.
 */

// =============================================================================
// ENTITY TYPES
// =============================================================================

/**
 * All syncable entity types in the system.
 */
export type EntityType =
  | 'token'
  | 'scene'
  | 'character'
  | 'obstacle'
  | 'drawing'
  | 'lightZone'
  | 'audioZone'
  | 'triggerZone'
  | 'attackZone'
  | 'combat'
  | 'combatant'
  | 'handout'
  | 'campaign';

/**
 * Sync priority levels - determines batching behavior.
 */
export type SyncPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Priority configuration per entity type.
 */
export const ENTITY_PRIORITY: Record<EntityType, SyncPriority> = {
  token: 'high',
  scene: 'medium',
  character: 'medium',
  obstacle: 'low',
  drawing: 'low',
  lightZone: 'low',
  audioZone: 'low',
  triggerZone: 'low',
  attackZone: 'high',
  combat: 'critical',
  combatant: 'high',
  handout: 'low',
  campaign: 'low',
};

/**
 * Batching configuration per priority.
 */
export const PRIORITY_CONFIG: Record<SyncPriority, {
  maxBatchSize: number;
  flushIntervalMs: number;
  immediate: boolean;
}> = {
  critical: { maxBatchSize: 1, flushIntervalMs: 0, immediate: true },
  high: { maxBatchSize: 5, flushIntervalMs: 50, immediate: false },
  medium: { maxBatchSize: 10, flushIntervalMs: 200, immediate: false },
  low: { maxBatchSize: 20, flushIntervalMs: 500, immediate: false },
};

// =============================================================================
// CHANGE TYPES
// =============================================================================

/**
 * Types of changes that can occur.
 */
export type ChangeType = 'create' | 'update' | 'delete' | 'move';

/**
 * A pending change waiting to be synced.
 */
export interface PendingChange<T = unknown> {
  /** Unique ID for this change */
  id: string;
  /** Entity type */
  entityType: EntityType;
  /** Entity ID */
  entityId: string;
  /** Parent ID (e.g., sceneId for tokens) */
  parentId?: string;
  /** Type of change */
  changeType: ChangeType;
  /** The changed data (partial for updates) */
  data: Partial<T>;
  /** Local version at time of change */
  version: number;
  /** Timestamp of change */
  timestamp: number;
  /** Whether this is optimistically applied */
  optimistic: boolean;
  /** Priority for batching */
  priority: SyncPriority;
}

/**
 * Sync event received from server.
 */
export interface SyncEvent<T = unknown> {
  /** Entity type */
  entityType: EntityType;
  /** Entity ID */
  entityId: string;
  /** Parent ID (e.g., sceneId for tokens) */
  parentId?: string;
  /** Type of change */
  changeType: ChangeType;
  /** The changed data */
  data: T;
  /** Server version */
  version: number;
  /** Server timestamp */
  timestamp: number;
  /** User who made the change */
  userId?: string;
}

// =============================================================================
// CACHE TYPES
// =============================================================================

/**
 * Entry in the sync cache.
 */
export interface CacheEntry<T = unknown> {
  /** The cached data */
  data: T;
  /** Current version */
  version: number;
  /** Last sync timestamp */
  lastSync: number;
  /** Whether there are unsynced local changes */
  dirty: boolean;
  /** Pending changes not yet confirmed by server */
  pendingChanges: string[];
}

/**
 * Cache statistics for debugging.
 */
export interface CacheStats {
  totalEntries: number;
  dirtyEntries: number;
  hitRate: number;
  pendingChanges: number;
}

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

/**
 * Callback for entity changes.
 */
export type ChangeCallback<T = unknown> = (
  entityId: string,
  data: T | null,
  changeType: ChangeType,
  parentId?: string
) => void;

/**
 * Callback for collection changes.
 */
export type CollectionCallback<T = unknown> = (
  entities: Map<string, T>,
  changedIds: string[]
) => void;

/**
 * Subscription options.
 */
export interface SubscriptionOptions {
  /** Only trigger for specific entity IDs */
  filterIds?: string[];
  /** Only trigger for specific change types */
  filterChangeTypes?: ChangeType[];
  /** Debounce updates (ms) */
  debounceMs?: number;
}

/**
 * Active subscription.
 */
export interface Subscription {
  id: string;
  entityType: EntityType;
  callback: ChangeCallback | CollectionCallback;
  options: SubscriptionOptions;
}

// =============================================================================
// CONFLICT RESOLUTION
// =============================================================================

/**
 * Conflict between local and remote changes.
 */
export interface SyncConflict<T = unknown> {
  entityType: EntityType;
  entityId: string;
  localChange: PendingChange<T>;
  remoteChange: SyncEvent<T>;
  localVersion: number;
  remoteVersion: number;
}

/**
 * Conflict resolution strategy.
 */
export type ConflictStrategy =
  | 'local-wins'      // Keep local changes
  | 'remote-wins'     // Accept remote changes
  | 'merge'           // Attempt to merge
  | 'manual';         // Require user intervention

/**
 * Result of conflict resolution.
 */
export interface ConflictResolution<T = unknown> {
  strategy: ConflictStrategy;
  resolvedData: T;
  discardedChanges?: PendingChange<T>[];
}

// =============================================================================
// SERVICE TYPES
// =============================================================================

/**
 * Options for SmartSyncService.
 */
export interface SmartSyncOptions {
  /** Enable debug logging */
  debug?: boolean;
  /** Default conflict strategy */
  defaultConflictStrategy?: ConflictStrategy;
  /** Enable optimistic updates */
  optimisticUpdates?: boolean;
  /** Max retry attempts for failed syncs */
  maxRetries?: number;
  /** Retry delay (ms) */
  retryDelayMs?: number;
}

/**
 * Sync service status.
 */
export interface SyncStatus {
  connected: boolean;
  pendingChanges: number;
  lastSyncTime: number;
  conflicts: SyncConflict[];
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Generate unique ID for changes.
 */
export const generateChangeId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Get priority for entity type.
 */
export const getEntityPriority = (entityType: EntityType): SyncPriority =>
  ENTITY_PRIORITY[entityType] || 'medium';

/**
 * Get priority config.
 */
export const getPriorityConfig = (priority: SyncPriority) =>
  PRIORITY_CONFIG[priority];
