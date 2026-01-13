import { drawRuler, drawLabel } from '../../../../../utils/canvasRenderer';
import { drawRoundedRect, drawCircle } from './canvasHelpers';
import { COLORS } from './constants';

export const renderToolOverlays = (
  ctx: CanvasRenderingContext2D,
  activeTool: string,
  mousePos: { x: number, y: number; },
  zoom: number,
  gridSize: number,
  state: {
    movementPath: any[];
    unitsPerSquare: number;
    rulerSettings: any;
    draftPolyPoints: { x: number, y: number; }[];
    drawingObstacle: any;
    currentFogRect: any;
    drawingLightZone: any;
    drawingAudioZone: any;
    drawingTriggerZone: any;
    drawingSettings: any;
  }
) => {
  const {
    movementPath, unitsPerSquare, rulerSettings, draftPolyPoints,
    drawingObstacle, currentFogRect, drawingLightZone, drawingAudioZone,
    drawingTriggerZone, drawingSettings
  } = state;

  // Measure Path
  if (activeTool === 'measure-path') {
    if (movementPath.length > 0) {
      drawRuler(ctx, movementPath, mousePos, gridSize, unitsPerSquare, zoom, undefined, undefined, rulerSettings.metric, true);
    } else {
      drawCircle(ctx, mousePos.x, mousePos.y, 4 / zoom, { fill: '#fbbf24' });
    }
  }

  // Erasers
  if (activeTool === 'eraser' || activeTool === 'eraser-audio' || activeTool === 'eraser-drawing') {
    ctx.save();
    drawCircle(ctx, mousePos.x, mousePos.y, 8 / zoom, {
      stroke: '#ef4444',
      lineWidth: 2 / zoom,
      fill: 'rgba(239, 68, 68, 0.2)'
    });
    ctx.restore();
  }

  if (activeTool === 'eraser-trigger') {
    ctx.save();
    drawCircle(ctx, mousePos.x, mousePos.y, 8 / zoom, {
      stroke: '#a855f7',
      lineWidth: 2 / zoom,
      fill: 'rgba(168, 85, 247, 0.2)'
    });
    ctx.restore();
  }

  // Rectangular Zones (Fog, Light, Audio, Trigger)
  const rectToolActive =
    currentFogRect ||
    (activeTool === 'draw-light-rect' && drawingLightZone?.type === 'rect') ||
    (activeTool === 'draw-audio-rect' && drawingAudioZone?.type === 'rect') ||
    (activeTool === 'draw-trigger-rect' && drawingTriggerZone?.type === 'rect');

  if (rectToolActive) {
    const rect = currentFogRect
      || (drawingLightZone?.type === 'rect' && mousePos && drawingLightZone.p1 ? { x: drawingLightZone.p1.x, y: drawingLightZone.p1.y, w: mousePos.x - drawingLightZone.p1.x, h: mousePos.y - drawingLightZone.p1.y } : null)
      || (drawingAudioZone?.type === 'rect' && mousePos && drawingAudioZone.p1 ? { x: drawingAudioZone.p1.x, y: drawingAudioZone.p1.y, w: mousePos.x - drawingAudioZone.p1.x, h: mousePos.y - drawingAudioZone.p1.y } : null)
      || (drawingTriggerZone?.type === 'rect' && mousePos && drawingTriggerZone.p1 ? { x: drawingTriggerZone.p1.x, y: drawingTriggerZone.p1.y, w: mousePos.x - drawingTriggerZone.p1.x, h: mousePos.y - drawingTriggerZone.p1.y } : null);

    if (rect) {
      ctx.save();
      let color = 'rgba(255, 255, 255, 0.9)';
      if (activeTool.includes('light')) color = 'rgba(251, 191, 36, 0.9)';
      else if (activeTool.includes('audio')) color = 'rgba(0, 255, 255, 0.9)';
      else if (activeTool.includes('trigger')) color = 'rgba(168, 85, 247, 0.9)';

      ctx.strokeStyle = color;
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
  }

  // Polygon Drawing (Fog, Wall, Light, Audio, Trigger)
  if ((['fog-poly', 'draw-wall', 'draw-light-poly', 'draw-audio-poly', 'draw-trigger-poly'].includes(activeTool)) && draftPolyPoints.length > 0) {
    ctx.save();
    let color = 'rgba(255, 255, 255, 0.9)';
    if (activeTool === 'draw-wall') color = 'rgba(255, 0, 255, 0.8)';
    else if (activeTool.includes('light')) color = 'rgba(251, 191, 36, 0.8)';
    else if (activeTool.includes('audio')) color = 'rgba(0, 255, 255, 0.8)';
    else if (activeTool.includes('trigger')) color = 'rgba(168, 85, 247, 0.8)';

    ctx.strokeStyle = color;
    ctx.lineWidth = 3 / zoom;

    draftPolyPoints.forEach(p => {
      drawCircle(ctx, p.x, p.y, 4 / zoom, { fill: color }); // fill logic implicitly matches 'fill' style
    });

    ctx.beginPath();
    ctx.moveTo(draftPolyPoints[0].x, draftPolyPoints[0].y);
    for (let i = 1; i < draftPolyPoints.length; i++) ctx.lineTo(draftPolyPoints[i].x, draftPolyPoints[i].y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(draftPolyPoints[draftPolyPoints.length - 1].x, draftPolyPoints[draftPolyPoints.length - 1].y);
    ctx.lineTo(mousePos.x, mousePos.y);
    ctx.stroke();

    if (draftPolyPoints.length >= (activeTool === 'draw-wall' ? 2 : 3)) {
      const distToStart = Math.hypot(mousePos.x - draftPolyPoints[0].x, mousePos.y - draftPolyPoints[0].y);
      if (distToStart < 15 / zoom) {
        drawCircle(ctx, draftPolyPoints[0].x, draftPolyPoints[0].y, 8 / zoom, { stroke: 'yellow', lineWidth: 2 / zoom });
        drawLabel(ctx, "Fechar", draftPolyPoints[0].x, draftPolyPoints[0].y - 20 / zoom, zoom);
      }
    }
    ctx.restore();
  }

  // Obstacle Drawing
  if (drawingObstacle) {
    ctx.save();
    ctx.strokeStyle = drawingObstacle.type === 'window' ? 'cyan' : 'rgba(139, 92, 246, 0.9)';
    ctx.lineWidth = 5 / zoom;
    ctx.beginPath();
    ctx.moveTo(drawingObstacle.p1.x, drawingObstacle.p1.y);
    ctx.lineTo(mousePos.x, mousePos.y);
    ctx.stroke();
    ctx.restore();
  }
};
