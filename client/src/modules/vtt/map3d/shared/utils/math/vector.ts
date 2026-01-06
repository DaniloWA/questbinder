import { Vector2, Vector3 } from './coordinates';

/**
 * Adds two 2D vectors.
 */
export const add2 = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

/**
 * Subtracts vector b from vector a (2D).
 */
export const sub2 = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

/**
 * Scales a 2D vector by a scalar.
 */
export const scale2 = (v: Vector2, s: number): Vector2 => ({
  x: v.x * s,
  y: v.y * s,
});

/**
 * Normalizes a 2D vector. Returns 0 vector if magnitude is 0.
 */
export const normalize2 = (v: Vector2): Vector2 => {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
};

/**
 * Adds two 3D vectors.
 */
export const add3 = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

/**
 * Subtracts vector b from vector a (3D).
 */
export const sub3 = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

/**
 * Scales a 3D vector by a scalar.
 */
export const scale3 = (v: Vector3, s: number): Vector3 => ({
  x: v.x * s,
  y: v.y * s,
  z: v.z * s,
});

/**
 * Linear interpolation between two numbers.
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};

/**
 * Linear interpolation between two 3D vectors.
 */
export const lerp3 = (start: Vector3, end: Vector3, t: number): Vector3 => ({
  x: lerp(start.x, end.x, t),
  y: lerp(start.y, end.y, t),
  z: lerp(start.z, end.z, t),
});
