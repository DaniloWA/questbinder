
import { Point, Obstacle, MeasurementMetric } from '../types';

/**
 * Calculates the intersection point of two line segments (p1-p2 and p3-p4).
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
 * Calculates the shortest distance from point p to line segment vw.
 */
export const distanceToSegment = (p: Point, v: Point, w: Point): number => {
  if (!p || !v || !w) return Infinity;
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
};

/**
 * Calculates distance between two points based on selected metric.
 * Coordinates are expected in Grid Units (not pixels).
 */
export const calculateDistance = (p1: Point, p2: Point, metric: MeasurementMetric): number => {
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);

    switch (metric) {
        case 'manhattan':
            return dx + dy;
        case 'chebyshev':
            return Math.max(dx, dy); // D&D 5e Standard (Diagonals = 1)
        case 'euclidean':
        default:
            return Math.sqrt(dx * dx + dy * dy);
    }
};

/**
 * Checks if a point is inside a polygon using Ray Casting algorithm.
 */
export const isPointInPolygon = (point: Point, vs: Point[]): boolean => {
    if (!point || !vs || vs.length === 0) return false;
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;
        let intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

/**
 * Calculates the polygon of visible area from an origin point, considering obstacles.
 * Uses Ray Casting algorithm with angular sweep.
 */
export const calculateVisibilityPolygon = (origin: Point, obstacles: Obstacle[], visionRadius: number): Point[] => {
    if (!origin || !obstacles) return [];
    
    const lineSegments: { p1: Point, p2: Point }[] = [];
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

                // Simple bounding box check to optimize
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
    let uniqueAngles: number[] = [];

    // Cast rays towards every obstacle point, plus slightly offset angles
    allPoints.forEach(p => {
        const angle = Math.atan2(p.y - origin.y, p.x - origin.x);
        uniqueAngles.push(angle - 0.0001, angle, angle + 0.0001);
    });
    
    // Add standard angles to ensure circle shape in open areas
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
