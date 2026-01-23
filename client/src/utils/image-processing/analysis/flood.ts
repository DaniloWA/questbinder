import { ColorMatcher } from '../color/matcher';
import { BoundingBox } from '../types';
import { extractRGBA, getPixelIndex, inBounds } from '../utils';
import { EdgeDetector } from './edge';

/**
 * Advanced flood fill with edge detection and adaptive color matching
 */
export class FloodFiller {
  private readonly data: Uint8ClampedArray;
  private readonly width: number;
  private readonly height: number;
  private readonly colorMatcher: ColorMatcher;
  private readonly edgeDetector: EdgeDetector;
  private readonly visited: Uint8Array; // 0: Not visited, 1: Region, 2: Edge/Rejected
  private bbox: BoundingBox;

  constructor(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    colorMatcher: ColorMatcher,
    edgeDetector: EdgeDetector
  ) {
    this.data = data;
    this.width = width;
    this.height = height;
    this.colorMatcher = colorMatcher;
    this.edgeDetector = edgeDetector;
    this.visited = new Uint8Array(width * height);
    this.bbox = { minX: width, maxX: 0, minY: height, maxY: 0 };
  }

  /**
   * Perform flood fill starting from seed point
   */
  fill(startX: number, startY: number): void {
    const queue = new Int32Array(this.width * this.height);
    let qHead = 0;
    let qTail = 0;

    const seedIdx = getPixelIndex(startX, startY, this.width);
    queue[qTail++] = seedIdx;
    this.visited[seedIdx] = 1;

    this.updateBounds(startX, startY);

    while (qHead < qTail) {
      const currIdx = queue[qHead++];
      const cx = currIdx % this.width;
      const cy = Math.floor(currIdx / this.width);

      // Check 4-connected neighbors
      qTail = this.processNeighbor(cx, cy - 1, queue, qTail); // North
      qTail = this.processNeighbor(cx, cy + 1, queue, qTail); // South
      qTail = this.processNeighbor(cx - 1, cy, queue, qTail); // West
      qTail = this.processNeighbor(cx + 1, cy, queue, qTail); // East
    }
  }

  /**
   * Process a neighbor pixel
   */
  private processNeighbor(
    x: number,
    y: number,
    queue: Int32Array,
    qTail: number
  ): number {
    if (!inBounds(x, y, this.width, this.height)) return qTail;

    const idx = getPixelIndex(x, y, this.width);
    if (this.visited[idx] !== 0) return qTail;

    // Edge detection check
    if (this.edgeDetector.isEdge(x, y)) {
      this.visited[idx] = 2; // Mark as edge
      return qTail;
    }

    // Color matching check
    const rgbaIdx = idx * 4;
    const rgba = extractRGBA(this.data, rgbaIdx);

    if (this.colorMatcher.matches(rgba.r, rgba.g, rgba.b, rgba.a)) {
      this.visited[idx] = 1;
      queue[qTail++] = idx;
      this.updateBounds(x, y);
    } else {
      this.visited[idx] = 2;
    }

    return qTail;
  }

  /**
   * Update bounding box
   */
  private updateBounds(x: number, y: number): void {
    if (x < this.bbox.minX) this.bbox.minX = x;
    if (x > this.bbox.maxX) this.bbox.maxX = x;
    if (y < this.bbox.minY) this.bbox.minY = y;
    if (y > this.bbox.maxY) this.bbox.maxY = y;
  }

  getVisited(): Uint8Array {
    return this.visited;
  }

  getBoundingBox(): BoundingBox {
    return this.bbox;
  }
}
