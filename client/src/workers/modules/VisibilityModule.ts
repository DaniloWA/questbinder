import { BaseModule } from './BaseModule';
import { Point, Obstacle } from '../../types';

interface VisibilityPayload {
  origin: Point;
  obstacles: Obstacle[];
  visionRadius: number;
}

export class VisibilityModule extends BaseModule {
  public readonly name = 'visibility';
  private obstacles: Obstacle[] = []; // Cache obstacles inside worker

  public async handle(action: string, payload: any): Promise<any> {
    switch (action) {
      case 'setObstacles':
        this.obstacles = payload.obstacles || [];
        return true;
      case 'calculateVisibility':
        // Payload now only needs origin/radius. 
        // We support passing obstacles optionally for one-offs, but prefer cached.
        return this.calculateVisibility(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private calculateVisibility(payload: VisibilityPayload): Point[] {
    const { origin, visionRadius } = payload;
    // Use payload obstacles if provided (one-off), otherwise use state
    const obstacles = payload.obstacles || this.obstacles;

    if (!origin || !obstacles) return [];

    const lineSegments: { p1: Point; p2: Point; }[] = [];
    const minX = origin.x - visionRadius;
    const maxX = origin.x + visionRadius;
    const minY = origin.y - visionRadius;
    const maxY = origin.y + visionRadius;

    // Helper
    const extend = (p1: Point, p2: Point) => {
      const dx = p2.x - p1.x; const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return { p1, p2 };
      const ex = (dx / len) * 0.1; const ey = (dy / len) * 0.1;
      return { p1: { x: p1.x - ex, y: p1.y - ey }, p2: { x: p2.x + ex, y: p2.y + ey } };
    };

    // 1. Extract Segments
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
          lineSegments.push(extend(p1, p2));
        }
      } else if (obs.type === 'door' || obs.type === 'window') {
        // Typed standard LineObstacle
        if (Math.max(obs.p1.x, obs.p2.x) < minX || Math.min(obs.p1.x, obs.p2.x) > maxX ||
          Math.max(obs.p1.y, obs.p2.y) < minY || Math.min(obs.p1.y, obs.p2.y) > maxY) continue;
        lineSegments.push(extend(obs.p1, obs.p2));
      } else if ((obs as any).p1 && (obs as any).p2) {
        // Fallback/Legacy structure
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

    for (let i = 0; i < lineSegments.length; i++) {
      const s = lineSegments[i];
      const a1 = Math.atan2(s.p1.y - origin.y, s.p1.x - origin.x);
      const a2 = Math.atan2(s.p2.y - origin.y, s.p2.x - origin.x);

      if (useHighPrecision) {
        // Robust 3-ray approach
        uniqueAngles.push(a1 - 0.0001, a1, a1 + 0.0001);
        uniqueAngles.push(a2 - 0.0001, a2, a2 + 0.0001);
      } else {
        uniqueAngles.push(a1, a2);
      }
    }

    // Add fixed intervals (every ~15 deg) to ensure circle shape if no walls
    const fixedCounts = 24;
    for (let i = 0; i < fixedCounts; i++) {
      uniqueAngles.push(i * (Math.PI * 2) / fixedCounts);
    }

    // 3. Raycast
    const intersections: Point[] = [];
    for (let i = 0; i < uniqueAngles.length; i++) {
      const angle = uniqueAngles[i];
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const rayEnd = { x: origin.x + dx * visionRadius, y: origin.y + dy * visionRadius };

      let closestIntersection: Point | null = null;
      let minDist = visionRadius;

      for (let j = 0; j < lineSegments.length; j++) {
        const seg = lineSegments[j];
        // Optimization: Inline intersection check or keep method call? Method call is fine for now.
        const inter = this.getIntersection(origin, rayEnd, seg.p1, seg.p2);
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

    // 4. Sort Vertices
    intersections.sort((a, b) => Math.atan2(a.y - origin.y, a.x - origin.x) - Math.atan2(b.y - origin.y, b.x - origin.x));

    // 5. Simplify (Match Logic from visibilityService.ts)
    return this.simplifyResult(intersections, 0.5);
  }

  // --- Helpers ---

  private getIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
    if (!p1 || !p2 || !p3 || !p4) return null;
    const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
    if (d === 0) return null;
    const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
    const u = -((p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x)) / d;
    if (t > 0 && t < 1 && u > 0 && u < 1) {
      return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
    }
    return null;
  }

  // Simplify path (Ramer-Douglas-Peucker)
  private simplifyResult(points: Point[], tolerance: number): Point[] {
    if (points.length <= 2) return points;
    const sqTolerance = tolerance * tolerance;
    let maxSqDist = 0;
    let index = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const sqDist = this.getSqSegDist(points[i], points[0], points[points.length - 1]);
      if (sqDist > maxSqDist) { index = i; maxSqDist = sqDist; }
    }
    if (maxSqDist > sqTolerance) {
      const left = this.simplifyResult(points.slice(0, index + 1), tolerance);
      const right = this.simplifyResult(points.slice(index), tolerance);
      return [...left.slice(0, -1), ...right];
    }
    return [points[0], points[points.length - 1]];
  }

  // Helper: Square distance from a point to a segment
  private getSqSegDist(p: Point, p1: Point, p2: Point) {
    let x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = p2.x; y = p2.y; }
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    dx = p.x - x; dy = p.y - y;
    return dx * dx + dy * dy;
  }
}
