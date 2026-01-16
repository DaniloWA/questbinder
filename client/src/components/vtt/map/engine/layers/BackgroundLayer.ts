/**
 * VTT Engine - Background Layer
 *
 * Renders the map background image.
 * Cached until the image URL changes.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';

/**
 * BackgroundLayer - Renders the scene background image.
 *
 * Features:
 * - Draws the map image to fill the scene dimensions
 * - Heavily cached (only re-renders when image changes)
 * - Fallback solid color when image not loaded
 */
export class BackgroundLayer extends BaseLayer {
  constructor() {
    super('background', 'Background', {
      useCache: true,
      description: 'Map background image',
    });
  }

  computeStateHash(context: RenderContext): string {
    const { scene, imageCache } = context;
    if (!scene) return 'no-scene';

    const imageLoaded = imageCache[scene.imageUrl]?.complete ? '1' : '0';
    return this.hashValues(
      scene.imageUrl,
      imageLoaded,
      context.mapWidth,
      context.mapHeight
    );
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { scene, imageCache, mapWidth, mapHeight } = context;
    if (!scene) return;

    const mapImage = imageCache[scene.imageUrl];

    if (mapImage?.complete) {
      ctx.drawImage(mapImage, 0, 0, mapWidth, mapHeight);
    } else {
      // Fallback: dark gray background
      ctx.fillStyle = '#27272a';
      ctx.fillRect(0, 0, mapWidth, mapHeight);
    }
  }
}
