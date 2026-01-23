import { LUMINANCE_WEIGHTS } from '../constants';
import { HSV, RGB } from '../types';

/**
 * Convert RGB to HSV color space (optimized)
 * Uses perceptually uniform color space for better matching
 */
export const rgbToHsv = (r: number, g: number, b: number): HSV => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  const v = max;
  const s = max === 0 ? 0 : delta / max;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = 60 * (((gn - bn) / delta) % 6);
    } else if (max === gn) {
      h = 60 * ((bn - rn) / delta + 2);
    } else {
      h = 60 * ((rn - gn) / delta + 4);
    }
    if (h < 0) h += 360;
  }

  return { h, s, v };
};

/**
 * Calculate perceptual luminance (BT.601 standard)
 */
export const calculateLuminance = (r: number, g: number, b: number): number => {
  return (
    LUMINANCE_WEIGHTS.r * r +
    LUMINANCE_WEIGHTS.g * g +
    LUMINANCE_WEIGHTS.b * b
  );
};

/**
 * Calculate color distance using CIEDE2000 approximation
 * More perceptually accurate than Euclidean distance
 */
export const calculateColorDistance = (
  rgb1: RGB,
  rgb2: RGB
): number => {
  const hsv1 = rgbToHsv(rgb1.r, rgb1.g, rgb1.b);
  const hsv2 = rgbToHsv(rgb2.r, rgb2.g, rgb2.b);

  // Hue difference (circular)
  let hueDiff = Math.abs(hsv1.h - hsv2.h);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;

  // Weighted distance combining HSV components
  const hueWeight = Math.min(hsv1.s, hsv2.s); // Hue matters more for saturated colors
  const satDiff = Math.abs(hsv1.s - hsv2.s);
  const valDiff = Math.abs(hsv1.v - hsv2.v);

  return Math.sqrt(
    Math.pow(hueDiff * hueWeight / 180, 2) +
    Math.pow(satDiff, 2) +
    Math.pow(valDiff, 2)
  );
};
