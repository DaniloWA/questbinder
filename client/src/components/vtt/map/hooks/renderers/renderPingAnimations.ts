import { Ping } from './types';
import { drawBadge, drawCircle, createRadialGrad, getAnimProgress, scaledSize } from './canvasHelpers';
import { adjustAlpha } from '../../utils';

export const renderPingAnimations = (
  ctx: CanvasRenderingContext2D,
  pings: Ping[],
  gridSize: number,
  zoom: number
) => {
  pings.forEach(ping => {
    const DURATION = 3000;
    const { progress, easeProgress } = getAnimProgress(ping.createdAt, DURATION);
    if (progress >= 1) return;

    const easeOut = easeProgress;
    const style = ping.animationStyle || 'radar';
    const color = ping.color;
    const baseSize = gridSize;

    ctx.save();
    ctx.translate(ping.x, ping.y);

    switch (style) {
      case 'radar': {
        ctx.rotate(progress * Math.PI * 4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, baseSize * 1.5, 0, Math.PI / 4);
        ctx.lineTo(0, 0);
        const grad = createRadialGrad(ctx, 0, 0, 0, baseSize * 1.5, [
          { offset: 0, color: adjustAlpha(color, 0.5) },
          { offset: 1, color: 'transparent' }
        ]);
        ctx.fillStyle = grad;
        ctx.fill();

        // Rings
        ctx.rotate(-progress * Math.PI * 4); // Reset rotation
        ctx.globalAlpha = 1 - progress;
        drawCircle(ctx, 0, 0, baseSize * progress * 2, { stroke: color, lineWidth: 2 / zoom });
        drawCircle(ctx, 0, 0, baseSize * progress * 1, { stroke: color, lineWidth: 2 / zoom });
        break;
      }
      case 'beacon': {
        const h = baseSize * 2 * easeOut;
        ctx.globalAlpha = 1 - progress;
        drawCircle(ctx, 0, 0, baseSize * 0.2, { fill: color });

        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2 * i + (progress * 2));
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(baseSize * 2, 0);
          ctx.strokeStyle = adjustAlpha(color, 0.5 * (1 - progress));
          ctx.lineWidth = 4 / zoom;
          ctx.stroke();
        }
        break;
      }
      case 'sonar': {
        for (let i = 0; i < 3; i++) {
          const waveProgress = (progress * 3 + i) % 3 / 3;
          const r = baseSize * 2 * waveProgress;
          ctx.globalAlpha = 1 - waveProgress;
          drawCircle(ctx, 0, 0, r, { stroke: color, lineWidth: 2 / zoom });
        }
        break;
      }
      case 'target': {
        const r = baseSize * 1.5 * (1 - easeOut);
        ctx.globalAlpha = Math.min(1, easeOut * 2);
        drawCircle(ctx, 0, 0, Math.max(0, r), {
          stroke: color,
          lineWidth: 3 / zoom,
          lineDash: [10 / zoom, 5 / zoom]
        });

        ctx.setLineDash([]); // Draw crosshair without dash in same scope? No drawCircle helps restoring.
        // Actually drawCircle restores so setLineDash is lost.
        // We need explicit crosshair drawing.
        ctx.beginPath();
        ctx.moveTo(-baseSize / 2, 0); ctx.lineTo(baseSize / 2, 0);
        ctx.moveTo(0, -baseSize / 2); ctx.lineTo(0, baseSize / 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 / zoom;
        ctx.stroke();
        break;
      }
      case 'flare': {
        const decay = Math.pow(1 - progress, 5);
        ctx.globalAlpha = decay;
        const grad = createRadialGrad(ctx, 0, 0, 0, baseSize * 2, [
          { offset: 0, color: color },
          { offset: 0.4, color: adjustAlpha(color, 0.2) },
          { offset: 1, color: 'transparent' }
        ]);
        drawCircle(ctx, 0, 0, baseSize * 2, { fill: grad });
        drawCircle(ctx, 0, 0, baseSize * 0.2, { fill: '#FFFFFF' });
        break;
      }
      case 'diamond': {
        ctx.rotate(progress * Math.PI);
        const r = baseSize * (1 + easeOut);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / zoom;
        ctx.globalAlpha = 1 - progress;
        ctx.strokeRect(-r / 2, -r / 2, r, r);
        ctx.rotate(Math.PI / 4);
        ctx.strokeRect(-r / 2, -r / 2, r, r);
        break;
      }
      case 'cross': {
        const scale = 1 + easeOut;
        ctx.scale(scale, scale);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4 / zoom;
        ctx.globalAlpha = 1 - progress;
        ctx.beginPath();
        ctx.moveTo(-baseSize / 2, -baseSize / 2); ctx.lineTo(baseSize / 2, baseSize / 2);
        ctx.moveTo(baseSize / 2, -baseSize / 2); ctx.lineTo(-baseSize / 2, baseSize / 2);
        ctx.stroke();
        break;
      }
      default: { // 'pulse'
        const maxRadius = gridSize * 1.5;
        ctx.globalAlpha = Math.max(0, 1 - progress * 1.5);
        drawCircle(ctx, 0, 0, (gridSize * 0.2) * (1 - progress * 0.5), { fill: color });

        ctx.globalAlpha = (1 - progress);
        drawCircle(ctx, 0, 0, maxRadius * easeOut, {
          stroke: color,
          lineWidth: Math.max(0.5, (5 - progress * 4) / zoom)
        });
        break;
      }
    }
    ctx.restore();

    // Name Display
    if (ping.userName) {
      const nameProgress = Math.min(1, (Date.now() - ping.createdAt) / 1500);
      if (nameProgress < 1) {
        const nameOpacity = 1 - Math.pow(nameProgress, 0.5);

        // Using helper for badge rendering
        ctx.save();
        ctx.globalAlpha = nameOpacity;
        drawBadge(
          ctx,
          ping.userName,
          ping.x,
          ping.y - baseSize * 1.5,
          color,
          zoom,
          { fontSize: 12 }
        );
        ctx.restore();
      }
    }
  });
};
