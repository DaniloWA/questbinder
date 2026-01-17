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

  private color: string | undefined;
  private tintCanvas: HTMLCanvasElement | null = null;

  setConfig(config: any) { // Type as SFXFogConfig
    this.enabled = config.enabled;
    this.opacity = config.intensity;
    this.speed = {
      x: config.speedX ?? 10,
      y: config.speedY ?? 5
    };
    this.color = config.color;
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

    const { viewport } = context;

    // World bounds visible
    const visibleX = -viewport.x / viewport.zoom;
    const visibleY = -viewport.y / viewport.zoom;
    const visibleW = ctx.canvas.width / viewport.zoom;
    const visibleH = ctx.canvas.height / viewport.zoom;

    ctx.save();

    // Check Config
    const useColor = this.color && this.color !== '#ffffff';

    if (useColor) {
      // --- Tinting Path (Offscreen) ---
      if (!this.tintCanvas) {
        this.tintCanvas = document.createElement('canvas');
      }

      // Resize buffer if needed (ceil to avoid subpixel resizing spam)
      const targetW = Math.ceil(visibleW);
      const targetH = Math.ceil(visibleH);

      if (this.tintCanvas.width !== targetW || this.tintCanvas.height !== targetH) {
        this.tintCanvas.width = targetW;
        this.tintCanvas.height = targetH;
      }

      const tCtx = this.tintCanvas.getContext('2d');
      if (tCtx) {
        tCtx.clearRect(0, 0, targetW, targetH);

        // Draw Pattern on Temp
        tCtx.save();
        const pattern = tCtx.createPattern(this.noiseTexture, 'repeat');
        if (pattern) {
          const matrix = new DOMMatrix();
          // Adjust for local coordinates since temp canvas is 0,0 based
          // pattern offset needs to include the viewport offset because we are drawing from (0,0) representing (visibleX, visibleY)
          // actually, if we translate the matrix, it works in world space usually.
          // But here we draw to [0, 0, W, H] on temp canvas.
          // So the pattern needs to offset by (this.offset.x - visibleX, this.offset.y - visibleY)

          matrix.translateSelf(this.offset.x - visibleX, this.offset.y - visibleY);
          pattern.setTransform(matrix);

          tCtx.fillStyle = pattern;
          tCtx.fillRect(0, 0, targetW, targetH);
        }

        // Tint
        tCtx.globalCompositeOperation = 'source-in';
        tCtx.fillStyle = this.color!;
        tCtx.fillRect(0, 0, targetW, targetH);
        tCtx.restore();

        // Composite back to main
        ctx.globalAlpha = this.opacity;
        ctx.globalCompositeOperation = 'screen'; // or normal? Atmosphere usually screen/lighter
        ctx.drawImage(this.tintCanvas, visibleX, visibleY, visibleW, visibleH);
      }

    } else {
      // --- Standard Path (Direct) ---
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = this.opacity;

      const pattern = ctx.createPattern(this.noiseTexture, 'repeat');
      if (pattern) {
        const matrix = new DOMMatrix();
        matrix.translateSelf(this.offset.x, this.offset.y);
        pattern.setTransform(matrix);

        ctx.fillStyle = pattern;
        ctx.fillRect(visibleX, visibleY, visibleW, visibleH);
      }
    }

    ctx.restore();
  }

  destroy(): void {
    // Cleanup
  }
}
