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
import { getContrastColor } from '../../../../utils/colors';
import { getCursorShape } from '../../constants/cursorShapes';
import { renderCursorToImage } from '../../../../utils/cursorRenderer';
import { useLayerCache, drawCachedGrid } from './useLayerCache';
import { getToolIcon } from '../../../../constants/toolIcons';
// Advanced animation engine imports
import { CursorPhysicsEngine, createCursorUpdateFromPayload } from '../../../../utils/cursorPhysicsEngine';
import { getGlobalFrameTimer } from '../../../../utils/animationEngine';

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
  draggedAttackZone: { id: string, startX: number, startY: number, originX: number, originY: number, rotating?: boolean; } | null;
  liveDrawingPointsRef: React.MutableRefObject<{ x: number, y: number; }[]>;
  isDrawingRef: React.MutableRefObject<boolean>;
  currentFogRect: { x: number, y: number, w: number, h: number; } | null;
  hoveredTokenId: string | null;
  visionTokens: Token[];
  imageCache: { [src: string]: HTMLImageElement; };
  currentUser: User | null;
  players?: User[];
  remoteViewports?: Record<string, { x: number, y: number, zoom: number, w: number, h: number; }>;
  clickAnimationsRef?: React.MutableRefObject<{ x: number, y: number, color: string, style?: 'ripple' | 'burst' | 'sparkle' | 'pulse' | 'vortex' | 'shard' | 'ring' | 'echo' | 'orb', startTime: number; }[]>;
  // PERFORMANCE: Ref for immediate viewport during pan/zoom (avoids state re-render)
  viewportRef?: React.MutableRefObject<{ x: number, y: number, zoom: number; }>;
  // PERFORMANCE: Ref for immediate mouse position during token drag
  mouseWorldPosRef?: React.MutableRefObject<{ x: number, y: number; }>;
  remoteCursorsRef?: React.MutableRefObject<Record<string, any>>;
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
  // Uses spring interpolation, latency compensation, and velocity-based prediction
  const cursorEngineRef = React.useRef<CursorPhysicsEngine | null>(null);
  if (!cursorEngineRef.current) {
    cursorEngineRef.current = new CursorPhysicsEngine();
  }
  const cursorEngine = cursorEngineRef.current;

  // Frame timer for delta-time independent animations
  const frameTimer = React.useRef(getGlobalFrameTimer());

  // Track last processed cursor positions to avoid re-processing same data every frame
  const lastProcessedCursorsRef = React.useRef<Record<string, { x: number; y: number; isClicking?: boolean; }>>({});

  // Track cursor collisions and explosions
  const cursorCollisionsRef = React.useRef<Map<string, number>>(new Map());
  const cursorExplosionsRef = React.useRef<{ x: number; y: number; time: number; colors: string[]; }[]>([]);

  // Track local cursor position for self-cursor rendering
  const localCursorRef = React.useRef<{ x: number; y: number; } | null>(null);

  // We use a ref because we update it inside the animation loop without triggering re-renders

  // --- DIRTY FLAGS FOR RENDER OPTIMIZATION ---
  // Track which layers need full redraw vs can use cached state
  const dirtyFlags = React.useRef({
    grid: true,       // Redraw grid (changes rarely)
    obstacles: true,  // Redraw walls/doors (changes on scene edit)
    tokens: true,     // Redraw tokens (changes on move/animation)
    lighting: true,   // Redraw lighting layer (changes on token move or light change)
    auras: true,      // Redraw auras (changes on token move)
  });

  // Track previous state for change detection
  const prevStateRef = React.useRef({
    gridSize: 0,
    gridColor: '',
    gridAlpha: 1,
    obstacleCount: 0,
    tokenPositions: '' as string,
    viewportZoom: 0,
  });


  // Sync React state cursors with Physics Engine
  useEffect(() => {
    if (!remoteCursors) return;
    Object.values(remoteCursors).forEach((cursor) => {
      // Bridge: Pass socket payload from React state to Physics Engine
      // This ensures the engine has data to interpolate and render
      const { userId, update } = createCursorUpdateFromPayload(cursor);
      cursorEngine.processServerUpdate(userId, update);
    });

    // Clean up stale cursors (optional, but good for keeping engine clean)
    // We can check if any cursor in engine is NOT in remoteCursors
    const engineIds = cursorEngine.getCursorIds();
    engineIds.forEach(id => {
      if (!remoteCursors[id] && id !== currentUser?.id) {
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
    if (!lightCanvas) return; // Should exist

    if (lightCanvas.width !== canvas.width || lightCanvas.height !== canvas.height) {
      lightCanvas.width = canvas.width;
      lightCanvas.height = canvas.height;
    }
    const lightCtx = lightCanvas.getContext('2d');




    let animationFrameId: number;
    let lastRenderTime = 0;

    const render = () => {
      const now = Date.now();

      // PERFORMANCE: COMPLETELY PAUSE rendering when modal is open
      // This frees 100% CPU for overlay interactions (modals, inputs, etc.)
      // The useEffect will restart the loop when modal closes (isModalOpen changes)
      if (props.isModalOpen) {
        // Don't schedule next frame - completely pause
        return;
      }

      // Throttle when tab is hidden (5fps)
      if (document.hidden && (now - lastRenderTime < 200)) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = now;

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

      // PERFORMANCE: Use viewportRef for immediate rendering during pan/zoom
      // This reads the latest position without waiting for React state update
      const effectiveViewport = props.viewportRef
        ? props.viewportRef.current
        : viewport;

      // PERFORMANCE: Use mouseWorldPosRef for immediate mouse position during drag
      // This avoids React state batching lag (1+ second delay during fast movements)
      const effectiveMousePos = props.mouseWorldPosRef
        ? props.mouseWorldPosRef.current
        : mouseWorldPos;

      // Alias for cleaner code - use this everywhere instead of viewport.zoom
      const z = effectiveViewport.zoom;

      // --- DIRTY FLAG DETECTION ---
      // Check what changed since last frame to optimize rendering
      const prev = prevStateRef.current;

      // Grid dirty if settings changed
      if (prev.gridSize !== gridSize || prev.gridColor !== gridColor || prev.gridAlpha !== gridAlpha) {
        dirtyFlags.current.grid = true;
        prev.gridSize = gridSize;
        prev.gridColor = gridColor;
        prev.gridAlpha = gridAlpha;
      }

      // Obstacles dirty if count changed
      if (prev.obstacleCount !== scene.obstacles.length) {
        dirtyFlags.current.obstacles = true;
        dirtyFlags.current.lighting = true; // Lighting depends on obstacles
        prev.obstacleCount = scene.obstacles.length;
      }

      // Token positions dirty check (simplified hash)
      const tokenHash = tokens.map(t => `${t.id}:${t.x}:${t.y}`).join(',');
      if (prev.tokenPositions !== tokenHash) {
        dirtyFlags.current.tokens = true;
        dirtyFlags.current.lighting = true; // Vision depends on token positions
        dirtyFlags.current.auras = true;
        prev.tokenPositions = tokenHash;
      }

      // Zoom changed - need to redraw grid for coordinate labels
      if (prev.viewportZoom !== z) {
        dirtyFlags.current.grid = true;
        prev.viewportZoom = z;
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      // PERFORMANCE: Use effectiveViewport for smooth panning
      ctx.translate(effectiveViewport.x, effectiveViewport.y);
      ctx.scale(effectiveViewport.zoom, effectiveViewport.zoom);

      const allVisionPolygons: Point[][] = [];
      const visionObstacles = scene.obstacles;

      if (effectiveIsGM) {
        if (mapImage?.complete) ctx.drawImage(mapImage, 0, 0, mapWidth, mapHeight);
        else { ctx.fillStyle = '#202020'; ctx.fillRect(0, 0, mapWidth, mapHeight); }
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

      // --- ATTACK ZONES ---
      if (attackZoneResults && attackZoneResults.length > 0) {
        renderAttackZones(ctx, attackZoneResults, {
          showAffectedTokens: true,
          showBlockedTokens: true,
          showStats: effectiveIsGM,
          gridSize: gridSize,
          zoom: z
        });
      }

      if (previewZoneResult) {
        renderPreviewZone(ctx, previewZoneResult, {
          showAffectedTokens: true,
          showBlockedTokens: true,
          showStats: true,
          gridSize: gridSize,
          zoom: z
        });
      }

      if (scene.obstacles && scene.obstacles.length > 0) {
        drawObstacles(ctx, scene.obstacles, effectiveIsGM, z, hoveredObstacleId || undefined, ui.gmHideObstacles);
      }

      // --- TRIGGER ZONES ---
      if (effectiveIsGM && scene.triggerZones && scene.triggerZones.length > 0) {
        ctx.save();
        ctx.font = `bold ${16 / z}px sans-serif`;
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
          ctx.lineWidth = 2 / z;
          ctx.setLineDash([8 / z, 4 / z]);
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
        drawAudioZones(ctx, scene.audioZones, effectiveIsGM, z);
      }

      // --- REMOTE DRAGS ---
      Object.entries(remoteDrags).forEach(([uid, dragItem]) => {
        const drag = dragItem as any; // TokenDragPayload
        const ghostToken = tokens.find(t => t.id === drag.tokenId);
        if (ghostToken) {
          const dragPosWorld = { x: drag.x * gridSize + (ghostToken.size * gridSize) / 2, y: drag.y * gridSize + (ghostToken.size * gridSize) / 2 };
          const pathWorld = drag.path.map((p: any) => ({ x: p.x * gridSize + (ghostToken.size * gridSize) / 2, y: p.y * gridSize + (ghostToken.size * gridSize) / 2 }));
          if (pathWorld.length > 0) {
            drawRuler(ctx, pathWorld, dragPosWorld, gridSize, unitsPerSquare, z, drag.color || '#fbbf24', ghostToken.speed || 9);
          }
          const visualToken = { ...ghostToken, x: drag.x, y: drag.y };
          ctx.globalAlpha = 0.6;
          drawToken(ctx, visualToken, gridSize, false, z, imageCache, true);
          ctx.globalAlpha = 1.0;

          // Resolve User Name
          const draggingUser = props.players?.find(u => u.id === uid);
          const labelText = draggingUser ? draggingUser.name : 'Unknown';

          drawLabel(ctx, labelText, drag.x * gridSize + (ghostToken.size * gridSize) / 2, drag.y * gridSize - 20 / z, z, drag.color || '#fbbf24');
        }
      });

      // --- TOKENS ---
      // Sort tokens so controllable tokens render on top of non-controllable ones
      const sortedTokens = [...tokens].sort((a, b) => {
        const aControllable = effectiveIsGM || a.ownerId === currentUser?.id || a.controlledBy?.includes(currentUser?.id || '');
        const bControllable = effectiveIsGM || b.ownerId === currentUser?.id || b.controlledBy?.includes(currentUser?.id || '');
        if (aControllable && !bControllable) return 1; // a goes after b (renders on top)
        if (!aControllable && bControllable) return -1; // b goes after a
        return 0; // Keep original order
      });

      sortedTokens.forEach(token => {
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
              ctx.lineWidth = 2 / z; ctx.strokeStyle = visColor; ctx.setLineDash([8 / z, 4 / z]); ctx.stroke();
              ctx.fillStyle = adjustAlpha(visColor, 0.05); ctx.fill();
              drawLabel(ctx, `DV: ${token.darkvisionRange}m`, cx, cy + r + (20 / z), z, visColor.replace(')', ', 0.8)')); ctx.restore();
            }
          }

          if ((token.visionRange || 0) > 0) {
            const r = (token.visionRange || 0) * unitScale;
            const poly = calculateVisibilityPolygon({ x: cx, y: cy }, scene.obstacles, r);

            if (poly.length > 0) {
              ctx.save(); ctx.beginPath(); ctx.moveTo(poly[0].x, poly[0].y); for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y); ctx.closePath();
              const visColor = token.visionColor || 'rgba(34, 211, 238, 0.5)';
              ctx.lineWidth = 2 / z; ctx.strokeStyle = visColor; ctx.setLineDash([]); ctx.stroke();
              ctx.fillStyle = adjustAlpha(visColor, 0.1); ctx.fill();
              drawLabel(ctx, `Vis: ${token.visionRange}m`, cx, cy - r - (10 / z), z, visColor.replace(')', ', 0.8)')); ctx.restore();
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

      // --- TOOLS & OVERLAYS ---
      if (activeTool === 'measure-path') {
        if (movementPath.length > 0) {
          drawRuler(ctx, movementPath, mouseWorldPos, gridSize, unitsPerSquare, z, undefined, undefined, rulerSettings.metric, true);
        } else {
          ctx.beginPath(); ctx.arc(mouseWorldPos.x, mouseWorldPos.y, 4 / z, 0, Math.PI * 2); ctx.fillStyle = '#fbbf24'; ctx.fill();
        }
      }

      if (activeTool === 'eraser' || activeTool === 'eraser-audio' || activeTool === 'eraser-drawing') {
        ctx.save(); ctx.beginPath(); ctx.arc(mouseWorldPos.x, mouseWorldPos.y, 8 / z, 0, Math.PI * 2); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2 / z; ctx.stroke(); ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; ctx.fill(); ctx.restore();
      }

      if (activeTool === 'eraser-trigger') {
        ctx.save(); ctx.beginPath(); ctx.arc(mouseWorldPos.x, mouseWorldPos.y, 8 / z, 0, Math.PI * 2); ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2 / z; ctx.stroke(); ctx.fillStyle = 'rgba(168, 85, 247, 0.2)'; ctx.fill(); ctx.restore();
      }

      if (dragState.current.isDragging && dragState.current.token) {
        const leader = dragState.current.token;
        // PERFORMANCE: Use effectiveMousePos from ref for immediate position
        const mouseX = effectiveMousePos.x; const mouseY = effectiveMousePos.y;
        const leaderGridX = Math.round((mouseX - dragState.current.offset.x) / gridSize);
        const leaderGridY = Math.round((mouseY - dragState.current.offset.y) / gridSize);
        const deltaGridX = leaderGridX - leader.x;
        const deltaGridY = leaderGridY - leader.y;

        dragState.current.draggedGroup.forEach(groupItem => {
          const token = tokens.find(t => t.id === groupItem.id);
          if (!token) return;
          const smoothX = mouseX - groupItem.offsetX; const smoothY = mouseY - groupItem.offsetY;
          ctx.save(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1 / z; ctx.strokeRect((groupItem.startGridX + deltaGridX) * gridSize, (groupItem.startGridY + deltaGridY) * gridSize, token.size * gridSize, token.size * gridSize); ctx.restore();
          const movingToken = { ...token, x: smoothX / gridSize, y: smoothY / gridSize };
          drawToken(ctx, movingToken, gridSize, true, z, imageCache, false);
          if (token.id === leader.id) {
            const pathWorldPoints = calculatedPath.map(p => ({ x: p.x * gridSize + (token.size * gridSize) / 2, y: p.y * gridSize + (token.size * gridSize) / 2 }));
            const currentSnap = { x: (groupItem.startGridX + deltaGridX) * gridSize + (token.size * gridSize) / 2, y: (groupItem.startGridY + deltaGridY) * gridSize + (token.size * gridSize) / 2 };
            if (pathWorldPoints.length > 0) drawRuler(ctx, pathWorldPoints, currentSnap, gridSize, unitsPerSquare, z, '#fbbf24', token.speed || 9);
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
          ctx.lineWidth = 2 / z;
          ctx.setLineDash([5 / z, 5 / z]);
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
        ctx.lineWidth = 3 / z;
        draftPolyPoints.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4 / z, 0, Math.PI * 2); ctx.fill(); });
        ctx.beginPath(); ctx.moveTo(draftPolyPoints[0].x, draftPolyPoints[0].y); for (let i = 1; i < draftPolyPoints.length; i++) ctx.lineTo(draftPolyPoints[i].x, draftPolyPoints[i].y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(draftPolyPoints[draftPolyPoints.length - 1].x, draftPolyPoints[draftPolyPoints.length - 1].y); ctx.lineTo(mouseWorldPos.x, mouseWorldPos.y); ctx.stroke();
        if (draftPolyPoints.length >= (activeTool === 'draw-wall' ? 2 : 3)) {
          const distToStart = Math.hypot(mouseWorldPos.x - draftPolyPoints[0].x, mouseWorldPos.y - draftPolyPoints[0].y);
          if (distToStart < 15 / z) {
            ctx.beginPath(); ctx.arc(draftPolyPoints[0].x, draftPolyPoints[0].y, 8 / z, 0, Math.PI * 2); ctx.strokeStyle = 'yellow'; ctx.lineWidth = 2 / z; ctx.stroke(); drawLabel(ctx, "Fechar", draftPolyPoints[0].x, draftPolyPoints[0].y - 20 / z, z);
          }
        }
        ctx.restore();
      }

      if (drawingObstacle) {
        ctx.save(); ctx.strokeStyle = drawingObstacle.type === 'window' ? 'cyan' : 'rgba(139, 92, 246, 0.9)'; ctx.lineWidth = 5 / z; ctx.beginPath(); ctx.moveTo(drawingObstacle.p1.x, drawingObstacle.p1.y); ctx.lineTo(mouseWorldPos.x, mouseWorldPos.y); ctx.stroke(); ctx.restore();
      }


      // --- CLICK ANIMATIONS ---
      if (props.clickAnimationsRef && props.clickAnimationsRef.current.length > 0) {
        const now = Date.now();
        const DURATION = 500;

        // Render
        props.clickAnimationsRef.current.forEach(anim => {
          const progress = (now - anim.startTime) / DURATION;
          if (progress >= 1) return;

          const easeOut = 1 - Math.pow(1 - progress, 3);

          ctx.save();
          ctx.translate(anim.x, anim.y);
          ctx.globalAlpha = 1 - easeOut; // Fade out common

          if (anim.style === 'burst') {
            const maxR = 60 / z;
            const currentR = maxR * easeOut;
            const lines = 8;
            ctx.strokeStyle = anim.color;
            ctx.lineWidth = 2 / z;
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
          } else if (anim.style === 'sparkle') {
            const maxDist = 50 / z;
            const particles = 5;
            ctx.fillStyle = anim.color;
            for (let i = 0; i < particles; i++) {
              const angle = (Math.PI * 2 / particles) * i + (now / 200);
              const dist = maxDist * easeOut;
              const px = Math.cos(angle) * dist;
              const py = Math.sin(angle) * dist;
              ctx.beginPath();
              ctx.arc(px, py, 4 / z, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (anim.style === 'pulse') {
            const maxR = 40 / z;
            ctx.fillStyle = anim.color;
            ctx.beginPath();
            ctx.arc(0, 0, maxR * easeOut, 0, Math.PI * 2);
            ctx.fill();
          } else if (anim.style === 'vortex') {
            const maxR = 50 / z;
            const spirals = 3;
            ctx.strokeStyle = anim.color;
            ctx.lineWidth = 2 / z;
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
          } else if (anim.style === 'shard') {
            const shards = 5;
            const dist = 50 / z * easeOut;
            ctx.fillStyle = anim.color;
            for (let i = 0; i < shards; i++) {
              const angle = (Math.PI * 2 / shards) * i;
              const sx = Math.cos(angle) * dist;
              const sy = Math.sin(angle) * dist;
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              const size = 6 / z;
              ctx.lineTo(sx + Math.cos(angle + 2.5) * size, sy + Math.sin(angle + 2.5) * size);
              ctx.lineTo(sx + Math.cos(angle - 2.5) * size, sy + Math.sin(angle - 2.5) * size);
              ctx.fill();
            }
          } else if (anim.style === 'ring') {
            const r1 = 30 / z * easeOut;
            const r2 = 20 / z * easeOut;
            ctx.strokeStyle = anim.color;
            ctx.lineWidth = 2 / z;
            ctx.beginPath(); ctx.arc(0, 0, r1, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, r2, 0, Math.PI * 2); ctx.stroke();
          } else if (anim.style === 'echo') {
            const count = 3;
            ctx.strokeStyle = anim.color;
            ctx.lineWidth = 1.5 / z;
            for (let i = 0; i < count; i++) {
              const r = (50 / z) * easeOut * (1 - i * 0.25);
              if (r > 0) {
                ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
              }
            }
          } else if (anim.style === 'orb') {
            const r = 25 / z * easeOut;
            ctx.fillStyle = anim.color;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = (1 - easeOut) * 0.5; // Inner glow
            ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2); ctx.fill();
          } else {
            // Ripple (Default)
            const radius = (20 / z) + (40 / z * easeOut);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.lineWidth = (3 / z) * (1 - easeOut);
            ctx.strokeStyle = anim.color;
            ctx.stroke();
          }

          ctx.restore();
        });

        // Cleanup
        props.clickAnimationsRef.current = props.clickAnimationsRef.current.filter(anim => now - anim.startTime < DURATION);
      }

      pings.forEach(ping => {
        const duration = 3000;
        const elapsed = Date.now() - ping.createdAt;
        const progress = Math.min(1, elapsed / duration);
        if (progress >= 1) return;

        const easeOut = 1 - Math.pow(1 - progress, 3);
        const style = ping.animationStyle || 'radar';
        const color = ping.color;
        const baseSize = gridSize;

        ctx.save();
        ctx.translate(ping.x, ping.y);

        // --- PING ANIMATION RENDERING ---
        if (style === 'radar') {
          // Classic Radar Scan
          ctx.rotate(progress * Math.PI * 4);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, baseSize * 1.5, 0, Math.PI / 4);
          ctx.lineTo(0, 0);
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, baseSize * 1.5);
          grad.addColorStop(0, adjustAlpha(color, 0.5));
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fill();
          // Rings
          ctx.rotate(-progress * Math.PI * 4); // Reset rotation for rings
          ctx.strokeStyle = color;
          ctx.lineWidth = 2 / z;
          ctx.globalAlpha = 1 - progress;
          ctx.beginPath(); ctx.arc(0, 0, baseSize * progress * 2, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, baseSize * progress * 1, 0, Math.PI * 2); ctx.stroke();
        } else if (style === 'beacon') {
          // Vertical Beacon (simulated top-down)
          const h = baseSize * 2 * easeOut;
          ctx.globalAlpha = 1 - progress;
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(0, 0, baseSize * 0.2, 0, Math.PI * 2); ctx.fill();
          // Rays
          for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2 * i + (progress * 2));
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(baseSize * 2, 0);
            ctx.strokeStyle = adjustAlpha(color, 0.5 * (1 - progress));
            ctx.lineWidth = 4 / z;
            ctx.stroke();
          }
        } else if (style === 'sonar') {
          // Concatric waves
          for (let i = 0; i < 3; i++) {
            const waveProgress = (progress * 3 + i) % 3 / 3; // 0 to 1 loop
            const r = baseSize * 2 * waveProgress;
            ctx.globalAlpha = 1 - waveProgress;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 / z;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
          }
        } else if (style === 'target') {
          // Locking Target
          const r = baseSize * 1.5 * (1 - easeOut); // Shrinking
          ctx.globalAlpha = Math.min(1, easeOut * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 3 / z;
          ctx.setLineDash([10 / z, 5 / z]);
          ctx.beginPath(); ctx.arc(0, 0, Math.max(0, r), 0, Math.PI * 2); ctx.stroke();
          // Crosshair
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(-baseSize / 2, 0); ctx.lineTo(baseSize / 2, 0);
          ctx.moveTo(0, -baseSize / 2); ctx.lineTo(0, baseSize / 2);
          ctx.stroke();
        } else if (style === 'flare') {
          // Bright flash
          const decay = Math.pow(1 - progress, 5);
          ctx.globalAlpha = decay;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, baseSize * 2);
          grad.addColorStop(0, color);
          grad.addColorStop(0.4, adjustAlpha(color, 0.2));
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(0, 0, baseSize * 2, 0, Math.PI * 2); ctx.fill();
          // Core
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(0, 0, baseSize * 0.2, 0, Math.PI * 2); ctx.fill();
        } else if (style === 'diamond') {
          // Rotating squares
          ctx.rotate(progress * Math.PI);
          const r = baseSize * (1 + easeOut);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2 / z;
          ctx.globalAlpha = 1 - progress;
          ctx.strokeRect(-r / 2, -r / 2, r, r);
          ctx.rotate(Math.PI / 4);
          ctx.strokeRect(-r / 2, -r / 2, r, r);
        } else if (style === 'cross') {
          // X Marks the spot
          const scale = 1 + easeOut;
          ctx.scale(scale, scale);
          ctx.lineWidth = 4 / z;
          ctx.strokeStyle = color;
          ctx.globalAlpha = 1 - progress;
          ctx.beginPath();
          ctx.moveTo(-baseSize / 2, -baseSize / 2); ctx.lineTo(baseSize / 2, baseSize / 2);
          ctx.moveTo(baseSize / 2, -baseSize / 2); ctx.lineTo(-baseSize / 2, baseSize / 2);
          ctx.stroke();
        } else {
          // Default/Pulse (Fallback)
          const maxRadius = gridSize * 1.5;
          ctx.globalAlpha = Math.max(0, 1 - progress * 1.5);
          ctx.beginPath();
          ctx.arc(0, 0, (gridSize * 0.2) * (1 - progress * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.globalAlpha = (1 - progress);
          ctx.lineWidth = Math.max(0.5, (5 - progress * 4) / z);
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.arc(0, 0, maxRadius * easeOut, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();

        // --- NAME DISPLAY (Separate Restore to avoid rotation/scale effects) ---
        if (ping.userName) {
          const nameProgress = Math.min(1, elapsed / 1500); // 1.5s fade out separately
          if (nameProgress < 1) {
            const nameOpacity = 1 - Math.pow(nameProgress, 0.5); // Fast fade out at end

            ctx.save();
            ctx.translate(ping.x, ping.y);
            ctx.translate(0, -baseSize * 1.5); // Above the ping

            const fontSize = 12;
            ctx.font = `bold ${fontSize / z}px "Inter", sans-serif`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center'; // Center text
            const textMetrics = ctx.measureText(ping.userName);

            const paddingX = 8 / z;
            const paddingY = 4 / z;
            const badgeH = (fontSize + 6) / z;
            const badgeW = textMetrics.width + (paddingX * 2);

            ctx.globalAlpha = nameOpacity;

            // Background Badge
            ctx.fillStyle = color;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;

            // Rounded Rect center
            const x = -badgeW / 2;
            const y = -badgeH / 2;
            const r = 4 / z;

            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + badgeW - r, y);
            ctx.quadraticCurveTo(x + badgeW, y, x + badgeW, y + r);
            ctx.lineTo(x + badgeW, y + badgeH - r);
            ctx.quadraticCurveTo(x + badgeW, y + badgeH, x + badgeW - r, y + badgeH);
            ctx.lineTo(x + r, y + badgeH);
            ctx.quadraticCurveTo(x, y + badgeH, x, y + badgeH - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();

            // Text
            ctx.shadowBlur = 0;
            ctx.fillStyle = getContrastColor(color);
            ctx.fillText(ping.userName, 0, 0);

            ctx.restore();
          }
        }
      });

      // --- REMOTE VIEWPORTS ---
      if (remoteViewports) {
        // Group viewports by proximity to handle overlaps
        const groups: { [key: string]: string[]; } = {};
        const threshold = 50 / z; // Distance to consider overlapping

        const visibleViewports = Object.entries(remoteViewports).filter(([uid, vp]) => {
          if (uid === currentUser?.id) return false; // Never show own viewport

          // Check if user is sharing their viewport (default true)
          const remoteUserOverrides = permissions?.userOverrides?.[uid];
          const isSharing = remoteUserOverrides?.shareViewport !== undefined
            ? remoteUserOverrides.shareViewport
            : (permissions?.shareViewport ?? true); // Default global might be used if we had one for "default share state", but usually per-user. Assuming defaults in constants.

          if (!isSharing && !effectiveIsGM) return false; // GM always sees (or should they respect stealth? Plan implies GM sees setup in modal, likely GM sees all)

          // Show if GM OR if permission to see others is enabled
          return effectiveIsGM || permissions?.showRemoteViewports;
        });

        // Calculate groups (using filtered list)
        visibleViewports.forEach(([uid, vp]) => {
          let added = false;
          for (const key in groups) {
            const [otherUid] = groups[key];
            const otherVp = remoteViewports[otherUid];
            if (Math.abs(vp.x - otherVp.x) < threshold && Math.abs(vp.y - otherVp.y) < threshold) {
              groups[key].push(uid);
              added = true;
              break;
            }
          }
          if (!added) {
            groups[uid] = [uid];
          }
        });

        // Render groups
        Object.entries(groups).forEach(([leaderId, uids]) => {
          const vp = remoteViewports[leaderId];
          const wx = -vp.x / vp.zoom;
          const wy = -vp.y / vp.zoom;
          const ww = vp.w / vp.zoom;
          const wh = vp.h / vp.zoom;

          ctx.save();

          // Draw rectangles for all (slightly offset if multiple, or just one main rect)
          // For cleaner look, we just draw the leader's rect since they are overlapping
          const cursor = remoteCursors ? remoteCursors[leaderId] : null;
          const color = cursor?.userColor || '#808080';

          ctx.strokeStyle = color;
          ctx.lineWidth = 2 / z;
          ctx.setLineDash([10 / z, 5 / z]);
          ctx.strokeRect(wx, wy, ww, wh);

          // Draw Labels Stacked
          const fontSize = 12 / z;
          ctx.font = `bold ${fontSize}px sans-serif`;
          const padding = 4 / z;
          let currentY = wy;

          uids.forEach((uid, index) => {
            const uCursor = remoteCursors ? remoteCursors[uid] : null;
            const uName = uCursor?.userName || 'Player';
            const uColor = uCursor?.userColor || '#808080';

            const textMetrics = ctx.measureText(uName);
            const tagW = textMetrics.width + padding * 2;
            const tagH = fontSize + padding * 2;

            // Alternate sides if many? For now just stack on top left
            const tagX = wx + (index * (tagW + 5 / z)); // Stack horizontally? 
            // User asked for "side by side up there" -> "lado a lado la encima"

            ctx.fillStyle = uColor;
            ctx.fillRect(tagX, wy, tagW, tagH);

            ctx.fillStyle = getContrastColor(uColor);
            ctx.textBaseline = 'top';
            ctx.fillText(uName, tagX + padding, wy + padding);
          });

          ctx.restore();
        });
      }

      // --- ALL CURSORS (Remote + Local with Advanced Physics Engine) ---
      // Get delta time from frame timer for frame-independent animation
      const deltaMs = frameTimer.current.tick();

      // Update local cursor position from mouseWorldPos (for self-visualization)
      localCursorRef.current = { x: mouseWorldPos.x, y: mouseWorldPos.y };

      // Helper function to render a single cursor with physics effects
      const renderCursor = (
        cursorX: number,
        cursorY: number,
        cursorAngle: number,
        cursorColor: string,
        cursorShape: string,
        cursorName: string,
        isLocal: boolean,
        scaleX: number = 1,  // Squash & stretch horizontal
        scaleY: number = 1   // Squash & stretch vertical
      ) => {
        const shape = getCursorShape(cursorShape || 'default');

        ctx.save();
        ctx.translate(cursorX, cursorY);
        ctx.scale(1 / z, 1 / z); // Normalize to screen pixels

        // Apply Rotation (Visual Physics) - not for local cursor
        if (!isLocal) {
          ctx.rotate(cursorAngle);
        }

        // Apply Stretch (Squash & Stretch based on velocity)
        ctx.scale(scaleX, scaleY);

        // Render size for the cursor
        const renderSize = isLocal ? 32 : 38;

        // Try to render the React component first
        if (shape.Component) {
          const cacheKey = `${cursorShape || 'default'}_${cursorColor}_${renderSize}`;
          const img = renderCursorToImage(shape.Component, cursorColor, renderSize, cacheKey);

          if (img && img.complete && img.naturalWidth > 0) {
            ctx.save();
            // Apply simple shadow
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = isLocal ? 3 : 4;
            // Slightly transparent for local cursor
            if (isLocal) ctx.globalAlpha = 0.7;
            // Center the image on the cursor position
            ctx.drawImage(img, -renderSize / 2, -renderSize / 2, renderSize, renderSize);
            ctx.restore();
          }
        } else if (shape.imageUrl) {
          // Fallback to imageUrl for legacy support
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
            img.onload = () => { /* triggers next frame */ };
          }
        } else if (shape.path) {
          // Fallback to path for simple shapes
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

        // Draw Name Badge (not for local cursor)
        if (!isLocal && cursorName) {
          ctx.save();
          ctx.translate(cursorX, cursorY);
          const fontSize = 11;
          ctx.font = `600 ${fontSize / z}px "Inter", sans-serif`;
          ctx.textBaseline = 'middle';
          const textMetrics = ctx.measureText(cursorName);

          // Badge Dimensions
          const paddingX = 6 / z;
          const badgeHeight = (fontSize + 6) / z;
          const badgeWidth = textMetrics.width + (paddingX * 2);

          // Badge Position (Offset from cursor)
          const badgeX = 14 / z;
          const badgeY = 14 / z;

          // Draw Badge Background
          ctx.fillStyle = cursorColor;
          const r = 4 / z;
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
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 4;
          ctx.fill();

          // Draw Name Text
          ctx.fillStyle = getContrastColor(cursorColor);
          ctx.fillText(cursorName, badgeX + paddingX, badgeY + (badgeHeight / 2));

          ctx.restore();
        }
      };

      // Render REMOTE cursors with physics engine
      const cursorsToRender = remoteCursorsRef?.current ? remoteCursorsRef.current : remoteCursors;
      Object.values(cursorsToRender).forEach((cursor: any) => {
        if (cursor.userId === currentUser?.id) return;

        // Check legacy permission (default true)
        const showTrails = props.cursorSettings?.showOthersTrails !== false;

        // Only process server update if position actually changed (prevents teleportation)
        const lastProcessed = lastProcessedCursorsRef.current[cursor.userId];
        const positionChanged = !lastProcessed ||
          lastProcessed.x !== cursor.x ||
          lastProcessed.y !== cursor.y;

        if (positionChanged || cursor.isClicking !== lastProcessed?.isClicking) {
          // Process server update through physics engine (handles prediction + latency)
          cursorEngine.processServerUpdate(cursor.userId, {
            x: cursor.x,
            y: cursor.y,
            timestamp: cursor.timestamp,
            velocityX: cursor.velocityX,
            velocityY: cursor.velocityY,
            isClicking: cursor.isClicking, // For shrink effect
            // Pass new fields to engine
            healthStatus: cursor.healthStatus,
            trailAnimation: cursor.trailAnimation,
            trailColor: cursor.trailColor,
            trailEnabled: cursor.trailEnabled,
            trailCustomImage: cursor.trailCustomImage,
          });
          lastProcessedCursorsRef.current[cursor.userId] = {
            x: cursor.x,
            y: cursor.y,
            isClicking: cursor.isClicking
          };
        }

        // ALWAYS tick physics simulation each frame (spring interpolation)
        cursorEngine.tick(cursor.userId, deltaMs);

        // Get render data from engine
        const renderData = cursorEngine.getRenderData(cursor.userId);
        if (!renderData) return;

        const cursorColor = cursor.userColor || '#fbbf24';
        const now = performance.now();

        // --- RENDER CURSOR TRAIL ---
        if (showTrails && (renderData.trailConfig?.enabled || renderData.healthStatus !== 'healthy')) {
          const trailColor = renderData.trailConfig.color || cursorColor;
          let animation = renderData.trailConfig.animation || 'line';

          // Health Override
          if (renderData.healthStatus === 'bloodied' || renderData.healthStatus === 'unconscious') {
            animation = 'blood'; // Force blood trail
          }

          const history = renderData.trailHistory;
          const trailMaxAge = renderData.healthStatus === 'unconscious' ? 1000 : 400;

          if (animation === 'line') {
            // Smooth Line
            if (history.length > 2) {
              ctx.save();
              ctx.beginPath();
              // Move to oldest point
              const start = history[0];
              ctx.moveTo(start.x, start.y);
              // Draw curves through points
              for (let i = 1; i < history.length - 1; i++) {
                const p0 = history[i];
                const p1 = history[i + 1];
                const midX = (p0.x + p1.x) / 2;
                const midY = (p0.y + p1.y) / 2;
                ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
              }
              // Connect to current position
              ctx.lineTo(renderData.position.x, renderData.position.y);

              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.lineWidth = 4 / z;
              ctx.strokeStyle = adjustAlpha(trailColor, 0.4);
              ctx.stroke();
              // Core
              ctx.lineWidth = 1 / z;
              ctx.strokeStyle = adjustAlpha(trailColor, 0.8);
              ctx.stroke();
              ctx.restore();
            }

          } else if (animation === 'particles' || animation === 'sparkles' || animation === 'smoke' || animation === 'electric') {
            // Particle Systems
            for (let i = 0; i < history.length; i++) {
              const trail = history[i];
              const age = now - trail.time;
              if (age > trailMaxAge) continue;

              const progress = age / trailMaxAge; // 0 to 1
              const alpha = 1 - progress;

              const seed = (trail.time % 100) / 100;
              const size = ((4 + (i * 0.2)) * (1 - progress * 0.5)) / z;

              ctx.save();
              ctx.translate(trail.x, trail.y);
              ctx.fillStyle = trailColor;
              ctx.globalAlpha = alpha * 0.6;

              if (animation === 'sparkles') {
                // Draw Stars
                const rot = progress * Math.PI;
                ctx.rotate(rot);
                ctx.beginPath();
                for (let k = 0; k < 5; k++) {
                  ctx.lineTo(Math.cos((18 + k * 72) / 180 * Math.PI) * size, -Math.sin((18 + k * 72) / 180 * Math.PI) * size);
                  ctx.lineTo(Math.cos((54 + k * 72) / 180 * Math.PI) * size * 0.4, -Math.sin((54 + k * 72) / 180 * Math.PI) * size * 0.4);
                }
                ctx.closePath();
                ctx.fill();
              } else if (animation === 'smoke') {
                // Smoky circles
                const driftY = -age * 0.05 / z; // Rise up
                ctx.translate(0, driftY);
                ctx.beginPath();
                ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
                ctx.fillStyle = '#666666'; // Smoke color
                ctx.fill();
              } else if (animation === 'electric') {
                // Jittery lines
                const jitterX = (Math.random() - 0.5) * 10 / z;
                const jitterY = (Math.random() - 0.5) * 10 / z;
                ctx.translate(jitterX, jitterY);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 1 / z;
                ctx.beginPath(); ctx.moveTo(-size, -size); ctx.lineTo(size, size); ctx.stroke();
              } else {
                // Standard Particles
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            }

          } else if (animation === 'dice') {
            // Falling Dice
            for (let i = 0; i < history.length; i++) {
              const trail = history[i];
              const age = now - trail.time;
              if (age > trailMaxAge * 1.5) continue; // Dice last longer

              const progress = age / (trailMaxAge * 1.5);
              const alpha = 1 - Math.pow(progress, 3);

              // Pseudo-random based on time
              const val = Math.floor((trail.time % 20)) + 1;
              const size = 16 / z;

              ctx.save();
              ctx.translate(trail.x, trail.y);
              // Spin and fall
              ctx.rotate((age * 0.005) + (trail.time % Math.PI));
              ctx.translate(0, age * 0.05 / z); // Gravity

              ctx.globalAlpha = alpha;
              ctx.fillStyle = '#FFFFFF';
              ctx.strokeStyle = trailColor;
              ctx.lineWidth = 1 / z;

              // Hexagon shape
              ctx.beginPath();
              for (let s = 0; s < 6; s++) {
                const angle = 2 * Math.PI / 6 * s;
                ctx.lineTo(size * Math.cos(angle), size * Math.sin(angle));
              }
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Number
              ctx.fillStyle = trailColor;
              ctx.font = `bold ${10 / z}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(val.toString(), 0, 0);

              ctx.restore();
            }

          } else if (animation === 'blood') {
            // Blood drops
            for (let i = 0; i < history.length; i++) {
              const trail = history[i];
              const age = now - trail.time;
              const maxAge = trailMaxAge * 2; // Stays longer
              if (age > maxAge) continue;

              const progress = age / maxAge;
              const alpha = 1 - Math.pow(progress, 0.5); // Fade slow

              // Consistent Random Logic
              const rand = (trail.time % 100) / 100;
              const size = (3 + (rand * 4)) / z;

              ctx.save();
              ctx.translate(trail.x, trail.y);
              // Drip down logic? Or just stay on ground. 
              // "Blood trail" usually stays on ground.
              // But cursor moves fast. Let's make it drip slightly or just static spots.

              ctx.globalAlpha = alpha * 0.8;
              ctx.fillStyle = '#8a0b0b'; // Deep red

              ctx.beginPath();
              ctx.arc(0, 0, size, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }
        ctx.globalAlpha = 1; // Reset alpha

        // Calculate Squash & Stretch from velocity
        const STRETCH_FACTOR = 0.05;
        const velocity = Math.sqrt(renderData.velocity.x ** 2 + renderData.velocity.y ** 2);
        let stretchScaleY = 1 + Math.min(velocity * STRETCH_FACTOR, 0.5);
        let stretchScaleX = 1 - Math.min(velocity * STRETCH_FACTOR * 0.5, 0.2);

        // Apply click scale effect (shrink when clicking)
        if (renderData.isClicking) {
          stretchScaleX *= 0.6;
          stretchScaleY *= 0.6;
        }

        renderCursor(
          renderData.position.x,
          renderData.position.y,
          renderData.angle,
          cursorColor,
          cursor.userShape || 'default',
          cursor.userName || '?',
          false,
          stretchScaleX,
          stretchScaleY
        );

        // --- GESTURE & TOOL OVERLAYS ---
        // Context Menu Indicator (Gear/Menu icon)
        if (renderData.isContexting) {
          ctx.save();
          ctx.translate(renderData.position.x + 15 / z, renderData.position.y - 15 / z);
          ctx.scale(1 / z, 1 / z);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 4;
          // Draw simple gear/menu shape
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#333333';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.stroke();
          // 3 dots
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(-4, 0, 1.5, 0, Math.PI * 2);
          ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
          ctx.arc(4, 0, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Active Tool Indicator
        const activeTool = renderData.activeTool;
        if (activeTool && activeTool !== 'select' && activeTool !== 'pan' && activeTool !== 'combat') {
          ctx.save();
          ctx.translate(renderData.position.x + 15 / z, renderData.position.y + 15 / z);
          ctx.scale(1 / z, 1 / z);

          const iconChar = getToolIcon(activeTool);
          if (iconChar && iconChar !== '🔧') { // Don't show default wrench if not recognized or generic
            ctx.font = '20px sans-serif';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 3;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(iconChar, 0, 0);
          }
          else if (activeTool === 'wand') { // Explicit fallback for wand if not in toolIcons (it is, but just safe)
            ctx.font = '20px sans-serif';
            ctx.fillText('✨', 0, 0);
          }
          ctx.restore();
        }

        // Status Indicator (Chat or Combat)
        // Priority: Chat > Combat
        // Position: Top-Left (mirroring CustomCursor)
        if (renderData.isChatting || activeTool === 'combat') {
          ctx.save();
          ctx.translate(renderData.position.x - 15 / z, renderData.position.y - 15 / z);
          ctx.scale(1 / z, 1 / z);

          const statusIcon = renderData.isChatting ? '💬' : '⚔️';

          ctx.font = '16px sans-serif';
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 3;
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(statusIcon, 0, 0);

          ctx.restore();
        }
      });

      // Local cursor is now handled by CustomCursor DOM component
      // (See MapCanvas.tsx CustomCursor with physics animation)

      // --- CURSOR COLLISION DETECTION & EXPLOSION ---
      // Check collision explosion setting
      if (props.cursorSettings?.explosionOnCollision !== false) {

        // Collect all cursor positions (remote only for now)
        const cursorPositions: { id: string; x: number; y: number; color: string; }[] = [];
        Object.values(remoteCursors).forEach((cursor: any) => {
          if (cursor.userId === currentUser?.id) return;
          const renderData = cursorEngine.getRenderData(cursor.userId);
          if (renderData) {
            cursorPositions.push({
              id: cursor.userId,
              x: renderData.position.x,
              y: renderData.position.y,
              color: cursor.userColor || '#fbbf24',
            });
          }
        });

        // Add local cursor if user exists
        if (currentUser) {
          cursorPositions.push({
            id: currentUser.id,
            x: mouseWorldPos.x,
            y: mouseWorldPos.y,
            color: permissions?.cursorOverrides?.[currentUser.id]?.color || props.cursorSettings?.color || '#3b82f6',
          });
        }

        // Check for collisions and create explosions
        const COLLISION_DISTANCE = 50 / z; // 50 screen pixels
        const EXPLOSION_COOLDOWN = 800; // ms
        const collisionTime = performance.now();

        for (let i = 0; i < cursorPositions.length; i++) {
          for (let j = i + 1; j < cursorPositions.length; j++) {
            const a = cursorPositions[i];
            const b = cursorPositions[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);

            if (dist < COLLISION_DISTANCE) {
              const collisionKey = [a.id, b.id].sort().join('_');
              const lastCollision = cursorCollisionsRef.current.get(collisionKey) || 0;

              if (collisionTime - lastCollision > EXPLOSION_COOLDOWN) {
                cursorCollisionsRef.current.set(collisionKey, collisionTime);
                // Add explosion at midpoint
                cursorExplosionsRef.current.push({
                  x: (a.x + b.x) / 2,
                  y: (a.y + b.y) / 2,
                  time: collisionTime,
                  colors: [a.color, b.color],
                });
              }
            }
          }
        }

        // Render active explosions
        const explosions = cursorExplosionsRef.current;
        const EXPLOSION_DURATION = 600; // ms
        for (let i = explosions.length - 1; i >= 0; i--) {
          const exp = explosions[i];
          const age = collisionTime - exp.time;
          if (age > EXPLOSION_DURATION) {
            explosions.splice(i, 1);
            continue;
          }

          const progress = age / EXPLOSION_DURATION;
          const alpha = 1 - progress;
          const radius = (20 + progress * 60) / z;

          // Draw expanding rings
          for (let ring = 0; ring < 3; ring++) {
            const ringProgress = Math.max(0, progress - ring * 0.15);
            const ringRadius = (10 + ringProgress * 50) / z;
            const ringAlpha = (1 - ringProgress) * 0.6;

            ctx.beginPath();
            ctx.arc(exp.x, exp.y, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = exp.colors[ring % exp.colors.length];
            ctx.globalAlpha = ringAlpha;
            ctx.lineWidth = 3 / z;
            ctx.stroke();
          }

          // Draw particle burst
          const particleCount = 12;
          for (let p = 0; p < particleCount; p++) {
            const angle = (p / particleCount) * Math.PI * 2;
            const dist = radius * progress * 1.5;
            const px = exp.x + Math.cos(angle) * dist;
            const py = exp.y + Math.sin(angle) * dist;
            const pSize = (4 - progress * 3) / z;

            ctx.beginPath();
            ctx.arc(px, py, Math.max(0.5, pSize), 0, Math.PI * 2);
            ctx.fillStyle = exp.colors[p % exp.colors.length];
            ctx.globalAlpha = alpha * 0.8;
            ctx.fill();
          }
        }
      } // End explosion check
      ctx.globalAlpha = 1;

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
    props.isModalOpen // CRITICAL: Must be in deps for throttle to work when modal opens
  ]);
};
