import { WorkerManager } from '../../workers/core/WorkerManager';
import { ProcessingConfig } from './types';
import { DEFAULT_CONFIG } from './constants';
import { Point } from '../../types';

/**
 * processImageInWorker
 * 
 * Prepares image data on the main thread and offloads processing to the Web Worker.
 */
export const processImageInWorker = async (
  image: HTMLImageElement,
  startX: number,
  startY: number,
  config: Partial<ProcessingConfig> = {}
): Promise<Point[]> => {
  const finalConfig: ProcessingConfig = { ...DEFAULT_CONFIG, ...config };

  // 1. Downscale Logic (Main Thread)
  // We must do this here because we can't send HTMLImageElement to worker
  const MAX_DIMENSION = finalConfig.maxDimension;
  let scale = 1;
  let w = image.naturalWidth;
  let h = image.naturalHeight;

  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    scale = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
  }

  // 2. Extract ImageData
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  ctx.drawImage(image, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);

  // 3. Adjust start coordinates to scaled image
  const sx = Math.floor(startX * scale);
  const sy = Math.floor(startY * scale);

  // 4. Send to Worker
  const manager = WorkerManager.getInstance();

  // We transfer the buffer to avoid copy overhead if possible, 
  // though structuredClone is default. To transfer, we'd need to use the 
  // transfer list API which our simple 'execute' might not expose yet.
  // For now, let's just rely on structural cloning.

  const result = await manager.execute<Point[]>('image-processing', 'process', {
    imageData: imageData.data, // Send the Uint8ClampedArray
    width: w,
    height: h,
    startX: sx,
    startY: sy,
    scale, // Pass scale so worker can return world coords
    config: finalConfig
  });

  return result;
};
