import { useEffect, useRef, useCallback } from 'react';
import { Point, Obstacle } from '../types';
import { calculateVisibilityPolygon } from './geometry';

interface PendingRequest {
  resolve: (polygon: Point[]) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

/**
 * Hook for using Web Worker for visibility polygon calculations.
 * Falls back to synchronous calculation if worker is not available.
 * 
 * Usage:
 * const { calculateAsync, isWorkerReady } = useVisibilityWorker();
 * const polygon = await calculateAsync(origin, obstacles, radius);
 */
export const useVisibilityWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());
  const requestIdCounter = useRef(0);
  const isReady = useRef(false);

  // Initialize worker on mount
  useEffect(() => {
    try {
      // Create worker with inline URL if module worker not supported
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

        const calculateVisibility = (origin, obstacles, visionRadius) => {
          if (!origin || !obstacles) return [];
          
          const lineSegments = [];
          const minX = origin.x - visionRadius;
          const maxX = origin.x + visionRadius;
          const minY = origin.y - visionRadius;
          const maxY = origin.y + visionRadius;

          obstacles.forEach(obs => {
            if (!obs.blocksVision) return;
            if (obs.type === 'wall') {
              const points = obs.points;
              if (!points) return;
              const len = points.length;
              if (len < 2) return;
              const loopCount = obs.open ? len - 1 : len;
              for (let i = 0; i < loopCount; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % len];
                if (!p1 || !p2) continue;
                if (Math.max(p1.x, p2.x) < minX || Math.min(p1.x, p2.x) > maxX || 
                    Math.max(p1.y, p2.y) < minY || Math.min(p1.y, p2.y) > maxY) continue;
                lineSegments.push({ p1, p2 });
              }
            } else {
              if (!obs.p1 || !obs.p2) return;
              if (Math.max(obs.p1.x, obs.p2.x) < minX || Math.min(obs.p1.x, obs.p2.x) > maxX || 
                  Math.max(obs.p1.y, obs.p2.y) < minY || Math.min(obs.p1.y, obs.p2.y) > maxY) return;
              lineSegments.push({ p1: obs.p1, p2: obs.p2 });
            }
          });

          const allPoints = lineSegments.flatMap(s => [s.p1, s.p2]);
          let uniqueAngles = [];

          allPoints.forEach(p => {
            const angle = Math.atan2(p.y - origin.y, p.x - origin.x);
            uniqueAngles.push(angle - 0.0001, angle, angle + 0.0001);
          });
          
          for (let i = 0; i < 360; i += 15) uniqueAngles.push(i * Math.PI / 180);

          const intersections = uniqueAngles.map(angle => {
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            const ray = { p1: origin, p2: { x: origin.x + dx * visionRadius, y: origin.y + dy * visionRadius } };
            let closestIntersection = null;
            let minDistance = visionRadius;

            lineSegments.forEach(seg => {
              const intersect = getIntersection(ray.p1, ray.p2, seg.p1, seg.p2);
              if (intersect) {
                const dist = Math.hypot(intersect.x - origin.x, intersect.y - origin.y);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestIntersection = intersect;
                }
              }
            });
            return closestIntersection || { x: origin.x + dx * visionRadius, y: origin.y + dy * visionRadius };
          }).sort((a, b) => Math.atan2(a.y - origin.y, a.x - origin.x) - Math.atan2(b.y - origin.y, b.x - origin.x));

          return intersections;
        };

        self.onmessage = (event) => {
          const { type, id, origin, obstacles, visionRadius } = event.data;
          if (type === 'calculate') {
            const polygon = calculateVisibility(origin, obstacles, visionRadius);
            self.postMessage({ type: 'result', id, polygon });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      workerRef.current = new Worker(workerUrl);

      workerRef.current.onmessage = (event) => {
        const { type, id, polygon } = event.data;
        if (type === 'result') {
          const pending = pendingRequests.current.get(id);
          if (pending) {
            pending.resolve(polygon);
            pendingRequests.current.delete(id);
          }
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('[VisibilityWorker] Error:', error);
        // Reject all pending requests on error
        pendingRequests.current.forEach((pending, id) => {
          pending.reject(new Error('Worker error'));
          pendingRequests.current.delete(id);
        });
      };

      isReady.current = true;
      console.log('[VisibilityWorker] Initialized successfully');

      // Cleanup blob URL
      URL.revokeObjectURL(workerUrl);
    } catch (error) {
      console.warn('[VisibilityWorker] Failed to initialize, using fallback:', error);
      isReady.current = false;
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingRequests.current.clear();
    };
  }, []);

  // Async calculation using worker
  const calculateAsync = useCallback((
    origin: Point,
    obstacles: Obstacle[],
    visionRadius: number
  ): Promise<Point[]> => {
    return new Promise((resolve, reject) => {
      // Fallback to sync if worker not available
      if (!workerRef.current || !isReady.current) {
        try {
          const result = calculateVisibilityPolygon(origin, obstacles, visionRadius);
          resolve(result);
        } catch (error) {
          reject(error);
        }
        return;
      }

      const id = `req_${requestIdCounter.current++}`;

      // Store pending request
      pendingRequests.current.set(id, {
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Send to worker
      workerRef.current.postMessage({
        type: 'calculate',
        id,
        origin,
        obstacles,
        visionRadius
      });

      // Timeout after 100ms - fall back to sync
      setTimeout(() => {
        const pending = pendingRequests.current.get(id);
        if (pending) {
          console.warn('[VisibilityWorker] Timeout, falling back to sync');
          pendingRequests.current.delete(id);
          try {
            const result = calculateVisibilityPolygon(origin, obstacles, visionRadius);
            pending.resolve(result);
          } catch (error) {
            pending.reject(error as Error);
          }
        }
      }, 100);
    });
  }, []);

  // Sync calculation with result caching (for compatibility)
  const calculateSync = useCallback((
    origin: Point,
    obstacles: Obstacle[],
    visionRadius: number
  ): Point[] => {
    return calculateVisibilityPolygon(origin, obstacles, visionRadius);
  }, []);

  return {
    calculateAsync,
    calculateSync,
    isWorkerReady: isReady.current
  };
};
