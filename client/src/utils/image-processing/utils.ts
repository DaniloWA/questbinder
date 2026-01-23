import { RGBA } from './types';

/**
 * Clamps a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Normalizes angle difference to [-180, 180] range
 */
export const normalizeAngleDiff = (angle: number): number => {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
};

/**
 * Checks if coordinates are within bounds
 */
export const inBounds = (
  x: number,
  y: number,
  width: number,
  height: number
): boolean => {
  return x >= 0 && x < width && y >= 0 && y < height;
};

/**
 * Calculates pixel index in flat array
 */
export const getPixelIndex = (x: number, y: number, width: number): number => {
  return y * width + x;
};

/**
 * Calculates RGBA index in flat array
 */
export const getRGBAIndex = (x: number, y: number, width: number): number => {
  return getPixelIndex(x, y, width) * 4;
};

/**
 * Extracts RGBA values from data array
 */
export const extractRGBA = (
  data: Uint8ClampedArray,
  index: number
): RGBA => {
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3],
  };
};
