import { useRef, useEffect, useMemo } from 'react';
import { GridOptions } from '../../../../types';
import { drawGrid } from '../../../../utils/canvasRenderer';

interface LayerCacheConfig {
  grid: GridOptions;
  mapWidth: number;
  mapHeight: number;
  showCoordinates?: boolean;
}

interface LayerCache {
  gridCanvas: HTMLCanvasElement | null;
  isValid: boolean;
}

/**
 * Hook for caching static map layers to off-screen canvases.
 * 
 * The grid layer rarely changes (only when grid settings change),
 * so we can render it once to an off-screen canvas and reuse it.
 * This eliminates thousands of draw calls per frame on large maps.
 */
export const useLayerCache = (config: LayerCacheConfig) => {
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cacheVersionRef = useRef<string>('');

  // Generate version key from grid settings
  const currentVersion = useMemo(() => {
    const { grid, mapWidth, mapHeight, showCoordinates } = config;
    return `${grid.size}_${grid.cols}_${grid.rows}_${grid.color}_${grid.alpha}_${mapWidth}_${mapHeight}_${showCoordinates ? '1' : '0'}`;
  }, [config]);

  // Check if cache is valid
  const isValid = cacheVersionRef.current === currentVersion;

  // Create or update the off-screen grid canvas
  useEffect(() => {
    if (isValid && gridCanvasRef.current) return;

    const { grid, mapWidth, mapHeight, showCoordinates } = config;

    // Skip if dimensions are invalid
    if (mapWidth <= 0 || mapHeight <= 0 || grid.size <= 0) return;

    // Create off-screen canvas if doesn't exist
    if (!gridCanvasRef.current) {
      gridCanvasRef.current = document.createElement('canvas');
    }

    const canvas = gridCanvasRef.current;

    // Size the canvas to match the map (unscaled world coordinates)
    // We render at a fixed scale (1x) and let the main renderer handle zoom
    canvas.width = mapWidth;
    canvas.height = mapHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and render grid
    ctx.clearRect(0, 0, mapWidth, mapHeight);

    // Render at zoom 1 - the main canvas will handle scaling
    drawGrid(ctx, mapWidth, mapHeight, grid.size, grid.color, grid.alpha, 1, showCoordinates);

    // Update version
    cacheVersionRef.current = currentVersion;

  }, [config, currentVersion, isValid]);

  return {
    gridCanvas: gridCanvasRef.current,
    isValid: cacheVersionRef.current === currentVersion,
    invalidate: () => { cacheVersionRef.current = ''; }
  };
};

/**
 * Draws the cached grid layer to the main canvas.
 * Simply blits the pre-rendered grid.
 */
export const drawCachedGrid = (
  ctx: CanvasRenderingContext2D,
  gridCanvas: HTMLCanvasElement | null,
  mapWidth: number,
  mapHeight: number
) => {
  if (!gridCanvas) return;

  // Draw the cached grid canvas onto the main canvas
  // The main canvas is already transformed (translated + scaled by viewport)
  ctx.drawImage(gridCanvas, 0, 0, mapWidth, mapHeight);
};
