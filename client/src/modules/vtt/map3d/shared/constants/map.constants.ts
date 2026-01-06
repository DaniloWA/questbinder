export const DEFAULT_GRID_SIZE = 60; // Pixels or world units per grid cell
export const DEFAULT_MAP_WIDTH = 1920;
export const DEFAULT_MAP_HEIGHT = 1080;

export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 5.0;
export const ZOOM_DEFAULT = 1.0;

export const Z_INDEX = {
  MAP: 0,
  GRID: 0.01,
  PRIMITIVES: 0.05, // Decals, etc
  TOKENS: 0.1,
  FLYING: 1.0,
  UI_OVERLAY: 2.0,
};

export const GRID_COLOR_DEFAULT = '#000000';
export const GRID_ALPHA_DEFAULT = 0.2;
