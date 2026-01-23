import { getPixelIndex, inBounds } from '../utils';

/**
 * Morphological operations for mask refinement
 */
export class MorphologyProcessor {
  /**
   * Dilate (expand white regions)
   */
  static dilate(
    mask: Uint8Array,
    width: number,
    height: number,
    radius: number = 1
  ): Uint8Array {
    const result = new Uint8Array(mask.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = getPixelIndex(x, y, width);

        if (mask[idx] === 1) {
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              const ny = y + dy;

              if (inBounds(nx, ny, width, height)) {
                const nIdx = getPixelIndex(nx, ny, width);
                result[nIdx] = 1;
              }
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Erode (shrink white regions)
   */
  static erode(
    mask: Uint8Array,
    width: number,
    height: number,
    radius: number = 1
  ): Uint8Array {
    const result = new Uint8Array(mask.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = getPixelIndex(x, y, width);

        if (mask[idx] === 1) {
          let allNeighborsSet = true;

          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              const ny = y + dy;

              if (inBounds(nx, ny, width, height)) {
                const nIdx = getPixelIndex(nx, ny, width);
                if (mask[nIdx] === 0) {
                  allNeighborsSet = false;
                  break;
                }
              }
            }
            if (!allNeighborsSet) break;
          }

          if (allNeighborsSet) {
            result[idx] = 1;
          }
        }
      }
    }

    return result;
  }

  /**
   * Morphological closing (dilate then erode)
   */
  static close(
    mask: Uint8Array,
    width: number,
    height: number,
    radius: number = 1
  ): Uint8Array {
    const dilated = this.dilate(mask, width, height, radius);
    return this.erode(dilated, width, height, radius);
  }

  /**
   * Morphological opening (erode then dilate)
   */
  static open(
    mask: Uint8Array,
    width: number,
    height: number,
    radius: number = 1
  ): Uint8Array {
    const eroded = this.erode(mask, width, height, radius);
    return this.dilate(eroded, width, height, radius);
  }

  /**
   * Fill holes (connected component analysis from borders)
   */
  static fillHoles(
    mask: Uint8Array,
    width: number,
    height: number
  ): Uint8Array {
    const filled = new Uint8Array(mask) as any; // Cast to avoid TS issues if any, but Uint8Array is standard
    const visited = new Uint8Array(mask.length);
    const queue = new Int32Array(mask.length);
    let qHead = 0;
    let qTail = 0;

    // Seed from borders
    const addBorderPixel = (x: number, y: number) => {
      const idx = getPixelIndex(x, y, width);
      if (mask[idx] === 0 && visited[idx] === 0) {
        visited[idx] = 1;
        queue[qTail++] = idx;
      }
    };

    // Top and bottom borders
    for (let x = 0; x < width; x++) {
      addBorderPixel(x, 0);
      addBorderPixel(x, height - 1);
    }

    // Left and right borders
    for (let y = 1; y < height - 1; y++) {
      addBorderPixel(0, y);
      addBorderPixel(width - 1, y);
    }

    // BFS to mark all background connected to borders
    while (qHead < qTail) {
      const idx = queue[qHead++];
      const cx = idx % width;
      const cy = Math.floor(idx / width);

      const neighbors = [
        cy > 0 ? getPixelIndex(cx, cy - 1, width) : -1,
        cy < height - 1 ? getPixelIndex(cx, cy + 1, width) : -1,
        cx > 0 ? getPixelIndex(cx - 1, cy, width) : -1,
        cx < width - 1 ? getPixelIndex(cx + 1, cy, width) : -1,
      ];

      for (const nIdx of neighbors) {
        if (nIdx !== -1 && visited[nIdx] === 0 && mask[nIdx] === 0) {
          visited[nIdx] = 1;
          queue[qTail++] = nIdx;
        }
      }
    }

    // Fill holes: any 0 pixel not visited is a hole
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] === 0 && visited[i] === 0) {
        filled[i] = 1;
      }
    }

    return filled;
  }
}
