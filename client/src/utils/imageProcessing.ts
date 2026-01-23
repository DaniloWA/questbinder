import { Point } from '../types';

// Helper to compare colors with tolerance using raw data
const colorsMatch = (
  r1: number, g1: number, b1: number, a1: number,
  r2: number, g2: number, b2: number, a2: number,
  tolerance: number
): boolean => {
  return Math.abs(r1 - r2) <= tolerance &&
    Math.abs(g1 - g2) <= tolerance &&
    Math.abs(b1 - b2) <= tolerance &&
    Math.abs(a1 - a2) <= tolerance;
};

// Ramer-Douglas-Peucker simplification
const perpendicularDistance = (p: Point, p1: Point, p2: Point): number => {
  let dx = p2.x - p1.x;
  let dy = p2.y - p1.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(p.x - p1.x, p.y - p1.y);
  }
  const mag = Math.hypot(dx, dy);
  return Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x) / mag;
};

export const simplifyPolygon = (points: Point[], epsilon: number): Point[] => {
  if (points.length < 3) return points;

  let dmax = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  if (dmax > epsilon) {
    const recResults1 = simplifyPolygon(points.slice(0, index + 1), epsilon);
    const recResults2 = simplifyPolygon(points.slice(index, end + 1), epsilon);
    return [...recResults1.slice(0, recResults1.length - 1), ...recResults2];
  } else {
    return [points[0], points[end]];
  }
};

/**
 * Chaikin's Corner Cutting Algorithm
 * Creates smooth curves by cutting corners - O(n) per iteration
 * Very efficient for real-time smoothing
 * 
 * @param points - Input polygon points
 * @param iterations - Number of smoothing passes (1-3 recommended)
 * @param closed - Whether the polygon is closed
 */
export const smoothPolygon = (points: Point[], iterations: number = 2, closed: boolean = true): Point[] => {
  if (points.length < 3 || iterations <= 0) return points;

  let result = points;

  for (let iter = 0; iter < iterations; iter++) {
    const smoothed: Point[] = [];
    const len = result.length;

    for (let i = 0; i < len; i++) {
      const p0 = result[i];
      const p1 = result[(i + 1) % len];

      // Chaikin's ratios: 0.75/0.25 creates Q and R points
      const q: Point = {
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y,
      };
      const r: Point = {
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y,
      };

      smoothed.push(q, r);
    }

    // For closed polygons, connect back to start
    if (!closed && smoothed.length > 0) {
      // Keep original start and end for open polygons
      smoothed[0] = result[0];
      smoothed[smoothed.length - 1] = result[result.length - 1];
    }

    result = smoothed;
  }

  return result;
};

/**
 * Remove duplicate/near-duplicate points (overlapping lines fix)
 * O(n) - very fast
 */
export const removeDuplicatePoints = (points: Point[], minDistance: number = 1): Point[] => {
  if (points.length < 2) return points;

  const result: Point[] = [points[0]];
  const minDistSq = minDistance * minDistance;

  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;

    // Only add if far enough from previous point
    if (dx * dx + dy * dy >= minDistSq) {
      result.push(curr);
    }
  }

  // Check if last point is too close to first (for closed polygons)
  if (result.length > 2) {
    const first = result[0];
    const last = result[result.length - 1];
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    if (dx * dx + dy * dy < minDistSq) {
      result.pop();
    }
  }

  return result;
};

/**
 * Remove collinear points (points on straight lines)
 * This aggressively removes points that lie on the same line
 * O(n) - very fast
 */
export const removeCollinearPoints = (points: Point[], angleThreshold: number = 0.05): Point[] => {
  if (points.length < 3) return points;

  const result: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Calculate angles of segments
    const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
    const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);

    // Normalize angle difference to [-PI, PI]
    let angleDiff = angle2 - angle1;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Keep point only if there's a significant direction change
    if (Math.abs(angleDiff) > angleThreshold) {
      result.push(curr);
    }
  }

  // Always keep the last point
  result.push(points[points.length - 1]);

  return result;
};

/**
 * Optimized contour processing pipeline
 * Order: Remove duplicates → Remove collinear → Simplify → Smooth
 */
export const optimizeContour = (
  points: Point[],
  options: {
    minPointDistance?: number;      // Min distance between points (default 2)
    collinearThreshold?: number;    // Angle threshold for collinear (default 0.1 rad ~6°)
    simplifyEpsilon?: number;       // RDP simplification (default 3)
    smoothIterations?: number;      // Chaikin iterations (default 1)
  } = {}
): Point[] => {
  const {
    minPointDistance = 2,
    collinearThreshold = 0.1,
    simplifyEpsilon = 3,
    smoothIterations = 1
  } = options;

  if (points.length < 3) return points;

  // Step 1: Remove near-duplicate points
  let result = removeDuplicatePoints(points, minPointDistance);

  // Step 2: Remove collinear points (straight line optimization)
  result = removeCollinearPoints(result, collinearThreshold);

  // Step 3: RDP simplification for remaining curves
  result = simplifyPolygon(result, simplifyEpsilon);

  // Step 4: Light smoothing to soften corners (only 1 iteration to not add too many points)
  if (smoothIterations > 0) {
    result = smoothPolygon(result, smoothIterations, true);
  }

  // Step 5: Final cleanup - remove any new duplicates created by smoothing
  result = removeDuplicatePoints(result, minPointDistance);

  return result;
};

// Marching Squares to find contour
const marchingSquares = (data: Uint8Array, width: number, height: number): Point[] => {
  // Find a starting point on the boundary
  let startX = -1, startY = -1;
  outer: for (let y = 0; y < height; y++) {
    const yw = y * width;
    for (let x = 0; x < width; x++) {
      if (data[yw + x] === 1) {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }

  if (startX === -1) return [];

  // Moore-Neighbor Tracing
  let x = startX;
  let y = startY;
  let prevX = x - 1;
  let prevY = y;

  const contour: Point[] = [];

  // Directions: N, NE, E, SE, S, SW, W, NW
  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];

  let currentX = x;
  let currentY = y;
  let backtrackX = prevX;
  let backtrackY = prevY;

  let steps = 0;
  const maxSteps = width * height * 2; // Safety break

  do {
    contour.push({ x: currentX, y: currentY });

    let foundNext = false;
    let dirIndex = -1;

    // Find direction index of backtrack
    // Unrolled loop for performance? Maybe not necessary for this part, but let's keep it simple
    for (let i = 0; i < 8; i++) {
      if (backtrackX === currentX + dx[i] && backtrackY === currentY + dy[i]) {
        dirIndex = i;
        break;
      }
    }

    if (dirIndex === -1) dirIndex = 6; // West default

    // Scan clockwise
    for (let i = 0; i < 8; i++) {
      const scanDir = (dirIndex + 1 + i) % 8;
      const nx = currentX + dx[scanDir];
      const ny = currentY + dy[scanDir];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (data[ny * width + nx] === 1) {
          const prevDir = (scanDir + 7) % 8;
          backtrackX = currentX + dx[prevDir];
          backtrackY = currentY + dy[prevDir];

          currentX = nx;
          currentY = ny;
          foundNext = true;
          break;
        }
      }
    }

    if (!foundNext) break;
    steps++;
  } while ((currentX !== startX || currentY !== startY) && steps < maxSteps);

  return contour;
};

export const getContourFromPoint = (
  image: HTMLImageElement,
  startX: number,
  startY: number,
  tolerance: number = 30,
  maxDimension: number = 512,
  simplification: number = 2.0,
  smoothingIterations: number = 2  // Chaikin smoothing passes (0 = off, 1-3 recommended)
): Point[] => {
  console.log('[ImageProcessing] 🎯 getContourFromPoint called');
  console.log('[ImageProcessing] Input startX:', startX, 'startY:', startY);
  console.log('[ImageProcessing] image.src:', image.src?.substring(0, 100) + '...');
  console.log('[ImageProcessing] image.naturalWidth:', image.naturalWidth);
  console.log('[ImageProcessing] image.naturalHeight:', image.naturalHeight);
  console.log('[ImageProcessing] image.width (CSS):', image.width);
  console.log('[ImageProcessing] image.height (CSS):', image.height);
  console.log('[ImageProcessing] tolerance:', tolerance, 'maxDimension:', maxDimension);

  // 1. Downscale for performance
  const MAX_DIMENSION = maxDimension; // Cap max dimension
  let scale = 1;
  let w = image.naturalWidth;
  let h = image.naturalHeight;

  console.log('[ImageProcessing] Original w:', w, 'h:', h);

  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    scale = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
    console.log('[ImageProcessing] Downscaled! scale:', scale, 'new w:', w, 'new h:', h);
  } else {
    console.log('[ImageProcessing] No downscale needed');
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Optimization hint
  if (!ctx) return [];

  ctx.drawImage(image, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const { data, width, height } = imageData;

  // Adjust start coordinates to scaled image
  const sx = Math.floor(startX * scale);
  const sy = Math.floor(startY * scale);
  console.log('[ImageProcessing] Scaled coords: sx:', sx, 'sy:', sy);
  console.log('[ImageProcessing] Canvas dimensions: width:', width, 'height:', height);

  if (sx < 0 || sx >= width || sy < 0 || sy >= height) {
    console.error('[ImageProcessing] ❌ Coords OUT OF BOUNDS! sx:', sx, 'sy:', sy, 'width:', width, 'height:', height);
    return [];
  }

  // Target Color
  const idx = (sy * width + sx) * 4;
  const tr = data[idx];
  const tg = data[idx + 1];
  const tb = data[idx + 2];
  const ta = data[idx + 3];
  console.log('[ImageProcessing] Target color at click: RGBA(', tr, tg, tb, ta, ')');

  // Visited array: 0 = unvisited, 1 = in-region, 2 = visited/checked
  const visited = new Uint8Array(width * height);

  // Queue for BFS - Pre-allocate Int32Array for better performance than push/shift
  // Max size is width * height
  const queue = new Int32Array(width * height);
  let qHead = 0;
  let qTail = 0;

  queue[qTail++] = sy * width + sx;
  visited[sy * width + sx] = 1;

  let minX = sx, maxX = sx, minY = sy, maxY = sy;

  // Flood Fill
  while (qHead < qTail) {
    const currIdx = queue[qHead++];
    const cx = currIdx % width;
    const cy = (currIdx / width) | 0; // Fast floor

    if (cx < minX) minX = cx;
    if (cx > maxX) maxX = cx;
    if (cy < minY) minY = cy;
    if (cy > maxY) maxY = cy;

    // Check 4 neighbors
    // North
    if (cy > 0) {
      const nIdx = (cy - 1) * width + cx;
      if (visited[nIdx] === 0) {
        const pIdx = nIdx * 4;
        if (colorsMatch(tr, tg, tb, ta, data[pIdx], data[pIdx + 1], data[pIdx + 2], data[pIdx + 3], tolerance)) {
          visited[nIdx] = 1;
          queue[qTail++] = nIdx;
        } else {
          visited[nIdx] = 2;
        }
      }
    }
    // South
    if (cy < height - 1) {
      const nIdx = (cy + 1) * width + cx;
      if (visited[nIdx] === 0) {
        const pIdx = nIdx * 4;
        if (colorsMatch(tr, tg, tb, ta, data[pIdx], data[pIdx + 1], data[pIdx + 2], data[pIdx + 3], tolerance)) {
          visited[nIdx] = 1;
          queue[qTail++] = nIdx;
        } else {
          visited[nIdx] = 2;
        }
      }
    }
    // West
    if (cx > 0) {
      const nIdx = cy * width + (cx - 1);
      if (visited[nIdx] === 0) {
        const pIdx = nIdx * 4;
        if (colorsMatch(tr, tg, tb, ta, data[pIdx], data[pIdx + 1], data[pIdx + 2], data[pIdx + 3], tolerance)) {
          visited[nIdx] = 1;
          queue[qTail++] = nIdx;
        } else {
          visited[nIdx] = 2;
        }
      }
    }
    // East
    if (cx < width - 1) {
      const nIdx = cy * width + (cx + 1);
      if (visited[nIdx] === 0) {
        const pIdx = nIdx * 4;
        if (colorsMatch(tr, tg, tb, ta, data[pIdx], data[pIdx + 1], data[pIdx + 2], data[pIdx + 3], tolerance)) {
          visited[nIdx] = 1;
          queue[qTail++] = nIdx;
        } else {
          visited[nIdx] = 2;
        }
      }
    }
  }

  // Extract Contour
  const cropWidth = maxX - minX + 3;
  const cropHeight = maxY - minY + 3;
  const mask = new Uint8Array(cropWidth * cropHeight);

  for (let y = minY; y <= maxY; y++) {
    const rowOffset = y * width;
    const maskRowOffset = (y - minY + 1) * cropWidth;
    for (let x = minX; x <= maxX; x++) {
      if (visited[rowOffset + x] === 1) {
        mask[maskRowOffset + (x - minX + 1)] = 1;
      }
    }
  }

  const contour = marchingSquares(mask, cropWidth, cropHeight);
  console.log('[ImageProcessing] Raw contour points from marchingSquares:', contour.length);

  // Transform back to original image coordinates and upscale
  const worldContour = contour.map(p => ({
    x: (p.x + minX - 1) / scale,
    y: (p.y + minY - 1) / scale
  }));

  // Use optimized pipeline: duplicates → collinear → simplify → smooth → cleanup
  const result = optimizeContour(worldContour, {
    minPointDistance: 2 / scale,           // Adjusted for image scale
    collinearThreshold: 0.1,               // ~6° angle threshold
    simplifyEpsilon: simplification / scale,
    smoothIterations: smoothingIterations
  });

  console.log('[ImageProcessing] ✅ Optimized contour points:', result.length);
  console.log('[ImageProcessing] Reduction:',
    ((1 - result.length / contour.length) * 100).toFixed(1) + '%',
    '(' + contour.length + ' → ' + result.length + ')'
  );

  return result;
};
