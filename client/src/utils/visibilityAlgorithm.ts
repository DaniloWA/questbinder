import { Point, Obstacle } from '../types/models';
import { DebugLogger } from './DebugLogger';

// ============================================================================
// PURE MATH HELPERS
// ============================================================================

/**
 * Calculates intersection between two segments p1-p2 and p3-p4
 */
export const getIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
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

/**
 * Square distance from point to segment
 */
export const getSqSegDist = (p: Point, p1: Point, p2: Point) => {
  let x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = p2.x; y = p2.y; }
    else if (t > 0) { x += dx * t; y += dy * t; }
  }
  dx = p.x - x; dy = p.y - y;
  return dx * dx + dy * dy;
};

/**
 * Ramer-Douglas-Peucker simplification
 */
export const simplifyResult = (points: Point[], tolerance: number): Point[] => {
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

/**
 * Extends a segment slightly to prevent light leaks
 */
const extend = (p1: Point, p2: Point) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { p1, p2 };
  const ex = (dx / len) * 0.1;
  const ey = (dy / len) * 0.1;
  return {
    p1: { x: p1.x - ex, y: p1.y - ey },
    p2: { x: p2.x + ex, y: p2.y + ey }
  };
};

// ============================================================================
// CORE LOGIC
// ============================================================================

export const computeVisibilityPolygon = (origin: Point, obstacles: Obstacle[], visionRadius: number): Point[] => {
  if (!origin) return [];
  if (!obstacles || obstacles.length === 0) return [];

  const start = performance.now();
  const lineSegments: { p1: Point, p2: Point; }[] = [];
  const minX = origin.x - visionRadius;
  const maxX = origin.x + visionRadius;
  const minY = origin.y - visionRadius;
  const maxY = origin.y + visionRadius;

  // 1. Extract Segments (Robust Method)
  for (const obs of obstacles) {
    if (!obs.blocksVision) continue;

    // Type-agnostic check: Polygons/Walls
    if ('points' in obs && (obs as any).points && (obs as any).points.length >= 2) {
      const points = (obs as any).points as Point[];
      const len = points.length;
      // Handle open property safely
      const open = 'open' in obs ? (obs as any).open : false;
      const loopCount = open ? len - 1 : len;

      for (let i = 0; i < loopCount; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % len];
        if (!p1 || !p2) continue;

        // Bounding box check
        if (Math.max(p1.x, p2.x) < minX || Math.min(p1.x, p2.x) > maxX ||
          Math.max(p1.y, p2.y) < minY || Math.min(p1.y, p2.y) > maxY) continue;

        lineSegments.push(extend(p1, p2));
      }
    }
    // Type-agnostic check: Lines/Doors/Windows
    else if ((obs as any).p1 && (obs as any).p2) {
      const p1 = (obs as any).p1;
      const p2 = (obs as any).p2;

      if (Math.max(p1.x, p2.x) < minX || Math.min(p1.x, p2.x) > maxX ||
        Math.max(p1.y, p2.y) < minY || Math.min(p1.y, p2.y) > maxY) continue;

      lineSegments.push(extend(p1, p2));
    }
  }

  // 2. Generate Casting Angles
  const uniqueAngles: number[] = [];
  // Adaptive precision
  const useHighPrecision = lineSegments.length < 1000;

  for (const s of lineSegments) {
    const a1 = Math.atan2(s.p1.y - origin.y, s.p1.x - origin.x);
    const a2 = Math.atan2(s.p2.y - origin.y, s.p2.x - origin.x);

    if (useHighPrecision) {
      uniqueAngles.push(a1 - 0.0001, a1, a1 + 0.0001);
      uniqueAngles.push(a2 - 0.0001, a2, a2 + 0.0001);
    } else {
      uniqueAngles.push(a1, a2);
    }
  }

  // Add fixed intervals (every ~15 degrees)
  const fixedCounts = 24;
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
  const result = simplifyResult(intersections, 0.5);

  // INTELLIGENT DEBUG LOG (Throttled ~1%)
  if (Math.random() < 0.01) {
    const duration = performance.now() - start;
    DebugLogger.log('vision', 'Algorithm', 'Stats', `Computed ${result.length} pts in ${duration.toFixed(2)}ms`, {
      segments: lineSegments.length,
      angles: uniqueAngles.length,
      rawIntersections: intersections.length,
      simplified: result.length,
      obstaclesProcessed: obstacles.length,
      useHighPrecision,
      fixedCounts,
      duration
    });
  }

  return result;
};
