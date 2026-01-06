/**
 * Shared Coordinate Utilities
 * Centralizes all conversions between Grid 2D space and World 3D space.
 * 
 * Coordinate Systems:
 * - Grid/Map 2D: Origin Top-Left (0,0), +X Right, +Y Down. Units: Grid Squares or Pixels.
 * - World 3D: Origin Center (0,0,0), +X Right, +Y Up, +Z towards camera. Plane: XY.
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 extends Vector2 {
  z: number;
}

/**
 * Converts a 2D map pixel/unit coordinate (Top-Left origin) to 3D World coordinate (Center origin).
 * @param x 2D X coordinate
 * @param y 2D Y coordinate
 * @param mapWidth Total map width in same units
 * @param mapHeight Total map height in same units
 * @param z Optional Z depth (default 0)
 */
export const mapToWorld = (x: number, y: number, mapWidth: number, mapHeight: number, z: number = 0): Vector3 => {
  return {
    x: x - mapWidth / 2,
    y: mapHeight / 2 - y,
    z
  };
};

/**
 * Converts a 3D World coordinate (Center origin) to 2D map pixel/unit coordinate (Top-Left origin).
 * @param x 3D X coordinate
 * @param y 3D Y coordinate
 * @param mapWidth Total map width
 * @param mapHeight Total map height
 */
export const worldToMap = (x: number, y: number, mapWidth: number, mapHeight: number): Vector2 => {
  return {
    x: x + mapWidth / 2,
    y: mapHeight / 2 - y
  };
};

/**
 * Converts discrete Grid coordinates (column, row) to 3D World coordinates (Center of the tile).
 * @param col Grid column (0-indexed)
 * @param row Grid row (0-indexed)
 * @param gridSize Size of one grid square in world units
 * @param mapWidth Total map width
 * @param mapHeight Total map height
 * @param z Optional Z depth
 */
export const gridToWorld = (col: number, row: number, gridSize: number, mapWidth: number, mapHeight: number, z: number = 0): Vector3 => {
  // Center of the grid cell
  const x2d = col * gridSize + gridSize / 2;
  const y2d = row * gridSize + gridSize / 2;
  return mapToWorld(x2d, y2d, mapWidth, mapHeight, z);
};

/**
 * Converts 3D World coordinates to discrete Grid coordinates (column, row).
 * @param x 3D X coordinate
 * @param y 3D Y coordinate
 * @param gridSize Size of one grid square
 * @param mapWidth Total map width
 * @param mapHeight Total map height
 */
export const worldToGrid = (x: number, y: number, gridSize: number, mapWidth: number, mapHeight: number): Vector2 => {
  const mapPos = worldToMap(x, y, mapWidth, mapHeight);
  return {
    x: Math.floor(mapPos.x / gridSize),
    y: Math.floor(mapPos.y / gridSize)
  };
};

/**
 * Aligns a 3D position to the nearest grid intersection or center.
 * @param x 3D X coordinate
 * @param y 3D Y coordinate
 * @param gridSize Grid size
 * @param mapWidth Map width
 * @param mapHeight Map height
 * @param center If true, snaps to center of tile. If false, snaps to intersection (top-left of tile).
 */
export const snapToGrid = (x: number, y: number, gridSize: number, mapWidth: number, mapHeight: number, center: boolean = true): Vector3 => {
  const gridPos = worldToGrid(x, y, gridSize, mapWidth, mapHeight);

  // If snapping to intersection (not center), we just take the grid pos * size
  // If center, we use gridToWorld

  if (center) {
    return gridToWorld(gridPos.x, gridPos.y, gridSize, mapWidth, mapHeight);
  } else {
    // Top-left of the tile in 2D
    const x2d = gridPos.x * gridSize;
    const y2d = gridPos.y * gridSize;
    return mapToWorld(x2d, y2d, mapWidth, mapHeight);
  }
};
