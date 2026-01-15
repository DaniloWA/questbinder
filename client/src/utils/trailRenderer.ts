/**
 * Shared Trail Renderer Module
 * 
 * This module provides unified trail rendering logic for both local (CustomCursor.tsx)
 * and remote (renderCursorTrails.ts) cursors. The rendering is identical, only differing
 * in the zoom factor (local uses screen coords with zoom=1, remote uses world coords).
 */

// ============== TYPES ==============

export interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

export type TrailAnimation =
  | 'line'
  | 'particles'
  | 'sparkles'
  | 'smoke'
  | 'electric'
  | 'dice'
  | 'blood'
  | 'water'
  | 'fire'
  | 'rainbow';

export type HealthStatus = 'healthy' | 'bloodied' | 'unconscious';

export interface TrailConfig {
  enabled?: boolean;
  color?: string;
  animation?: TrailAnimation;
  customImage?: string;
  /** Trail length/duration multiplier (1-100, default 20). Higher = longer visible trail */
  length?: number;
  /** Trail thickness multiplier (0.5-3.0, default 1). Higher = thicker lines/particles */
  thickness?: number;
  /** Base size for particles (default 4). Used as starting reference for size calc. */
  size?: number;
}

export interface TrailRenderOptions {
  /** Zoom factor (1 for screen coordinates, viewport.zoom for world coordinates) */
  zoom: number;
  /** Current cursor position (for line endpoint) */
  currentPosition: { x: number; y: number; };
  /** Health status for blood trail override */
  healthStatus?: HealthStatus;
}

// ============== CONSTANTS ==============

export const TRAIL_MAX_AGE = 400; // ms
export const BLOOD_MAX_AGE_UNCONSCIOUS = 1000; // ms
export const BLOOD_MAX_AGE_BLOODIED = 800; // ms

// ============== HELPERS ==============

/**
 * Adjusts the alpha of a hex color
 */
export const adjustAlpha = (hexColor: string, alpha: number): string => {
  // Handle already rgba colors
  if (hexColor.startsWith('rgba')) {
    return hexColor.replace(/[\d.]+\)$/, `${alpha})`);
  }
  if (hexColor.startsWith('rgb')) {
    return hexColor.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }

  // Handle hex colors
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * Gets the effective animation type based on health status
 */
export const getEffectiveAnimation = (
  animation: TrailAnimation | string | undefined,
  healthStatus?: HealthStatus
): TrailAnimation => {
  if (healthStatus === 'bloodied' || healthStatus === 'unconscious') {
    return 'blood';
  }
  return (animation as TrailAnimation) || 'line';
};

/**
 * Gets the effective max age for trail points based on health status
 */
export const getEffectiveMaxAge = (healthStatus?: HealthStatus): number => {
  if (healthStatus === 'unconscious') {
    return BLOOD_MAX_AGE_UNCONSCIOUS;
  }
  if (healthStatus === 'bloodied') {
    return BLOOD_MAX_AGE_BLOODIED;
  }
  return TRAIL_MAX_AGE;
};

/**
 * Draws a simple filled circle
 */
const drawCircle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fillColor: string
): void => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
};

// ============== ANIMATION RENDERERS ==============

const renderLineTrail = (
  ctx: CanvasRenderingContext2D,
  points: TrailPoint[],
  currentPosition: { x: number; y: number; },
  color: string,
  zoom: number,
  thickness: number = 1
): void => {
  if (points.length < 3) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  // Smooth curve through points
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
  }
  ctx.lineTo(currentPosition.x, currentPosition.y);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer glow
  ctx.lineWidth = (4 / zoom) * thickness;
  ctx.strokeStyle = adjustAlpha(color, 0.4);
  ctx.stroke();

  // Inner core
  ctx.lineWidth = (1 / zoom) * thickness;
  ctx.strokeStyle = adjustAlpha(color, 0.8);
  ctx.stroke();

  ctx.restore();
};

const renderParticleTrail = (
  ctx: CanvasRenderingContext2D,
  points: TrailPoint[],
  color: string,
  zoom: number,
  maxAge: number,
  now: number,
  thickness: number = 1,
  baseSize: number = 4
): void => {
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const age = now - point.time;
    if (age > maxAge) continue;

    const progress = age / maxAge;
    const alpha = 1 - progress;
    // Fix: Size based on age (progress), not index `i`.
    // Younger points (small progress) are larger.
    const size = ((baseSize * (1 - progress * 0.5)) + 2) / zoom * thickness;

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.globalAlpha = alpha * 0.6;
    drawCircle(ctx, 0, 0, size, color);
    ctx.restore();
  }
};

const renderSparkleTrail = (
  ctx: CanvasRenderingContext2D,
  points: TrailPoint[],
  color: string,
  zoom: number,
  maxAge: number,
  now: number,
  thickness: number = 1,
  baseSize: number = 4
): void => {
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const age = now - point.time;
    if (age > maxAge) continue;

    const progress = age / maxAge;
    const alpha = 1 - progress;
    const size = ((baseSize * (1 - progress * 0.5)) + 2) / zoom * thickness;

    ctx.save();
    ctx.translate(point.x, point.y);
    // Rotate based on time to make it sparkle
    ctx.rotate((progress * Math.PI) + (point.time * 0.01));
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * 0.6;

    // Star shape
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      ctx.lineTo(
        Math.cos((18 + k * 72) / 180 * Math.PI) * size,
        -Math.sin((18 + k * 72) / 180 * Math.PI) * size
      );
      ctx.lineTo(
        Math.cos((54 + k * 72) / 180 * Math.PI) * size * 0.4,
        -Math.sin((54 + k * 72) / 180 * Math.PI) * size * 0.4
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
};

const renderSmokeTrail = (
  ctx: CanvasRenderingContext2D,
  points: TrailPoint[],
  zoom: number,
  maxAge: number,
  now: number,
  thickness: number = 1,
  baseSize: number = 4
): void => {
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const age = now - point.time;
    if (age > maxAge) continue;

    const progress = age / maxAge;
    const alpha = 1 - progress;
    // Smoke grows as it ages
    const size = ((baseSize + (progress * 8))) / zoom * thickness;
    const driftY = -age * 0.05 / zoom;

    ctx.save();
    ctx.translate(point.x, point.y + driftY);
    ctx.globalAlpha = alpha * 0.6;
    drawCircle(ctx, 0, 0, size * 2, '#666666');
    ctx.restore();
  }
};

const renderElectricTrail = (
  ctx: CanvasRenderingContext2D,
  points: TrailPoint[],
  zoom: number,
  maxAge: number,
  now: number,
  thickness: number = 1,
  baseSize: number = 4
): void => {
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const age = now - point.time;
    if (age > maxAge) continue;

    const progress = age / maxAge;
    const alpha = 1 - progress;
    const size = ((baseSize * (1 - progress * 0.5))) / zoom * thickness;

    // Jitter effect (random each frame for electric feel)
    const jitterX = (Math.random() - 0.5) * 10 / zoom;
    const jitterY = (Math.random() - 0.5) * 10 / zoom;

    ctx.save();
    ctx.translate(point.x + jitterX, point.y + jitterY);
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.moveTo(-size, -size);
    ctx.lineTo(size, size);
    ctx.stroke();
    ctx.restore();
  }
};

const renderDiceTrail = (
  ctx: CanvasRenderingContext2D,
  points: TrailPoint[],
  color: string,
  zoom: number,
  maxAge: number,
  now: number
): void => {
  const diceMaxAge = maxAge * 1.5;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const age = now - point.time;
    if (age > diceMaxAge) continue;

    const progress = age / diceMaxAge;
    const alpha = 1 - Math.pow(progress, 3);
    const diceVal = Math.floor((point.time % 20)) + 1;
    const diceSize = 16 / zoom;

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate((age * 0.005) + (point.time % Math.PI));
    ctx.translate(0, age * 0.05 / zoom); // Gravity fall

    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1 / zoom;

    // Hexagon shape
    ctx.beginPath();
    for (let s = 0; s < 6; s++) {
      const angle = (2 * Math.PI / 6) * s;
      ctx.lineTo(diceSize * Math.cos(angle), diceSize * Math.sin(angle));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Number in center
    ctx.fillStyle = color;
    ctx.font = `bold ${10 / zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(diceVal.toString(), 0, 0);

    ctx.restore();
  }
};

const renderBloodTrail = (
  ctx: CanvasRenderingContext2D,
  points: TrailPoint[],
  zoom: number,
  maxAge: number,
  now: number
): void => {
  const bloodMaxAge = maxAge * 2;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const age = now - point.time;
    if (age > bloodMaxAge) continue;

    const progress = age / bloodMaxAge;
    const alpha = 1 - Math.pow(progress, 0.5); // Slow fade

    // Deterministic randomness based on time
    const rand = (point.time % 100) / 100;
    const size = (3 + (rand * 4)) / zoom;

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.globalAlpha = alpha * 0.8;
    drawCircle(ctx, 0, 0, size, '#8a0b0b');
    ctx.restore();
  }
};

// ============== MAIN RENDER FUNCTION ==============

/**
 * Renders a cursor trail on the given canvas context.
 * 
 * @param ctx - Canvas 2D rendering context
 * @param points - Array of trail points with x, y, and timestamp
 * @param config - Trail configuration (color, animation type, etc.)
 * @param options - Render options (zoom, current position, health status)
 */
export const renderTrail = (
  ctx: CanvasRenderingContext2D,
  points: TrailPoint[],
  config: TrailConfig,
  options: TrailRenderOptions
): void => {
  if (!points || points.length === 0) return;

  const { zoom, currentPosition, healthStatus } = options;
  const color = config.color || '#fbbf24';
  const animation = getEffectiveAnimation(config.animation, healthStatus);
  const lengthMultiplier = Math.max(0.1, Math.min(5, (config.length ?? 20) / 20)); // Normalize to 0.1-5x
  const thickness = Math.max(0.5, Math.min(3, config.thickness ?? 1));
  const baseSize = config.size ?? 4; // Default particle size
  const baseMaxAge = getEffectiveMaxAge(healthStatus);
  const maxAge = baseMaxAge * lengthMultiplier;
  const now = performance.now();

  switch (animation) {
    case 'line':
      renderLineTrail(ctx, points, currentPosition, color, zoom, thickness);
      break;

    case 'particles':
      renderParticleTrail(ctx, points, color, zoom, maxAge, now, thickness, baseSize);
      break;

    case 'sparkles':
      renderSparkleTrail(ctx, points, color, zoom, maxAge, now, thickness, baseSize);
      break;

    case 'smoke':
      renderSmokeTrail(ctx, points, zoom, maxAge, now, thickness, baseSize);
      break;

    case 'electric':
      renderElectricTrail(ctx, points, zoom, maxAge, now, thickness, baseSize);
      break;

    case 'dice':
      renderDiceTrail(ctx, points, color, zoom, maxAge, now);
      break;

    case 'blood':
      renderBloodTrail(ctx, points, zoom, maxAge, now);
      break;

    default:
      // Fallback to line
      renderLineTrail(ctx, points, currentPosition, color, zoom, thickness);
      break;
  }
};

// ============== TRAIL HISTORY MANAGEMENT ==============

/**
 * Adds a point to trail history if conditions are met
 */
export const addTrailPoint = (
  history: TrailPoint[],
  x: number,
  y: number,
  velocity: number,
  lastTrailTime: number,
  maxPoints: number = 40
): { history: TrailPoint[]; lastTime: number; } => {
  const now = performance.now();

  // Only add points when moving fast enough and enough time has passed
  if (velocity > 2 && now - lastTrailTime > 16) { // ~60fps
    history.push({ x, y, time: now });

    // Limit trail length
    if (history.length > maxPoints) {
      history = history.slice(-maxPoints);
    }

    return { history, lastTime: now };
  }

  return { history, lastTime: lastTrailTime };
};

/**
 * Cleans up old trail points that have exceeded max age
 */
export const cleanupTrailHistory = (
  history: TrailPoint[],
  healthStatus?: HealthStatus,
  lengthMultiplier: number = 1.0
): TrailPoint[] => {
  const baseMaxAge = getEffectiveMaxAge(healthStatus);
  const maxAge = baseMaxAge * lengthMultiplier * 2; // Keep points a bit longer for smooth fade
  const now = performance.now();
  return history.filter(point => now - point.time < maxAge);
};
