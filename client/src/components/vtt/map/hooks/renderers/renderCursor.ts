import { renderCursorToImage } from '../../../../../utils/cursorRenderer';
import { getCursorShape } from '../../../constants/cursorShapes';
import { getContrastColor } from '../../../../../utils/colors';
import { drawBadge } from './canvasHelpers';

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
  zoom: number
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

  const screenMin = Math.min(window.innerWidth, window.innerHeight);
  const dynamicSize = Math.max(48, Math.min(64, Math.round(screenMin * 0.04)));
  const renderSize = dynamicSize;

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

  ctx.restore();

  // Name Badge (not for local)
  // Name Badge (not for local)
  if (!isLocal && cursorName) {
    ctx.save();
    ctx.translate(cursorX, cursorY);
    ctx.globalAlpha = 1.0; // Ensure badge is opaque equivalent unless hidden

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
};
