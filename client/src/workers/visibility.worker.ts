// Web Worker for heavy visibility polygon calculations
// This offloads ray casting from the main thread to prevent frame drops

import { Point, Obstacle } from '../types';

// Message types
interface CalculateVisibilityMessage {
  type: 'calculate';
  id: string;
  origin: Point;
  obstacles: Obstacle[];
  visionRadius: number;
}

interface VisibilityResultMessage {
  type: 'result';
  id: string;
  polygon: Point[];
}

type WorkerMessage = CalculateVisibilityMessage;
type WorkerResponse = VisibilityResultMessage;

// --- GEOMETRY FUNCTIONS (duplicated from geometry.ts for worker isolation) ---

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

const calculateVisibilityPolygonWorker = (origin: Point, obstacles: Obstacle[], visionRadius: number): Point[] => {
  if (!origin || !obstacles) return [];

  const lineSegments: { p1: Point, p2: Point; }[] = [];
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
  let uniqueAngles: number[] = [];

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

// --- WORKER MESSAGE HANDLER ---

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, id, origin, obstacles, visionRadius } = event.data;

  if (type === 'calculate') {
    const polygon = calculateVisibilityPolygonWorker(origin, obstacles, visionRadius);

    const response: VisibilityResultMessage = {
      type: 'result',
      id,
      polygon
    };

    self.postMessage(response);
  }
};

export { };
