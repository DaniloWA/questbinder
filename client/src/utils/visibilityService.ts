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
const WORKER_TIMEOUT_MS = 50; // Fast timeout - fall back quickly
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
const MIN_WORKER_INTERVAL = 200; // Max 5fps worker updates (sync handles immediate needs)
let lastObstacleHash = '';

// ============================================================================
// HELPERS
// ============================================================================

// Worker initialization is handled by WorkerManager now.
const isWorkerAvailable = () => true;


/**
 * Updates the worker's obstacle state if it has changed.
 */
const updateWorkerMap = (obstacles: Obstacle[], hash: string) => {
  if (hash === lastObstacleHash) return;

  lastObstacleHash = hash;
  WorkerManager.getInstance().execute('visibility', 'setObstacles', { obstacles })
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
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS * 10) {
      cache.delete(key);
    }
  }
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < entries.length - MAX_CACHE_SIZE / 2; i++) {
      cache.delete(entries[i][0]);
    }
  }
};

// ============================================================================
// SYNC CALCULATION (Fallback)
// ============================================================================

const getIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
  if (!p1 || !p2 || !p3 || !p4) return null;
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (d === 0) return null;
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const u = -((p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x)) / d;
  if (t > 0 && t < 1 && u > 0 && u < 1) {
    return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
  }
  return null;
};
// Helper: Square distance from a point to a segment
const getSqSegDist = (p: Point, p1: Point, p2: Point) => {
  let x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = p2.x; y = p2.y; }
    else if (t > 0) { x += dx * t; y += dy * t; }
  }
  dx = p.x - x; dy = p.y - y;
  return dx * dx + dy * dy;
};

// Simplify path (Ramer-Douglas-Peucker) to reduce point count
const simplifyResult = (points: Point[], tolerance: number): Point[] => {
  if (points.length <= 2) return points;
  const sqTolerance = tolerance * tolerance;
  let maxSqDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const sqDist = getSqSegDist(points[i], points[0], points[points.length - 1]);
    if (sqDist > maxSqDist) { index = i; maxSqDist = sqDist; }
  }
  if (maxSqDist > sqTolerance) {
    const left = simplifyResult(points.slice(0, index + 1), tolerance);
    const right = simplifyResult(points.slice(index), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
};

const calculateSync = (origin: Point, obstacles: Obstacle[], visionRadius: number): Point[] => {
  try {
    if (!origin) return [];

    // Fallback 3: Empty polygon if no obstacles (Validation)
    if (!obstacles || obstacles.length === 0) {
      if (visionRadius > 0) {
        // Intelligent Log: Only warn if we EXPECT walls (visionRadius > 0) but see none
        // Use frequency throttling to avoid spam
        if (Math.random() < 0.01) {
          DebugLogger.warn('vision', 'VisibilityService', 'CalcSync', 'calculateSync: No obstacles provided!', { origin });
        }
      }
      return [];
    }

    const lineSegments: { p1: Point, p2: Point; }[] = [];
    const minX = origin.x - visionRadius;
    const maxX = origin.x + visionRadius;
    const minY = origin.y - visionRadius;
    const maxY = origin.y + visionRadius;

    // Helper: Extend segment slightly to overlap corners (Fixes Light Leaks)
    const extend = (p1: Point, p2: Point) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return { p1, p2 };
      const ex = (dx / len) * 0.1; // Extend by 0.1px 
      const ey = (dy / len) * 0.1;
      return {
        p1: { x: p1.x - ex, y: p1.y - ey },
        p2: { x: p2.x + ex, y: p2.y + ey }
      };
    };

    // 1. Extract Segments
    for (const obs of obstacles) {
      if (!obs.blocksVision) continue;

      if (obs.type === 'wall' && obs.points) {
        const len = obs.points.length;
        if (len < 2) continue;
        const loopCount = obs.open ? len - 1 : len;

        for (let i = 0; i < loopCount; i++) {
          const p1 = obs.points[i];
          const p2 = obs.points[(i + 1) % len];
          if (!p1 || !p2) continue;

          // Simple bounding box check
          if (Math.max(p1.x, p2.x) < minX || Math.min(p1.x, p2.x) > maxX ||
            Math.max(p1.y, p2.y) < minY || Math.min(p1.y, p2.y) > maxY) continue;

          lineSegments.push(extend(p1, p2));
        }
      } else if (obs.type === 'door' || obs.type === 'window') {
        // LineObstacle type
        if (Math.max(obs.p1.x, obs.p2.x) < minX || Math.min(obs.p1.x, obs.p2.x) > maxX ||
          Math.max(obs.p1.y, obs.p2.y) < minY || Math.min(obs.p1.y, obs.p2.y) > maxY) continue;
        lineSegments.push(extend(obs.p1, obs.p2));
      } else if ((obs as any).p1 && (obs as any).p2) {
        // Legacy support
        const p1 = (obs as any).p1;
        const p2 = (obs as any).p2;
        if (Math.max(p1.x, p2.x) < minX || Math.min(p1.x, p2.x) > maxX ||
          Math.max(p1.y, p2.y) < minY || Math.min(p1.y, p2.y) > maxY) continue;
        lineSegments.push(extend(p1, p2));
      }
    }

    // 2. Generate Casting Angles
    const uniqueAngles: number[] = [];

    // Adaptive precision: if HUGE number of segments, degrade gracefully
    const useHighPrecision = lineSegments.length < 1000;

    for (const s of lineSegments) {
      const a1 = Math.atan2(s.p1.y - origin.y, s.p1.x - origin.x);
      const a2 = Math.atan2(s.p2.y - origin.y, s.p2.x - origin.x);

      if (useHighPrecision) {
        // Robust 3-ray approach: Target, slightly left, slightly right
        uniqueAngles.push(a1 - 0.0001, a1, a1 + 0.0001);
        uniqueAngles.push(a2 - 0.0001, a2, a2 + 0.0001);
      } else {
        // Fallback for extreme cases
        uniqueAngles.push(a1, a2);
      }
    }

    // Always add cardinal directions/fixed intervals to ensure basic shape even without walls
    // (This ensures "circular" vision in open areas)
    const fixedCounts = 24; // Every ~15 degrees
    for (let i = 0; i < fixedCounts; i++) {
      uniqueAngles.push(i * (Math.PI * 2) / fixedCounts);
    }

    // 3. Raycast
    const intersections = uniqueAngles.map(angle => {
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const rayEnd = { x: origin.x + dx * visionRadius, y: origin.y + dy * visionRadius };

      let closestIntersection: Point | null = null;
      let minDist = visionRadius;

      for (const seg of lineSegments) {
        const inter = getIntersection(origin, rayEnd, seg.p1, seg.p2);
        if (inter) {
          const dist = Math.hypot(inter.x - origin.x, inter.y - origin.y);
          if (dist < minDist) {
            minDist = dist;
            closestIntersection = inter;
          }
        }
      }
      return closestIntersection || rayEnd;
    });

    // 4. Sort Vertices
    intersections.sort((a, b) =>
      Math.atan2(a.y - origin.y, a.x - origin.x) - Math.atan2(b.y - origin.y, b.x - origin.x)
    );

    // 5. Simplify
    // Use a small tolerance to merge colinear points but keep corners sharp
    // 0.5 is usually 1/3 of a pixel or 1/140 of a grid cell
    const simplified = simplifyResult(intersections, 0.5);

    return simplified;
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
    // We only re-calc if origin changes (new key) or obstacles change (new hash).
    if (cached && cached.obstacleHash === obstacleHash) {
      return cached.polygon;
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
          DebugLogger.log('vision', 'VisibilityService', 'Worker', `Worker Result: ${polygon.length} points`, { cacheKey });
          cache.set(cacheKey, { polygon, timestamp: Date.now(), obstacleHash, origin });
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
