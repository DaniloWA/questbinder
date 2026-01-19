/**
 * SmartSync - Diff Utilities
 * 
 * Utilities for computing deltas between entities to minimize network traffic.
 */

// =============================================================================
// DIFF TYPES
// =============================================================================

/**
 * A computed diff between two versions.
 */
export interface EntityDiff<T = unknown> {
  /** Fields that were added or modified */
  changed: Partial<T>;
  /** Fields that were removed */
  removed: (keyof T)[];
  /** Whether the entity was created */
  isCreate: boolean;
  /** Whether the entity was deleted */
  isDelete: boolean;
  /** Size of the diff (number of changed fields) */
  size: number;
}

// =============================================================================
// DIFF FUNCTIONS
// =============================================================================

/**
 * Compute diff between two versions of an entity.
 * Returns only the fields that changed.
 */
export function computeDiff<T extends Record<string, unknown>>(
  before: T | null,
  after: T | null
): EntityDiff<T> {
  // Handle create/delete cases
  if (!before && after) {
    return {
      changed: after,
      removed: [],
      isCreate: true,
      isDelete: false,
      size: Object.keys(after).length,
    };
  }

  if (before && !after) {
    return {
      changed: {} as Partial<T>,
      removed: Object.keys(before) as (keyof T)[],
      isCreate: false,
      isDelete: true,
      size: Object.keys(before).length,
    };
  }

  if (!before || !after) {
    return {
      changed: {} as Partial<T>,
      removed: [],
      isCreate: false,
      isDelete: false,
      size: 0,
    };
  }

  // Compute actual diff
  const changed: Partial<T> = {};
  const removed: (keyof T)[] = [];

  // Check for changes and additions
  for (const key of Object.keys(after) as (keyof T)[]) {
    const beforeValue = before[key];
    const afterValue = after[key];

    if (!deepEqual(beforeValue, afterValue)) {
      changed[key] = afterValue;
    }
  }

  // Check for removals
  for (const key of Object.keys(before) as (keyof T)[]) {
    if (!(key in after)) {
      removed.push(key);
    }
  }

  return {
    changed,
    removed,
    isCreate: false,
    isDelete: false,
    size: Object.keys(changed).length + removed.length,
  };
}

/**
 * Apply a diff to an entity.
 */
export function applyDiff<T extends Record<string, unknown>>(
  entity: T,
  diff: EntityDiff<T>
): T {
  if (diff.isDelete) {
    return null as unknown as T;
  }

  const result = { ...entity, ...diff.changed };

  for (const key of diff.removed) {
    delete result[key];
  }

  return result;
}

/**
 * Check if a diff represents no changes.
 */
export function isDiffEmpty<T>(diff: EntityDiff<T>): boolean {
  return diff.size === 0 && !diff.isCreate && !diff.isDelete;
}

/**
 * Merge two diffs (for batching).
 */
export function mergeDiffs<T>(
  a: EntityDiff<T>,
  b: EntityDiff<T>
): EntityDiff<T> {
  if (b.isDelete) {
    return b;
  }

  if (a.isDelete) {
    // Deleted then modified = create with new data
    return {
      changed: b.changed,
      removed: [],
      isCreate: true,
      isDelete: false,
      size: Object.keys(b.changed).length,
    };
  }

  const changed = { ...a.changed, ...b.changed };
  const removed = [...new Set([...a.removed, ...b.removed])];

  // Remove from removed if it's now in changed
  const finalRemoved = removed.filter(key => !(key in changed));

  return {
    changed,
    removed: finalRemoved,
    isCreate: a.isCreate,
    isDelete: false,
    size: Object.keys(changed).length + finalRemoved.length,
  };
}

// =============================================================================
// DEEP EQUALITY
// =============================================================================

/**
 * Deep equality check.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  const typeA = typeof a;
  const typeB = typeof b;

  if (typeA !== typeB) return false;

  if (typeA === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!deepEqual((a as any)[key], (b as any)[key])) return false;
    }

    return true;
  }

  return false;
}

// =============================================================================
// COMPRESSION HELPERS
// =============================================================================

/**
 * Estimate byte size of an object (for optimization decisions).
 */
export function estimateSize(obj: unknown): number {
  try {
    return JSON.stringify(obj).length;
  } catch {
    return 0;
  }
}

/**
 * Should use delta for this entity based on size comparison.
 */
export function shouldUseDelta<T extends Record<string, unknown>>(
  before: T,
  after: T,
  threshold: number = 0.5
): boolean {
  const diff = computeDiff(before, after);
  const diffSize = estimateSize(diff.changed);
  const fullSize = estimateSize(after);

  // Use delta if it's less than threshold * full size
  return diffSize < fullSize * threshold;
}
