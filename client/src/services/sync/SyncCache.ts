/**
 * SmartSync System - SyncCache
 * 
 * Intelligent cache for versioned entities with dirty tracking
 * and optimistic update support.
 */

import {
  EntityType,
  CacheEntry,
  CacheStats,
  ChangeType,
  PendingChange,
} from './types';
import { DebugLogger } from '../../utils/DebugLogger';

/**
 * SyncCache - Versioned entity cache with dirty tracking.
 * 
 * Features:
 * - Version tracking for conflict detection
 * - Dirty flag for pending local changes
 * - Optimistic update support
 * - Entity grouping by parent (e.g., tokens by sceneId)
 */
export class SyncCache {
  private cache: Map<EntityType, Map<string, CacheEntry>> = new Map();
  private parentIndex: Map<string, Set<string>> = new Map(); // parentId -> entityIds
  private stats = { hits: 0, misses: 0 };

  constructor() {
    // Initialize entity type maps
    const entityTypes: EntityType[] = [
      'token', 'scene', 'character', 'obstacle', 'drawing',
      'lightZone', 'audioZone', 'triggerZone', 'attackZone',
      'combat', 'combatant', 'handout', 'campaign',
      'chatMessage', 'player'
    ];

    for (const type of entityTypes) {
      this.cache.set(type, new Map());
    }
  }

  // ===========================================================================
  // CORE OPERATIONS
  // ===========================================================================

  /**
   * Get an entity from cache.
   */
  get<T>(entityType: EntityType, id: string): T | null {
    const typeCache = this.cache.get(entityType);
    if (!typeCache) {
      this.stats.misses++;
      return null;
    }

    const entry = typeCache.get(id);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Get full cache entry (including metadata).
   */
  getEntry<T>(entityType: EntityType, id: string): CacheEntry<T> | null {
    const typeCache = this.cache.get(entityType);
    return typeCache?.get(id) as CacheEntry<T> | null;
  }

  /**
   * Set/update an entity in cache.
   */
  set<T>(
    entityType: EntityType,
    id: string,
    data: T,
    version: number,
    parentId?: string,
    dirty = false
  ): void {
    let typeCache = this.cache.get(entityType);
    if (!typeCache) {
      typeCache = new Map();
      this.cache.set(entityType, typeCache);
    }

    const existingEntry = typeCache.get(id);
    const entry: CacheEntry<T> = {
      data,
      version,
      lastSync: Date.now(),
      dirty,
      pendingChanges: existingEntry?.pendingChanges || [],
    };

    typeCache.set(id, entry as CacheEntry);

    // Update parent index
    if (parentId) {
      const parentKey = `${entityType}:${parentId}`;
      let children = this.parentIndex.get(parentKey);
      if (!children) {
        children = new Set();
        this.parentIndex.set(parentKey, children);
      }
      children.add(id);
    }
  }

  /**
   * Apply optimistic update to entity.
   */
  applyOptimisticUpdate<T>(
    entityType: EntityType,
    id: string,
    changes: Partial<T>,
    changeId: string
  ): T | null {
    const typeCache = this.cache.get(entityType);
    if (!typeCache) return null;

    const entry = typeCache.get(id);
    if (!entry) return null;

    // Merge changes
    const updatedData = { ...(entry.data as object), ...changes } as T;
    const updatedEntry: CacheEntry = {
      ...entry,
      data: updatedData,
      dirty: true,
      pendingChanges: [...entry.pendingChanges, changeId],
    };

    typeCache.set(id, updatedEntry);
    return updatedData as T;
  }

  /**
   * Confirm a pending change (server acknowledged).
   */
  confirmChange(entityType: EntityType, id: string, changeId: string, newVersion: number): void {
    const typeCache = this.cache.get(entityType);
    if (!typeCache) return;

    const entry = typeCache.get(id);
    if (!entry) return;

    const updatedPending = entry.pendingChanges.filter(c => c !== changeId);
    const updatedEntry: CacheEntry = {
      ...entry,
      version: newVersion,
      lastSync: Date.now(),
      dirty: updatedPending.length > 0,
      pendingChanges: updatedPending,
    };

    typeCache.set(id, updatedEntry);
  }

  /**
   * Rollback a pending change (server rejected or conflict).
   */
  rollbackChange<T>(
    entityType: EntityType,
    id: string,
    changeId: string,
    originalData: T
  ): void {
    const typeCache = this.cache.get(entityType);
    if (!typeCache) return;

    const entry = typeCache.get(id);
    if (!entry) return;

    const updatedPending = entry.pendingChanges.filter(c => c !== changeId);
    const updatedEntry: CacheEntry<T> = {
      ...entry,
      data: originalData,
      dirty: updatedPending.length > 0,
      pendingChanges: updatedPending,
    };

    typeCache.set(id, updatedEntry as CacheEntry);
  }

  /**
   * Delete an entity from cache.
   */
  delete(entityType: EntityType, id: string): boolean {
    const typeCache = this.cache.get(entityType);
    if (!typeCache) return false;

    const deleted = typeCache.delete(id);

    // Clean up parent index
    for (const [parentKey, children] of this.parentIndex) {
      if (children.has(id)) {
        children.delete(id);
        if (children.size === 0) {
          this.parentIndex.delete(parentKey);
        }
        break;
      }
    }

    return deleted;
  }

  // ===========================================================================
  // BULK OPERATIONS
  // ===========================================================================

  /**
   * Get all entities of a type.
   */
  getAll<T>(entityType: EntityType): Map<string, T> {
    const typeCache = this.cache.get(entityType);
    if (!typeCache) return new Map();

    const result = new Map<string, T>();
    for (const [id, entry] of typeCache) {
      result.set(id, entry.data as T);
    }
    return result;
  }

  /**
   * Get all entities under a parent.
   */
  getByParent<T>(entityType: EntityType, parentId: string): Map<string, T> {
    const parentKey = `${entityType}:${parentId}`;
    const childIds = this.parentIndex.get(parentKey);
    if (!childIds) return new Map();

    const typeCache = this.cache.get(entityType);
    if (!typeCache) return new Map();

    const result = new Map<string, T>();
    for (const id of childIds) {
      const entry = typeCache.get(id);
      if (entry) {
        result.set(id, entry.data as T);
      }
    }
    return result;
  }

  /**
   * Invalidate cache for entity type (optionally specific id).
   */
  invalidate(entityType: EntityType, id?: string): void {
    const typeCache = this.cache.get(entityType);
    if (!typeCache) return;

    if (id) {
      typeCache.delete(id);
    } else {
      typeCache.clear();
    }
  }

  /**
   * Clear all cache.
   */
  clear(): void {
    for (const typeCache of this.cache.values()) {
      typeCache.clear();
    }
    this.parentIndex.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  // ===========================================================================
  // DIRTY TRACKING
  // ===========================================================================

  /**
   * Get all dirty entries across all types.
   */
  getDirtyEntries(): Array<{ entityType: EntityType; id: string; entry: CacheEntry; }> {
    const dirty: Array<{ entityType: EntityType; id: string; entry: CacheEntry; }> = [];

    for (const [entityType, typeCache] of this.cache) {
      for (const [id, entry] of typeCache) {
        if (entry.dirty) {
          dirty.push({ entityType, id, entry });
        }
      }
    }

    return dirty;
  }

  /**
   * Check if any entities have pending changes.
   */
  hasPendingChanges(): boolean {
    for (const typeCache of this.cache.values()) {
      for (const entry of typeCache.values()) {
        if (entry.dirty || entry.pendingChanges.length > 0) {
          return true;
        }
      }
    }
    return false;
  }

  // ===========================================================================
  // STATS & DEBUGGING
  // ===========================================================================

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    let totalEntries = 0;
    let dirtyEntries = 0;
    let pendingChanges = 0;

    for (const typeCache of this.cache.values()) {
      totalEntries += typeCache.size;
      for (const entry of typeCache.values()) {
        if (entry.dirty) dirtyEntries++;
        pendingChanges += entry.pendingChanges.length;
      }
    }

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      totalEntries,
      dirtyEntries,
      hitRate,
      pendingChanges,
    };
  }

  /**
   * Debug log cache state.
   */
  debug(): void {
    console.group('[SyncCache] State');
    DebugLogger.log('sync', 'SyncCache', 'Debug', 'Stats:', this.getStats());

    for (const [entityType, typeCache] of this.cache) {
      if (typeCache.size > 0) {
        DebugLogger.log('sync', 'SyncCache', 'Contents', `${entityType}: ${typeCache.size} entries`);
      }
    }

    console.groupEnd();
  }
}

// Export singleton instance
export const syncCache = new SyncCache();
