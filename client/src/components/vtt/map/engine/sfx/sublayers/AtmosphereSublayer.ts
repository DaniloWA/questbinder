/**
 * Atmosphere Sublayer
 * 
 * Handles large-scale atmospheric effects like Fog, Clouds, and Haze.
 * Uses scrolling textures (noise) with parallax.
 */

import { SFXSublayer } from '../core/SFXSublayer';
import { RenderContext } from '../../core/types';

export class AtmosphereSublayer implements SFXSublayer {
  id = 'atmosphere';
  enabled = false;

  private noiseTexture: HTMLCanvasElement | null = null;
  private offset = { x: 0, y: 0 };
  private speed = { x: 10, y: 5 };
  private opacity = 0.5;

  setConfig(config: { enabled: boolean, intensity: number, speed?: { x: number, y: number; }; }) {
    this.enabled = config.enabled;
    this.opacity = config.intensity;
    if (config.speed) {
      this.speed = config.speed;
    }
  }

  constructor() {
    this.initNoise();
  }

  private initNoise() {
    // Generate a seamless noise texture
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear transparent
    ctx.clearRect(0, 0, size, size);

    // Helper to draw a soft blob with wrapping
    const drawBlob = (x: number, y: number, r: number, alpha: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawSeamlessBlob = (x: number, y: number, r: number, alpha: number) => {
      drawBlob(x, y, r, alpha);
      // Wrap X
      if (x - r < 0) drawBlob(x + size, y, r, alpha);
      if (x + r > size) drawBlob(x - size, y, r, alpha);
      // Wrap Y
      if (y - r < 0) drawBlob(x, y + size, r, alpha);
      if (y + r > size) drawBlob(x, y - size, r, alpha);
      // Corners (simplified, main cross-wrap handles most, but corners needed for full seamlessness)
      if (x - r < 0 && y - r < 0) drawBlob(x + size, y + size, r, alpha);
      if (x + r > size && y - r < 0) drawBlob(x - size, y + size, r, alpha);
      if (x - r < 0 && y + r > size) drawBlob(x + size, y - size, r, alpha);
      if (x + r > size && y + r > size) drawBlob(x - size, y - size, r, alpha);
    };

    // Layer 1: Large base clouds
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 150 + Math.random() * 150;
      drawSeamlessBlob(x, y, r, 0.05);
    }

    // Layer 2: Medium details
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 50 + Math.random() * 80;
      drawSeamlessBlob(x, y, r, 0.08);
    }

    this.noiseTexture = canvas;
  }

  update(deltaTime: number, context: RenderContext): void {
    // Scroll texture
    this.offset.x += this.speed.x * deltaTime;
    this.offset.y += this.speed.y * deltaTime;
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    if (!this.noiseTexture) return;

    const { viewport, mapWidth, mapHeight } = context;

    // We want to fill the screen with the repeating texture
    // But mapped to world coordinates so it stays with the map?
    // Atmosphere (Fog) acts like a layer above the map.
    // If we want it to scroll with the map, render in world space.

    // World bounds visible
    const visibleX = -viewport.x / viewport.zoom;
    const visibleY = -viewport.y / viewport.zoom;
    const visibleW = ctx.canvas.width / viewport.zoom;
    const visibleH = ctx.canvas.height / viewport.zoom;

    ctx.save();

    // Blend mode for fog
    ctx.globalCompositeOperation = 'screen';
    // ctx.globalAlpha = 0.5;
    ctx.globalAlpha = this.opacity;

    // Pattern fill is easiest for tiling
    const pattern = ctx.createPattern(this.noiseTexture, 'repeat');
    if (pattern) {
      // Offset pattern by our scroll offset
      // We need to account for the pattern matrix
      const matrix = new DOMMatrix();
      // Translate by scroll offset + world position (to lock to world)
      // If we want it to float *over* the world, we add world pos but maybe with parallax?
      // For now, lock to world.
      matrix.translateSelf(this.offset.x, this.offset.y);

      pattern.setTransform(matrix);
      ctx.fillStyle = pattern;

      // Draw rect over visible area
      // We inflate slightly to avoid edge artifacts
      ctx.fillRect(visibleX, visibleY, visibleW, visibleH);
    }

    ctx.restore();
  }

  destroy(): void {
    // Cleanup
  }
}
