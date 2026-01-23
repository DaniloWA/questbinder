import { ProcessingConfig } from './types';

export const DEFAULT_CONFIG: ProcessingConfig = {
  tolerance: 30,
  maxDimension: 512,
  simplification: 2.0,
  smoothing: true,
  smoothingIterations: 2,
  gradientThreshold: 80,
  hueTolerance: 25,
  saturationThreshold: 0.05,
  valueThreshold: 0.15,
  collinearThreshold: 0.1,
};

export const DIRECTION_VECTORS = {
  dx: [0, 1, 1, 1, 0, -1, -1, -1], // N, NE, E, SE, S, SW, W, NW
  dy: [-1, -1, 0, 1, 1, 1, 0, -1],
};

export const LUMINANCE_WEIGHTS = {
  r: 0.299,
  g: 0.587,
  b: 0.114,
} as const;
