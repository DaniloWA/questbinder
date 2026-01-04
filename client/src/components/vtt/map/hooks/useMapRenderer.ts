import React, { useEffect } from 'react';
import { MapCanvasProps, DragState } from '../types';
import { TokenAnimation } from './useTokenLayer';
import { useGameSession } from '../../../../context/GameSessionContext';
import {
  drawGrid, drawToken, drawRuler, drawObstacles, drawLabel, drawLightingLayer, drawAudioZones, drawAuras
} from '../../../../utils/canvasRenderer';
import { renderAttackZones, renderPreviewZone } from '../../../../utils/attackZoneRenderer';
import { calculateVisibilityPolygon, isPointInPolygon } from '../../../../utils/geometry';
import { easeOutCubic, adjustAlpha } from '../utils';
import { Token, Point, User } from '../../../../types';

interface UseMapRendererProps extends MapCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  lightCanvasRef: React.RefObject<HTMLCanvasElement>;
  animatingTokens: Map<string, TokenAnimation>;
  animationsRef: React.MutableRefObject<Map<string, TokenAnimation>>;
  setAnimatingTokens: (m: Map<string, TokenAnimation>) => void;
  mouseWorldPos: { x: number, y: number; };
  dragState: React.MutableRefObject<DragState>;
  hoveredObstacleId: string | null;
  calculatedPath: { x: number, y: number; }[];
  draggedAttackZone: { id: string, startX: number, startY: number, originX: number, originY: number; } | null;
  liveDrawingPointsRef: React.MutableRefObject<{ x: number, y: number; }[]>;
  isDrawingRef: React.MutableRefObject<boolean>;
  currentFogRect: { x: number, y: number, w: number, h: number; } | null;
  hoveredTokenId: string | null;
  visionTokens: Token[];
  imageCache: { [src: string]: HTMLImageElement; };
  currentUser: User | null;
}

export const useMapRenderer = (props: UseMapRendererProps) => {
  const {
    canvasRef, lightCanvasRef, scene, tokens, viewport, isGM, gmViewMode, activeTool, movementPath, pings, drawingObstacle,
    draftPolyPoints, selectedTokenIds = [], previewPlayerId, remoteDrags = {}, remoteCursors, permissions, campaign,
    animatingTokens, animationsRef, setAnimatingTokens, mouseWorldPos, dragState, hoveredObstacleId, calculatedPath,
    draggedAttackZone, liveDrawingPointsRef, isDrawingRef, currentFogRect, hoveredTokenId, visionTokens, imageCache,
    drawingLightZone, drawingAudioZone, drawingTriggerZone, attackZoneResults, previewZoneResult,
    campaignCharacters = [], currentUser
  } = props;

  const { ui, drawingSettings, rulerSettings } = useGameSession();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scene) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lightCanvas = lightCanvasRef.current;
    if (!lightCanvas) return; // Should exist

    if (lightCanvas.width !== canvas.width || lightCanvas.height !== canvas.height) {
      lightCanvas.width = canvas.width;
      lightCanvas.height = canvas.height;
    }
    const lightCtx = lightCanvas.getContext('2d');

    let animationFrameId: number;

    const render = () => {
      const now = Date.now();
      let animationsChanged = false;
      const newAnimations = new Map<string, TokenAnimation>(animationsRef.current);
      animationsRef.current.forEach((anim, id) => {
        if (now > anim.startTime + anim.duration) {
          newAnimations.delete(id);
          animationsChanged = true;
        }
      });
      if (animationsChanged) setAnimatingTokens(newAnimations);

      const mapWidth = scene.grid.size * scene.grid.cols;
      const mapHeight = scene.grid.size * scene.grid.rows;
      const effectiveIsGM = isGM && gmViewMode === 'gm';
      const mapImage = imageCache[scene.imageUrl];
      const { size: gridSize, color: gridColor, alpha: gridAlpha, unitsPerSquare } = scene.grid;
      const renderTime = Date.now();

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);

      const allVisionPolygons: Point[][] = [];
      const visionObstacles = scene.obstacles;

      if (effectiveIsGM) {
        if (mapImage?.complete) ctx.drawImage(mapImage, 0, 0, mapWidth, mapHeight);
        else { ctx.fillStyle = '#202020'; ctx.fillRect(0, 0, mapWidth, mapHeight); }
        drawGrid(ctx, mapWidth, mapHeight, gridSize, gridColor, gridAlpha, viewport.zoom);
        if (scene.fogPath) {
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fill(new Path2D(scene.fogPath));
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2 / viewport.zoom;
          ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);
          ctx.stroke(new Path2D(scene.fogPath));
          ctx.restore();
        }
      } else {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, mapWidth, mapHeight);
        const visibilityPath = new Path2D();
        if (scene.fogPath) visibilityPath.addPath(new Path2D(scene.fogPath));

        const unitScale = gridSize / (unitsPerSquare || 1.5);

        visionTokens.forEach(token => {
          const anim = animationsRef.current.get(token.id);
          let currX = token.x;
          let currY = token.y;
          if (anim) {
            const progress = Math.min(1, (renderTime - anim.startTime) / anim.duration);
            const ease = easeOutCubic(progress);
            currX = anim.startX + (anim.targetX - anim.startX) * ease;
            currY = anim.startY + (anim.targetY - anim.startY) * ease;
          }
          const origin = { x: (currX + token.size / 2) * gridSize, y: (currY + token.size / 2) * gridSize };
          const visionRangePx = (token.visionRange || 0) * unitScale;
          const darkvisionRangePx = (token.darkvisionRange || 0) * unitScale;
          const effectiveRadius = Math.max(gridSize * 0.6, Math.max(visionRangePx, darkvisionRangePx));

          if (effectiveRadius > 0) {
            const poly = calculateVisibilityPolygon(origin, visionObstacles, effectiveRadius);
            if (poly.length > 0) {
              allVisionPolygons.push(poly);
              const p = new Path2D();
              p.moveTo(poly[0].x, poly[0].y);
              for (let i = 1; i < poly.length; i++) p.lineTo(poly[i].x, poly[i].y);
              p.closePath();
              visibilityPath.addPath(p);
            }
          }
        });

        ctx.save();
        ctx.clip(visibilityPath);
        if (mapImage?.complete) ctx.drawImage(mapImage, 0, 0, mapWidth, mapHeight);
        else { ctx.fillStyle = '#202020'; ctx.fillRect(0, 0, mapWidth, mapHeight); }
        drawGrid(ctx, mapWidth, mapHeight, gridSize, gridColor, gridAlpha, viewport.zoom);
        ctx.restore();
      }

      // --- DRAWINGS ---
      if (scene.drawings) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        scene.drawings.forEach(drawing => {
          if (drawing.points.length < 2) return;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
          for (let i = 1; i < drawing.points.length; i++) {
            ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
          }
          ctx.strokeStyle = drawing.color;
          ctx.lineWidth = drawing.width / viewport.zoom;
          ctx.globalAlpha = drawing.opacity !== undefined ? drawing.opacity : 1.0;
          ctx.stroke();
          ctx.restore();
        });

        const livePoints = liveDrawingPointsRef.current;
        if (livePoints.length > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(livePoints[0].x, livePoints[0].y);
          for (let i = 1; i < livePoints.length; i++) {
            ctx.lineTo(livePoints[i].x, livePoints[i].y);
          }
          if (activeTool === 'freehand-wall') {
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 1.0;
          } else {
            ctx.strokeStyle = drawingSettings.color;
            ctx.lineWidth = drawingSettings.width / viewport.zoom;
            ctx.globalAlpha = drawingSettings.opacity;
          }
          ctx.stroke();
          ctx.restore();
        }
      }

      // --- ATTACK ZONES ---
      if (attackZoneResults && attackZoneResults.length > 0) {
        renderAttackZones(ctx, attackZoneResults, {
          showAffectedTokens: true,
          showBlockedTokens: true,
          showStats: effectiveIsGM,
          gridSize: gridSize
        });
      }

      if (previewZoneResult) {
        renderPreviewZone(ctx, previewZoneResult, {
          showAffectedTokens: true,
          showBlockedTokens: true,
          showStats: true,
          gridSize: gridSize
        });
      }

      if (scene.obstacles && scene.obstacles.length > 0) {
        drawObstacles(ctx, scene.obstacles, effectiveIsGM, viewport.zoom, hoveredObstacleId || undefined, ui.gmHideObstacles);
      }

      // --- TRIGGER ZONES ---
      if (effectiveIsGM && scene.triggerZones && scene.triggerZones.length > 0) {
        ctx.save();
        ctx.font = `bold ${16 / viewport.zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        scene.triggerZones.forEach(zone => {
          ctx.beginPath();
          if (zone.type === 'rect' && zone.rect) { ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h); }
          else if (zone.type === 'polygon' && zone.points && zone.points.length > 0) {
            ctx.moveTo(zone.points[0].x, zone.points[0].y);
            for (let i = 1; i < zone.points.length; i++) ctx.lineTo(zone.points[i].x, zone.points[i].y);
            ctx.closePath();
          }
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
          ctx.lineWidth = 2 / viewport.zoom;
          ctx.setLineDash([8 / viewport.zoom, 4 / viewport.zoom]);
          ctx.stroke();
          ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
          ctx.fill();
          let cx = 0, cy = 0;
          if (zone.rect) { cx = zone.rect.x + zone.rect.w / 2; cy = zone.rect.y + zone.rect.h / 2; }
          else if (zone.points) { zone.points.forEach(p => { cx += p.x; cy += p.y; }); cx /= zone.points.length; cy /= zone.points.length; }
          ctx.fillStyle = 'rgba(168, 85, 247, 1)';
          ctx.fillText('⚡', cx, cy);
        });
        ctx.restore();
      }

      if (scene.audioZones && scene.audioZones.length > 0) {
        drawAudioZones(ctx, scene.audioZones, effectiveIsGM, viewport.zoom);
      }

      // --- REMOTE DRAGS ---
      Object.entries(remoteDrags).forEach(([uid, dragItem]) => {
        const drag = dragItem as any; // TokenDragPayload
        const ghostToken = tokens.find(t => t.id === drag.tokenId);
        if (ghostToken) {
          const dragPosWorld = { x: drag.x * gridSize + (ghostToken.size * gridSize) / 2, y: drag.y * gridSize + (ghostToken.size * gridSize) / 2 };
          const pathWorld = drag.path.map((p: any) => ({ x: p.x * gridSize + (ghostToken.size * gridSize) / 2, y: p.y * gridSize + (ghostToken.size * gridSize) / 2 }));
          if (pathWorld.length > 0) {
            drawRuler(ctx, pathWorld, dragPosWorld, gridSize, unitsPerSquare, viewport.zoom, drag.color || '#fbbf24', ghostToken.speed || 9);
          }
          const visualToken = { ...ghostToken, x: drag.x, y: drag.y };
          ctx.globalAlpha = 0.6;
          drawToken(ctx, visualToken, gridSize, false, viewport.zoom, imageCache, true);
          ctx.globalAlpha = 1.0;
          drawLabel(ctx, `Arrastando...`, drag.x * gridSize + (ghostToken.size * gridSize) / 2, drag.y * gridSize - 20 / viewport.zoom, viewport.zoom, drag.color || '#fbbf24');
        }
      });

      // --- TOKENS ---
      tokens.forEach(token => {
        const isOwner = token.ownerId === currentUser?.id || token.controlledBy?.includes(currentUser?.id || '');
        let shouldRender = true;
        if (!effectiveIsGM) {
          const isVisibleToOthers = token.isVisibleToPlayers;
          if (previewPlayerId === 'all') shouldRender = isVisibleToOthers || token.type === 'pc';
          else if (previewPlayerId) shouldRender = isVisibleToOthers || token.ownerId === previewPlayerId;
          else shouldRender = isVisibleToOthers || isOwner;
        }
        if (!shouldRender) return;

        const isBeingDragged = dragState.current.isDragging && (dragState.current.token?.id === token.id || selectedTokenIds.includes(token.id));
        let renderAsGhost = false;
        if (!token.isVisibleToPlayers) {
          if (effectiveIsGM) renderAsGhost = true;
          else if (!previewPlayerId && isOwner) renderAsGhost = true;
        }
        if (isBeingDragged) renderAsGhost = true;

        const anim = animationsRef.current.get(token.id);
        let currX = token.x;
        let currY = token.y;

        if (anim) {
          const progress = Math.min(1, (renderTime - anim.startTime) / anim.duration);
          const ease = easeOutCubic(progress);
          currX = anim.startX + (anim.targetX - anim.startX) * ease;
          currY = anim.startY + (anim.targetY - anim.startY) * ease;
        }

        const animToken = { ...token, x: currX, y: currY };

        if (!effectiveIsGM && !isOwner && allVisionPolygons.length > 0) {
          const tGx = animToken.x * gridSize;
          const tGy = animToken.y * gridSize;
          const tSize = token.size * gridSize;
          const pointsToCheck = [{ x: tGx + tSize / 2, y: tGy + tSize / 2 }, { x: tGx, y: tGy }, { x: tGx + tSize, y: tGy }, { x: tGx + tSize, y: tGy + tSize }, { x: tGx, y: tGy + tSize }];
          const isVisible = pointsToCheck.some(p => allVisionPolygons.some(poly => isPointInPolygon(p, poly)));
          if (!isVisible) return;
        } else if (!effectiveIsGM && !isOwner && allVisionPolygons.length === 0 && scene.fogPath) {
          const center = { x: animToken.x * gridSize + animToken.size * gridSize / 2, y: animToken.y * gridSize + animToken.size * gridSize / 2 };
          if (!ctx.isPointInPath(new Path2D(scene.fogPath), center.x, center.y)) return;
        }

        if (effectiveIsGM && (ui.showVisionRanges || selectedTokenIds.includes(token.id))) {
          const cx = (currX + token.size / 2) * gridSize;
          const cy = (currY + token.size / 2) * gridSize;
          const unitScale = gridSize / (unitsPerSquare || 1.5);

          if ((token.darkvisionRange || 0) > 0) {
            const r = (token.darkvisionRange || 0) * unitScale;
            const visColor = token.visionColor || 'rgba(139, 92, 246, 0.5)';
            const poly = calculateVisibilityPolygon({ x: cx, y: cy }, scene.obstacles, r);
            if (poly.length > 0) {
              ctx.save(); ctx.beginPath(); ctx.moveTo(poly[0].x, poly[0].y); for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y); ctx.closePath();
              ctx.lineWidth = 2 / viewport.zoom; ctx.strokeStyle = visColor; ctx.setLineDash([8 / viewport.zoom, 4 / viewport.zoom]); ctx.stroke();
              ctx.fillStyle = adjustAlpha(visColor, 0.05); ctx.fill();
              drawLabel(ctx, `DV: ${token.darkvisionRange}m`, cx, cy + r + (20 / viewport.zoom), viewport.zoom, visColor.replace(')', ', 0.8)')); ctx.restore();
            }
          }

          if ((token.visionRange || 0) > 0) {
            const r = (token.visionRange || 0) * unitScale;
            const poly = calculateVisibilityPolygon({ x: cx, y: cy }, scene.obstacles, r);

            if (poly.length > 0) {
              ctx.save(); ctx.beginPath(); ctx.moveTo(poly[0].x, poly[0].y); for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y); ctx.closePath();
              const visColor = token.visionColor || 'rgba(34, 211, 238, 0.5)';
              ctx.lineWidth = 2 / viewport.zoom; ctx.strokeStyle = visColor; ctx.setLineDash([]); ctx.stroke();
              ctx.fillStyle = adjustAlpha(visColor, 0.1); ctx.fill();
              drawLabel(ctx, `Vis: ${token.visionRange}m`, cx, cy - r - (10 / viewport.zoom), viewport.zoom, visColor.replace(')', ', 0.8)')); ctx.restore();
            }
          }
        }

        const linkedCharacter = token.linkedId ? campaignCharacters.find(c => c.id === token.linkedId) : undefined;
        drawAuras(ctx, animToken, gridSize, viewport.zoom, effectiveIsGM);
        drawToken(ctx, animToken, gridSize, selectedTokenIds.includes(token.id), viewport.zoom, imageCache, renderAsGhost, linkedCharacter);
      });

      if (lightCtx) {
        drawLightingLayer(lightCtx, canvas.width, canvas.height, scene, tokens, animationsRef.current, viewport, visionTokens, !effectiveIsGM, (!effectiveIsGM && allVisionPolygons.length > 0) ? allVisionPolygons : undefined, visionObstacles);
        ctx.save(); ctx.resetTransform(); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(lightCanvas, 0, 0); ctx.restore();
      }

      // --- TOOLS & OVERLAYS ---
      if (activeTool === 'measure-path') {
        if (movementPath.length > 0) {
          drawRuler(ctx, movementPath, mouseWorldPos, gridSize, unitsPerSquare, viewport.zoom, undefined, undefined, rulerSettings.metric, true);
        } else {
          ctx.beginPath(); ctx.arc(mouseWorldPos.x, mouseWorldPos.y, 4 / viewport.zoom, 0, Math.PI * 2); ctx.fillStyle = '#fbbf24'; ctx.fill();
        }
      }

      if (activeTool === 'eraser' || activeTool === 'eraser-audio' || activeTool === 'eraser-drawing') {
        ctx.save(); ctx.beginPath(); ctx.arc(mouseWorldPos.x, mouseWorldPos.y, 8 / viewport.zoom, 0, Math.PI * 2); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2 / viewport.zoom; ctx.stroke(); ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; ctx.fill(); ctx.restore();
      }

      if (activeTool === 'eraser-trigger') {
        ctx.save(); ctx.beginPath(); ctx.arc(mouseWorldPos.x, mouseWorldPos.y, 8 / viewport.zoom, 0, Math.PI * 2); ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2 / viewport.zoom; ctx.stroke(); ctx.fillStyle = 'rgba(168, 85, 247, 0.2)'; ctx.fill(); ctx.restore();
      }

      if (dragState.current.isDragging && dragState.current.token) {
        const leader = dragState.current.token;
        const mouseX = mouseWorldPos.x; const mouseY = mouseWorldPos.y;
        const leaderGridX = Math.round((mouseX - dragState.current.offset.x) / gridSize);
        const leaderGridY = Math.round((mouseY - dragState.current.offset.y) / gridSize);
        const deltaGridX = leaderGridX - leader.x;
        const deltaGridY = leaderGridY - leader.y;

        dragState.current.draggedGroup.forEach(groupItem => {
          const token = tokens.find(t => t.id === groupItem.id);
          if (!token) return;
          const smoothX = mouseX - groupItem.offsetX; const smoothY = mouseY - groupItem.offsetY;
          ctx.save(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1 / viewport.zoom; ctx.strokeRect((groupItem.startGridX + deltaGridX) * gridSize, (groupItem.startGridY + deltaGridY) * gridSize, token.size * gridSize, token.size * gridSize); ctx.restore();
          const movingToken = { ...token, x: smoothX / gridSize, y: smoothY / gridSize };
          drawToken(ctx, movingToken, gridSize, true, viewport.zoom, imageCache, false);
          if (token.id === leader.id) {
            const pathWorldPoints = calculatedPath.map(p => ({ x: p.x * gridSize + (token.size * gridSize) / 2, y: p.y * gridSize + (token.size * gridSize) / 2 }));
            const currentSnap = { x: (groupItem.startGridX + deltaGridX) * gridSize + (token.size * gridSize) / 2, y: (groupItem.startGridY + deltaGridY) * gridSize + (token.size * gridSize) / 2 };
            if (pathWorldPoints.length > 0) drawRuler(ctx, pathWorldPoints, currentSnap, gridSize, unitsPerSquare, viewport.zoom, '#fbbf24', token.speed || 9);
          }
        });
      }

      if (currentFogRect || (activeTool === 'draw-light-rect' && drawingLightZone?.type === 'rect') || (activeTool === 'draw-audio-rect' && drawingAudioZone?.type === 'rect') || (activeTool === 'draw-trigger-rect' && drawingTriggerZone?.type === 'rect')) {
        const rect = currentFogRect
          || (drawingLightZone?.type === 'rect' && mouseWorldPos && drawingLightZone.p1 ? { x: drawingLightZone.p1.x, y: drawingLightZone.p1.y, w: mouseWorldPos.x - drawingLightZone.p1.x, h: mouseWorldPos.y - drawingLightZone.p1.y } : null)
          || (drawingAudioZone?.type === 'rect' && mouseWorldPos && drawingAudioZone.p1 ? { x: drawingAudioZone.p1.x, y: drawingAudioZone.p1.y, w: mouseWorldPos.x - drawingAudioZone.p1.x, h: mouseWorldPos.y - drawingAudioZone.p1.y } : null)
          || (drawingTriggerZone?.type === 'rect' && mouseWorldPos && drawingTriggerZone.p1 ? { x: drawingTriggerZone.p1.x, y: drawingTriggerZone.p1.y, w: mouseWorldPos.x - drawingTriggerZone.p1.x, h: mouseWorldPos.y - drawingTriggerZone.p1.y } : null);
        if (rect) {
          ctx.save();
          let color = 'rgba(255, 255, 255, 0.9)';
          if (activeTool.includes('light')) color = 'rgba(251, 191, 36, 0.9)';
          else if (activeTool.includes('audio')) color = 'rgba(0, 255, 255, 0.9)';
          else if (activeTool.includes('trigger')) color = 'rgba(168, 85, 247, 0.9)';
          ctx.strokeStyle = color;
          ctx.lineWidth = 2 / viewport.zoom;
          ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);
          ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
          ctx.restore();
        }
      }

      if ((['fog-poly', 'draw-wall', 'draw-light-poly', 'draw-audio-poly', 'draw-trigger-poly'].includes(activeTool)) && draftPolyPoints.length > 0) {
        ctx.save();
        let color = 'rgba(255, 255, 255, 0.9)';
        if (activeTool === 'draw-wall') color = 'rgba(255, 0, 255, 0.8)';
        else if (activeTool.includes('light')) color = 'rgba(251, 191, 36, 0.8)';
        else if (activeTool.includes('audio')) color = 'rgba(0, 255, 255, 0.8)';
        else if (activeTool.includes('trigger')) color = 'rgba(168, 85, 247, 0.8)';

        ctx.strokeStyle = color;
        ctx.lineWidth = 3 / viewport.zoom;
        draftPolyPoints.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4 / viewport.zoom, 0, Math.PI * 2); ctx.fill(); });
        ctx.beginPath(); ctx.moveTo(draftPolyPoints[0].x, draftPolyPoints[0].y); for (let i = 1; i < draftPolyPoints.length; i++) ctx.lineTo(draftPolyPoints[i].x, draftPolyPoints[i].y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(draftPolyPoints[draftPolyPoints.length - 1].x, draftPolyPoints[draftPolyPoints.length - 1].y); ctx.lineTo(mouseWorldPos.x, mouseWorldPos.y); ctx.stroke();
        if (draftPolyPoints.length >= (activeTool === 'draw-wall' ? 2 : 3)) {
          const distToStart = Math.hypot(mouseWorldPos.x - draftPolyPoints[0].x, mouseWorldPos.y - draftPolyPoints[0].y);
          if (distToStart < 15 / viewport.zoom) {
            ctx.beginPath(); ctx.arc(draftPolyPoints[0].x, draftPolyPoints[0].y, 8 / viewport.zoom, 0, Math.PI * 2); ctx.strokeStyle = 'yellow'; ctx.lineWidth = 2 / viewport.zoom; ctx.stroke(); drawLabel(ctx, "Fechar", draftPolyPoints[0].x, draftPolyPoints[0].y - 20 / viewport.zoom, viewport.zoom);
          }
        }
        ctx.restore();
      }

      if (drawingObstacle) {
        ctx.save(); ctx.strokeStyle = drawingObstacle.type === 'window' ? 'cyan' : 'rgba(139, 92, 246, 0.9)'; ctx.lineWidth = 5 / viewport.zoom; ctx.beginPath(); ctx.moveTo(drawingObstacle.p1.x, drawingObstacle.p1.y); ctx.lineTo(mouseWorldPos.x, mouseWorldPos.y); ctx.stroke(); ctx.restore();
      }

      pings.forEach(ping => {
        const duration = 3000; const elapsed = Date.now() - ping.createdAt; const progress = Math.min(1, elapsed / duration);
        if (progress >= 1) return;
        const easeOut = 1 - Math.pow(1 - progress, 3); const maxRadius = gridSize * 1.5;
        ctx.save(); ctx.translate(ping.x, ping.y); ctx.globalAlpha = Math.max(0, 1 - progress * 1.5); ctx.beginPath(); ctx.arc(0, 0, (gridSize * 0.2) * (1 - progress * 0.5), 0, Math.PI * 2); ctx.fillStyle = ping.color; ctx.fill();
        ctx.globalAlpha = 1; ctx.globalAlpha = (1 - progress); ctx.lineWidth = Math.max(0.5, (5 - progress * 4) / viewport.zoom); ctx.strokeStyle = ping.color; ctx.beginPath(); ctx.arc(0, 0, maxRadius * easeOut, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      });

      // --- REMOTE CURSORS (New Design) ---
      Object.values(remoteCursors).forEach((cursor: any) => {
        if (cursor.userId === currentUser?.id) return;

        const z = viewport.zoom;
        const color = cursor.userColor || '#fbbf24'; // Fallback amber

        ctx.save();
        ctx.translate(cursor.x, cursor.y);

        // Add subtle shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;

        // 1. Draw Cursor Arrow (Figma-style pointer)
        // Scaled by 1/z to ensure constant screen size
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(6 / z, 18 / z); // Long tip
        ctx.lineTo(10 / z, 11 / z); // Notch
        ctx.lineTo(17 / z, 11 / z); // Wing
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        // Stroke for contrast
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5 / z;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // 2. Draw Name Badge
        // Configure Font
        const fontSize = 11;
        ctx.font = `600 ${fontSize / z}px "Inter", sans-serif`; // Use Inter/Sans
        ctx.textBaseline = 'middle';
        const textMetrics = ctx.measureText(cursor.userName);

        // Badge Dimensions
        const paddingX = 6 / z;
        const paddingY = 3 / z;
        const badgeHeight = (fontSize + 6) / z;
        const badgeWidth = textMetrics.width + (paddingX * 2);

        // Badge Position (Offset from cursor)
        const badgeX = 14 / z;
        const badgeY = 14 / z;

        // Draw Badge Background (Rounded Rect manually for compatibility)
        ctx.fillStyle = color;
        const r = 4 / z; // Corner radius
        const bx = badgeX, by = badgeY, bw = badgeWidth, bh = badgeHeight;

        ctx.beginPath();
        ctx.moveTo(bx + r, by);
        ctx.lineTo(bx + bw - r, by);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
        ctx.lineTo(bx + bw, by + bh - r);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
        ctx.lineTo(bx + r, by + bh);
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
        ctx.lineTo(bx, by + r);
        ctx.quadraticCurveTo(bx, by, bx + r, by);
        ctx.closePath();
        ctx.fill();

        // Draw Name Text
        ctx.fillStyle = '#FFFFFF'; // Always white text on colored badge
        ctx.fillText(cursor.userName, badgeX + paddingX, badgeY + (badgeHeight / 2));

        ctx.restore();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    scene, tokens, viewport, isGM, gmViewMode, currentUser, activeTool, movementPath, pings, drawingObstacle, draftPolyPoints,
    currentFogRect, selectedTokenIds, mouseWorldPos, animatingTokens, calculatedPath, hoveredObstacleId, ui.gmHideObstacles,
    ui.showVisionRanges, drawingLightZone, drawingAudioZone, drawingTriggerZone, previewPlayerId, visionTokens, remoteDrags,
    remoteCursors, drawingSettings, rulerSettings, imageCache, attackZoneResults, previewZoneResult, campaignCharacters
  ]);
};
