/**
 * VTT Engine - Debug Layer
 *
 * Renders real-time performance statistics overlay.
 * - FPS
 * - Render Time per Layer
 * - Particle Counts
 * - Memory usage (if available)
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';

export class DebugLayer extends BaseLayer {
  constructor() {
    super('debug', 'Debug Stats', {
      useCache: false, // Always dynamic
      opacity: 0.8,
    });
  }

  computeStateHash(context: RenderContext): string {
    return 'dynamic';
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    if (!this.orchestrator) return;

    // Reset transform to draw in screen space (HUD)
    ctx.save();
    ctx.resetTransform();

    const fps = this.orchestrator.getFps();
    const layerStates = this.orchestrator.getLayerStates();

    // Sort layers by render time desc
    layerStates.sort((a, b) => b.lastRenderTime - a.lastRenderTime);

    const padding = 10;
    const lineHeight = 14;
    let y = padding + lineHeight;

    // Background box
    const width = 220;
    const height = (layerStates.length * lineHeight) + 60;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(5, 5, width, height);

    // Text Style
    ctx.font = '12px monospace';
    ctx.fillStyle = '#00ff00';
    ctx.textAlign = 'left';

    // FPS
    ctx.fillText(`FPS: ${fps}`, padding, y);
    y += lineHeight;

    // Total Frame Time (approx from layer sum or just use performance.now delta if we tracked it)
    // We don't have total frame time from orchestrator public API easily here without tracking it ourselves?
    // Orchestrator keeps `frameTime` internally but doesn't expose it except via event.
    // We'll just sum layer times.
    const totalLayerTime = layerStates.reduce((acc, l) => acc + l.lastRenderTime, 0);
    ctx.fillText(`Layer Render: ${totalLayerTime.toFixed(2)}ms`, padding, y);
    y += lineHeight * 1.5;

    // Layer Breakdown
    ctx.fillStyle = '#cccccc';
    ctx.fillText('--- Layer Costs ---', padding, y);
    y += lineHeight;

    for (const layer of layerStates) {
      // Highlight expensive layers
      if (layer.lastRenderTime > 2) ctx.fillStyle = '#ff5555';
      else if (layer.lastRenderTime > 0.5) ctx.fillStyle = '#ffff55';
      else ctx.fillStyle = '#cccccc';

      const name = layer.id.padEnd(15, ' ').slice(0, 15);
      const time = layer.lastRenderTime.toFixed(2).padStart(6, ' ');
      ctx.fillText(`${name}: ${time}ms`, padding, y);
      y += lineHeight;
    }

    ctx.restore();
  }
}
