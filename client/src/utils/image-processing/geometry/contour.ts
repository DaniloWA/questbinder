import { Point } from '../../../types';
import { DIRECTION_VECTORS } from '../constants';
import { getPixelIndex, inBounds } from '../utils';

/**
 * Moore-Neighbor contour tracing algorithm
 */
export class ContourTracer {
  /**
   * Extract contour from binary mask
   */
  static trace(
    mask: Uint8Array,
    width: number,
    height: number
  ): Point[] {
    const startPoint = this.findStartPoint(mask, width, height);
    if (!startPoint) return [];

    const contour: Point[] = [];
    const { dx, dy } = DIRECTION_VECTORS;

    let currentX = startPoint.x;
    let currentY = startPoint.y;
    let backtrackX = currentX - 1;
    let backtrackY = currentY;

    const maxSteps = width * height * 2;
    let steps = 0;

    do {
      contour.push({ x: currentX, y: currentY });

      // Find backtrack direction
      let dirIndex = this.findDirection(
        currentX,
        currentY,
        backtrackX,
        backtrackY,
        dx,
        dy
      );

      // Scan clockwise for next boundary pixel
      let foundNext = false;
      for (let i = 0; i < 8; i++) {
        const scanDir = (dirIndex + 1 + i) % 8;
        const nx = currentX + dx[scanDir];
        const ny = currentY + dy[scanDir];

        if (
          inBounds(nx, ny, width, height) &&
          mask[getPixelIndex(nx, ny, width)] === 1
        ) {
          const prevDir = (scanDir + 7) % 8;
          backtrackX = currentX + dx[prevDir];
          backtrackY = currentY + dy[prevDir];
          currentX = nx;
          currentY = ny;
          foundNext = true;
          break;
        }
      }

      if (!foundNext) break;
      steps++;
    } while (
      (currentX !== startPoint.x || currentY !== startPoint.y) &&
      steps < maxSteps
    );

    return contour;
  }

  /**
   * Find starting point (first 1 in mask)
   */
  private static findStartPoint(
    mask: Uint8Array,
    width: number,
    height: number
  ): Point | null {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[getPixelIndex(x, y, width)] === 1) {
          return { x, y };
        }
      }
    }
    return null;
  }

  /**
   * Find direction index
   */
  private static findDirection(
    cx: number,
    cy: number,
    bx: number,
    by: number,
    dx: number[],
    dy: number[]
  ): number {
    for (let i = 0; i < 8; i++) {
      if (bx === cx + dx[i] && by === cy + dy[i]) {
        return i;
      }
    }
    return 6; // Default West
  }
}
