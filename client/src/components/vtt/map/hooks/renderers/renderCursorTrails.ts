import { RenderContext } from './types';
import { drawCircle, scaledSize } from './canvasHelpers';
import { adjustAlpha } from '../../utils';

export interface TrailConfig {
  enabled?: boolean;
  color?: string;
  animation?: 'line' | 'particles' | 'sparkles' | 'smoke' | 'electric' | 'dice' | 'blood';
}

export interface RenderData {
  position: { x: number, y: number; }; // Used for line end
  trailHistory: { x: number, y: number, time: number; }[];
  trailConfig: TrailConfig;
  healthStatus?: string;
}

export const renderCursorTrails = (
  ctx: CanvasRenderingContext2D,
  renderData: RenderData,
  cursorColor: string,
  zoom: number
) => {
  const { trailConfig, trailHistory, healthStatus, position } = renderData;
  const now = performance.now(); // Original used performance.now() passed in? No, used in loop.
  // Actually original used `now = performance.now()` inside the loop for all cursors.
  // We can passed it or call it. Calling it is fine.

  // Check visibility logic is handled by caller (showTrials)

  const trailColor = trailConfig.color || cursorColor;
  let animation = trailConfig.animation || 'line';

  if (healthStatus === 'bloodied' || healthStatus === 'unconscious') {
    animation = 'blood';
  }

  const trailMaxAge = healthStatus === 'unconscious' ? 1000 : 400;

  if (animation === 'line') {
    if (trailHistory.length > 2) {
      ctx.save();
      ctx.beginPath();
      const start = trailHistory[0];
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < trailHistory.length - 1; i++) {
        const p0 = trailHistory[i];
        const p1 = trailHistory[i + 1];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      }
      ctx.lineTo(position.x, position.y);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4 / zoom;
      ctx.strokeStyle = adjustAlpha(trailColor, 0.4);
      ctx.stroke();

      ctx.lineWidth = 1 / zoom;
      ctx.strokeStyle = adjustAlpha(trailColor, 0.8);
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // Particle systems
    for (let i = 0; i < trailHistory.length; i++) {
      const trail = trailHistory[i];
      const age = now - trail.time;
      // Note: trail.time comes from physics engine which uses Date.now() usually? 
      // Physics engine `tick` delta is passed. 
      // Original code: `cursorEngine` updates use `timestamp`.
      // `cursorEngine.tick` uses `deltaMs`.
      // `trailHistory` times are likely `performance.now()` if generated there.
      // Wait, original `cursorEngine` might using different time.
      // In original code: `const now = performance.now();` at line 1219.
      // `const age = now - trail.time;`.
      // So assuming `trail.time` is compatible with `performance.now()`.

      if (animation === 'dice' && age > trailMaxAge * 1.5) continue;
      if (animation === 'blood' && age > trailMaxAge * 2) continue;
      if (animation !== 'dice' && animation !== 'blood' && age > trailMaxAge) continue;

      let progress = age / trailMaxAge;
      if (animation === 'dice') progress = age / (trailMaxAge * 1.5);
      if (animation === 'blood') progress = age / (trailMaxAge * 2);

      const alpha = (animation === 'dice' || animation === 'blood')
        ? (animation === 'dice' ? 1 - Math.pow(progress, 3) : 1 - Math.pow(progress, 0.5))
        : 1 - progress;

      // Seed/Random logic
      // Original: `const seed = (trail.time % 100) / 100;` (unused?)
      // Original used specific randoms based on time for determinism.

      const size = ((4 + (i * 0.2)) * (1 - progress * 0.5)) / zoom;

      ctx.save();
      ctx.translate(trail.x, trail.y);

      if (animation === 'sparkles') {
        const rot = progress * Math.PI;
        ctx.rotate(rot);
        ctx.fillStyle = trailColor;
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          // Star shape logic
          ctx.lineTo(Math.cos((18 + k * 72) / 180 * Math.PI) * size, -Math.sin((18 + k * 72) / 180 * Math.PI) * size);
          ctx.lineTo(Math.cos((54 + k * 72) / 180 * Math.PI) * size * 0.4, -Math.sin((54 + k * 72) / 180 * Math.PI) * size * 0.4);
        }
        ctx.closePath();
        ctx.fill();
      } else if (animation === 'smoke') {
        const driftY = -age * 0.05 / zoom;
        ctx.translate(0, driftY);
        drawCircle(ctx, 0, 0, size * 2, { fill: '#666666' });
      } else if (animation === 'electric') {
        const jitterX = (Math.random() - 0.5) * 10 / zoom; // Random here causes jitter every frame?
        // Original code used Math.random() inside the loop! Yes, so it jitters every frame.
        const jitterY = (Math.random() - 0.5) * 10 / zoom;
        ctx.translate(jitterX, jitterY);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath(); ctx.moveTo(-size, -size); ctx.lineTo(size, size); ctx.stroke();
      } else if (animation === 'dice') {
        // Dice logic
        const val = Math.floor((trail.time % 20)) + 1;
        const dSize = 16 / zoom;
        ctx.rotate((age * 0.005) + (trail.time % Math.PI));
        ctx.translate(0, age * 0.05 / zoom);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = trailColor;
        ctx.lineWidth = 1 / zoom;

        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const angle = 2 * Math.PI / 6 * s;
          ctx.lineTo(dSize * Math.cos(angle), dSize * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = trailColor;
        ctx.font = `bold ${10 / zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val.toString(), 0, 0);
      } else if (animation === 'blood') {
        // Blood logic
        const rand = (trail.time % 100) / 100;
        const bSize = (3 + (rand * 4)) / zoom;
        ctx.globalAlpha = alpha * 0.8;
        drawCircle(ctx, 0, 0, bSize, { fill: '#8a0b0b' });
      } else { // particles
        ctx.fillStyle = trailColor;
        ctx.globalAlpha = alpha * 0.6;
        drawCircle(ctx, 0, 0, size, { fill: trailColor });
      }

      ctx.restore();
    }
  }
};
