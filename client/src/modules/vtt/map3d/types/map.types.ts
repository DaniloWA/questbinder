export interface GridOptions {
  size: number;
  color: string;
  cols: number;
  rows: number;
  unitsPerSquare?: number;
  enabled?: boolean;
}

export interface MapData {
  imageUrl?: string; // It was imageUrl not currentMap
  grid: GridOptions;
  width: number;
  height: number;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

// Re-export legacy types for compatibility if needed, or alias them
export type MapScene = {
  imageUrl: string;
};

export type Viewport = ViewportState;
