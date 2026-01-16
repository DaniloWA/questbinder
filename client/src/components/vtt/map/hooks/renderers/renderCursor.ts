import { renderCursorToImage } from '../../../../../utils/cursorRenderer';
import { getCursorShape } from '../../../constants/cursorShapes';
import { getContrastColor } from '../../../../../utils/colors';
import { drawBadge } from './canvasHelpers';
import { getDynamicCursorSize } from '../../../../../constants/cursorConstants';

export const renderCursor = (
  ctx: CanvasRenderingContext2D,
  cursorX: number,
  cursorY: number,
  cursorAngle: number,
  cursorColor: string,
  cursorShape: string,
  cursorName: string,
  isLocal: boolean,
  scaleX: number = 1,
  scaleY: number = 1,
  zoom: number,
  activeToolName?: string,
  activeToolIcon?: string,
  statusIcon?: string,
  contextIcon?: string
) => {
  const shape = getCursorShape(cursorShape || 'default');

  ctx.save();
  ctx.translate(cursorX, cursorY);
  ctx.scale(1 / zoom, 1 / zoom);

  // Apply Rotation (Visual Physics) - not for local cursor
  if (!isLocal) {
    ctx.rotate(cursorAngle);
  }

  // Apply Stretch
  ctx.scale(scaleX, scaleY);

  // Dynamic cursor size (from shared constants)
  const renderSize = getDynamicCursorSize();

  if (shape.Component) {
    const cacheKey = `${cursorShape || 'default'}_${cursorColor}_${renderSize}`;
    const img = renderCursorToImage(shape.Component, cursorColor, renderSize, cacheKey);

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = isLocal ? 3 : 4;
      if (isLocal) ctx.globalAlpha = 0.7;
      ctx.drawImage(img, -renderSize / 2, -renderSize / 2, renderSize, renderSize);
      ctx.restore();
    }
  } else if (shape.imageUrl) {
    const img = new Image();
    img.src = shape.imageUrl;
    if (img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.scale(shape.scale || 1, shape.scale || 1);
      ctx.translate(-shape.hotspot.x, -shape.hotspot.y);
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    } else {
      img.onload = () => { /* no-op */ };
    }
  } else if (shape.path) {
    const p = new Path2D(shape.path);
    ctx.scale(shape.scale || 1, shape.scale || 1);
    ctx.translate(-shape.hotspot.x, -shape.hotspot.y);
    ctx.fillStyle = cursorColor;
    ctx.fill(p);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke(p);
  }

  ctx.restore(); // Restore from the main cursor drawing (translation, scale, rotation)

  // 1. Draw User Name Badge (Top Center)
  if (!isLocal && cursorName) {
    ctx.save();
    ctx.translate(cursorX, cursorY);
    // ctx.globalAlpha = 1.0; 

    // Position matches original: badgeX = 14/z, badgeY = 14/z
    drawBadge(
      ctx,
      cursorName,
      14 / zoom,
      14 / zoom,
      cursorColor,
      zoom
    );
    ctx.restore();
  }

  // 2. Draw Status Icon (Top Left: Chat/Combat)
  if (!isLocal && statusIcon) {
    ctx.save();
    ctx.translate(cursorX, cursorY);
    // CustomCursor: -top-4 -left-4 (-16px, -16px)
    // We adjust for zoom.
    drawStatusIcon(ctx, statusIcon, -16 / zoom, -16 / zoom, zoom);
    ctx.restore();
  }

  // 3. Draw Context Icon (Top Right: Menu)
  if (!isLocal && contextIcon) {
    ctx.save();
    ctx.translate(cursorX, cursorY);
    // CustomCursor: -top-4 -right-4 (approx +16px?, -16px)
    // Using 16px offset
    drawContextIcon(ctx, contextIcon, 16 / zoom, -16 / zoom, zoom);
    ctx.restore();
  }

  // 4. Draw Tool Badge (Bottom Right: Active Tool)
  // We check activeToolName is valid to avoid drawing empty boxes
  if (!isLocal && activeToolName && activeToolIcon && activeToolIcon !== "select") {
    ctx.save();
    ctx.translate(cursorX, cursorY);

    // Offset for the tool badge relative to the cursor
    // Position it below the cursor/name badge
    const badgeX = 24 / zoom;
    const badgeY = 32 / zoom;

    drawToolBadge(ctx, activeToolIcon, activeToolName, badgeX, badgeY, zoom);

    ctx.restore();
  }
};

const drawStatusIcon = (
  ctx: CanvasRenderingContext2D,
  icon: string,
  x: number,
  y: number,
  zoom: number
) => {
  ctx.font = `${14 / zoom}px "Inter", sans-serif`; // Larger icon
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(icon, x, y);
};

const drawContextIcon = (
  ctx: CanvasRenderingContext2D,
  icon: string,
  x: number,
  y: number,
  zoom: number
) => {
  const size = 20 / zoom;

  // Circle Background (White)
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 3;
  ctx.fill();
  ctx.strokeStyle = '#e4e4e7'; // zinc-200
  ctx.lineWidth = 1 / zoom;
  ctx.stroke();

  // Icon (Text)
  ctx.font = `bold ${10 / zoom}px "Inter", sans-serif`;
  ctx.fillStyle = '#27272a'; // zinc-800
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(icon, x, y);
};

const drawToolBadge = (
  ctx: CanvasRenderingContext2D,
  icon: string,
  text: string,
  x: number,
  y: number,
  zoom: number
) => {
  // Config
  const fontSize = 10 / zoom;
  const paddingX = 6 / zoom;
  const paddingY = 4 / zoom; // unused in totalHeight?
  const gap = 4 / zoom;
  const radius = 4 / zoom;

  ctx.font = `bold ${fontSize}px "Inter", sans-serif`;

  // Measure dimensions
  // Icon width placeholder (approx width of an emoji or char)
  // If icon is a lucide icon name (string), we might just display the first letter or skip it for now.
  // Ideally we would map tool IDs to unicode chars if we can't draw SVG paths easily.
  // For now, let's assume 'icon' is a simple string representation or we just use text.
  const iconWidth = 12 / zoom;
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;

  const totalWidth = paddingX * 2 + iconWidth + gap + textWidth;
  const totalHeight = 16 / zoom;

  // Draw Background
  ctx.fillStyle = 'rgba(24, 24, 27, 0.9)'; // zinc-900 @ 0.9
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // white/20
  ctx.lineWidth = 1 / zoom;

  ctx.beginPath();
  // roundRect check (ES2022) - fallback if needed, but modern browsers support it
  if (ctx.roundRect) {
    ctx.roundRect(x, y, totalWidth, totalHeight, radius);
  } else {
    ctx.rect(x, y, totalWidth, totalHeight);
  }
  ctx.fill();
  ctx.stroke();

  // Draw Content
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  // Icon (Stub: just drawing a generic indicator for now if it's not a char)
  // If it's a tool ID like "smart-wall", "S" might be better than nothing.
  // But CustomCursor used `getToolIcon` which returns a component.
  // Here we only get a string. I will pass the UNICODE char from CursorLayer
  // or a simplified string.
  // For now, drawing the first char of the icon string if it seems short, 
  // or a generic tool symbol.
  const iconSymbol = icon || "�"; // Generic tool icon if specific one isn't renderable text
  ctx.fillText(iconSymbol, x + paddingX, y + totalHeight / 2);

  // Label
  ctx.fillText(text, x + paddingX + iconWidth + gap, y + totalHeight / 2);
};
