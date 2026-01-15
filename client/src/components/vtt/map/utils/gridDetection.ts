/**
 * Advanced Grid Detection Engine v2
 * Multi-Strategy Approach with Autocorrelation, Hough Transform, and FFT
 */

interface GridDetectionResult {
  gridSize: number;
  offsetX: number;
  offsetY: number;
  confidence: number;
  angle?: number;
  method?: string;
}

interface DetectionStrategy {
  name: string;
  detect: (data: Uint8ClampedArray, width: number, height: number, minSize: number, maxSize: number) => GridDetectionResult | null;
}

/**
 * Main detection function with multi-strategy voting
 */
export const detectGrid = (
  image: HTMLImageElement,
  options: {
    minGridSize?: number;
    maxGridSize?: number;
    angleThreshold?: number;
  } = {}
): GridDetectionResult | null => {
  const minGridSize = options.minGridSize || 20;
  const maxGridSize = options.maxGridSize || 300;
  const angleThreshold = options.angleThreshold || 5; // degrees

  // Setup canvas with adaptive downsampling
  const MAX_DIM = 2048;
  let scale = 1;
  if (image.width > MAX_DIM || image.height > MAX_DIM) {
    scale = Math.min(MAX_DIM / image.width, MAX_DIM / image.height);
  }

  const canvas = document.createElement('canvas');
  const width = Math.floor(image.width * scale);
  const height = Math.floor(image.height * scale);
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Apply sharpening for better edge detection
  ctx.filter = 'contrast(1.2) brightness(1.0)';
  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Run multiple detection strategies
  const strategies: DetectionStrategy[] = [
    { name: 'autocorrelation', detect: detectByAutocorrelation },
    { name: 'fft', detect: detectByFFT },
    { name: 'hough', detect: detectByHoughTransform },
    { name: 'enhanced_projection', detect: detectByEnhancedProjection }
  ];

  const results: GridDetectionResult[] = [];
  const minScaledSize = minGridSize * scale;
  const maxScaledSize = maxGridSize * scale;

  for (const strategy of strategies) {
    try {
      const result = strategy.detect(data, width, height, minScaledSize, maxScaledSize);
      if (result && result.confidence > 0.2) {
        results.push({ ...result, method: strategy.name });
      }
    } catch (e) {
      console.warn(`Strategy ${strategy.name} failed:`, e);
    }
  }

  if (results.length === 0) return null;

  // Voting and consensus
  const finalResult = combineResults(results, 1 / scale);

  return finalResult.confidence > 0.3 ? finalResult : null;
};

/**
 * Strategy 1: Autocorrelation
 * Best for regular periodic patterns
 */
const detectByAutocorrelation = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  minSize: number,
  maxSize: number
): GridDetectionResult | null => {
  // Convert to grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
  }

  // Compute 1D autocorrelation for rows and columns
  const autocorrX = computeAutocorrelation1D(gray, width, height, true, maxSize);
  const autocorrY = computeAutocorrelation1D(gray, width, height, false, maxSize);

  const xResult = findPeriodFromAutocorr(autocorrX, minSize, maxSize);
  const yResult = findPeriodFromAutocorr(autocorrY, minSize, maxSize);

  if (!xResult && !yResult) return null;

  const gridSize = xResult && yResult ? (xResult.period + yResult.period) / 2 :
    (xResult?.period || yResult?.period || 0);

  const confidence = xResult && yResult ?
    Math.min(xResult.confidence, yResult.confidence) :
    (xResult?.confidence || yResult?.confidence || 0);

  return {
    gridSize,
    offsetX: xResult?.offset || 0,
    offsetY: yResult?.offset || 0,
    confidence
  };
};

const computeAutocorrelation1D = (
  gray: Float32Array,
  width: number,
  height: number,
  isHorizontal: boolean,
  maxLag: number
): Float32Array => {
  const size = isHorizontal ? width : height;
  const count = isHorizontal ? height : width;
  const result = new Float32Array(maxLag);

  // Sample multiple lines and average
  const sampleCount = Math.min(count, 50);
  const step = Math.floor(count / sampleCount);

  for (let lag = 0; lag < maxLag; lag++) {
    let sum = 0;
    let n = 0;

    for (let line = 0; line < count; line += step) {
      for (let pos = 0; pos < size - lag; pos++) {
        const idx1 = isHorizontal ? line * width + pos : pos * width + line;
        const idx2 = isHorizontal ? line * width + pos + lag : (pos + lag) * width + line;
        sum += gray[idx1] * gray[idx2];
        n++;
      }
    }

    result[lag] = n > 0 ? sum / n : 0;
  }

  return result;
};

const findPeriodFromAutocorr = (
  autocorr: Float32Array,
  minSize: number,
  maxSize: number
): { period: number; offset: number; confidence: number; } | null => {
  // Find peaks in autocorrelation
  const peaks: { pos: number; val: number; }[] = [];

  for (let i = Math.floor(minSize); i < Math.min(autocorr.length, maxSize); i++) {
    if (i > 1 && i < autocorr.length - 1) {
      if (autocorr[i] > autocorr[i - 1] && autocorr[i] > autocorr[i + 1]) {
        peaks.push({ pos: i, val: autocorr[i] });
      }
    }
  }

  if (peaks.length < 2) return null;

  // Sort by value
  peaks.sort((a, b) => b.val - a.val);

  // Find most consistent period
  const period = peaks[0].pos;
  const confidence = peaks[0].val / autocorr[0]; // Normalize by zero-lag

  return { period, offset: 0, confidence };
};

/**
 * Strategy 2: FFT-based detection
 * Best for noisy images with strong periodic components
 */
const detectByFFT = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  minSize: number,
  maxSize: number
): GridDetectionResult | null => {
  // Simplified FFT: Use projection profiles and analyze frequency
  const vertProj = new Float32Array(width).fill(0);
  const horzProj = new Float32Array(height).fill(0);

  // Enhanced edge detection with Scharr operator
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const edges = computeScharrGradient(data, x, y, width);
      if (edges.gx > 20) vertProj[x] += edges.gx;
      if (edges.gy > 20) horzProj[y] += edges.gy;
    }
  }

  // Analyze dominant frequency using DFT approximation
  const xFreq = findDominantFrequency(vertProj, minSize, maxSize);
  const yFreq = findDominantFrequency(horzProj, minSize, maxSize);

  if (!xFreq && !yFreq) return null;

  const gridSize = xFreq && yFreq ? (xFreq.period + yFreq.period) / 2 :
    (xFreq?.period || yFreq?.period || 0);

  const confidence = Math.max(xFreq?.strength || 0, yFreq?.strength || 0);

  return {
    gridSize,
    offsetX: xFreq?.phase || 0,
    offsetY: yFreq?.phase || 0,
    confidence
  };
};

const computeScharrGradient = (
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number
): { gx: number; gy: number; } => {
  // Scharr operator: better rotation invariance than Sobel
  const getLum = (dx: number, dy: number): number => {
    const idx = ((y + dy) * width + (x + dx)) * 4;
    return data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
  };

  // Scharr kernels (3x stronger center weight)
  const gx = (
    -3 * getLum(-1, -1) + 3 * getLum(1, -1) +
    -10 * getLum(-1, 0) + 10 * getLum(1, 0) +
    -3 * getLum(-1, 1) + 3 * getLum(1, 1)
  ) / 32;

  const gy = (
    -3 * getLum(-1, -1) - 10 * getLum(0, -1) - 3 * getLum(1, -1) +
    3 * getLum(-1, 1) + 10 * getLum(0, 1) + 3 * getLum(1, 1)
  ) / 32;

  return { gx: Math.abs(gx), gy: Math.abs(gy) };
};

const findDominantFrequency = (
  signal: Float32Array,
  minPeriod: number,
  maxPeriod: number
): { period: number; phase: number; strength: number; } | null => {
  const n = signal.length;
  let maxPower = 0;
  let bestPeriod = 0;
  let bestPhase = 0;

  // Discrete Fourier Transform for specific frequency range
  for (let period = minPeriod; period <= Math.min(maxPeriod, n / 2); period += 0.5) {
    const freq = 1 / period;
    let real = 0;
    let imag = 0;

    for (let i = 0; i < n; i++) {
      const angle = 2 * Math.PI * freq * i;
      real += signal[i] * Math.cos(angle);
      imag += signal[i] * Math.sin(angle);
    }

    const power = Math.sqrt(real * real + imag * imag);

    if (power > maxPower) {
      maxPower = power;
      bestPeriod = period;
      bestPhase = Math.atan2(imag, real) / (2 * Math.PI) * period;
    }
  }

  if (maxPower === 0) return null;

  // Normalize strength
  const avgSignal = signal.reduce((a, b) => a + b, 0) / n;
  const strength = maxPower / (n * avgSignal);

  return { period: bestPeriod, phase: bestPhase, strength: Math.min(strength, 1) };
};

/**
 * Strategy 3: Hough Transform
 * Best for detecting line orientations and angles
 */
const detectByHoughTransform = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  minSize: number,
  maxSize: number
): GridDetectionResult | null => {
  // Simplified Hough for vertical and horizontal lines
  const edges = detectEdges(data, width, height);
  const lines = findLines(edges, width, height);

  if (lines.vertical.length < 3 && lines.horizontal.length < 3) return null;

  // Analyze spacing between parallel lines
  const vSpacing = analyzeLineSpacing(lines.vertical, minSize, maxSize);
  const hSpacing = analyzeLineSpacing(lines.horizontal, minSize, maxSize);

  if (!vSpacing && !hSpacing) return null;

  const gridSize = vSpacing && hSpacing ? (vSpacing.spacing + hSpacing.spacing) / 2 :
    (vSpacing?.spacing || hSpacing?.spacing || 0);

  const confidence = Math.max(vSpacing?.confidence || 0, hSpacing?.confidence || 0);

  return {
    gridSize,
    offsetX: vSpacing?.offset || 0,
    offsetY: hSpacing?.offset || 0,
    confidence
  };
};

const detectEdges = (data: Uint8ClampedArray, width: number, height: number): Uint8Array => {
  const edges = new Uint8Array(width * height);
  const threshold = 30;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const grad = computeScharrGradient(data, x, y, width);
      const magnitude = Math.sqrt(grad.gx * grad.gx + grad.gy * grad.gy);
      edges[y * width + x] = magnitude > threshold ? 255 : 0;
    }
  }

  return edges;
};

const findLines = (
  edges: Uint8Array,
  width: number,
  height: number
): { vertical: number[]; horizontal: number[]; } => {
  const vertical: number[] = [];
  const horizontal: number[] = [];

  // Vertical lines: strong edge columns
  for (let x = 0; x < width; x++) {
    let count = 0;
    for (let y = 0; y < height; y++) {
      if (edges[y * width + x] > 0) count++;
    }
    if (count > height * 0.3) vertical.push(x);
  }

  // Horizontal lines: strong edge rows
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > 0) count++;
    }
    if (count > width * 0.3) horizontal.push(y);
  }

  return { vertical, horizontal };
};

const analyzeLineSpacing = (
  lines: number[],
  minSize: number,
  maxSize: number
): { spacing: number; offset: number; confidence: number; } | null => {
  if (lines.length < 3) return null;

  const gaps: number[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const gap = lines[i + 1] - lines[i];
    if (gap >= minSize && gap <= maxSize) {
      gaps.push(gap);
    }
  }

  if (gaps.length === 0) return null;

  // Find mode
  const histogram = new Map<number, number>();
  gaps.forEach(g => {
    const bucket = Math.round(g / 2) * 2;
    histogram.set(bucket, (histogram.get(bucket) || 0) + 1);
  });

  let maxCount = 0;
  let spacing = 0;
  histogram.forEach((count, gap) => {
    if (count > maxCount) {
      maxCount = count;
      spacing = gap;
    }
  });

  const confidence = maxCount / gaps.length;

  return { spacing, offset: lines[0] % spacing, confidence };
};

/**
 * Strategy 4: Enhanced Projection with Multi-scale Analysis
 */
const detectByEnhancedProjection = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  minSize: number,
  maxSize: number
): GridDetectionResult | null => {
  // Multi-scale projection analysis
  const scales = [1, 0.5, 0.25];
  const results: GridDetectionResult[] = [];

  for (const s of scales) {
    const result = projectAndAnalyze(data, width, height, minSize * s, maxSize * s, s);
    if (result) results.push(result);
  }

  if (results.length === 0) return null;

  // Average results weighted by confidence
  let totalWeight = 0;
  let weightedSize = 0;
  let weightedX = 0;
  let weightedY = 0;

  results.forEach(r => {
    const w = r.confidence;
    totalWeight += w;
    weightedSize += r.gridSize * w;
    weightedX += r.offsetX * w;
    weightedY += r.offsetY * w;
  });

  return {
    gridSize: weightedSize / totalWeight,
    offsetX: weightedX / totalWeight,
    offsetY: weightedY / totalWeight,
    confidence: totalWeight / results.length
  };
};

const projectAndAnalyze = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  minSize: number,
  maxSize: number,
  scale: number
): GridDetectionResult | null => {
  const vProj = new Float32Array(width).fill(0);
  const hProj = new Float32Array(height).fill(0);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const grad = computeScharrGradient(data, x, y, width);
      if (grad.gx > 25) vProj[x] += grad.gx;
      if (grad.gy > 25) hProj[y] += grad.gy;
    }
  }

  const xRes = analyzePeaksRobust(vProj, minSize, maxSize);
  const yRes = analyzePeaksRobust(hProj, minSize, maxSize);

  if (!xRes && !yRes) return null;

  const gridSize = (xRes && yRes ? (xRes.period + yRes.period) / 2 :
    (xRes?.period || yRes?.period || 0)) / scale;

  return {
    gridSize,
    offsetX: (xRes?.offset || 0) / scale,
    offsetY: (yRes?.offset || 0) / scale,
    confidence: Math.max(xRes?.confidence || 0, yRes?.confidence || 0)
  };
};

const analyzePeaksRobust = (
  proj: Float32Array,
  minSize: number,
  maxSize: number
): { period: number; offset: number; confidence: number; } | null => {
  // Adaptive smoothing
  const smoothed = gaussianSmooth(proj, 3);

  const mean = smoothed.reduce((a, b) => a + b) / smoothed.length;
  const std = Math.sqrt(smoothed.reduce((a, b) => a + (b - mean) ** 2, 0) / smoothed.length);
  const threshold = mean + std * 1.5;

  const peaks: number[] = [];
  for (let i = 2; i < smoothed.length - 2; i++) {
    if (smoothed[i] > threshold &&
      smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1] &&
      smoothed[i] > smoothed[i - 2] && smoothed[i] > smoothed[i + 2]) {
      peaks.push(i);
    }
  }

  if (peaks.length < 3) return null;

  // RANSAC-like robust fitting
  const intervals: number[] = [];
  for (let i = 0; i < peaks.length - 1; i++) {
    const diff = peaks[i + 1] - peaks[i];
    if (diff >= minSize && diff <= maxSize) intervals.push(diff);
  }

  if (intervals.length === 0) return null;

  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];

  // Only keep inliers
  const inliers = intervals.filter(v => Math.abs(v - median) < median * 0.15);
  const period = inliers.reduce((a, b) => a + b, 0) / inliers.length;
  const confidence = inliers.length / intervals.length;

  // Find best offset
  const offset = findBestOffset(smoothed, period);

  return { period, offset, confidence };
};

const gaussianSmooth = (data: Float32Array, sigma: number): Float32Array => {
  const size = Math.ceil(sigma * 3);
  const kernel: number[] = [];
  let sum = 0;

  for (let i = -size; i <= size; i++) {
    const val = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(val);
    sum += val;
  }

  kernel.forEach((_, i, arr) => arr[i] /= sum);

  const result = new Float32Array(data.length);
  for (let i = size; i < data.length - size; i++) {
    let val = 0;
    for (let j = 0; j < kernel.length; j++) {
      val += data[i - size + j] * kernel[j];
    }
    result[i] = val;
  }

  return result;
};

const findBestOffset = (proj: Float32Array, period: number): number => {
  let bestOffset = 0;
  let maxScore = 0;

  for (let off = 0; off < period; off++) {
    let score = 0;
    for (let pos = off; pos < proj.length; pos += period) {
      const idx = Math.round(pos);
      if (idx < proj.length) score += proj[idx];
    }
    if (score > maxScore) {
      maxScore = score;
      bestOffset = off;
    }
  }

  return bestOffset;
};

/**
 * Combine results from multiple strategies using weighted voting
 */
const combineResults = (
  results: GridDetectionResult[],
  scale: number
): GridDetectionResult => {
  // Weight by confidence
  let totalWeight = 0;
  let weightedSize = 0;
  let weightedX = 0;
  let weightedY = 0;
  let maxConfidence = 0;
  let bestMethod = '';

  results.forEach(r => {
    const w = r.confidence * r.confidence; // Square for emphasis
    totalWeight += w;
    weightedSize += r.gridSize * w;
    weightedX += r.offsetX * w;
    weightedY += r.offsetY * w;

    if (r.confidence > maxConfidence) {
      maxConfidence = r.confidence;
      bestMethod = r.method || '';
    }
  });

  return {
    gridSize: (weightedSize / totalWeight) * scale,
    offsetX: (weightedX / totalWeight) * scale,
    offsetY: (weightedY / totalWeight) * scale,
    confidence: maxConfidence,
    method: bestMethod
  };
};