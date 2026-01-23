import { Point } from '../../types';
import { EdgeDetector } from './analysis/edge';
import { FloodFiller } from './analysis/flood';
import { ColorMatcher } from './color/matcher';
import { ColorSampler } from './color/sampler';
import { DEFAULT_CONFIG } from './constants';
import { ContourTracer } from './geometry/contour';
import { MorphologyProcessor } from './geometry/morphology';
import { PolygonOptimizer } from './geometry/optimizer';
import { ProcessingConfig } from './types';
import { inBounds } from './utils';

// Re-export types for consumers
export type { ProcessingConfig } from './types';

/**
 * Extracts and optimizes a contour of a color region starting from a seed point.
 * This is the main entry point for the image processing pipeline.
 *
 * @param image - HTMLImageElement source.
 * @param startX - X coordinate of the seed point (original scale).
 * @param startY - Y coordinate of the seed point (original scale).
 * @param config - Configuration object for the processing pipeline.
 * @returns Array of optimized contour points (Point[]) in the original image scale.
 */
export const getContourFromPoint = (
  image: HTMLImageElement,
  startX: number,
  startY: number,
  config: Partial<ProcessingConfig> = {}
): Point[] => {
  const finalConfig: ProcessingConfig = { ...DEFAULT_CONFIG, ...config };

  // 1. Downscale for performance
  const MAX_DIMENSION = finalConfig.maxDimension;
  let scale = 1;
  let w = image.naturalWidth;
  let h = image.naturalHeight;

  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    scale = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  ctx.drawImage(image, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const { data, width, height } = imageData;

  // Adjust start coordinates to scaled image
  const sx = Math.floor(startX * scale);
  const sy = Math.floor(startY * scale);

  if (!inBounds(sx, sy, width, height)) {
    return [];
  }

  // 2. Target Color & Adaptive Tolerance
  // Using 3x3 sample for Color and 5x5 sample for Variance
  const targetRGBA = ColorSampler.getSample(data, sx, sy, width, height, 3);
  const variance = ColorSampler.getVariance(data, sx, sy, width, height, 5);

  // 3. Initialize Processors with Adaptive Config
  // First, create matcher to calculate adaptive tolerance
  const tempMatcher = new ColorMatcher(targetRGBA, finalConfig);
  const adaptiveTolerance = tempMatcher.getAdaptiveTolerance(variance);

  // Update config with adaptive tolerance
  const adaptiveConfig = { ...finalConfig, tolerance: adaptiveTolerance };
  console.log('[ImageProcessing] Adaptive Tolerance:', adaptiveTolerance.toFixed(1), '(Variance:', variance.toFixed(1) + ')');

  const colorMatcher = new ColorMatcher(targetRGBA, adaptiveConfig);
  const edgeDetector = new EdgeDetector(data, width, height, adaptiveConfig.gradientThreshold);
  const floodFiller = new FloodFiller(data, width, height, colorMatcher, edgeDetector);

  // 4. Perform Flood Fill
  floodFiller.fill(sx, sy);
  const visitedMask = floodFiller.getVisited();
  const bbox = floodFiller.getBoundingBox();

  // 5. Create Cropped Mask
  const minX = bbox.minX;
  const maxX = bbox.maxX;
  const minY = bbox.minY;
  const maxY = bbox.maxY;

  // Add a 1-pixel margin for contour tracing
  const cropWidth = maxX - minX + 3;
  const cropHeight = maxY - minY + 3;
  let mask = new Uint8Array(cropWidth * cropHeight) as any;

  for (let y = minY; y <= maxY; y++) {
    const rowOffset = y * width;
    const maskRowOffset = (y - minY + 1) * cropWidth;
    for (let x = minX; x <= maxX; x++) {
      if (visitedMask[rowOffset + x] === 1) {
        mask[maskRowOffset + (x - minX + 1)] = 1;
      }
    }
  }

  // 6. Mask Refinement
  // 6.0 Morphological Opening (Erode -> Dilate) to remove pepper noise (white specks)
  mask = MorphologyProcessor.open(mask, cropWidth, cropHeight, 1);

  // 6.1. Hole Filling (Fill internal black holes)
  mask = MorphologyProcessor.fillHoles(mask, cropWidth, cropHeight);

  // 6.2. Morphological Closing (Dilate -> Erode) to close gaps and smooth edges
  mask = MorphologyProcessor.close(mask, cropWidth, cropHeight, 1);

  // 7. Contour Extraction (Moore-Neighbor Trace)
  const contour = ContourTracer.trace(mask, cropWidth, cropHeight);

  if (contour.length === 0) return [];

  // 8. Transform back to original image coordinates and upscale
  const worldContour = contour.map(p => ({
    // p.x and p.y are in the cropped mask. Subtract 1 (margin) and add minX/minY (offset)
    x: (p.x + minX - 1) / scale,
    y: (p.y + minY - 1) / scale
  }));

  // 9. Optimization Pipeline
  const result = PolygonOptimizer.optimizeContour(worldContour, {
    minPointDistance: finalConfig.simplification / scale,
    collinearThreshold: finalConfig.collinearThreshold,
    simplifyEpsilon: finalConfig.simplification / scale,
    smoothIterations: finalConfig.smoothingIterations
  });

  return result;
};
