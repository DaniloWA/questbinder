export interface HSV {
  h: number; // 0-360°
  s: number; // 0-1
  v: number; // 0-1
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface RGBA extends RGB {
  a: number; // 0-255
}

export interface BoundingBox {
  minX: number;
  maxY: number;
  minY: number;
  maxX: number;
}

export interface ProcessingConfig {
  tolerance: number;
  maxDimension: number;
  simplification: number;
  smoothing: boolean;
  smoothingIterations: number;
  gradientThreshold: number;
  hueTolerance: number;
  saturationThreshold: number;
  valueThreshold: number;
  collinearThreshold: number;
}

export interface OptimizationOptions {
  minPointDistance?: number;
  collinearThreshold?: number;
  simplifyEpsilon?: number;
  smoothIterations?: number;
}
