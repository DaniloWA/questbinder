
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

// ============================================================================
// VISIBILITY POLYGON - Delegated to Worker-based Service
// ============================================================================

// Re-export from visibilityService which uses Web Worker as primary
// with multiple fallback layers (worker → cache → sync → empty)
// NEVER throws - always returns Point[]
export {
    calculateVisibilityPolygon,
    clearVisibilityCache,
    getVisibilityServiceStatus
} from './visibilityService';

// ============================================================================
// SIMPLIFICATION & CURVES
// ============================================================================

/**
 * Calculates the midpoint between two points.
 */
export const getMidPoint = (p1: Point, p2: Point): Point => {
    return {
        x: p1.x + (p2.x - p1.x) / 2,
        y: p1.y + (p2.y - p1.y) / 2
    };
};

/**
 * Simplifies a path using the Ramer-Douglas-Peucker algorithm.
 * Reduces point count while maintaining shape within tolerance.
 * 
 * @param points The original path points
 * @param tolerance Max distance error (in grid units/pixels)
 * @returns Simplified path
 */
export const simplifyPath = (points: Point[], tolerance: number): Point[] => {
    if (points.length <= 2) return points;

    const sqTolerance = tolerance * tolerance;
    let maxSqDist = 0;
    let index = 0;

    // Find the point with the maximum distance
    for (let i = 1; i < points.length - 1; i++) {
        const sqDist = getSqSegDist(points[i], points[0], points[points.length - 1]);
        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    // If max distance is greater than epsilon, recursively simplify
    if (maxSqDist > sqTolerance) {
        const left = simplifyPath(points.slice(0, index + 1), tolerance);
        const right = simplifyPath(points.slice(index), tolerance);
        return [...left.slice(0, -1), ...right];
    } else {
        return [points[0], points[points.length - 1]];
    }
};

/**
 * Helper: Square distance from a point to a segment
 */
const getSqSegDist = (p: Point, p1: Point, p2: Point) => {
    let x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;

    if (dx !== 0 || dy !== 0) {
        const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = p2.x;
            y = p2.y;
        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p.x - x;
    dy = p.y - y;

    return dx * dx + dy * dy;
};
