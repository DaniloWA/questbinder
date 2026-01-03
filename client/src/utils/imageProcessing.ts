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
  tolerance: number = 30
): Point[] => {
  // 1. Downscale for performance
  const MAX_DIMENSION = 512; // Cap max dimension
  let scale = 1;
  let w = image.width;
  let h = image.height;

  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    scale = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
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

  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return [];

  // Target Color
  const idx = (sy * width + sx) * 4;
  const tr = data[idx];
  const tg = data[idx + 1];
  const tb = data[idx + 2];
  const ta = data[idx + 3];

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

  // Transform back to world coordinates and upscale
  const worldContour = contour.map(p => ({
    x: (p.x + minX - 1) / scale,
    y: (p.y + minY - 1) / scale
  }));

  // Simplify
  return simplifyPolygon(worldContour, 2.0 / scale); // Adjust epsilon for scale
};
