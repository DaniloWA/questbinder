import React, { useEffect } from 'react';
import { useTranslation } from '../../../../i18n/TranslationContext';
import { MapCanvasProps, DragState } from '../types';
import { TokenAnimation } from './useTokenLayer';
import { useGameSession } from '../../../../context/GameSessionContext';
import {
  drawGrid, drawToken, drawRuler, drawObstacles, drawLabel, drawLightingLayer, drawAudioZones, drawAuras
} from '../../../../utils/canvasRenderer';
import { renderAttackZones, renderPreviewZone } from '../../../../utils/attackZoneRenderer';
import { calculateVisibilityPolygon } from '../../../../utils/geometry';
import { easeOutCubic, adjustAlpha } from '../utils';
import { Token, Point, User } from '../../../../types';
import { useLayerCache } from './useLayerCache';
import { CursorPhysicsEngine, createCursorUpdateFromPayload } from '../../../../utils/cursorPhysicsEngine';
import { getGlobalFrameTimer } from '../../../../utils/animationEngine';

// Renderers & Helpers
import {
  RenderContext,
  COLORS,
  drawRoundedRect,
  drawCircle,
  isTokenOwner,
  getAnimatedPosition,
  getTokenWorldPos,
  isPositionVisible,
  renderClickAnimations,
  renderPingAnimations,
  renderRemoteViewports,
  renderCursor,
  renderCursorTrails,
  renderCursorOverlays,
  renderExplosions,
  renderToolOverlays,
  ClickAnimation
} from './renderers';

interface UseMapRendererProps extends MapCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  lightCanvasRef: React.RefObject<HTMLCanvasElement>;
  animatingTokens: Map<string, TokenAnimation>;
  animationsRef: React.RefObject<Map<string, TokenAnimation>>;
  setAnimatingTokens: (m: Map<string, TokenAnimation>) => void;
  mouseWorldPos: { x: number, y: number; };
  dragState: React.RefObject<DragState>;
  hoveredObstacleId: string | null;
  calculatedPath: { x: number, y: number; }[];
  draggedAttackZone: { id: string, startX: number, startY: number, originX: number, originY: number, rotating?: boolean; } | null;
  liveDrawingPointsRef: React.RefObject<{ x: number, y: number; }[]>;
  isDrawingRef: React.RefObject<boolean>;
  currentFogRect: { x: number, y: number, w: number, h: number; } | null;
  hoveredTokenId: string | null;
  visionTokens: Token[];
  imageCache: { [src: string]: HTMLImageElement; };
  currentUser: User | null;
  players?: User[];
  remoteViewports?: Record<string, { x: number, y: number, zoom: number, w: number, h: number; }>;
  clickAnimationsRef?: React.RefObject<ClickAnimation[]>;
  viewportRef?: React.RefObject<{ x: number, y: number, zoom: number; }>;
  mouseWorldPosRef?: React.RefObject<{ x: number, y: number; }>;
  remoteCursorsRef?: React.RefObject<Record<string, any>>;
}

export const useMapRenderer = (props: UseMapRendererProps) => {
  const {
    canvasRef, lightCanvasRef, scene, tokens, viewport, isGM, gmViewMode, activeTool, movementPath, pings, drawingObstacle,
    draftPolyPoints, selectedTokenIds = [], previewPlayerId, remoteDrags = {}, remoteCursors, permissions, campaign,
    animatingTokens, animationsRef, setAnimatingTokens, mouseWorldPos, dragState, hoveredObstacleId, calculatedPath,
    draggedAttackZone, liveDrawingPointsRef, isDrawingRef, currentFogRect, hoveredTokenId, visionTokens, imageCache,
    drawingLightZone, drawingAudioZone, drawingTriggerZone, attackZoneResults, previewZoneResult,
    campaignCharacters = [], currentUser, remoteViewports, players, remoteCursorsRef
  } = props;

  const { ui, drawingSettings, rulerSettings } = useGameSession();

  // --- ADVANCED CURSOR PHYSICS ENGINE ---
  const cursorEngineRef = React.useRef<CursorPhysicsEngine | null>(null);
  if (!cursorEngineRef.current) {
    cursorEngineRef.current = new CursorPhysicsEngine();
  }
  const cursorEngine = cursorEngineRef.current;

  // Local Cursor Engine (for identical trail behavior)
  // We use the same engine instance but a special ID to manage local state
  const LOCAL_ID = 'local_user_cursor';

  const frameTimer = React.useRef(getGlobalFrameTimer());
  const { t } = useTranslation();

  const lastProcessedCursorsRef = React.useRef<Record<string, { x: number; y: number; isClicking?: boolean; isAfk?: boolean; }>>({});
  const cursorCollisionsRef = React.useRef<Map<string, number>>(new Map());
  const cursorExplosionsRef = React.useRef<{ x: number; y: number; time: number; colors: string[]; }[]>([]);
  const localCursorRef = React.useRef<{ x: number; y: number; } | null>(null);
  // removed localTrailHistoryRef

  // --- DIRTY FLAGS ---
  const dirtyFlags = React.useRef({
    grid: true, obstacles: true, tokens: true, lighting: true, auras: true,
  });

  const prevStateRef = React.useRef({
    gridSize: 0, gridColor: '', gridAlpha: 1, obstacleCount: 0, tokenPositions: '' as string, viewportZoom: 0,
  });

  // Sync React cursors with Physics Engine
  useEffect(() => {
    if (!remoteCursors) return;
    Object.values(remoteCursors).forEach((cursor) => {
      const { userId, update } = createCursorUpdateFromPayload(cursor);
      cursorEngine.processServerUpdate(userId, update);
    });

    // Clean up cursors that are no longer in remoteCursors
    // BUT preserve: currentUser's cursor AND the special 'local_user_cursor' ID used for collision detection
    const engineIds = cursorEngine.getCursorIds();
    engineIds.forEach(id => {
      if (!remoteCursors[id] && id !== currentUser?.id && id !== 'local_user_cursor') {
        cursorEngine.removeCursor(id);
      }
    });
  }, [remoteCursors, cursorEngine, currentUser?.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scene) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lightCanvas = lightCanvasRef.current;
    if (!lightCanvas) return;

    if (lightCanvas.width !== canvas.width || lightCanvas.height !== canvas.height) {
      lightCanvas.width = canvas.width;
      lightCanvas.height = canvas.height;
    }
    const lightCtx = lightCanvas.getContext('2d');

    let animationFrameId: number;
    let lastRenderTime = 0;

    const render = () => {
      const now = Date.now();
      if (props.isModalOpen) return;

      if (document.hidden && (now - lastRenderTime < 200)) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = now;

      // Animation State Update
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

      const effectiveViewport = props.viewportRef ? props.viewportRef.current : viewport;
      const effectiveMousePos = props.mouseWorldPosRef ? props.mouseWorldPosRef.current : mouseWorldPos;
      const z = effectiveViewport.zoom;

      // Dirty Checks
      const prev = prevStateRef.current;
      if (prev.gridSize !== gridSize || prev.gridColor !== gridColor || prev.gridAlpha !== gridAlpha) {
        dirtyFlags.current.grid = true;
        prev.gridSize = gridSize; prev.gridColor = gridColor; prev.gridAlpha = gridAlpha;
      }
      if (prev.obstacleCount !== scene.obstacles.length) {
        dirtyFlags.current.obstacles = true; dirtyFlags.current.lighting = true;
        prev.obstacleCount = scene.obstacles.length;
      }
      const tokenHash = tokens.map(t => `${t.id}:${t.x}:${t.y}`).join(',');
      if (prev.tokenPositions !== tokenHash) {
        dirtyFlags.current.tokens = true; dirtyFlags.current.lighting = true; dirtyFlags.current.auras = true;
        prev.tokenPositions = tokenHash;
      }
      if (prev.viewportZoom !== z) {
        dirtyFlags.current.grid = true; prev.viewportZoom = z;
      }

      // --- RENDER START ---
      ctx.fillStyle = COLORS.CANVAS_BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(effectiveViewport.x, effectiveViewport.y);
      ctx.scale(effectiveViewport.zoom, effectiveViewport.zoom);

      const allVisionPolygons: Point[][] = [];
      const visionObstacles = scene.obstacles;

      // --- VISION CALCULATION & GRID ---
      if (effectiveIsGM) {
        if (mapImage?.complete) ctx.drawImage(mapImage, 0, 0, mapWidth, mapHeight);
        else { ctx.fillStyle = COLORS.EMPTY_MAP; ctx.fillRect(0, 0, mapWidth, mapHeight); }
        drawGrid(ctx, mapWidth, mapHeight, gridSize, gridColor, gridAlpha, effectiveViewport.zoom, ui.showGridCoordinates);
        if (scene.fogPath) {
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fill(new Path2D(scene.fogPath));
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2 / effectiveViewport.zoom;
          ctx.setLineDash([5 / z, 5 / z]);
          ctx.stroke(new Path2D(scene.fogPath));
          ctx.restore();
        }
      } else {
        ctx.fillStyle = COLORS.CANVAS_BG;
        ctx.fillRect(0, 0, mapWidth, mapHeight);
        const visibilityPath = new Path2D();
        if (scene.fogPath) visibilityPath.addPath(new Path2D(scene.fogPath));

        const unitScale = gridSize / (unitsPerSquare || 1.5);

        visionTokens.forEach(token => {
          const anim = animationsRef.current.get(token.id);
          const { x: currX, y: currY } = getAnimatedPosition(token, anim, renderTime);

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
        else { ctx.fillStyle = COLORS.EMPTY_MAP; ctx.fillRect(0, 0, mapWidth, mapHeight); }
        drawGrid(ctx, mapWidth, mapHeight, gridSize, gridColor, gridAlpha, z, ui.showGridCoordinates);
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
          ctx.lineWidth = drawing.width / z;
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
            ctx.lineWidth = drawingSettings.width / z;
            ctx.globalAlpha = drawingSettings.opacity;
          }
          ctx.stroke();
          ctx.restore();
        }
      }

      // --- ZONES (Attack, Preview, Obstacles, Trigger, Audio) ---
      if (attackZoneResults && attackZoneResults.length > 0) {
        renderAttackZones(ctx, attackZoneResults, {
          showAffectedTokens: true, showBlockedTokens: true, showStats: effectiveIsGM, gridSize: gridSize, zoom: z
        });
      }
      if (previewZoneResult) {
        renderPreviewZone(ctx, previewZoneResult, {
          showAffectedTokens: true, showBlockedTokens: true, showStats: true, gridSize: gridSize, zoom: z
        });
      }
      if (scene.obstacles && scene.obstacles.length > 0) {
        drawObstacles(ctx, scene.obstacles, effectiveIsGM, z, hoveredObstacleId || undefined, ui.gmHideObstacles);
      }
      if (effectiveIsGM && scene.triggerZones && scene.triggerZones.length > 0) {
        ctx.save();
        ctx.font = `bold ${16 / z}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        scene.triggerZones.forEach(zone => {
          ctx.beginPath();
          if (zone.type === 'rect' && zone.rect) { ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h); }
          else if (zone.type === 'polygon' && zone.points && zone.points.length > 0) {
            ctx.moveTo(zone.points[0].x, zone.points[0].y);
            for (let i = 1; i < zone.points.length; i++) ctx.lineTo(zone.points[i].x, zone.points[i].y);
            ctx.closePath();
          }
          ctx.strokeStyle = COLORS.TRIGGER_ZONE; ctx.lineWidth = 2 / z; ctx.setLineDash([8 / z, 4 / z]); ctx.stroke();
          ctx.fillStyle = COLORS.TRIGGER_FILL; ctx.fill();
          let cx = 0, cy = 0;
          if (zone.rect) { cx = zone.rect.x + zone.rect.w / 2; cy = zone.rect.y + zone.rect.h / 2; }
          else if (zone.points) { zone.points.forEach(p => { cx += p.x; cy += p.y; }); cx /= zone.points.length; cy /= zone.points.length; }
          ctx.fillStyle = 'rgba(168, 85, 247, 1)'; ctx.fillText('⚡', cx, cy);
        });
        ctx.restore();
      }
      if (scene.audioZones && scene.audioZones.length > 0) {
        drawAudioZones(ctx, scene.audioZones, effectiveIsGM, z);
      }

      // --- REMOTE DRAGS ---
      Object.entries(remoteDrags).forEach(([uid, dragItem]) => {
        const drag = dragItem as any; // TokenDragPayload
        const ghostToken = tokens.find(t => t.id === drag.tokenId);
        if (ghostToken) {
          if (!effectiveIsGM) {
            const isOwner = isTokenOwner(ghostToken, currentUser?.id);
            if (!ghostToken.isVisibleToPlayers && !isOwner) return;
            if (!isOwner && !isPositionVisible({ x: drag.x, y: drag.y, size: ghostToken.size }, gridSize, allVisionPolygons, scene.fogPath, ctx)) return;
          }
          const dragPosWorld = getTokenWorldPos({ x: drag.x, y: drag.y, size: ghostToken.size }, gridSize);
          const pathWorld = drag.path.map((p: any) => getTokenWorldPos({ x: p.x, y: p.y, size: ghostToken.size }, gridSize));

          if (pathWorld.length > 0) {
            drawRuler(ctx, pathWorld, dragPosWorld, gridSize, unitsPerSquare, z, drag.color || COLORS.DEFAULT_CURSOR, ghostToken.speed || 9);
          }
          ctx.globalAlpha = 0.6;
          drawToken(ctx, { ...ghostToken, x: drag.x, y: drag.y }, gridSize, false, z, imageCache, true);
          ctx.globalAlpha = 1.0;

          const draggingUser = props.players?.find(u => u.id === uid);
          const labelText = draggingUser ? draggingUser.name : 'Unknown';
          drawLabel(ctx, labelText, dragPosWorld.x, dragPosWorld.y - 40 / z, z, drag.color || COLORS.DEFAULT_CURSOR);
        }
      });

      // --- TOKENS ---
      const sortedTokens = [...tokens].sort((a, b) => {
        const aControllable = effectiveIsGM || isTokenOwner(a, currentUser?.id);
        const bControllable = effectiveIsGM || isTokenOwner(b, currentUser?.id);
        if (aControllable && !bControllable) return 1;
        if (!aControllable && bControllable) return -1;
        return 0;
      });

      sortedTokens.forEach(token => {
        const isOwner = isTokenOwner(token, currentUser?.id);
        let shouldRender = true;
        if (!effectiveIsGM) {
          const isVisibleToOthers = token.isVisibleToPlayers;
          if (previewPlayerId === 'all') shouldRender = isVisibleToOthers || token.type === 'pc';
          else if (previewPlayerId) shouldRender = isVisibleToOthers || token.ownerId === previewPlayerId;
          else shouldRender = isVisibleToOthers || isOwner;
        }
        if (!shouldRender) return;

        const isBeingDragged = dragState.current.isDragging && (dragState.current.token?.id === token.id || selectedTokenIds.includes(token.id));
        let renderAsGhost = isBeingDragged;
        if (!token.isVisibleToPlayers && (effectiveIsGM || (!previewPlayerId && isOwner))) renderAsGhost = true;

        const anim = animationsRef.current.get(token.id);
        const { x: currX, y: currY } = getAnimatedPosition(token, anim, renderTime);
        const animToken = { ...token, x: currX, y: currY };

        if (!effectiveIsGM && !isOwner && !isPositionVisible(animToken, gridSize, allVisionPolygons, scene.fogPath, ctx)) return;

        // GM Vision Ranges
        if (effectiveIsGM && (ui.showVisionRanges || selectedTokenIds.includes(token.id))) {
          const cx = (currX + token.size / 2) * gridSize;
          const cy = (currY + token.size / 2) * gridSize;
          const unitScale = gridSize / (unitsPerSquare || 1.5);

          if ((token.darkvisionRange || 0) > 0) {
            const r = (token.darkvisionRange || 0) * unitScale;
            const poly = calculateVisibilityPolygon({ x: cx, y: cy }, scene.obstacles, r);
            if (poly.length > 0) {
              ctx.save(); ctx.beginPath(); ctx.moveTo(poly[0].x, poly[0].y); for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y); ctx.closePath();
              ctx.lineWidth = 2 / z; ctx.strokeStyle = COLORS.DEFAULT_DARKVISION; ctx.setLineDash([8 / z, 4 / z]); ctx.stroke();
              ctx.fillStyle = adjustAlpha(COLORS.DEFAULT_DARKVISION, 0.05); ctx.fill();
              drawLabel(ctx, `DV: ${token.darkvisionRange}m`, cx, cy + r + (20 / z), z, COLORS.DEFAULT_DARKVISION.replace(')', ', 0.8)')); ctx.restore();
            }
          }
          if ((token.visionRange || 0) > 0) {
            const r = (token.visionRange || 0) * unitScale;
            const poly = calculateVisibilityPolygon({ x: cx, y: cy }, scene.obstacles, r);
            if (poly.length > 0) {
              ctx.save(); ctx.beginPath(); ctx.moveTo(poly[0].x, poly[0].y); for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y); ctx.closePath();
              ctx.lineWidth = 2 / z; ctx.strokeStyle = COLORS.DEFAULT_VISION; ctx.setLineDash([]); ctx.stroke();
              ctx.fillStyle = adjustAlpha(COLORS.DEFAULT_VISION, 0.1); ctx.fill();
              drawLabel(ctx, `Vis: ${token.visionRange}m`, cx, cy - r - (10 / z), z, COLORS.DEFAULT_VISION.replace(')', ', 0.8)')); ctx.restore();
            }
          }
        }

        const linkedCharacter = token.linkedId ? campaignCharacters.find(c => c.id === token.linkedId) : undefined;
        drawAuras(ctx, animToken, gridSize, z, effectiveIsGM);
        drawToken(ctx, animToken, gridSize, selectedTokenIds.includes(token.id), z, imageCache, renderAsGhost, linkedCharacter);
      });

      if (lightCtx) {
        drawLightingLayer(lightCtx, canvas.width, canvas.height, scene, tokens, animationsRef.current, effectiveViewport, visionTokens, !effectiveIsGM, (!effectiveIsGM && allVisionPolygons.length > 0) ? allVisionPolygons : undefined, visionObstacles);
        ctx.save(); ctx.resetTransform(); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(lightCanvas, 0, 0); ctx.restore();
      }

      // --- HELPER MODULES RENDER ---

      // Render Tools
      renderToolOverlays(ctx, activeTool, effectiveMousePos, z, gridSize, {
        movementPath, unitsPerSquare, rulerSettings, draftPolyPoints,
        drawingObstacle, currentFogRect, drawingLightZone, drawingAudioZone,
        drawingTriggerZone, drawingSettings
      });

      // Drags (Local)
      if (dragState.current.isDragging && dragState.current.token) {
        const leader = dragState.current.token;
        const offset = dragState.current.offset || { x: 0, y: 0 };
        const leaderGridX = Math.round((effectiveMousePos.x - offset.x) / gridSize);
        const leaderGridY = Math.round((effectiveMousePos.y - offset.y) / gridSize);
        const deltaGridX = leaderGridX - leader.x;
        const deltaGridY = leaderGridY - leader.y;

        dragState.current.draggedGroup.forEach(groupItem => {
          const token = tokens.find(t => t.id === groupItem.id);
          if (!token) return;
          const smoothX = effectiveMousePos.x - groupItem.offsetX;
          const smoothY = effectiveMousePos.y - groupItem.offsetY;

          ctx.save(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1 / z;
          ctx.strokeRect((groupItem.startGridX + deltaGridX) * gridSize, (groupItem.startGridY + deltaGridY) * gridSize, token.size * gridSize, token.size * gridSize);
          ctx.restore();

          drawToken(ctx, { ...token, x: smoothX / gridSize, y: smoothY / gridSize }, gridSize, true, z, imageCache, false);

          if (token.id === leader.id) {
            const pathWorldPoints = calculatedPath.map(p => getTokenWorldPos({ x: p.x, y: p.y, size: token.size }, gridSize));
            const currentSnap = getTokenWorldPos({ x: groupItem.startGridX + deltaGridX, y: groupItem.startGridY + deltaGridY, size: token.size }, gridSize);
            const dragColor = props.cursorSettings?.color || COLORS.DEFAULT_CURSOR;
            if (pathWorldPoints.length > 0) drawRuler(ctx, pathWorldPoints, currentSnap, gridSize, unitsPerSquare, z, dragColor, token.speed || 9);
            const dragLabel = `${t('common.me')} (${token.name})`;
            drawLabel(ctx, dragLabel, currentSnap.x, currentSnap.y - 40 / z, z, dragColor);
          }
        });
      }

      // Modules: Click Animations, Pings, Remote Viewports
      if (props.clickAnimationsRef && props.clickAnimationsRef.current) {
        renderClickAnimations(ctx, props.clickAnimationsRef.current, z);
        // Clean up old animations (mutating the array in ref as original code did)
        const now = Date.now();
        props.clickAnimationsRef.current = props.clickAnimationsRef.current.filter(anim => now - anim.startTime < 500);
      }

      renderPingAnimations(ctx, pings, gridSize, z);

      const cursorsToRender = remoteCursorsRef?.current ? remoteCursorsRef.current : remoteCursors;

      if (remoteViewports) {
        renderRemoteViewports(ctx, remoteViewports, cursorsToRender, currentUser?.id, permissions, effectiveIsGM, z, players);
      }

      // --- CURSORS (Physics Engine) ---
      const deltaMs = frameTimer.current.tick();
      localCursorRef.current = { x: mouseWorldPos.x, y: mouseWorldPos.y };

      // --- LOCAL CURSOR PHYSICS (for collisions) ---
      // Note: Local trail is rendered by CustomCursor.tsx (DOM overlay), not here.
      const LOCAL_ID = 'local_user_cursor';
      const currentUserOverride = props.permissions?.cursorOverrides?.[currentUser?.id || ''] || {};
      const localSettings = (props.cursorSettings || {}) as any;

      const effectiveLocalSettings = {
        color: currentUserOverride.color || localSettings.color || COLORS.DEFAULT_CURSOR,
        trailEnabled: currentUserOverride.trailEnabled ?? localSettings.trailEnabled,
        trailColor: currentUserOverride.trailColor || localSettings.trailColor || localSettings.color,
        trailAnimation: currentUserOverride.trailAnimation || localSettings.trailAnimation,
        trailCustomImage: currentUserOverride.trailCustomImage || localSettings.trailCustomImage,
        trailLength: currentUserOverride.trailLength ?? localSettings.trailLength,
        trailThickness: currentUserOverride.trailThickness ?? localSettings.trailThickness,
        trailSize: currentUserOverride.trailSize ?? localSettings.trailSize
      };

      // Feed local data into physics engine for collision detection (trail rendered by CustomCursor.tsx)
      cursorEngine.processServerUpdate(LOCAL_ID, {
        x: mouseWorldPos.x,
        y: mouseWorldPos.y,
        timestamp: performance.now(),
        trailEnabled: effectiveLocalSettings.trailEnabled,
        trailColor: effectiveLocalSettings.trailColor,
        trailAnimation: effectiveLocalSettings.trailAnimation,
        trailCustomImage: effectiveLocalSettings.trailCustomImage,
        trailLength: effectiveLocalSettings.trailLength,
        trailThickness: effectiveLocalSettings.trailThickness,
        trailSize: effectiveLocalSettings.trailSize,
        healthStatus: 'healthy',
      });

      // Tick physics
      cursorEngine.tick(LOCAL_ID, deltaMs);

      // Render Local Trail (Unified Logic)
      // Precision Mode: Skip trail when grid align tools are active
      const localRenderData = cursorEngine.getRenderData(LOCAL_ID);
      if (localRenderData && !activeTool.startsWith('map-align') && (localRenderData.trailConfig?.enabled || localRenderData.healthStatus !== 'healthy')) {
        renderCursorTrails(ctx, localRenderData as any, effectiveLocalSettings.color, z);
      }


      if (cursorsToRender) {
        // Get current user ID with fallback to prevent undefined comparison issues
        const localUserId = currentUser?.id;

        Object.values(cursorsToRender).forEach((cursor: any) => {
          // Skip local user cursor - never render here (CustomCursor.tsx handles it)
          if (!localUserId || cursor.userId === localUserId) return;
          const showTrails = props.cursorSettings?.showOthersTrails !== false;

          const lastProcessed = lastProcessedCursorsRef.current[cursor.userId];
          const positionChanged = !lastProcessed || lastProcessed.x !== cursor.x || lastProcessed.y !== cursor.y;

          if (positionChanged || cursor.isClicking !== lastProcessed?.isClicking || cursor.isAfk !== lastProcessed?.isAfk) {
            cursorEngine.processServerUpdate(cursor.userId, {
              x: cursor.x, y: cursor.y, timestamp: cursor.timestamp,
              velocityX: cursor.velocityX, velocityY: cursor.velocityY,
              isClicking: cursor.isClicking, healthStatus: cursor.healthStatus,
              activeTool: cursor.activeTool, isContexting: cursor.isContexting,
              isChatting: cursor.isChatting, trailAnimation: cursor.trailAnimation as any,
              trailColor: cursor.trailColor, trailEnabled: cursor.trailEnabled,
              trailCustomImage: cursor.trailCustomImage,
              trailLength: cursor.trailLength,
              trailThickness: cursor.trailThickness,
              trailSize: cursor.trailSize,
              isAfk: cursor.isAfk,
            });
            lastProcessedCursorsRef.current[cursor.userId] = {
              x: cursor.x,
              y: cursor.y,
              isClicking: cursor.isClicking,
              isAfk: cursor.isAfk,

            };
          }

          cursorEngine.tick(cursor.userId, deltaMs);
          const renderData = cursorEngine.getRenderData(cursor.userId);
          if (!renderData) return;
          if (cursor.isDragging) return;

          const cursorColor = cursor.userColor || COLORS.DEFAULT_CURSOR;

          ctx.save();


          // Trails - Precision Mode: Skip when grid align tools are active
          if (showTrails && !activeTool.startsWith('map-align') && (renderData.trailConfig?.enabled || renderData.healthStatus !== 'healthy')) {
            renderCursorTrails(ctx, renderData as any, cursorColor, z);
          }

          // Cursor Shape
          const STRETCH_FACTOR = 0.05;
          const velocity = Math.sqrt(renderData.velocity.x ** 2 + renderData.velocity.y ** 2);
          let stretchScaleY = 1 + Math.min(velocity * STRETCH_FACTOR, 0.5);
          let stretchScaleX = 1 - Math.min(velocity * STRETCH_FACTOR * 0.5, 0.2);
          if (renderData.isClicking) { stretchScaleX *= 0.6; stretchScaleY *= 0.6; }

          // Ghost Mode for AFK/Hidden
          const isInactive = renderData.isAfk;
          const effectiveColor = isInactive ? '#9ca3af' : cursorColor; // Gray-400 for ghost
          const effectiveOpacity = isInactive ? 0.5 : 1.0;

          ctx.save();
          ctx.globalAlpha = effectiveOpacity;
          if (isInactive) {
            ctx.filter = 'blur(2px)'; // Add blur for ghost
          }

          renderCursor(ctx, renderData.position.x, renderData.position.y, renderData.angle,
            effectiveColor, cursor.userShape || 'default', cursor.userName || '?',
            false, stretchScaleX, stretchScaleY, z
          );
          ctx.restore();

          // Overlays (Icons) - Render at full opacity
          renderCursorOverlays(ctx, renderData, z);

          ctx.restore();
        });
      }

      // Explosions
      const explosionEnabled = props.cursorSettings?.explosionOnCollision !== false && String(props.cursorSettings?.explosionOnCollision) !== 'false';
      if (explosionEnabled) {
        // Collect positions for collision logic
        const cursorPositions: { id: string; x: number; y: number; color: string; }[] = [];
        if (cursorsToRender) {
          Object.values(cursorsToRender).forEach((cursor: any) => {
            if (cursor.userId === currentUser?.id) return;
            const data = cursorEngine.getRenderData(cursor.userId);
            // Don't explode if hidden/afk?
            if (data && !data.isAfk) {
              cursorPositions.push({ id: cursor.userId, x: data.position.x, y: data.position.y, color: cursor.userColor || COLORS.DEFAULT_CURSOR });
            }
          });
        }
        if (currentUser) {
          cursorPositions.push({ id: currentUser.id, x: mouseWorldPos.x, y: mouseWorldPos.y, color: permissions?.cursorOverrides?.[currentUser.id]?.color || props.cursorSettings?.color || '#3b82f6' });
        }

        // Detect collisions
        const collisionTime = performance.now();
        const COLLISION_DISTANCE = 50 / z;
        const EXPLOSION_COOLDOWN = 800;

        for (let i = 0; i < cursorPositions.length; i++) {
          for (let j = i + 1; j < cursorPositions.length; j++) {
            const a = cursorPositions[i];
            const b = cursorPositions[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < COLLISION_DISTANCE) {
              const key = [a.id, b.id].sort().join('_');
              const last = cursorCollisionsRef.current.get(key) || 0;
              if (collisionTime - last > EXPLOSION_COOLDOWN) {
                cursorCollisionsRef.current.set(key, collisionTime);
                cursorExplosionsRef.current.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, time: collisionTime, colors: [a.color, b.color] });
              }
            }
          }
        }
        renderExplosions(ctx, cursorExplosionsRef.current, z);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    scene, tokens, viewport, isGM, gmViewMode, currentUser, activeTool, movementPath, pings, drawingObstacle, draftPolyPoints,
    currentFogRect, selectedTokenIds, mouseWorldPos, animatingTokens, calculatedPath, hoveredObstacleId, ui.gmHideObstacles,
    ui.showVisionRanges, drawingLightZone, drawingAudioZone, drawingTriggerZone, previewPlayerId, visionTokens, remoteDrags,
    remoteCursors, drawingSettings, rulerSettings, imageCache, attackZoneResults, previewZoneResult, campaignCharacters, remoteViewports,
    props.isModalOpen
  ]);
};
