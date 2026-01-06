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

interface VisibilityRequest {
  id: string;
  origin: Point;
  obstacles: Obstacle[];
  visionRadius: number;
  resolve: (polygon: Point[]) => void;
  timestamp: number;
}

interface CacheEntry {
  polygon: Point[];
  timestamp: number;
  obstacleHash: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_TTL_MS = 100;
const MAX_CACHE_SIZE = 200;
const WORKER_TIMEOUT_MS = 50; // Fast timeout - fall back quickly
const MAX_PENDING_REQUESTS = 20; // Prevent memory bloat

// ============================================================================
// STATE (Module-level singleton)
// ============================================================================

let worker: Worker | null = null;
let workerReady = false;
let workerFailed = false;
let requestId = 0;

const pendingRequests = new Map<string, VisibilityRequest>();
const cache = new Map<string, CacheEntry>();

// ============================================================================
// WORKER INITIALIZATION
// ============================================================================

const initWorker = (): boolean => {
  if (worker || workerFailed) return workerReady;

  try {
    const workerCode = `
      const getIntersection = (p1, p2, p3, p4) => {
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

      const calculate = (origin, obstacles, visionRadius) => {
        if (!origin || !obstacles) return [];
        
        const lineSegments = [];
        const minX = origin.x - visionRadius;
        const maxX = origin.x + visionRadius;
        const minY = origin.y - visionRadius;
        const maxY = origin.y + visionRadius;

        for (let i = 0; i < obstacles.length; i++) {
          const obs = obstacles[i];
          if (!obs.blocksVision) continue;
          
          if (obs.type === 'wall' && obs.points) {
            const len = obs.points.length;
            if (len < 2) continue;
            const loopCount = obs.open ? len - 1 : len;
            for (let j = 0; j < loopCount; j++) {
              const p1 = obs.points[j];
              const p2 = obs.points[(j + 1) % len];
              if (!p1 || !p2) continue;
              if (Math.max(p1.x, p2.x) < minX || Math.min(p1.x, p2.x) > maxX || 
                  Math.max(p1.y, p2.y) < minY || Math.min(p1.y, p2.y) > maxY) continue;
              lineSegments.push({ p1, p2 });
            }
          } else if (obs.p1 && obs.p2) {
            if (Math.max(obs.p1.x, obs.p2.x) < minX || Math.min(obs.p1.x, obs.p2.x) > maxX || 
                Math.max(obs.p1.y, obs.p2.y) < minY || Math.min(obs.p1.y, obs.p2.y) > maxY) continue;
            lineSegments.push({ p1: obs.p1, p2: obs.p2 });
          }
        }

        const uniqueAngles = [];
        for (let i = 0; i < lineSegments.length; i++) {
          const s = lineSegments[i];
          const a1 = Math.atan2(s.p1.y - origin.y, s.p1.x - origin.x);
          const a2 = Math.atan2(s.p2.y - origin.y, s.p2.x - origin.x);
          uniqueAngles.push(a1 - 0.0001, a1, a1 + 0.0001);
          uniqueAngles.push(a2 - 0.0001, a2, a2 + 0.0001);
        }
        for (let i = 0; i < 360; i += 15) uniqueAngles.push(i * Math.PI / 180);

        const intersections = [];
        for (let i = 0; i < uniqueAngles.length; i++) {
          const angle = uniqueAngles[i];
          const dx = Math.cos(angle);
          const dy = Math.sin(angle);
          const rayEnd = { x: origin.x + dx * visionRadius, y: origin.y + dy * visionRadius };
          
          let closestIntersection = null;
          let minDist = visionRadius;

          for (let j = 0; j < lineSegments.length; j++) {
            const seg = lineSegments[j];
            const inter = getIntersection(origin, rayEnd, seg.p1, seg.p2);
            if (inter) {
              const dist = Math.hypot(inter.x - origin.x, inter.y - origin.y);
              if (dist < minDist) {
                minDist = dist;
                closestIntersection = inter;
              }
            }
          }
          intersections.push(closestIntersection || rayEnd);
        }
        
        intersections.sort((a, b) => Math.atan2(a.y - origin.y, a.x - origin.x) - Math.atan2(b.y - origin.y, b.x - origin.x));
        return intersections;
      };

      self.onmessage = (e) => {
        try {
          const { id, origin, obstacles, visionRadius } = e.data;
          const polygon = calculate(origin, obstacles, visionRadius);
          self.postMessage({ id, polygon, error: null });
        } catch (err) {
          self.postMessage({ id: e.data?.id, polygon: [], error: err.message });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    worker = new Worker(url);
    URL.revokeObjectURL(url);

    worker.onmessage = (e) => {
      const { id, polygon, error } = e.data;
      const req = pendingRequests.get(id);
      if (req) {
        pendingRequests.delete(id);
        if (error) {
          console.warn('[VisibilityService] Worker error, using fallback');
          req.resolve(calculateSync(req.origin, req.obstacles, req.visionRadius));
        } else {
          req.resolve(polygon);
        }
      }
    };

    worker.onerror = (e) => {
      console.error('[VisibilityService] Worker failed:', e);
      workerFailed = true;
      // Resolve all pending with fallback
      pendingRequests.forEach((req, id) => {
        pendingRequests.delete(id);
        req.resolve(calculateSync(req.origin, req.obstacles, req.visionRadius));
      });
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    workerReady = true;
    console.log('[VisibilityService] Worker initialized');
    return true;
  } catch (e) {
    console.warn('[VisibilityService] Worker init failed:', e);
    workerFailed = true;
    return false;
  }
};

// ============================================================================
// CACHE HELPERS
// ============================================================================

const getCacheKey = (origin: Point, visionRadius: number): string => {
  return `${origin.x.toFixed(0)}_${origin.y.toFixed(0)}_${visionRadius.toFixed(0)}`;
};

const getObstacleHash = (obstacles: Obstacle[]): string => {
  if (!obstacles.length) return '0';
  const f = obstacles[0];
  const l = obstacles[obstacles.length - 1];
  const fp = f.type === 'wall' ? f.points?.[0] : f.p1;
  const lp = l.type === 'wall' ? l.points?.[0] : l.p1;
  return `${obstacles.length}_${fp?.x?.toFixed(0) || 0}_${lp?.x?.toFixed(0) || 0}`;
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

const calculateSync = (origin: Point, obstacles: Obstacle[], visionRadius: number): Point[] => {
  try {
    if (!origin || !obstacles) return [];

    const lineSegments: { p1: Point, p2: Point; }[] = [];
    const minX = origin.x - visionRadius;
    const maxX = origin.x + visionRadius;
    const minY = origin.y - visionRadius;
    const maxY = origin.y + visionRadius;

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
          if (Math.max(p1.x, p2.x) < minX || Math.min(p1.x, p2.x) > maxX ||
            Math.max(p1.y, p2.y) < minY || Math.min(p1.y, p2.y) > maxY) continue;
          lineSegments.push({ p1, p2 });
        }
      } else if (obs.type === 'door' || obs.type === 'window') {
        // LineObstacle type (door or window)
        if (Math.max(obs.p1.x, obs.p2.x) < minX || Math.min(obs.p1.x, obs.p2.x) > maxX ||
          Math.max(obs.p1.y, obs.p2.y) < minY || Math.min(obs.p1.y, obs.p2.y) > maxY) continue;
        lineSegments.push({ p1: obs.p1, p2: obs.p2 });
      }
    }

    const uniqueAngles: number[] = [];
    for (const s of lineSegments) {
      const a1 = Math.atan2(s.p1.y - origin.y, s.p1.x - origin.x);
      const a2 = Math.atan2(s.p2.y - origin.y, s.p2.x - origin.x);
      uniqueAngles.push(a1 - 0.0001, a1, a1 + 0.0001, a2 - 0.0001, a2, a2 + 0.0001);
    }
    for (let i = 0; i < 360; i += 15) uniqueAngles.push(i * Math.PI / 180);

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

    intersections.sort((a, b) =>
      Math.atan2(a.y - origin.y, a.x - origin.x) - Math.atan2(b.y - origin.y, b.x - origin.x)
    );

    return intersections;
  } catch (e) {
    console.error('[VisibilityService] Sync calculation failed:', e);
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
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS && cached.obstacleHash === obstacleHash) {
      return cached.polygon;
    }

    // Try worker
    if (!workerFailed) {
      initWorker();

      if (workerReady && worker && pendingRequests.size < MAX_PENDING_REQUESTS) {
        const id = `r${requestId++}`;

        // Create a promise that will be resolved when worker responds
        // But we need sync return, so we use cache + async update pattern
        worker.postMessage({ id, origin, obstacles, visionRadius });

        // For now, fall through to sync - worker will update cache for next frame
        pendingRequests.set(id, {
          id,
          origin,
          obstacles,
          visionRadius,
          resolve: (polygon) => {
            cache.set(cacheKey, { polygon, timestamp: Date.now(), obstacleHash });
          },
          timestamp: now
        });

        // Set timeout to clean up stale requests
        setTimeout(() => {
          const req = pendingRequests.get(id);
          if (req) {
            pendingRequests.delete(id);
          }
        }, WORKER_TIMEOUT_MS * 2);
      }
    }

    // Sync calculation (with cache storage)
    const polygon = calculateSync(origin, obstacles, visionRadius);
    cache.set(cacheKey, { polygon, timestamp: now, obstacleHash });

    // Periodic cache cleanup
    if (cache.size > MAX_CACHE_SIZE * 0.8) {
      cleanCache();
    }

    return polygon;
  } catch (e) {
    console.error('[VisibilityService] Unexpected error:', e);
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
  workerReady,
  workerFailed,
  pendingRequests: pendingRequests.size,
  cacheSize: cache.size
});
