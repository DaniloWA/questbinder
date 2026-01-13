import { RenderContext } from './types';
import { drawCircle, getAnimProgress } from './canvasHelpers';
import { adjustAlpha } from '../../utils';

export interface ClickAnimation {
  x: number;
  y: number;
  color: string;
  style?: 'ripple' | 'burst' | 'sparkle' | 'pulse' | 'vortex' | 'shard' | 'ring' | 'echo' | 'orb';
  startTime: number;
}

export const renderClickAnimations = (
  ctx: CanvasRenderingContext2D,
  animations: ClickAnimation[],
  zoom: number
) => {
  const now = Date.now();
  const DURATION = 500;

  animations.forEach(anim => {
    const { progress, easeProgress } = getAnimProgress(anim.startTime, DURATION, now);
    if (progress >= 1) return;

    // easeOutCubic is used in original code: 1 - Math.pow(1 - progress, 3) which matches getAnimProgress default
    const easeOut = easeProgress;

    ctx.save();
    ctx.translate(anim.x, anim.y);
    ctx.globalAlpha = 1 - easeOut; // Fade out common

    switch (anim.style) {
      case 'burst': {
        const maxR = 60 / zoom;
        const currentR = maxR * easeOut;
        const lines = 8;
        ctx.strokeStyle = anim.color;
        ctx.lineWidth = 2 / zoom;
        for (let i = 0; i < lines; i++) {
          const angle = (Math.PI * 2 / lines) * i;
          const x1 = Math.cos(angle) * (currentR * 0.4);
          const y1 = Math.sin(angle) * (currentR * 0.4);
          const x2 = Math.cos(angle) * currentR;
          const y2 = Math.sin(angle) * currentR;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        break;
      }
      case 'sparkle': {
        const maxDist = 50 / zoom;
        const particles = 5;
        // Using helper for particles
        for (let i = 0; i < particles; i++) {
          const angle = (Math.PI * 2 / particles) * i + (now / 200);
          const dist = maxDist * easeOut;
          const px = Math.cos(angle) * dist;
          const py = Math.sin(angle) * dist;
          drawCircle(ctx, px, py, 4 / zoom, { fill: anim.color });
        }
        break;
      }
      case 'pulse': {
        const maxR = 40 / zoom;
        drawCircle(ctx, 0, 0, maxR * easeOut, { fill: anim.color });
        break;
      }
      case 'vortex': {
        const maxR = 50 / zoom;
        const spirals = 3;
        ctx.strokeStyle = anim.color;
        ctx.lineWidth = 2 / zoom;
        for (let j = 0; j < spirals; j++) {
          const angleOffset = (Math.PI * 2 / spirals) * j + (easeOut * Math.PI * 2);
          ctx.beginPath();
          for (let i = 0; i < 15; i++) {
            const r = (i / 15) * maxR * easeOut;
            const a = angleOffset + (i / 4);
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        break;
      }
      case 'shard': {
        const shards = 5;
        const dist = 50 / zoom * easeOut;
        ctx.fillStyle = anim.color;
        for (let i = 0; i < shards; i++) {
          const angle = (Math.PI * 2 / shards) * i;
          const sx = Math.cos(angle) * dist;
          const sy = Math.sin(angle) * dist;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          const size = 6 / zoom;
          ctx.lineTo(sx + Math.cos(angle + 2.5) * size, sy + Math.sin(angle + 2.5) * size);
          ctx.lineTo(sx + Math.cos(angle - 2.5) * size, sy + Math.sin(angle - 2.5) * size);
          ctx.fill();
        }
        break;
      }
      case 'ring': {
        const r1 = 30 / zoom * easeOut;
        const r2 = 20 / zoom * easeOut;
        drawCircle(ctx, 0, 0, r1, { stroke: anim.color, lineWidth: 2 / zoom });
        drawCircle(ctx, 0, 0, r2, { stroke: anim.color, lineWidth: 2 / zoom });
        break;
      }
      case 'echo': {
        const count = 3;
        for (let i = 0; i < count; i++) {
          const r = (50 / zoom) * easeOut * (1 - i * 0.25);
          if (r > 0) {
            drawCircle(ctx, 0, 0, r, { stroke: anim.color, lineWidth: 1.5 / zoom });
          }
        }
        break;
      }
      case 'orb': {
        const r = 25 / zoom * easeOut;
        drawCircle(ctx, 0, 0, r, { fill: anim.color });
        // Inner glow
        ctx.globalAlpha = (1 - easeOut) * 0.5;
        drawCircle(ctx, 0, 0, r * 0.6, { fill: anim.color });
        break;
      }
      default: { // 'ripple'
        const radius = (20 / zoom) + (40 / zoom * easeOut);
        drawCircle(ctx, 0, 0, radius, {
          stroke: anim.color,
          lineWidth: (3 / zoom) * (1 - easeOut)
        });
        break;
      }
    }

    ctx.restore();
  });
};
