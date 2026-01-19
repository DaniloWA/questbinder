/**
 * SmartSync - Merge Strategies
 * 
 * Per-entity merge strategies for intelligent conflict resolution.
 * Each entity type can define custom merge logic.
 */

import type { EntityType, PendingChange, SyncEvent, ConflictResolution, ConflictStrategy } from '../types';

// =============================================================================
// MERGE STRATEGY INTERFACE
// =============================================================================

/**
 * A merge strategy for a specific entity type.
 */
export interface MergeStrategy<T = unknown> {
  /** Entity type this strategy handles */
  entityType: EntityType;

  /**
   * Determine if local and remote changes are conflicting.
   * @returns true if there's a genuine conflict, false if changes can be auto-merged
   */
  hasConflict(local: Partial<T>, remote: T, base?: T): boolean;

  /**
   * Merge local and remote changes.
   * @returns The merged result
   */
  merge(local: Partial<T>, remote: T, base?: T): T;

  /**
   * Get fields that were changed between two versions.
   */
  getChangedFields(before: T, after: Partial<T>): (keyof T)[];
}

// =============================================================================
// TOKEN MERGE STRATEGY
// =============================================================================

interface TokenData {
  id: string;
  x: number;
  y: number;
  size: number;
  name: string;
  imgUrl?: string;
  hp?: number;
  hpMax?: number;
  ac?: number;
  speed?: number;
  isVisibleToPlayers?: boolean;
  conditions?: string[];
  [key: string]: unknown;
}

export const tokenMergeStrategy: MergeStrategy<TokenData> = {
  entityType: 'token',

  hasConflict(local, remote, base) {
    // Position changes are frequent - only conflict if both changed position
    const localChangedPos = local.x !== undefined || local.y !== undefined;
    const remoteChangedPos = base && (remote.x !== base.x || remote.y !== base.y);

    // If both changed position, that's a conflict
    if (localChangedPos && remoteChangedPos) {
      return true;
    }

    // Check for overlapping field changes
    const localFields = Object.keys(local) as (keyof TokenData)[];
    for (const field of localFields) {
      if (base && remote[field] !== base[field] && local[field] !== remote[field]) {
        return true; // Same field changed differently
      }
    }

    return false;
  },

  merge(local, remote, _base) {
    // For tokens, prefer local position changes (better UX)
    // Remote wins for other properties unless locally changed
    return {
      ...remote,
      ...local, // Local changes overlay remote
    };
  },

  getChangedFields(before, after) {
    const changed: (keyof TokenData)[] = [];
    for (const key of Object.keys(after) as (keyof TokenData)[]) {
      if (after[key] !== before[key]) {
        changed.push(key);
      }
    }
    return changed;
  },
};

// =============================================================================
// SCENE MERGE STRATEGY
// =============================================================================

interface SceneData {
  id: string;
  name: string;
  imageUrl?: string;
  fog?: string;
  obstacles?: unknown[];
  lightZones?: unknown[];
  audioZones?: unknown[];
  triggerZones?: unknown[];
  drawings?: unknown[];
  grid?: { size: number; cols: number; rows: number; };
  [key: string]: unknown;
}

export const sceneMergeStrategy: MergeStrategy<SceneData> = {
  entityType: 'scene',

  hasConflict(local, remote, base) {
    // Scenes rarely have position conflicts
    // Array fields (obstacles, zones) need special handling
    const arrayFields: (keyof SceneData)[] = ['obstacles', 'lightZones', 'audioZones', 'triggerZones', 'drawings'];

    for (const field of arrayFields) {
      if (local[field] !== undefined && base && remote[field] !== base[field]) {
        return true; // Both modified an array field
      }
    }

    return false;
  },

  merge(local, remote, _base) {
    // For arrays, concatenate new items instead of replacing
    const result = { ...remote };

    for (const key of Object.keys(local) as (keyof SceneData)[]) {
      const localValue = local[key];
      const remoteValue = remote[key];

      if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
        // Merge arrays by ID (assuming items have id property)
        const merged = [...remoteValue];
        for (const item of localValue) {
          const existing = merged.findIndex((r: any) => r.id === (item as any).id);
          if (existing >= 0) {
            merged[existing] = { ...merged[existing], ...item };
          } else {
            merged.push(item);
          }
        }
        (result as any)[key] = merged;
      } else if (localValue !== undefined) {
        (result as any)[key] = localValue;
      }
    }

    return result;
  },

  getChangedFields(before, after) {
    const changed: (keyof SceneData)[] = [];
    for (const key of Object.keys(after) as (keyof SceneData)[]) {
      if (JSON.stringify(after[key]) !== JSON.stringify(before[key])) {
        changed.push(key);
      }
    }
    return changed;
  },
};

// =============================================================================
// CHARACTER MERGE STRATEGY
// =============================================================================

interface CharacterData {
  id: string;
  name: string;
  hpCurrent?: number;
  hpMax?: number;
  ac?: number;
  level?: number;
  [key: string]: unknown;
}

export const characterMergeStrategy: MergeStrategy<CharacterData> = {
  entityType: 'character',

  hasConflict(local, remote, base) {
    // HP changes are critical - detect concurrent HP modifications
    const localChangedHp = local.hpCurrent !== undefined;
    const remoteChangedHp = base && remote.hpCurrent !== base.hpCurrent;

    if (localChangedHp && remoteChangedHp) {
      return true;
    }

    return false;
  },

  merge(local, remote, base) {
    // For HP, calculate delta and apply both
    if (local.hpCurrent !== undefined && base?.hpCurrent !== undefined) {
      const localDelta = local.hpCurrent - base.hpCurrent;
      const remoteDelta = remote.hpCurrent! - base.hpCurrent;
      const mergedHp = base.hpCurrent + localDelta + remoteDelta;

      return {
        ...remote,
        ...local,
        hpCurrent: Math.max(0, Math.min(mergedHp, remote.hpMax || 100)),
      };
    }

    return { ...remote, ...local };
  },

  getChangedFields(before, after) {
    const changed: (keyof CharacterData)[] = [];
    for (const key of Object.keys(after) as (keyof CharacterData)[]) {
      if (after[key] !== before[key]) {
        changed.push(key);
      }
    }
    return changed;
  },
};

// =============================================================================
// DEFAULT MERGE STRATEGY
// =============================================================================

export const defaultMergeStrategy: MergeStrategy<Record<string, unknown>> = {
  entityType: 'campaign', // Fallback

  hasConflict(local, remote, base) {
    // Simple check: any overlapping fields changed
    for (const key of Object.keys(local)) {
      if (base && remote[key] !== base[key]) {
        return true;
      }
    }
    return false;
  },

  merge(local, remote, _base) {
    // Remote wins, then apply local on top
    return { ...remote, ...local };
  },

  getChangedFields(before, after) {
    const changed: string[] = [];
    for (const key of Object.keys(after)) {
      if (after[key] !== before[key]) {
        changed.push(key);
      }
    }
    return changed as (keyof Record<string, unknown>)[];
  },
};

// =============================================================================
// STRATEGY REGISTRY
// =============================================================================

const strategyRegistry = new Map<EntityType, MergeStrategy<any>>();

// Register built-in strategies
strategyRegistry.set('token', tokenMergeStrategy);
strategyRegistry.set('scene', sceneMergeStrategy);
strategyRegistry.set('character', characterMergeStrategy);

/**
 * Get merge strategy for entity type.
 */
export function getMergeStrategy<T>(entityType: EntityType): MergeStrategy<T> {
  return (strategyRegistry.get(entityType) || defaultMergeStrategy) as MergeStrategy<T>;
}

/**
 * Register a custom merge strategy.
 */
export function registerMergeStrategy<T>(strategy: MergeStrategy<T>): void {
  strategyRegistry.set(strategy.entityType, strategy);
}

// =============================================================================
// CONFLICT RESOLVER
// =============================================================================

/**
 * Resolve a conflict using the appropriate strategy.
 */
export function resolveConflict<T>(
  localChange: PendingChange<T>,
  remoteEvent: SyncEvent<T>,
  baseData: T | undefined,
  preferredStrategy: ConflictStrategy = 'merge'
): ConflictResolution<T> {
  const strategy = getMergeStrategy<T>(localChange.entityType);

  switch (preferredStrategy) {
    case 'local-wins':
      return {
        strategy: 'local-wins',
        resolvedData: { ...remoteEvent.data, ...localChange.data } as T,
      };

    case 'remote-wins':
      return {
        strategy: 'remote-wins',
        resolvedData: remoteEvent.data,
        discardedChanges: [localChange],
      };

    case 'merge':
      const merged = strategy.merge(localChange.data, remoteEvent.data, baseData);
      return {
        strategy: 'merge',
        resolvedData: merged,
      };

    case 'manual':
    default:
      // For manual, return remote data but flag as needing review
      return {
        strategy: 'manual',
        resolvedData: remoteEvent.data,
      };
  }
}
