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
    // Generate a simple seamless noise texture procedurally
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple random noise clouds
    // For better results we'd use Perlin, but for this POC we use radial gradients scattered
    ctx.fillStyle = '#000000'; // Transparent base (using blend mode later)
    ctx.fillRect(0, 0, size, size);

    // Create a few "cloud" blobs
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 50 + Math.random() * 100;

      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
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
