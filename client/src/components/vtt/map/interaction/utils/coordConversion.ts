/**
 * VTT Interaction Engine - Coordinate Conversion Utilities
 *
 * Shared functions for converting between coordinate systems.
 */

import type { Viewport, Point } from '../../../../../types';

/**
 * Get mouse position relative to canvas.
 */
export const getMousePos = (
  e: React.MouseEvent | React.WheelEvent,
  canvas: HTMLCanvasElement
): Point => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
};

/**
 * Convert screen coordinates to world coordinates.
 */
export const screenToWorld = (
  screenX: number,
  screenY: number,
  viewport: Viewport
): Point => ({
  x: (screenX - viewport.x) / viewport.zoom,
  y: (screenY - viewport.y) / viewport.zoom,
});

/**
 * Convert world coordinates to screen coordinates.
 */
export const worldToScreen = (
  worldX: number,
  worldY: number,
  viewport: Viewport
): Point => ({
  x: worldX * viewport.zoom + viewport.x,
  y: worldY * viewport.zoom + viewport.y,
});

/**
 * Convert world coordinates to grid coordinates.
 */
export const worldToGrid = (
  worldX: number,
  worldY: number,
  gridSize: number
): Point => ({
  x: Math.floor(worldX / gridSize),
  y: Math.floor(worldY / gridSize),
});

/**
 * Convert grid coordinates to world coordinates (center of cell).
 */
export const gridToWorld = (
  gridX: number,
  gridY: number,
  gridSize: number
): Point => ({
  x: gridX * gridSize + gridSize / 2,
  y: gridY * gridSize + gridSize / 2,
});

/**
 * Convert grid coordinates to world coordinates (top-left of cell).
 */
export const gridToWorldTopLeft = (
  gridX: number,
  gridY: number,
  gridSize: number
): Point => ({
  x: gridX * gridSize,
  y: gridY * gridSize,
});

/**
 * Snap a world position to grid center.
 */
export const snapToGridCenter = (worldPos: Point, gridSize: number): Point => {
  const gridX = Math.floor(worldPos.x / gridSize);
  const gridY = Math.floor(worldPos.y / gridSize);
  return {
    x: gridX * gridSize + gridSize / 2,
    y: gridY * gridSize + gridSize / 2,
  };
};

/**
 * Snap a world position to nearest grid intersection.
 */
export const snapToGridIntersection = (worldPos: Point, gridSize: number): Point => ({
  x: Math.round(worldPos.x / gridSize) * gridSize,
  y: Math.round(worldPos.y / gridSize) * gridSize,
});

/**
 * Round a world position to grid coordinates.
 */
export const roundToGrid = (worldPos: Point, gridSize: number): Point => ({
  x: Math.round(worldPos.x / gridSize),
  y: Math.round(worldPos.y / gridSize),
});

/**
 * Calculate the distance between two points.
 */
export const distance = (p1: Point, p2: Point): number =>
  Math.hypot(p2.x - p1.x, p2.y - p1.y);

/**
 * Check if a point is within a given radius of another point.
 */
export const isWithinRadius = (p1: Point, p2: Point, radius: number): boolean =>
  distance(p1, p2) <= radius;
