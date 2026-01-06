import { create } from 'zustand';
import { MapData, ViewportState } from '../types/map.types';
import { DEFAULT_GRID_SIZE, DEFAULT_MAP_HEIGHT, DEFAULT_MAP_WIDTH, ZOOM_DEFAULT } from '../shared/constants/map.constants';

interface MapStoreState {
  mapData: MapData;
  viewport: ViewportState;

  // Actions
  setMapData: (data: Partial<MapData>) => void;
  updateViewport: (updates: Partial<ViewportState>) => void;
  setGridSize: (size: number) => void;
}

export const useMapStore = create<MapStoreState>((set) => ({
  mapData: {
    id: 'default',
    imageUrl: '',
    width: DEFAULT_MAP_WIDTH,
    height: DEFAULT_MAP_HEIGHT,
    grid: {
      enabled: true,
      size: DEFAULT_GRID_SIZE,
      color: '#000000',
      cols: Math.ceil(DEFAULT_MAP_WIDTH / DEFAULT_GRID_SIZE),
      rows: Math.ceil(DEFAULT_MAP_HEIGHT / DEFAULT_GRID_SIZE),
      unitsPerSquare: 1.5,
    },
  },
  viewport: {
    x: 0,
    y: 0,
    zoom: ZOOM_DEFAULT,
    isDragging: false,
  },

  setMapData: (data) => set((state) => ({
    mapData: { ...state.mapData, ...data }
  })),

  updateViewport: (updates) => set((state) => ({
    viewport: { ...state.viewport, ...updates }
  })),

  setGridSize: (size) => set((state) => ({
    mapData: {
      ...state.mapData,
      grid: {
        ...state.mapData.grid,
        size,
        cols: Math.ceil(state.mapData.width / size),
        rows: Math.ceil(state.mapData.height / size),
      }
    }
  })),
}));
