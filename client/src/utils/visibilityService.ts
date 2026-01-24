/**
 * Visibility Calculation Service
 * 
 * Primary: Web Worker (off main thread, non-blocking)
 * Fallback 1: Cached sync calculation (main thread with TTL cache)
 * Fallback 2: Direct sync calculation (main thread, no cache)
 * Fallback 3: Empty polygon (graceful degradation)
 * 
 * This module NEVER throws - always returns a valid polygon (even if empty)
 */

import { Point, Obstacle } from '../types';

// ============================================================================
// TYPES
// ============================================================================

// interface VisibilityRequest removed


interface CacheEntry {
  polygon: Point[];
  timestamp: number;
  obstacleHash: string;
  origin: Point; // Added for fuzzy translation
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_TTL_MS = 100;
const MAX_CACHE_SIZE = 200;
const WORKER_TIMEOUT_MS = 600;// Fast timeout - fall back quickly
const MAX_PENDING_REQUESTS = 5; // Strict limit to prevent animation loop overload

// ============================================================================
// STATE (Module-level singleton)
// ============================================================================

import { WorkerManager } from '../workers/core/WorkerManager';
import { DebugLogger } from './DebugLogger';

// ============================================================================
// STATE (Module-level singleton)
// ============================================================================

const pendingRequests = new Map<string, number>(); // ID -> timestamp
const cache = new Map<string, CacheEntry>();

// Throttle State
let lastWorkerRequestTime = 0;
const MIN_WORKER_INTERVAL = 50; // Max 20fps worker updates (sync handles immediate needs)
let lastObstacleHash = '';

// ============================================================================
// HELPERS
// ============================================================================

// Worker initialization is handled by WorkerManager now.
const isWorkerAvailable = () => true;

// Listen for worker restarts (crashes/HMR) to invalidate state
// CRITICAL: Only run this on the main thread.
if (typeof window !== 'undefined' && !((typeof self !== 'undefined' && self.constructor.name === 'DedicatedWorkerGlobalScope') || typeof (self as any).importScripts === 'function')) {
  try {
    WorkerManager.getInstance().onWorkerRestart(() => {
      DebugLogger.warn('vision', 'VisibilityService', 'WorkerRestart', 'Worker restarted, invalidating obstacle state');
      lastObstacleHash = '';
    });
  } catch (e) {
    // Ignore errors if WorkerManager fails to init (e.g. inside worker context that slipped through)
    console.warn('Skipped WorkerManager init in potential worker context', e);
  }
}


/**
 * Updates the worker's obstacle state if it has changed.
 */
const updateWorkerMap = (obstacles: Obstacle[], hash: string) => {
  if (hash === lastObstacleHash) return;

  lastObstacleHash = hash;

  // Sanitize obstacles to ensure they are plain objects (removes Proxies/Getters)
  const sanitizedObstacles = obstacles.map(obs => {
    // Basic properties
    const base = {
      id: obs.id,
      type: obs.type,
      blocksVision: obs.blocksVision,
      // Copy potential legacy properties just in case
      p1: (obs as any).p1,
      p2: (obs as any).p2,
      open: (obs as any).open
    };

    // Handle Points array specifically
    if ((obs as any).points) {
      (base as any).points = (obs as any).points.map((p: any) => ({ x: p.x, y: p.y }));
    }

    // Handle p1/p2 strictly if they exist
    if ((obs as any).p1) (base as any).p1 = { x: (obs as any).p1.x, y: (obs as any).p1.y };
    if ((obs as any).p2) (base as any).p2 = { x: (obs as any).p2.x, y: (obs as any).p2.y };

    return base;
  });

  WorkerManager.getInstance().execute('visibility', 'setObstacles', { obstacles: sanitizedObstacles })
    .catch(err => DebugLogger.error('vision', 'VisibilityService', 'UpdateMap', 'Failed to update map', err));
};


// ============================================================================
// CACHE HELPERS
// ============================================================================

const getCacheKey = (origin: Point, visionRadius: number): string => {
  return `${origin.x.toFixed(0)}_${origin.y.toFixed(0)}_${visionRadius.toFixed(0)}`;
};

const getObstacleHash = (obstacles: Obstacle[]): string => {
  if (!obstacles.length) return '0';

  // Create a stable hash using:
  // - Total count of obstacles  
  // - Count of vision-blocking obstacles
  // - Concatenated IDs + versions (sorted for stability)
  const blockingObstacles = obstacles.filter(o => o.blocksVision);

  if (blockingObstacles.length === 0) return `${obstacles.length}_none`;

  // Use ID + version for accurate change detection (prevents infinite loops)
  const idVersions = blockingObstacles
    .map(o => `${o.id}:${o.version ?? 0}`)
    .sort()
    .join(',');

  return `${obstacles.length}_${blockingObstacles.length}_${idVersions}`;
};

const cleanCache = () => {
  const now = Date.now();
  let evictedTTL = 0;
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS * 10) {
      cache.delete(key);
      evictedTTL++;
    }
  }

  let evictedSize = 0;
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.length - MAX_CACHE_SIZE / 2;

    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
      evictedSize++;
    }
  }

  if (evictedTTL > 0 || evictedSize > 0) {
    if (Math.random() < 0.1) {
      DebugLogger.log('vision', 'VisibilityService', 'Evict', `Evicted: ${evictedTTL} (TTL), ${evictedSize} (Size). Remaining: ${cache.size}`);
    }
  }
};

const findFuzzyMatch = (origin: Point, visionRadius: number, obstacleHash: string): Point[] | null => {
  // Search for a recent cache entry with same map state but close position
  // Limit search to ~50 most recent entries for speed
  const ENTRIES_TO_CHECK = 50;
  const FUZZY_RADIUS = 50; // Pixels

  let checked = 0;
  // Iterate map in reverse insertion order (newest first)
  // Map iteration is insertion-ordered. We need to be careful.
  // Actually, standard iteration is easiest. We'll check all if size < big.

  for (const entry of cache.values()) {
    if (checked++ > ENTRIES_TO_CHECK) break;

    // Must match environment exactly
    if (entry.obstacleHash !== obstacleHash) continue;

    // Check distance
    const dist = Math.hypot(origin.x - entry.origin.x, origin.y - entry.origin.y);
    if (dist < FUZZY_RADIUS) {
      // Found a close match! Translate it.
      const dx = origin.x - entry.origin.x;
      const dy = origin.y - entry.origin.y;

      // Return translated copy
      return entry.polygon.map(p => ({ x: p.x + dx, y: p.y + dy }));
    }
  }
  return null;
};

// ============================================================================
// SYNC CALCULATION (Fallback)
// ============================================================================

import { computeVisibilityPolygon } from './visibilityAlgorithm';

const calculateSync = (origin: Point, obstacles: Obstacle[], visionRadius: number): Point[] => {
  try {
    // Use shared DRY logic
    return computeVisibilityPolygon(origin, obstacles, visionRadius);
  } catch (e) {
    DebugLogger.error('vision', 'VisibilityService', 'CalcSync', 'Sync calculation failed:', e);
    return []; // Fallback 3: Empty polygon
  }
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Calculate visibility polygon.
 * 
 * Tries: Worker → Cache → Sync → Empty
 * NEVER throws - always returns Point[]
 */
export const calculateVisibilityPolygon = (
  origin: Point,
  obstacles: Obstacle[],
  visionRadius: number
): Point[] => {
  try {
    if (!origin || !obstacles) return [];

    const cacheKey = getCacheKey(origin, visionRadius);
    const obstacleHash = getObstacleHash(obstacles);
    const now = Date.now();

    // Check cache first
    const cached = cache.get(cacheKey);
    // If cache exists and map state (hash) hasn't changed, return it forever.
    if (cached && cached.obstacleHash === obstacleHash) {
      // DEBUG: Cache Hit
      if (Math.random() < 0.001) {
        DebugLogger.log('vision', 'Service', 'CacheHit', `Returning cached polygon for ${cacheKey}`);
      }
      return cached.polygon;
    }

    // DEBUG: Cache Miss & Worker Status
    if (Math.random() < 0.01) {
      DebugLogger.log('vision', 'Service', 'Status', `Pending: ${pendingRequests.size}, Cache: ${cache.size}, LastHash: ${lastObstacleHash.substring(0, 10)}`);
    }

    // Update worker state if needed
    updateWorkerMap(obstacles, obstacleHash);

    // Try worker (Throttled)
    const timeSinceLast = now - lastWorkerRequestTime;

    if (pendingRequests.size < MAX_PENDING_REQUESTS && timeSinceLast > MIN_WORKER_INTERVAL) {
      const id = cacheKey; // Used as correlation ID

      if (!pendingRequests.has(id)) {
        pendingRequests.set(id, now);
        lastWorkerRequestTime = now;

        WorkerManager.getInstance().execute<Point[]>('visibility', 'calculateVisibility', {
          origin,
          visionRadius
        }).then(polygon => {
          // AUTO-RECOVERY: If worker returns empty but we have obstacles, assume state desync
          if (polygon.length === 0 && obstacles.length > 0) {
            DebugLogger.warn('vision', 'VisibilityService', 'Worker', 'Worker returned 0 points (State Desync?). Forcing obstacle re-sync.');
            lastObstacleHash = ''; // Force re-send next time
          } else {
            // Only cache valid results or if truly empty
            cache.set(cacheKey, { polygon, timestamp: Date.now(), obstacleHash, origin });
            DebugLogger.log('vision', 'VisibilityService', 'Worker', `Worker Result: ${polygon.length} points`, { cacheKey });
          }

          pendingRequests.delete(id);
        }).catch(err => {
          DebugLogger.error('worker', 'VisibilityService', 'Worker', 'Visibility calculation failed', err);
          pendingRequests.delete(id);
        });

        // Cleanup stale
        setTimeout(() => {
          if (pendingRequests.has(id) && Date.now() - pendingRequests.get(id)! > WORKER_TIMEOUT_MS * 4) {
            pendingRequests.delete(id);
          }
        }, WORKER_TIMEOUT_MS * 4);
      }
    }

    // If we have a cached value (even if stale), return it while we wait for worker
    // This prevents main thread freeze
    if (cached) return cached.polygon;

    // TRY FUZZY CACHE: If moving fast, use a nearby polygon shifted to our position
    // This effectively "interpolates" the vision polygon, avoiding the 100ms sync calc
    const fuzzy = findFuzzyMatch(origin, visionRadius, obstacleHash);
    if (fuzzy) {
      // DEBUG: Fuzzy Hit
      if (Math.random() < 0.01) DebugLogger.log('vision', 'VisibilityService', 'FuzzyHit', 'Used interpolated cache during movement');

      // IMPORTANT: We still dispatched the worker above!
      // We just return this approximation NOW to avoid dropping frames.
      // We do NOT cache this fuzzy result as "authoritative" for this key.
      return fuzzy;
    }

    // Last resort: Use sync calculation for first-time calculations
    DebugLogger.warn('vision', 'VisibilityService', 'Fallback', 'Fallback to SYNC calculation', { cacheKey });
    DebugLogger.time('sync-vis');
    const syncResult = calculateSync(origin, obstacles, visionRadius);
    DebugLogger.timeEnd('vision', 'sync-vis', 5); // Warn if > 5ms
    DebugLogger.log('vision', 'VisibilityService', 'Fallback', `Sync Result: ${syncResult.length} points`);

    // Cache the sync result immediately so next frame doesn't recalculate
    cache.set(cacheKey, { polygon: syncResult, timestamp: now, obstacleHash, origin });

    return syncResult;
  } catch (e) {
    DebugLogger.error('vision', 'VisibilityService', 'Error', 'Unexpected error:', e);
    return []; // Ultimate fallback
  }
};

/**
 * Force sync calculation (for testing/debugging)
 */
export const calculateVisibilityPolygonSync = calculateSync;

/**
 * Clear all caches
 */
export const clearVisibilityCache = () => {
  cache.clear();
};

/**
 * Get service status
 */
export const getVisibilityServiceStatus = () => ({
  workerReady: true, // Managed by WorkerManager
  workerFailed: false,
  pendingRequests: pendingRequests.size,
  cacheSize: cache.size
});
