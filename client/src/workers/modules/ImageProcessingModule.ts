import { BaseModule } from './BaseModule';
import { EdgeDetector } from '../../utils/image-processing/analysis/edge';
import { FloodFiller } from '../../utils/image-processing/analysis/flood';
import { ColorMatcher } from '../../utils/image-processing/color/matcher';
import { ColorSampler } from '../../utils/image-processing/color/sampler';
import { ContourTracer } from '../../utils/image-processing/geometry/contour';
import { MorphologyProcessor } from '../../utils/image-processing/geometry/morphology';
import { PolygonOptimizer } from '../../utils/image-processing/geometry/optimizer';
import { ProcessingConfig } from '../../utils/image-processing/types';
import { inBounds } from '../../utils/image-processing/utils';
import { DEFAULT_CONFIG } from '../../utils/image-processing/constants';

interface ProcessPayload {
  imageData: Uint8ClampedArray;
  width: number;
  height: number;
  startX: number; // Scaled X
  startY: number; // Scaled Y
  scale: number;
  config: Partial<ProcessingConfig>;
}

export class ImageProcessingModule extends BaseModule {
  public readonly name = 'image-processing';

  public async handle(action: string, payload: any): Promise<any> {
    switch (action) {
      case 'process':
        return this.process(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async process(payload: ProcessPayload) {
    const { imageData: data, width, height, startX, startY, scale, config } = payload;

    // Safety check for bounds
    if (!inBounds(startX, startY, width, height)) {
      return [];
    }

    const finalConfig: ProcessingConfig = { ...DEFAULT_CONFIG, ...config };

    console.log('[ImageWorker] Starting processing...');
    const startTotal = performance.now();

    // 1. Target Color & Adaptive Tolerance
    const targetRGBA = ColorSampler.getSample(data, startX, startY, width, height, 3);
    const variance = ColorSampler.getVariance(data, startX, startY, width, height, 5);

    // 2. Adaptive Config
    const tempMatcher = new ColorMatcher(targetRGBA, finalConfig);
    const adaptiveTolerance = tempMatcher.getAdaptiveTolerance(variance);
    const adaptiveConfig = { ...finalConfig, tolerance: adaptiveTolerance };

    // 3. Initialize Processors
    const colorMatcher = new ColorMatcher(targetRGBA, adaptiveConfig);
    const edgeDetector = new EdgeDetector(data, width, height, adaptiveConfig.gradientThreshold);
    const floodFiller = new FloodFiller(data, width, height, colorMatcher, edgeDetector);

    // 4. Flood Fill
    floodFiller.fill(startX, startY);
    const visitedMask = floodFiller.getVisited();
    const bbox = floodFiller.getBoundingBox();

    // 5. Create Mask
    const minX = bbox.minX;
    const maxX = bbox.maxX;
    const minY = bbox.minY;
    const maxY = bbox.maxY;

    // Add margin
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

    // 6. Morphology
    mask = MorphologyProcessor.open(mask, cropWidth, cropHeight, 1);
    mask = MorphologyProcessor.fillHoles(mask, cropWidth, cropHeight);
    mask = MorphologyProcessor.close(mask, cropWidth, cropHeight, 1);

    // 7. Contour Trace
    const contour = ContourTracer.trace(mask, cropWidth, cropHeight);

    if (contour.length === 0) {
      return [];
    }

    // 8. Transform to World Coords
    const worldContour = contour.map(p => ({
      x: (p.x + minX - 1) / scale,
      y: (p.y + minY - 1) / scale
    }));

    // 9. Optimize
    const result = PolygonOptimizer.optimizeContour(worldContour, {
      minPointDistance: finalConfig.simplification / scale,
      collinearThreshold: finalConfig.collinearThreshold,
      simplifyEpsilon: finalConfig.simplification / scale,
      smoothIterations: finalConfig.smoothing ? finalConfig.smoothingIterations : 0
    });

    const endTotal = performance.now();
    console.log(`[ImageWorker] Finished in ${(endTotal - startTotal).toFixed(2)}ms`);

    return result;
  }
}
