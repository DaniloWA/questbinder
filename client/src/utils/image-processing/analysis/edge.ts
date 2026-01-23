import { calculateLuminance } from '../color/conversion';
import { getRGBAIndex } from '../utils';

/**
 * Advanced edge detection using Sobel operator
 */
export class EdgeDetector {
  private readonly data: Uint8ClampedArray;
  private readonly width: number;
  private readonly height: number;
  private readonly threshold: number;

  constructor(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    threshold: number = 80
  ) {
    this.data = data;
    this.width = width;
    this.height = height;
    this.threshold = threshold;
  }

  /**
   * Check if pixel is on an edge
   */
  isEdge(x: number, y: number): boolean {
    return this.computeGradient(x, y) > this.threshold;
  }

  /**
   * Compute Sobel gradient magnitude
   */
  private computeGradient(x: number, y: number): number {
    if (x <= 0 || x >= this.width - 1 || y <= 0 || y >= this.height - 1) {
      return 0;
    }

    const getLum = (dx: number, dy: number): number => {
      const idx = getRGBAIndex(x + dx, y + dy, this.width);
      return calculateLuminance(
        this.data[idx],
        this.data[idx + 1],
        this.data[idx + 2]
      );
    };

    // 3x3 luminance grid
    const tl = getLum(-1, -1), tm = getLum(0, -1), tr = getLum(1, -1);
    const ml = getLum(-1, 0), mr = getLum(1, 0);
    const bl = getLum(-1, 1), bm = getLum(0, 1), br = getLum(1, 1);

    // Sobel operators
    const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
    const gy = -tl - 2 * tm - tr + bl + 2 * bm + br;

    return Math.sqrt(gx * gx + gy * gy);
  }

  /**
   * Get gradient direction (for oriented edge detection)
   */
  getGradientDirection(x: number, y: number): number {
    if (x <= 0 || x >= this.width - 1 || y <= 0 || y >= this.height - 1) {
      return 0;
    }

    const getLum = (dx: number, dy: number): number => {
      const idx = getRGBAIndex(x + dx, y + dy, this.width);
      return calculateLuminance(
        this.data[idx],
        this.data[idx + 1],
        this.data[idx + 2]
      );
    };

    const tl = getLum(-1, -1), tm = getLum(0, -1), tr = getLum(1, -1);
    const ml = getLum(-1, 0), mr = getLum(1, 0);
    const bl = getLum(-1, 1), bm = getLum(0, 1), br = getLum(1, 1);

    const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
    const gy = -tl - 2 * tm - tr + bl + 2 * bm + br;

    return Math.atan2(gy, gx) * (180 / Math.PI);
  }
}
