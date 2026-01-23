import { RGBA } from '../types';
import { getRGBAIndex, inBounds } from '../utils';

/**
 * Multi-scale sampling for robust color extraction
 */
export class ColorSampler {
  /**
   * Get average color from NxN sample area
   */
  static getSample(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    height: number,
    sampleSize: number = 3
  ): RGBA {
    let r = 0, g = 0, b = 0, a = 0, count = 0;
    const radius = Math.floor(sampleSize / 2);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (inBounds(nx, ny, width, height)) {
          const idx = getRGBAIndex(nx, ny, width);
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
          count++;
        }
      }
    }

    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count),
      a: Math.round(a / count),
    };
  }

  /**
   * Calculate local color variance for adaptive tolerance
   */
  static getVariance(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    height: number,
    sampleSize: number = 5
  ): number {
    const radius = Math.floor(sampleSize / 2);
    const sample = this.getSample(data, x, y, width, height, sampleSize);
    let variance = 0;
    let count = 0;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (inBounds(nx, ny, width, height)) {
          const idx = getRGBAIndex(nx, ny, width);
          const dr = data[idx] - sample.r;
          const dg = data[idx + 1] - sample.g;
          const db = data[idx + 2] - sample.b;
          variance += dr * dr + dg * dg + db * db;
          count++;
        }
      }
    }

    return Math.sqrt(variance / count);
  }
}
