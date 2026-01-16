/**
 * VTT Engine - Grid Layer
 *
 * Renders the map grid lines and optional coordinates.
 * Cached until grid settings or zoom change.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';

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

    // Normalize offset for seamless wrapping
    const normalizeOffset = (offset: number, size: number): number => {
      const mod = offset % size;
      return mod < 0 ? mod + size : mod;
    };

    const startX = normalizeOffset(offsetX, gridSize);
    const startY = normalizeOffset(offsetY, gridSize);

    // Draw grid lines
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();

    // Vertical lines
    for (let x = startX; x <= mapWidth; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mapHeight);
    }

    // Horizontal lines
    for (let y = startY; y <= mapHeight; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(mapWidth, y);
    }

    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Draw coordinates if enabled
    if (ui.showGridCoordinates) {
      this.drawCoordinates(ctx, mapWidth, mapHeight, gridSize, zoom, startX, startY);
    }
  }

  /**
   * Draw grid coordinates (A1, B2, etc.)
   */
  private drawCoordinates(
    ctx: CanvasRenderingContext2D,
    mapWidth: number,
    mapHeight: number,
    gridSize: number,
    zoom: number,
    startX: number,
    startY: number
  ): void {
    const cols = Math.ceil((mapWidth - startX) / gridSize) + (startX > 0 ? 1 : 0);
    const rows = Math.ceil((mapHeight - startY) / gridSize) + (startY > 0 ? 1 : 0);

    const borderLabelSize = Math.max(10, Math.min(16, gridSize * 0.25)) / zoom;
    const tileLabelSize = Math.max(6, Math.min(10, gridSize * 0.12)) / zoom;
    const borderWidth = Math.max(20, gridSize * 0.4);

    // Border backgrounds
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(-borderWidth, 0, borderWidth, mapHeight);
    ctx.fillRect(0, -borderWidth, mapWidth, borderWidth);
    ctx.fillRect(-borderWidth, -borderWidth, borderWidth, borderWidth);

    // Column letters (top border)
    ctx.font = `bold ${borderLabelSize}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let col = 0; col < cols; col++) {
      const x = (col === 0 && startX > 0) ? startX / 2 : startX + (col - (startX > 0 ? 1 : 0)) * gridSize + gridSize / 2;
      if (x > mapWidth) continue;

      const y = -borderWidth / 2;
      const letter = this.columnToLetter(col);

      ctx.fillStyle = col % 2 === 0 ? '#ffffff' : '#a0a0a0';
      ctx.fillText(letter, x, y);
    }

    // Row numbers (left border)
    for (let row = 0; row < rows; row++) {
      const x = -borderWidth / 2;
      const y = (row === 0 && startY > 0) ? startY / 2 : startY + (row - (startY > 0 ? 1 : 0)) * gridSize + gridSize / 2;
      if (y > mapHeight) continue;

      const rowNum = (row + 1).toString();

      ctx.fillStyle = row % 2 === 0 ? '#ffffff' : '#a0a0a0';
      ctx.fillText(rowNum, x, y);
    }

    // Tile labels
    ctx.font = `${tileLabelSize}px "Inter", monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const xPos = (col === 0 && startX > 0) ? 0 : startX + (col - (startX > 0 ? 1 : 0)) * gridSize;
        const yPos = (row === 0 && startY > 0) ? 0 : startY + (row - (startY > 0 ? 1 : 0)) * gridSize;

        if (xPos >= mapWidth || yPos >= mapHeight) continue;

        const x = xPos + 2 / zoom;
        const y = yPos + 2 / zoom;
        const coord = `${this.columnToLetter(col)}${row + 1}`;

        const textMetrics = ctx.measureText(coord);
        const textWidth = textMetrics.width;
        const textHeight = tileLabelSize;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - 1 / zoom, y - 1 / zoom, textWidth + 4 / zoom, textHeight + 2 / zoom);

        const isLight = (col + row) % 2 === 0;
        ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(180, 180, 180, 0.7)';
        ctx.fillText(coord, x, y);
      }
    }
  }

  /**
   * Convert column index to letter (A, B, ..., Z, AA, AB, ...)
   */
  private columnToLetter(col: number): string {
    let result = '';
    let n = col;
    while (n >= 0) {
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26) - 1;
    }
    return result;
  }
}
