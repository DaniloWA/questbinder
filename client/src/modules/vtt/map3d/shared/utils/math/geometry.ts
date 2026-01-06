import { Vector2, Vector3 } from './coordinates';

/**
 * Calculates the distance between two 2D points.
 */
export const distance2D = (a: Vector2, b: Vector2): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculates the distance between two 3D points.
 */
export const distance3D = (a: Vector3, b: Vector3): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/**
 * Checks if a point is within a circle.
 * @param point The point to check
 * @param center The center of the circle
 * @param radius The radius of the circle
 */
export const pointInCircle = (point: Vector2, center: Vector2, radius: number): boolean => {
  return distance2D(point, center) <= radius;
};

/**
 * Checks if a point is within a rectangle (AABB).
 * @param point The point to check
 * @param rectTopLeft The top-left corner of the rectangle
 * @param rectSize The size (width, height) of the rectangle
 */
export const pointInRect = (point: Vector2, rectTopLeft: Vector2, rectSize: Vector2): boolean => {
  return (
    point.x >= rectTopLeft.x &&
    point.x <= rectTopLeft.x + rectSize.x &&
    point.y >= rectTopLeft.y &&
    point.y <= rectTopLeft.y + rectSize.y
  );
};
