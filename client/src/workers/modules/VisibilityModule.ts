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
          lineSegments.push({ p1, p2 });
        }
      } else if (obs.type === 'door' || obs.type === 'window' || ((obs as any).p1 && (obs as any).p2)) {
        // Support both old LineObstacle structure (p1, p2) and typed door/window
        const p1 = (obs as any).p1;
        const p2 = (obs as any).p2;
        if (Math.max(p1.x, p2.x) < minX || Math.min(p1.x, p2.x) > maxX ||
          Math.max(p1.y, p2.y) < minY || Math.min(p1.y, p2.y) > maxY) continue;
        lineSegments.push({ p1, p2 });
      }
    }

    // 2. Generate Casting Angles
    const uniqueAngles: number[] = [];
    for (let i = 0; i < lineSegments.length; i++) {
      const s = lineSegments[i];
      const a1 = Math.atan2(s.p1.y - origin.y, s.p1.x - origin.x);
      const a2 = Math.atan2(s.p2.y - origin.y, s.p2.x - origin.x);
      uniqueAngles.push(a1 - 0.0001, a1, a1 + 0.0001);
      uniqueAngles.push(a2 - 0.0001, a2, a2 + 0.0001);
    }
    // Add fixed intervals (every 15 deg) to ensure circle shape if no walls
    for (let i = 0; i < 360; i += 15) uniqueAngles.push(i * Math.PI / 180);

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

    return intersections;
  }

  // Internal Helper
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
}
