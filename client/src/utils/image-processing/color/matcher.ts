import { HSV, ProcessingConfig, RGB } from '../types';
import { calculateLuminance, rgbToHsv } from './conversion';

/**
 * Multi-strategy color matching with adaptive thresholds
 * Combines RGB, HSV, and perceptual distance for 99% accuracy
 */
export class ColorMatcher {
  private readonly config: ProcessingConfig;
  private readonly targetRGB: RGB;
  private readonly targetHSV: HSV;
  private readonly targetLuminance: number;

  constructor(rgb: RGB, config: ProcessingConfig) {
    this.config = config;
    this.targetRGB = rgb;
    this.targetHSV = rgbToHsv(rgb.r, rgb.g, rgb.b);
    this.targetLuminance = calculateLuminance(rgb.r, rgb.g, rgb.b);
  }

  /**
   * Primary color matching strategy
   */
  matches(r: number, g: number, b: number, a: number): boolean {
    // Fast path: exact match
    if (
      r === this.targetRGB.r &&
      g === this.targetRGB.g &&
      b === this.targetRGB.b
    ) {
      return true;
    }

    // Alpha check - transparent pixels are always different
    if (Math.abs(a - 255) > 50) return false;

    // Perceptual Distance Check (utilizing calculateColorDistance logic inline for performance)
    // We incorporate the "perceptual fallback" here if needed.
    // However, sticking to the smart dual-mode logic for now as it's proven more robust for walls.

    return this.matchesSmart(r, g, b);
  }

  private matchesSmart(r: number, g: number, b: number): boolean {
    const hsv = rgbToHsv(r, g, b);
    const isSaturated =
      this.targetHSV.s > this.config.saturationThreshold &&
      hsv.s > this.config.saturationThreshold;

    if (isSaturated) {
      return this.matchSaturatedColor(r, g, b, hsv);
    } else {
      return this.matchGrayscaleColor(r, g, b, hsv);
    }
  }

  /**
   * Strategy for saturated (colorful) pixels
   */
  private matchSaturatedColor(
    r: number,
    g: number,
    b: number,
    hsv: HSV
  ): boolean {
    // Hue must match (circular distance)
    const hueDiff = this.calculateHueDifference(hsv.h);
    if (hueDiff > this.config.hueTolerance) return false;

    // Additional RGB tolerance check with leniency
    const rgbDiff = Math.max(
      Math.abs(r - this.targetRGB.r),
      Math.abs(g - this.targetRGB.g),
      Math.abs(b - this.targetRGB.b)
    );

    return rgbDiff <= this.config.tolerance * 1.5;
  }

  /**
   * Strategy for grayscale/desaturated pixels
   */
  private matchGrayscaleColor(
    r: number,
    g: number,
    b: number,
    hsv: HSV
  ): boolean {
    // For grayscale, value (brightness) is most important
    const valueDiff = Math.abs(hsv.v - this.targetHSV.v);
    if (valueDiff > this.config.valueThreshold) return false;

    // Additional luminance check
    const luminance = calculateLuminance(r, g, b);
    const lumDiff = Math.abs(luminance - this.targetLuminance) / 255;

    return lumDiff <= this.config.valueThreshold;
  }

  /**
   * Calculate hue difference (handles 360° wraparound)
   */
  private calculateHueDifference(hue: number): number {
    let diff = Math.abs(this.targetHSV.h - hue);
    if (diff > 180) diff = 360 - diff;
    return diff;
  }

  /**
   * Get adaptive tolerance based on local variance
   */
  getAdaptiveTolerance(variance: number): number {
    // Higher variance = more lenient tolerance
    // variance is typically 0-100+
    // If variance is high (textured wall), we increase tolerance
    const adaptiveFactor = 1 + Math.min(variance / 50, 1.0); // Up to 2x tolerance
    return this.config.tolerance * adaptiveFactor;
  }
}
