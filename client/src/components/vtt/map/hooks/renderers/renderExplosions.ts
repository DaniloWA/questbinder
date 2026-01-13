import { RenderContext } from './types';
import { drawCircle, getAnimProgress } from './canvasHelpers';

export interface Explosion {
  x: number;
  y: number;
  time: number;
  colors: string[];
}

export const renderExplosions = (
  ctx: CanvasRenderingContext2D,
  explosions: Explosion[],
  zoom: number
) => {
  const collisionTime = performance.now();
  const EXPLOSION_DURATION = 600;

  // We iterate backwards to remove old ones? 
  // Original code: `for (let i = explosions.length - 1; ...)` AND `explosions.splice(i, 1)`.
  // Refactor: We should probably return the cleaned list, OR modify the array in place if passed by ref. 
  // Arrays are ref. So we can splice.

  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    const age = collisionTime - exp.time;
    if (age > EXPLOSION_DURATION) {
      explosions.splice(i, 1);
      continue;
    }

    const { progress, easeProgress } = getAnimProgress(exp.time, EXPLOSION_DURATION, collisionTime, t => t); // Linear progress usually
    // Original: `const progress = age / EXPLOSION_DURATION` (Linear)

    const alpha = 1 - progress;
    const radius = (20 + progress * 60) / zoom;

    // Rings
    for (let ring = 0; ring < 3; ring++) {
      const ringProgress = Math.max(0, progress - ring * 0.15);
      const ringRadius = (10 + ringProgress * 50) / zoom;
      const ringAlpha = (1 - ringProgress) * 0.6;

      drawCircle(ctx, exp.x, exp.y, ringRadius, {
        stroke: exp.colors[ring % exp.colors.length],
        alpha: ringAlpha,
        lineWidth: 3 / zoom
      });
    }

    // Particles
    const particleCount = 12;
    for (let p = 0; p < particleCount; p++) {
      const angle = (p / particleCount) * Math.PI * 2;
      const dist = radius * progress * 1.5;
      const px = exp.x + Math.cos(angle) * dist;
      const py = exp.y + Math.sin(angle) * dist;
      const pSize = (4 - progress * 3) / zoom;

      drawCircle(ctx, px, py, Math.max(0.5, pSize), {
        fill: exp.colors[p % exp.colors.length],
        alpha: alpha * 0.8
      });
    }
  }
};
