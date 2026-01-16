/**
 * VTT Engine - Grid Layer
 *
 * Renders the map grid lines and optional coordinates.
 * Cached until grid settings or zoom change.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { drawGrid } from '../../../../../utils/canvasRenderer';

/**
 * GridLayer - Renders the grid overlay.
 *
 * Features:
 * - Configurable grid size, color, and opacity
 * - Support for grid offset (aligning with pre-baked grids)
 * - Optional coordinate labels (A1, B2, etc.)
 * - Cached based on grid settings and zoom
 */
export class GridLayer extends BaseLayer {
  constructor() {
    super('grid', 'Grid', {
      useCache: true,
      cacheStrategy: 'world', // Ensuring full map coverage
      description: 'Grid lines and coordinates',
    });
  }

  computeStateHash(context: RenderContext): string {
    const { scene, zoom, ui, mapWidth, mapHeight } = context;
    if (!scene) return 'no-scene';

    const { size, color, alpha, offsetX, offsetY } = scene.grid;

    return this.hashValues(
      size,
      color,
      alpha,
      offsetX ?? 0,
      offsetY ?? 0,
      zoom,
      ui.showGridCoordinates,
      mapWidth,
      mapHeight
    );
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { scene, zoom, ui, mapWidth, mapHeight } = context;
    if (!scene) return;

    const { size: gridSize, color, alpha, offsetX = 0, offsetY = 0 } = scene.grid;

    // Use legacy renderer for exact parity
    drawGrid(
      ctx,
      mapWidth,
      mapHeight,
      gridSize,
      color,
      alpha,
      zoom,
      ui.showGridCoordinates,
      offsetX,
      offsetY
    );
  }
}
