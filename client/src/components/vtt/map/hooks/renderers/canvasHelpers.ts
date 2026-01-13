import { adjustAlpha, easeOutCubic } from '../../utils';
import { getContrastColor } from '../../../../../utils/colors';

// Scale-aware line width
export const scaledSize = (size: number, zoom: number) => size / zoom;

// Animation progress helper
export const getAnimProgress = (
  startTime: number,
  duration: number,
  renderTime: number = Date.now(),
  easing: (t: number) => number = easeOutCubic
): { progress: number; easeProgress: number; isComplete: boolean; } => {
  const elapsed = renderTime - startTime;
  const progress = Math.min(1, elapsed / duration);
  return {
    progress,
    easeProgress: easing(progress),
    isComplete: progress >= 1
  };
};

// Rounded Rectangle
export const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

// Name Badge
export const drawBadge = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  bgColor: string,
  zoom: number,
  options: {
    paddingX?: number;
    paddingY?: number;
    fontSize?: number;
    shadow?: boolean;
    offsetY?: number;
    font?: string;
  } = {}
) => {
  const {
    paddingX = 6 / zoom,
    paddingY = 4 / zoom, // Not used in geometry calc but kept for compat
    fontSize = 11,
    shadow = true,
    font = "Inter"
  } = options;

  const scaledFontSize = fontSize / zoom;
  ctx.font = `600 ${scaledFontSize}px "${font}", sans-serif`;
  ctx.textBaseline = 'middle';
  const textMetrics = ctx.measureText(text);

  const badgeHeight = (fontSize + 6) / zoom;
  const badgeWidth = textMetrics.width + (paddingX * 2);

  // Position
  const r = 4 / zoom;

  // Save context for shadow
  ctx.save();
  ctx.fillStyle = bgColor;
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
  }

  // Draw background
  drawRoundedRect(ctx, x, y, badgeWidth, badgeHeight, r);
  ctx.fill();

  // Draw text
  ctx.shadowBlur = 0; // Reset shadow for text
  ctx.fillStyle = getContrastColor(bgColor);
  ctx.fillText(text, x + paddingX, y + (badgeHeight / 2));

  ctx.restore();
};

// Circle / Arc
export const drawCircle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  options: {
    fill?: string | CanvasGradient;
    stroke?: string;
    lineWidth?: number;
    alpha?: number;
    startAngle?: number;
    endAngle?: number;
    lineDash?: number[];
  } = {}
) => {
  const {
    fill,
    stroke,
    lineWidth = 1,
    alpha = 1,
    startAngle = 0,
    endAngle = Math.PI * 2,
    lineDash = []
  } = options;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, radius), startAngle, endAngle);

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    if (lineDash.length > 0) ctx.setLineDash(lineDash);
    ctx.stroke();
  }

  ctx.restore();
};

// Radial Gradient Helper
export const createRadialGrad = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r1: number,
  r2: number,
  stops: { offset: number; color: string; }[]
) => {
  const grad = ctx.createRadialGradient(x, y, r1, x, y, r2);
  stops.forEach(stop => grad.addColorStop(stop.offset, stop.color));
  return grad;
};
