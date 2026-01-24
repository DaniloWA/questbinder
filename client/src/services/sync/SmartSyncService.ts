/**
 * SmartSync System - SmartSyncService
 * 
 * Central coordinator for the sync system. Handles:
 * - Local state updates with optimistic UI
 * - Remote sync via socket
 * - Subscription management for reactive updates
 * - Conflict detection and resolution
 * - Retry logic with exponential backoff
 * - Connection state management
 */

import { socketService } from '../socketService';
import { syncCache, SyncCache } from './SyncCache';
import { syncQueue, SyncQueue } from './SyncQueue';
import { retryManager, RetryManager } from './RetryManager';
import { DebugLogger } from '../../utils/DebugLogger';
import { connectionManager, ConnectionManager, ConnectionStatus } from './ConnectionManager';
import { resolveConflict, getMergeStrategy } from './strategies';
import {
  EntityType,
  ChangeType,
  PendingChange,
  SyncEvent,
  ChangeCallback,
  CollectionCallback,
  Subscription,
  SubscriptionOptions,
  SyncConflict,
  ConflictStrategy,
  SyncStatus,
  SmartSyncOptions,
  CacheEntry,
  generateChangeId,
} from './types';

/**
 * SmartSyncService - Main sync coordinator.
 * 
 * Usage:
 * ```ts
 * // Apply a local change
 * smartSync.apply('token', tokenId, 'update', { x: 10, y: 20 }, sceneId);
 * 
 * // Subscribe to changes
 * const unsub = smartSync.subscribe('token', (id, data, type) => {
 *   console.log('Token changed:', id, type);
 * });
 * ```
 */
export class SmartSyncService {
  private cache: SyncCache;
  private queue: SyncQueue;
  private retry: RetryManager;
  private connection: ConnectionManager;
  private subscriptions: Map<string, Subscription> = new Map();
  private conflicts: SyncConflict[] = [];
  private baseDataCache: Map<string, unknown> = new Map(); // Store base data for merge
  private options: SmartSyncOptions;
  private initialized = false;
  private connectionUnsubscribe: (() => void) | null = null;

  constructor(
    cache: SyncCache = syncCache,
    queue: SyncQueue = syncQueue,
    retry: RetryManager = retryManager,
    connection: ConnectionManager = connectionManager,
    options: SmartSyncOptions = {}
  ) {
    this.cache = cache;
    this.queue = queue;
    this.retry = retry;
    this.connection = connection;
    this.options = {
      debug: false,
      defaultConflictStrategy: 'merge', // Changed default to merge for better UX
      optimisticUpdates: true,
      maxRetries: 5,
      retryDelayMs: 500,
      ...options,
    };

    // Setup retry callbacks
    this.retry.setOnRetry((change) => this.handleRetry(change));
    this.retry.setOnMaxRetriesExceeded((change, error) => this.handleMaxRetriesExceeded(change, error));
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize the sync service and set up socket listeners.
   * Can optionally hydrate cache from initial state.
   */
  init(initialState?: any): void {
    if (this.initialized && !initialState) return;

    if (!this.initialized) {
      this.setupSocketListeners();
      this.setupConnectionListener();
      this.initialized = true;
    }

    if (initialState) {
      this.hydrate(initialState);
    }

    if (this.options.debug) {
      DebugLogger.log('sync', 'SmartSyncService', 'Init', 'Initialized', { options: this.options, hydrated: !!initialState });
    }
  }

  /**
   * Hydrate cache from full game state.
   */
  private hydrate(state: any): void {
    if (!state || !state.scenes) return;

    const scenes = state.scenes as any[];

    // Scenes
    scenes.forEach(scene => {
      this.cache.set('scene', scene.id, scene, scene.version || 0);

      // Tokens
      scene.tokens?.forEach((token: any) => {
        this.cache.set('token', token.id, token, token.version || 0, scene.id);
      });

      // Drawings
      scene.drawings?.forEach((drawing: any) => {
        this.cache.set('drawing', drawing.id, drawing, drawing.version || 0, scene.id);
      });

      // Obstacles
      scene.obstacles?.forEach((obstacle: any) => {
        this.cache.set('obstacle', obstacle.id, obstacle, obstacle.version || 0, scene.id);
      });
    });

    // Characters
    state.campaignCharacters?.forEach((char: any) => {
      this.cache.set('character', char.id, char, char.version || 0);
    });

    if (this.options.debug) {
      DebugLogger.log('sync', 'SmartSyncService', 'Hydrate', 'Hydrated from state:', this.cache.getStats());
    }
  }

  /**
   * Setup connection state listener.
   */
  private setupConnectionListener(): void {
    this.connectionUnsubscribe = this.connection.subscribe((status) => {
      if (status.state === 'connected' && this.queue.getPendingCount() > 0) {
        // Reconnected - flush pending changes
        if (this.options.debug) {
          DebugLogger.log('sync', 'SmartSyncService', 'Connection', 'Reconnected, flushing pending changes');
        }
        this.queue.flushAll();
      }
    });
  }

  /**
   * Set up socket listeners for sync acknowledgement events only.
   * 
   * NOTE: Entity-specific listeners (token, scene, character, drawing) are now
   * handled by the listener modules in gameSession/hooks/listeners/.
   * Those listeners call notifySmartSync() to pipe events to this service's cache.
   * 
   * This avoids code duplication while maintaining all SmartSync features:
   * - Conflict detection
   * - Version tracking
   * - Optimistic updates
   * - Subscription notifications
   */
  private setupSocketListeners(): void {
    // Only handle sync acknowledgement events - entity events come via notifySmartSync()
    (socketService as any).on?.('sync:ack', (payload: any) => {
      this.handleAck(payload);
    });

    (socketService as any).on?.('sync:reject', (payload: any) => {
      this.handleReject(payload);
    });
  }

  // ===========================================================================
  // LOCAL CHANGES
  // ===========================================================================

  /**
   * Apply a local change (optimistic + queue for remote).
   */
  apply<T>(
    entityType: EntityType,
    entityId: string,
    changeType: ChangeType,
    data: Partial<T>,
    parentId?: string
  ): string {
    const entry = this.cache.getEntry(entityType, entityId);
    const version = entry?.version || 0;

    // Generate change ID
    const changeId = generateChangeId();

    // Optimistic update
    if (this.options.optimisticUpdates) {
      if (changeType === 'update' || changeType === 'move') {
        this.cache.applyOptimisticUpdate(entityType, entityId, data, changeId);
      } else if (changeType === 'create') {
        this.cache.set(entityType, entityId, data, version, parentId, true);
      } else if (changeType === 'delete') {
        this.cache.delete(entityType, entityId);
      }
    }

    // Queue for remote sync
    this.queue.enqueue(entityType, entityId, changeType, data, parentId, version);

    // Notify subscribers
    this.notifySubscribers(entityType, entityId, data as T, changeType, parentId);

    if (this.options.debug) {
      DebugLogger.log('sync', 'SmartSyncService', 'Apply', 'Applied change:', { entityType, entityId, changeType, data });
    }

    return changeId;
  }

  /**
   * Apply multiple changes in a batch.
   */
  applyBatch<T>(
    changes: Array<{
      entityType: EntityType;
      entityId: string;
      changeType: ChangeType;
      data: Partial<T>;
      parentId?: string;
    }>
  ): string[] {
    return changes.map(c =>
      this.apply(c.entityType, c.entityId, c.changeType, c.data, c.parentId)
    );
  }

  // ===========================================================================
  // REMOTE CHANGES
  // ===========================================================================

  /**
   * Handle incoming sync event from server.
   */
  receive<T>(event: SyncEvent<T>): void {
    const { entityType, entityId, changeType, data, version, parentId } = event;

    // Check for conflicts
    const entry = this.cache.getEntry(entityType, entityId);

    // CRITICAL FIX: "Client Wins on Dirty"
    // If we have pending local changes for this entity, IGNORE the server update.
    // The server update is likely "stale" (pre-move state) if our move hasn't processed yet.
    // We trust that our pending queue will eventually overwrite the server.
    if (entry && entry.dirty && entry.pendingChanges.length > 0) {
      // Exception: If server says DELETE, we might want to respect it? 
      // For now, protect local state against overwrites.
      if (changeType !== 'create') { // Create confirmation is handled below
        if (this.options.debug) {
          DebugLogger.warn('sync', 'SmartSyncService', 'Receive', 'Ignored remote update for dirty entity:', entityId);
        }
        return;
      }
    }

    // Skip conflict check for CREATE - server is confirming our optimistic create
    // Also skip for updates to our own pending creates
    if (entry && entry.dirty && entry.pendingChanges.length > 0 && changeType !== 'create') {
      // Potential conflict - actually we just Handled it above by returning early.
      // But keeping logic for "Create" confirmation or specialized conflict types.
      const conflict = this.detectConflict(entry, event);
      if (conflict) {
        this.handleConflict(conflict);
        return;
      }
    }

    // If server confirms our create, clear pending state
    if (changeType === 'create' && entry && entry.dirty) {
      // Clear all pending changes for this entity since server confirmed
      for (const changeId of entry.pendingChanges) {
        this.queue.dequeue(changeId);
      }
      if (this.options.debug) {
        DebugLogger.log('sync', 'SmartSyncService', 'Receive', 'Server confirmed creation, cleared pending state for:', entityId);
      }
    }

    // Apply remote change
    if (changeType === 'delete') {
      this.cache.delete(entityType, entityId);
    } else {
      this.cache.set(entityType, entityId, data, version, parentId, false);
    }

    // Notify subscribers
    this.notifySubscribers(entityType, entityId, changeType === 'delete' ? null : data, changeType, parentId);

    if (this.options.debug) {
      DebugLogger.log('sync', 'SmartSyncService', 'Receive', 'Received:', { entityType, entityId, changeType });
    }
  }

  // ===========================================================================
  // SUBSCRIPTIONS
  // ===========================================================================

  /**
   * Subscribe to entity changes.
   */
  subscribe<T>(
    entityType: EntityType,
    callback: ChangeCallback<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    const id = generateChangeId();
    const subscription: Subscription = {
      id,
      entityType,
      callback: callback as ChangeCallback,
      options,
    };

    this.subscriptions.set(id, subscription);

    return () => {
      this.subscriptions.delete(id);
    };
  }

  /**
   * Subscribe to all entities of a type.
   */
  subscribeCollection<T>(
    entityType: EntityType,
    callback: CollectionCallback<T>,
    options: SubscriptionOptions = {}
  ): () => void {
    // Wrap as entity callback
    const wrappedCallback: ChangeCallback<T> = (entityId, data, changeType) => {
      const entities = this.cache.getAll<T>(entityType);
      callback(entities, [entityId]);
    };

    return this.subscribe(entityType, wrappedCallback, options);
  }

  /**
   * Notify all relevant subscribers.
   */
  private notifySubscribers<T>(
    entityType: EntityType,
    entityId: string,
    data: T | null,
    changeType: ChangeType,
    parentId?: string
  ): void {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.entityType !== entityType) continue;

      const { options, callback } = subscription;

      // Filter by ID
      if (options.filterIds && !options.filterIds.includes(entityId)) continue;

      // Filter by change type
      if (options.filterChangeTypes && !options.filterChangeTypes.includes(changeType)) continue;

      // Call subscriber
      try {
        (callback as ChangeCallback<T>)(entityId, data, changeType, parentId);
      } catch (error) {
        DebugLogger.error('sync', 'SmartSyncService', 'Notify', 'Subscriber error:', error);
      }
    }
  }

  // ===========================================================================
  // CONFLICT RESOLUTION
  // ===========================================================================

  /**
   * Detect if there's a conflict between local and remote.
   */
  private detectConflict<T>(
    localEntry: import('./types').CacheEntry<T>,
    remoteEvent: SyncEvent<T>
  ): SyncConflict<T> | null {
    // Simple version comparison
    if (remoteEvent.version > localEntry.version) {
      // Remote is newer, but we have pending changes
      return {
        entityType: remoteEvent.entityType,
        entityId: remoteEvent.entityId,
        localChange: {
          id: localEntry.pendingChanges[0] || 'unknown',
          entityType: remoteEvent.entityType,
          entityId: remoteEvent.entityId,
          changeType: 'update',
          data: localEntry.data as Partial<T>,
          version: localEntry.version,
          timestamp: localEntry.lastSync,
          optimistic: true,
          priority: 'medium',
        },
        remoteChange: remoteEvent,
        localVersion: localEntry.version,
        remoteVersion: remoteEvent.version,
      };
    }

    return null;
  }

  /**
   * Handle a sync conflict.
   */
  private handleConflict<T>(conflict: SyncConflict<T>): void {
    const strategy = this.options.defaultConflictStrategy || 'remote-wins';

    if (this.options.debug) {
      DebugLogger.warn('sync', 'SmartSyncService', 'Conflict', 'Conflict detected:', conflict);
    }

    this.conflicts.push(conflict as SyncConflict);

    switch (strategy) {
      case 'remote-wins':
        if (this.options.debug) DebugLogger.warn('sync', 'SmartSyncService', 'Resolve', 'Strategy: Remote Wins', { id: conflict.entityId });
        // Accept remote, discard local
        this.cache.set(
          conflict.entityType,
          conflict.entityId,
          conflict.remoteChange.data,
          conflict.remoteVersion,
          conflict.remoteChange.parentId,
          false
        );
        // Remove pending changes
        for (const changeId of (this.cache.getEntry(conflict.entityType, conflict.entityId)?.pendingChanges || [])) {
          this.queue.dequeue(changeId);
        }
        break;

      case 'local-wins':
        if (this.options.debug) DebugLogger.warn('sync', 'SmartSyncService', 'Resolve', 'Strategy: Local Wins (Re-queuing)', { id: conflict.entityId });
        // Keep local, re-queue for sync
        // The local data is already in cache
        break;

      case 'merge':
        if (this.options.debug) DebugLogger.log('sync', 'SmartSyncService', 'Resolve', 'Strategy: Automated Merge', { id: conflict.entityId });
        // Attempt to merge
        const merged = this.mergeChanges(conflict);
        this.cache.set(
          conflict.entityType,
          conflict.entityId,
          merged,
          conflict.remoteVersion + 1,
          conflict.remoteChange.parentId,
          true
        );
        break;

      case 'manual':
        if (this.options.debug) DebugLogger.warn('sync', 'SmartSyncService', 'Resolve', 'Strategy: Manual Intervention Required');
        // Store conflict for UI to resolve
        // Don't apply remote
        break;
    }

    // Notify subscribers about the resolved state
    this.notifySubscribers(
      conflict.entityType,
      conflict.entityId,
      this.cache.get(conflict.entityType, conflict.entityId),
      'update',
      conflict.remoteChange.parentId
    );
  }

  /**
   * Merge local and remote changes (simple property merge).
   */
  private mergeChanges<T>(conflict: SyncConflict<T>): T {
    return {
      ...conflict.remoteChange.data,
      ...conflict.localChange.data,
    } as T;
  }

  // ===========================================================================
  // RETRY HANDLING
  // ===========================================================================

  /**
   * Handle a retry attempt for a failed change.
   */
  private handleRetry(change: PendingChange): void {
    if (this.options.debug) {
      DebugLogger.log('sync', 'SmartSyncService', 'Retry', 'Retrying change:', change.id);
    }

    // Re-queue the change
    this.queue.enqueue(
      change.entityType,
      change.entityId,
      change.changeType,
      change.data,
      change.parentId,
      change.version
    );
  }

  /**
   * Handle when max retries are exceeded.
   */
  private handleMaxRetriesExceeded(change: PendingChange, error: string): void {
    DebugLogger.error('sync', 'SmartSyncService', 'Retry', 'Max retries exceeded for change:', { id: change.id, error });

    // Remove from cache's pending list
    const entry = this.cache.getEntry(change.entityType, change.entityId);
    if (entry) {
      // Rollback to last known good state if possible
      const baseKey = `${change.entityType}:${change.entityId}`;
      const baseData = this.baseDataCache.get(baseKey);
      if (baseData) {
        this.cache.rollbackChange(change.entityType, change.entityId, change.id, baseData);
        this.baseDataCache.delete(baseKey);
      }
    }

    // Notify subscribers of the failure (they might want to show an error)
    this.notifySubscribers(
      change.entityType,
      change.entityId,
      this.cache.get(change.entityType, change.entityId),
      'update',
      change.parentId
    );
  }

  /**
   * Store base data before applying optimistic update (for rollback).
   */
  private storeBaseData<T>(entityType: EntityType, entityId: string, data: T): void {
    const key = `${entityType}:${entityId}`;
    if (!this.baseDataCache.has(key)) {
      this.baseDataCache.set(key, data);
    }
  }

  /**
   * Clear base data after successful sync.
   */
  private clearBaseData(entityType: EntityType, entityId: string): void {
    const key = `${entityType}:${entityId}`;
    this.baseDataCache.delete(key);
  }

  // ===========================================================================
  // ACKNOWLEDGEMENT HANDLING
  // ===========================================================================

  private handleAck(payload: any) {
    const { changeId, version } = payload;
    if (this.options.debug) {
      DebugLogger.log('sync', 'SmartSyncService', 'Ack', 'ACK received:', payload);
    }

    // Get the pending change to know which entity to update
    const pendingChange = this.queue.getChange(changeId);

    // Get any merged IDs (older changes merged into this one)
    const mergedIds = this.queue.getMergedIds(changeId);

    if (pendingChange) {
      // Confirm primary change
      this.cache.confirmChange(
        pendingChange.entityType,
        pendingChange.entityId,
        changeId,
        version || pendingChange.version + 1
      );

      // Confirm all merged changes (they are implicitly ACKed by the latest state)
      for (const mergedId of mergedIds) {
        this.cache.confirmChange(
          pendingChange.entityType,
          pendingChange.entityId,
          mergedId,
          version || pendingChange.version + 1
        );
      }
    }

    // Remove from queue (confirmed)
    this.queue.dequeue(changeId);
  }

  private handleReject(payload: any) {
    const { changeId, version, data } = payload;
    DebugLogger.warn('sync', 'SmartSyncService', 'Reject', 'REJECT received:', payload);

    // Retrieve pending change before dequeuing
    const pendingChange = this.queue.getChange(changeId);

    // Remove from queue (failed)
    this.queue.dequeue(changeId);

    if (pendingChange) {
      const targetId = (data && data.id) || pendingChange.entityId;
      const mergedIds = this.queue.getMergedIds(changeId);

      if (data) {
        // Server sent the correct state - apply it immediately to fix desync
        // This essentially works like "Server Wins" on conflict
        this.cache.rollbackChange(
          pendingChange.entityType,
          targetId,
          changeId,
          data,
          version || pendingChange.version + 1
        );

        // Also rollback merged IDs
        for (const mergedId of mergedIds) {
          this.cache.rollbackChange(
            pendingChange.entityType,
            targetId,
            mergedId,
            data,
            version || pendingChange.version + 1
          );
        }

        // Notify subscribers of the "fix"
        this.notifySubscribers(
          pendingChange.entityType,
          targetId,
          data,
          'update',
          pendingChange.parentId
        );

        DebugLogger.log('sync', 'SmartSyncService', 'Reject', 'Applied server state for rejected change:', targetId);
      } else {
        // No data provided, but we must clear the pending status to unblock sync
        // We revert to current state (effectively accepting it locally but marking not dirty)
        // ideally we would revert to pre-optimistic state, but we don't track that currently without baseData
        const currentData = this.cache.get(pendingChange.entityType, targetId);
        if (currentData) {
          this.cache.rollbackChange(
            pendingChange.entityType,
            targetId,
            changeId,
            currentData
          );
          // Also rollback merged IDs
          for (const mergedId of mergedIds) {
            this.cache.rollbackChange(
              pendingChange.entityType,
              targetId,
              mergedId,
              currentData
            );
          }
          DebugLogger.warn('sync', 'SmartSyncService', 'Reject', 'Cleared pending status without data rollback:', targetId);
        } else {
          DebugLogger.warn('sync', 'SmartSyncService', 'Reject', 'Could not find entity to clear pending status:', targetId);
        }
      }
    } else {
      DebugLogger.warn('sync', 'SmartSyncService', 'Reject', 'Rejected change not found in queue:', changeId);
    }
  }

  // ===========================================================================
  // STATUS & UTILITIES
  // ===========================================================================

  /**
   * Get current sync status.
   */
  getStatus(): SyncStatus {
    const connectionStatus = this.connection.getStatus();
    return {
      connected: connectionStatus.state === 'connected',
      pendingChanges: this.queue.getPendingCount() + this.retry.getPendingCount(),
      lastSyncTime: connectionStatus.lastConnected || Date.now(),
      conflicts: this.conflicts,
    };
  }

  /**
   * Clear all conflicts.
   */
  clearConflicts(): void {
    this.conflicts = [];
  }

  /**
   * Flush all pending changes immediately.
   */
  flush(): void {
    this.queue.flushAll();
  }

  /**
   * Get entity from cache.
   */
  get<T>(entityType: EntityType, id: string): T | null {
    return this.cache.get<T>(entityType, id);
  }

  /**
   * Get all entities of a type.
   */
  getAll<T>(entityType: EntityType): Map<string, T> {
    return this.cache.getAll<T>(entityType);
  }

  /**
   * Debug log current state.
   */
  debug(): void {
    DebugLogger.log('sync', 'SmartSyncService', 'Debug', 'Status:', this.getStatus());
    DebugLogger.log('sync', 'SmartSyncService', 'Debug', 'Subscriptions:', this.subscriptions.size);
    this.cache.debug();
    this.queue.debug();
  }
}

// Export singleton instance
export const smartSync = new SmartSyncService(undefined, undefined, undefined, undefined, { debug: true });
