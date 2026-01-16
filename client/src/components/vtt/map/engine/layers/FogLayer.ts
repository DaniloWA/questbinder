/**
 * VTT Engine - Fog Layer
 *
 * Renders the Fog of War overlay (GM-revealed areas).
 * Shows transparent overlay on unrevealed areas for GM view.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';

/**
 * FogLayer - Renders the Fog of War.
 *
 * Features:
 * - GM-controlled revealed areas via SVG path
 * - Semi-transparent overlay for GM visibility
 * - Dashed border around revealed areas
 * - Cached until fogPath changes
 */
export class FogLayer extends BaseLayer {
  constructor() {
    super('fog', 'Fog of War', {
      useCache: true,
      description: 'GM-revealed areas overlay',
    });
  }

  computeStateHash(context: RenderContext): string {
    const { scene, isGM, gmViewMode, zoom } = context;
    if (!scene) return 'no-scene';

    // Players see fog differently than GM
    const viewMode = isGM ? gmViewMode : 'player';

    return this.hashValues(
      scene.fogPath || '',
      viewMode,
      zoom,
      context.mapWidth,
      context.mapHeight
    );
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { scene, isGM, gmViewMode, zoom } = context;
    if (!scene || !scene.fogPath) return;

    const effectiveIsGM = isGM && gmViewMode === 'gm';

    // Only render fog overlay in GM view (players use vision clipping instead)
    if (!effectiveIsGM) return;

    const path = new Path2D(scene.fogPath);

    ctx.save();

    // Semi-transparent overlay showing revealed areas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill(path);

    // Dashed border around revealed areas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.stroke(path);

    ctx.restore();
  }
}
