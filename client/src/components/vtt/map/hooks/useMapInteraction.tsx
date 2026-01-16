import React, { useEffect } from 'react';
import { MapCanvasProps, DragState } from '../types';
import { useGameSession } from '../../../../context/GameSessionContext';
import { useModal } from '../../../../context/ModalContext';
import { findPath } from '../../../../utils/pathfinding';
import { getContourFromPoint } from '../../../../utils/imageProcessing';
import { isPointInPolygon, distanceToSegment } from '../../../../utils/geometry';
import { AudioZoneConfigModalContent, TriggerZoneConfigModalContent } from '../modals';
import { AudioZone, TriggerZone, MapDrawing } from '../../../../types';
import { socketService } from '../../../../services/socketService';

interface UseMapInteractionProps extends MapCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  mouseWorldPos: { x: number, y: number; };
  setMouseWorldPos: (p: { x: number, y: number; }) => void;
  dragState: React.RefObject<DragState>;
  isPanning: boolean;
  setIsPanning: (b: boolean) => void;
  fogRectStart: { x: number, y: number; } | null;
  setFogRectStart: (p: { x: number, y: number; } | null) => void;
  currentFogRect: { x: number, y: number, w: number, h: number; } | null;
  setCurrentFogRect: (r: { x: number, y: number, w: number, h: number; } | null) => void;
  hoveredTokenId: string | null;
  setHoveredTokenId: (id: string | null) => void;
  setIsTokenDragging: (b: boolean) => void;
  setHoveredObstacleId: (id: string | null) => void;
  calculatedPath: { x: number, y: number; }[];
  setCalculatedPath: (path: { x: number, y: number; }[]) => void;
  draggedAttackZone: { id: string, startX: number, startY: number, originX: number, originY: number, rotating?: boolean; } | null;
  setDraggedAttackZone: (z: { id: string, startX: number, startY: number, originX: number, originY: number, rotating?: boolean; } | null) => void;
  liveDrawingPointsRef: React.RefObject<{ x: number, y: number; }[]>;
  isDrawingRef: React.RefObject<boolean>;
  emitTokenDrag?: (id: string, x: number, y: number, path: { x: number, y: number; }[]) => void;
  emitCursorMove: (x: number, y: number, forceImmediate?: boolean) => void;
  lastCursorEmit: React.RefObject<number>;
  lastMousePos: React.RefObject<{ x: number, y: number; }>;
  hoverOpenTimerRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  hoverCloseTimerRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  imageCache: { [src: string]: HTMLImageElement; };
  clickAnimationsRef?: React.RefObject<{ x: number, y: number, color: string, style?: 'ripple' | 'burst' | 'sparkle' | 'pulse' | 'vortex' | 'shard' | 'ring' | 'echo' | 'orb', startTime: number; }[]>;
  // PERFORMANCE: Ref for immediate viewport updates without React re-render
  viewportRef?: React.RefObject<{ x: number, y: number, zoom: number; }>;
  // PERFORMANCE: Ref for immediate mouse position (avoids React state batching lag)
  mouseWorldPosRef?: React.RefObject<{ x: number, y: number; }>;
  // DOM-based screen-position click animation callback
  addScreenClickAnimation?: (screenX: number, screenY: number, color: string, style: string) => void;
}

export const useMapInteraction = (props: UseMapInteractionProps) => {
  const {
    canvasRef, scene, tokens, viewport, isGM, activeTool, movementPath, drawingObstacle, draftPolyPoints, selectedTokenIds,
    permissions, campaign, setViewport, moveToken, moveTokens, updateFog, setActiveTool, onTokenContextMenu, onMapContextMenu,
    setMovementPath, addObstacles, updateObstacle, setDrawingObstacle, setDrawingLightZone, addLightZones, setDrawingAudioZone,
    addAudioZones, setDrawingTriggerZone, addTriggerZones, removeTriggerZone, setDraftPolyPoints, selectToken, clearSelection,
    emitTokenDrag, emitCursorMove, drawingLightZone, drawingAudioZone, drawingTriggerZone, attackZoneResults, onAttackZoneContextMenu,
    onUpdateAttackZone, mouseWorldPos, setMouseWorldPos, dragState, isPanning, setIsPanning, fogRectStart, setFogRectStart,
    currentFogRect, setCurrentFogRect, hoveredTokenId, setHoveredTokenId, setIsTokenDragging, setHoveredObstacleId, setCalculatedPath,
    draggedAttackZone, setDraggedAttackZone, liveDrawingPointsRef, isDrawingRef, lastCursorEmit, lastMousePos,
    hoverOpenTimerRef, hoverCloseTimerRef, imageCache, currentUser, wandSettings,
    // Attack Zone Placement Mode
    isPlacingAttackZone, onUpdatePreviewOrigin, onConfirmAttackZonePlacement, onCancelAttackZonePlacement
  } = props;

  const {
    removeObstacle, ui, audioSettings, removeAudioZone, handouts, addDrawing, removeDrawing, drawingSettings,
    rulerSettings, permissionHelper, setCursorClickState, setDragging, updateMapSettings
  } = useGameSession(); // Added updateMapSettings
  const { openModal, closeModal } = useModal();

  // Grid Alignment Refs
  const gridDragState = React.useRef({ isDragging: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });
  const alignPointsRef = React.useRef<{ x: number, y: number; }[]>([]);

  // Timer for delayed "pressing" state (distinguish click vs hold)
  const pressingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDrawingTool = ['draw-wall', 'draw-door', 'draw-window', 'fog-poly', 'fog-rect', 'measure-path', 'eraser', 'draw-light-rect', 'draw-light-poly', 'draw-audio-rect', 'draw-audio-poly', 'eraser-audio', 'draw-trigger-rect', 'draw-trigger-poly', 'eraser-trigger', 'brush', 'eraser-drawing', 'smart-wall'].includes(activeTool);

  const getMousePos = (e: React.MouseEvent | React.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const screenToWorld = (screenX: number, screenY: number) => ({
    x: (screenX - viewport.x) / viewport.zoom,
    y: (screenY - viewport.y) / viewport.zoom,
  });

  const findTokenAt = (worldX: number, worldY: number) => {
    if (!scene) return null;
    const gridSize = scene.grid.size;

    // Filter tokens at position
    const tokensAtPos = tokens.filter(t =>
      worldX >= t.x * gridSize && worldX < (t.x + t.size) * gridSize &&
      worldY >= t.y * gridSize && worldY < (t.y + t.size) * gridSize
    );

    if (tokensAtPos.length === 0) return null;
    if (tokensAtPos.length === 1) return tokensAtPos[0];

    // Prioritize controllable tokens (GM sees all, players see their own first)
    const controllable = tokensAtPos.filter(t =>
      isGM || t.ownerId === currentUser?.id || t.controlledBy?.includes(currentUser?.id || '')
    );

    // Return last controllable (top layer) or last non-controllable
    if (controllable.length > 0) return controllable[controllable.length - 1];
    return tokensAtPos[tokensAtPos.length - 1];
  };

  const findObstacleAt = (worldX: number, worldY: number) => {
    if (!scene || !scene.obstacles) return null;
    const clickRadius = 10 / viewport.zoom;
    const p = { x: worldX, y: worldY };
    return scene.obstacles.find(obs => {
      if (obs.type === 'wall') {
        if (!obs.points || obs.points.length < 2) return false;
        for (let i = 0; i < obs.points.length; i++) {
          if (obs.open && i === obs.points.length - 1) continue;
          const p1 = obs.points[i];
          const p2 = obs.points[(i + 1) % obs.points.length];
          if (!p1 || !p2) continue;
          if (distanceToSegment(p, p1, p2) < clickRadius) return true;
        }
        return false;
      } else {
        if (!obs.p1 || !obs.p2) return false;
        return distanceToSegment(p, obs.p1, obs.p2) < clickRadius;
      }
    });
  };

  const findAudioZoneAt = (worldX: number, worldY: number): AudioZone | null => {
    if (!scene || !scene.audioZones) return null;
    const p = { x: worldX, y: worldY };
    for (let i = scene.audioZones.length - 1; i >= 0; i--) {
      const zone = scene.audioZones[i];
      if (zone.type === 'rect' && zone.rect) {
        const { x, y, w, h } = zone.rect;
        const x1 = Math.min(x, x + w); const x2 = Math.max(x, x + w);
        const y1 = Math.min(y, y + h); const y2 = Math.max(y, y + h);
        if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) return zone;
      } else if (zone.type === 'polygon' && zone.points) {
        if (isPointInPolygon(p, zone.points)) return zone;
      }
    }
    return null;
  };

  const findTriggerZoneAt = (worldX: number, worldY: number): TriggerZone | null => {
    if (!scene || !scene.triggerZones) return null;
    const p = { x: worldX, y: worldY };
    for (let i = scene.triggerZones.length - 1; i >= 0; i--) {
      const zone = scene.triggerZones[i];
      if (zone.type === 'rect' && zone.rect) {
        const { x, y, w, h } = zone.rect;
        const x1 = Math.min(x, x + w); const x2 = Math.max(x, x + w);
        const y1 = Math.min(y, y + h); const y2 = Math.max(y, y + h);
        if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) return zone;
      } else if (zone.type === 'polygon' && zone.points) {
        if (isPointInPolygon(p, zone.points)) return zone;
      }
    }
    return null;
  };

  const findDrawingAt = (worldX: number, worldY: number): MapDrawing | null => {
    if (!scene || !scene.drawings) return null;
    const clickRadius = 10 / viewport.zoom;
    const p = { x: worldX, y: worldY };

    for (let i = scene.drawings.length - 1; i >= 0; i--) {
      const drawing = scene.drawings[i];
      if (drawing.points.length < 2) continue;

      for (let j = 0; j < drawing.points.length - 1; j++) {
        const p1 = drawing.points[j];
        const p2 = drawing.points[j + 1];
        if (distanceToSegment(p, p1, p2) < Math.max(clickRadius, drawing.width / 2)) {
          return drawing;
        }
      }
    }
    return null;
  };

  const findAttackZoneAt = (worldX: number, worldY: number) => {
    if (!attackZoneResults || attackZoneResults.length === 0) return null;
    const tolerance = 20 / viewport.zoom;
    for (const result of attackZoneResults) {
      const origin = result.config.origin;
      const dist = Math.hypot(worldX - origin.x, worldY - origin.y);
      if (dist <= tolerance) {
        return result.config;
      }
    }
    return null;
  };

  const openAudioZoneConfigModal = (onSaveConfig: (config: { audioUrl: string; volume: number; radius: number; }) => void) => {
    openModal(<AudioZoneConfigModalContent audioSettings={audioSettings} onSave={onSaveConfig} onClose={closeModal} />, { title: 'Configurar Zona de Áudio', size: 'md' });
  };

  const openTriggerZoneConfigModal = (onSaveConfig: (handoutId: string) => void) => {
    openModal(<TriggerZoneConfigModalContent handouts={handouts} onSave={onSaveConfig} onClose={closeModal} />, { title: 'Configurar Gatilho', size: 'sm' });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const worldPos = screenToWorld(pos.x, pos.y);

    // PERFORMANCE: Update ref immediately for render loop
    if (props.mouseWorldPosRef) {
      props.mouseWorldPosRef.current = worldPos;
    }
    setMouseWorldPos(worldPos);

    // Attack Zone Placement Mode - preview follows mouse
    if (isPlacingAttackZone && onUpdatePreviewOrigin) {
      onUpdatePreviewOrigin(worldPos);
      lastMousePos.current = pos;
      // Don't return - still emit cursor and allow other hover behaviors
    }

    if (draggedAttackZone) {
      if (draggedAttackZone.rotating) {
        // Rotation mode: calculate angle from origin to current mouse position
        const angle = Math.atan2(
          worldPos.y - draggedAttackZone.originY,
          worldPos.x - draggedAttackZone.originX
        );
        if (onUpdateAttackZone) {
          onUpdateAttackZone(draggedAttackZone.id, { direction: angle });
        }
      } else {
        // Movement mode: update origin position
        const dx = worldPos.x - draggedAttackZone.startX;
        const dy = worldPos.y - draggedAttackZone.startY;
        const newOrigin = { x: draggedAttackZone.originX + dx, y: draggedAttackZone.originY + dy };
        if (onUpdateAttackZone) { onUpdateAttackZone(draggedAttackZone.id, { origin: newOrigin }); }
      }
      lastMousePos.current = pos;
      return;
    }

    // Grid Alignment Drag Logic
    if (activeTool === 'map-align-drag' && gridDragState.current.isDragging && scene) {
      const dx = worldPos.x - gridDragState.current.startX;
      const dy = worldPos.y - gridDragState.current.startY;
      const newOffsetX = gridDragState.current.startOffsetX + dx;
      const newOffsetY = gridDragState.current.startOffsetY + dy;

      // EMIT LOCAL UPDATE to UI (MapAlignerTool) which will then emit PREVIEW to Renderer
      // This keeps UI in sync and Renderer updating at 60fps without Network lag.
      window.dispatchEvent(new CustomEvent('questbinder:grid-local-update', {
        detail: { offsetX: newOffsetX, offsetY: newOffsetY }
      }));

      // Also emit preview directly to ensure smoothness if UI reacts slowly
      window.dispatchEvent(new CustomEvent('questbinder:grid-preview', {
        detail: { size: scene.grid.size, offsetX: newOffsetX, offsetY: newOffsetY }
      }));
      return;
    }

    const now = Date.now();
    if (now - lastCursorEmit.current > 50 && !dragState.current.isDragging) {
      emitCursorMove(worldPos.x, worldPos.y);
      lastCursorEmit.current = now;
    }

    if (isPanning) {
      const dx = pos.x - lastMousePos.current.x;
      const dy = pos.y - lastMousePos.current.y;
      // PERFORMANCE: Use ref for immediate update without React re-render
      if (props.viewportRef) {
        props.viewportRef.current.x += dx;
        props.viewportRef.current.y += dy;
      } else {
        // Fallback to setState if ref not available
        setViewport({ x: viewport.x + dx, y: viewport.y + dy });
      }
      lastMousePos.current = pos;
      return;
    }

    if ((activeTool === 'brush' || activeTool === 'freehand-wall') && isDrawingRef.current) {
      const currentPoints = liveDrawingPointsRef.current;
      if (currentPoints.length > 0) {
        const lastPoint = currentPoints[currentPoints.length - 1];
        const dist = Math.hypot(worldPos.x - lastPoint.x, worldPos.y - lastPoint.y);
        if (dist > 5 / viewport.zoom) { liveDrawingPointsRef.current.push(worldPos); }
      } else {
        liveDrawingPointsRef.current.push(worldPos);
      }
      lastMousePos.current = pos;
      return;
    }

    if (dragState.current.isDragging && dragState.current.token) {
      const gridSize = scene?.grid.size || 70;
      const newGridX = Math.round((worldPos.x - dragState.current.offset.x) / gridSize);
      const newGridY = Math.round((worldPos.y - dragState.current.offset.y) / gridSize);

      if (newGridX !== dragState.current.lastCheckedGridX || newGridY !== dragState.current.lastCheckedGridY) {
        dragState.current.lastCheckedGridX = newGridX;
        dragState.current.lastCheckedGridY = newGridY;
        const startPoint = { x: dragState.current.token.x, y: dragState.current.token.y };
        const endPoint = { x: newGridX, y: newGridY };
        const path = findPath(startPoint, endPoint, scene!.grid, scene!.obstacles);
        setCalculatedPath(path);
        if (emitTokenDrag) { emitTokenDrag(dragState.current.token.id, newGridX, newGridY, path); }
      }
      lastMousePos.current = pos;
      return;
    }

    if (fogRectStart || (drawingLightZone?.type === 'rect' && drawingLightZone.p1) || (drawingAudioZone?.type === 'rect' && drawingAudioZone.p1) || (drawingTriggerZone?.type === 'rect' && drawingTriggerZone.p1)) {
      const start = fogRectStart || drawingLightZone?.p1 || drawingAudioZone?.p1 || drawingTriggerZone?.p1;
      if (start) {
        setCurrentFogRect({ x: start.x, y: start.y, w: worldPos.x - start.x, h: worldPos.y - start.y });
      }
      lastMousePos.current = pos;
      return;
    }

    if (!isDrawingTool && !dragState.current.isDragging) {
      const token = findTokenAt(worldPos.x, worldPos.y);
      if (token) {
        if (hoverCloseTimerRef.current) { clearTimeout(hoverCloseTimerRef.current); hoverCloseTimerRef.current = null; }
        if (hoveredTokenId !== token.id) { setHoveredTokenId(token.id); }
      } else {
        if (hoveredTokenId && !hoverCloseTimerRef.current) {
          hoverCloseTimerRef.current = setTimeout(() => { setHoveredTokenId(null); hoverCloseTimerRef.current = null; }, 300);
        }
      }
      const obs = findObstacleAt(worldPos.x, worldPos.y);
      setHoveredObstacleId(obs ? obs.id : null);
    }
    lastMousePos.current = pos;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getMousePos(e);
    lastMousePos.current = pos;
    let worldPos = screenToWorld(pos.x, pos.y);

    // --- TRIGGER CLICK ANIMATION ---
    // Precision Mode: Skip click animations when grid align tools are active
    if ((e.button === 0 || e.button === 2) && props.clickAnimationsRef && !activeTool.startsWith('map-align')) {
      const isLeft = e.button === 0;
      const defaultColor = isLeft ? '#3b82f6' : '#f59e0b';

      // Check for GM override first, then user settings, then defaults
      const myOverride = currentUser ? permissions?.cursorOverrides?.[currentUser.id] : undefined;

      const customColor = isLeft
        ? (myOverride?.clickColorLeft || props.cursorSettings?.clickColorLeft)
        : (myOverride?.clickColorRight || props.cursorSettings?.clickColorRight);
      const color = customColor || defaultColor;
      const style = (myOverride?.clickAnimation || props.cursorSettings?.clickAnimation || 'ripple') as 'ripple' | 'burst' | 'sparkle' | 'pulse' | 'vortex' | 'shard' | 'ring' | 'echo' | 'orb';

      props.clickAnimationsRef.current.push({ x: worldPos.x, y: worldPos.y, color, style, startTime: Date.now() });

      // Broadcast to other users
      if (currentUser) {
        socketService.emit('cursor:click', { userId: currentUser.id, x: worldPos.x, y: worldPos.y, color, style });
      }
    }

    // Attack Zone Placement Mode - left click confirms, right click cancels
    if (isPlacingAttackZone) {
      if (e.button === 0 && onConfirmAttackZonePlacement) {
        onConfirmAttackZonePlacement();
        return;
      }
      if (e.button === 2 && onCancelAttackZonePlacement) {
        onCancelAttackZonePlacement();
        return;
      }
    }

    if (activeTool === 'measure-path' && rulerSettings.snapToGrid && scene) {
      const gridSize = scene.grid.size;
      const gx = Math.floor(worldPos.x / gridSize);
      const gy = Math.floor(worldPos.y / gridSize);
      worldPos = { x: gx * gridSize + gridSize / 2, y: gy * gridSize + gridSize / 2 };
    }

    // Grid Alignment Interactions
    if (activeTool === 'map-align-drag') {
      if (scene) {
        gridDragState.current = {
          isDragging: true,
          startX: worldPos.x,
          startY: worldPos.y,
          startOffsetX: scene.grid.offsetX || 0,
          startOffsetY: scene.grid.offsetY || 0
        };
      }
      return;
    }

    if (activeTool === 'map-align-3point') {
      // If we already have 3 points, we are waiting for confirmation. Do not add more points.
      if (alignPointsRef.current.length < 3) {
        alignPointsRef.current.push(worldPos);
      }
      return;
    }

    const clickedToken = findTokenAt(worldPos.x, worldPos.y);
    const clickedObstacle = findObstacleAt(worldPos.x, worldPos.y);
    const clickedAudioZone = findAudioZoneAt(worldPos.x, worldPos.y);
    const clickedTriggerZone = findTriggerZoneAt(worldPos.x, worldPos.y);
    const clickedDrawing = findDrawingAt(worldPos.x, worldPos.y);
    const clickedAttackZone = findAttackZoneAt(worldPos.x, worldPos.y);

    // Notify usage of click for remote cursor feedback
    // Logic: Only trigger "pressing" (shrink effect) if held for 200ms
    // This avoids visual noise on quick clicks
    if (pressingTimerRef.current) clearTimeout(pressingTimerRef.current);
    pressingTimerRef.current = setTimeout(() => {
      setCursorClickState(true);
    }, 200);

    if (e.button === 1 || (e.button === 0 && (e.metaKey || e.ctrlKey))) { setIsPanning(true); return; }

    if (e.button === 2) {
      e.stopPropagation();
      if (dragState.current.isDragging) {
        dragState.current.isDragging = false;
        setIsTokenDragging(false);
        setDragging?.(false); // Remote cursor visibility
        dragState.current.token = null;
        setCalculatedPath([]);
        return;
      }
      if (draggedAttackZone) { setDraggedAttackZone(null); return; }

      if (isGM) {
        if (clickedAttackZone && onAttackZoneContextMenu) { onAttackZoneContextMenu(e, clickedAttackZone.id); return; }
        if (clickedAudioZone) { onMapContextMenu(e, worldPos.x, worldPos.y, undefined, undefined, clickedAudioZone.id); return; }
        if (clickedTriggerZone) { onMapContextMenu(e, worldPos.x, worldPos.y, undefined, clickedTriggerZone.id); return; }
      }

      if (['draw-wall', 'fog-poly', 'draw-light-poly', 'draw-audio-poly', 'draw-trigger-poly'].includes(activeTool) && draftPolyPoints.length > 0) {
        const minPoints = activeTool === 'draw-wall' ? 2 : 3;
        if (draftPolyPoints.length >= minPoints) {
          if (activeTool === 'draw-wall') { addObstacles([{ type: 'wall', points: [...draftPolyPoints], blocksVision: true, blocksMovement: true, open: true }]); }
          else if (activeTool === 'draw-light-poly') { addLightZones([{ type: 'polygon', points: [...draftPolyPoints], brightness: 1.0, color: '#ffffff' }]); }
          else if (activeTool === 'draw-audio-poly') { openAudioZoneConfigModal(config => { addAudioZones([{ type: 'polygon', points: [...draftPolyPoints], ...config }]); }); }
          else if (activeTool === 'draw-trigger-poly') { openTriggerZoneConfigModal(handoutId => { addTriggerZones([{ type: 'polygon', points: [...draftPolyPoints], handoutId }]); }); }
          else {
            let pathString = `M${draftPolyPoints[0].x},${draftPolyPoints[0].y}`;
            for (let i = 1; i < draftPolyPoints.length; i++) pathString += ` L${draftPolyPoints[i].x},${draftPolyPoints[i].y}`;
            pathString += " Z";
            updateFog(scene?.fogPath + ' ' + pathString);
          }
        }
        setDraftPolyPoints([]);
        return;
      }

      if (activeTool === 'measure-path' && movementPath.length > 0) { setMovementPath([]); return; }
      if (drawingObstacle || drawingLightZone || drawingAudioZone || drawingTriggerZone) { setDrawingObstacle(null); setDrawingLightZone(null); setDrawingAudioZone(null); setDrawingTriggerZone(null); return; }
      if (activeTool !== 'select') { setActiveTool('select'); return; }
      if (activeTool === 'select') { if (clickedToken) { onTokenContextMenu(e, clickedToken.id); } else { onMapContextMenu(e, worldPos.x, worldPos.y, clickedObstacle?.id); } }
      return;
    }

    if (e.button === 0) {
      if (activeTool === 'brush' || activeTool === 'freehand-wall') {
        isDrawingRef.current = true;
        liveDrawingPointsRef.current = [worldPos];
        return;
      }

      if (activeTool === 'smart-wall' && scene) {
        const img = imageCache[scene.imageUrl];
        if (img) {
          const mapWidth = scene.grid.size * scene.grid.cols;
          const mapHeight = scene.grid.size * scene.grid.rows;
          const scaleX = img.naturalWidth / mapWidth;
          const scaleY = img.naturalHeight / mapHeight;
          const ix = Math.floor(worldPos.x * scaleX);
          const iy = Math.floor(worldPos.y * scaleY);
          try {
            const contour = getContourFromPoint(
              img,
              ix,
              iy,
              wandSettings.tolerance,
              wandSettings.resolution,
              wandSettings.simplification
            );
            if (contour.length > 2) {
              const worldContour = contour.map(p => ({ x: p.x / scaleX, y: p.y / scaleY }));
              addObstacles([{ type: 'wall', points: worldContour, blocksVision: true, blocksMovement: true, open: false }]);
            }
          } catch (e) { console.error("Smart wall error:", e); }
        }
        return;
      }

      if (activeTool === 'eraser-drawing') {
        if (clickedDrawing && permissionHelper.canDeleteDrawing(clickedDrawing.userId)) { removeDrawing(clickedDrawing.id); }
        return;
      }
      if (activeTool === 'eraser-trigger' && isGM) { if (clickedTriggerZone) { removeTriggerZone(clickedTriggerZone.id); } return; }
      if (activeTool === 'eraser-audio' && isGM) { if (clickedAudioZone) { removeAudioZone(clickedAudioZone.id); } return; }
      if (activeTool === 'eraser' && isGM) { if (clickedObstacle) { removeObstacle(clickedObstacle.id); setHoveredObstacleId(null); } return; }

      if (clickedObstacle && activeTool === 'select' && ['door', 'window'].includes(clickedObstacle.type)) {
        if (permissionHelper.canAsGMOr('doorControl')) {
          const isOpen = !clickedObstacle.blocksMovement;
          const newOpen = !isOpen;
          updateObstacle(clickedObstacle.id, { blocksMovement: !newOpen, blocksVision: clickedObstacle.type === 'door' ? !newOpen : false });
          return;
        } else { console.warn('[MapCanvas] Door control denied - no permission'); }
      }

      if (activeTool === 'measure-path') {
        const p = worldPos;
        setMovementPath(movementPath.length === 0 ? [p] : [...movementPath, p]);
        return;
      }

      if (activeTool === 'fog-rect') { if (isGM) setFogRectStart(worldPos); return; }
      if (activeTool === 'draw-light-rect') { if (isGM) setDrawingLightZone({ type: 'rect', p1: worldPos }); return; }
      if (activeTool === 'draw-audio-rect') { if (isGM) setDrawingAudioZone({ type: 'rect', p1: worldPos }); return; }
      if (activeTool === 'draw-trigger-rect') { if (isGM) setDrawingTriggerZone({ type: 'rect', p1: worldPos }); return; }

      if (['fog-poly', 'draw-wall', 'draw-light-poly', 'draw-audio-poly', 'draw-trigger-poly'].includes(activeTool)) {
        if (draftPolyPoints.length > 0) {
          const start = draftPolyPoints[0];
          const dist = Math.hypot(worldPos.x - start.x, worldPos.y - start.y);
          if (dist < 15 / viewport.zoom) {
            const minPoints = activeTool === 'draw-wall' ? 2 : 3;
            if (draftPolyPoints.length >= minPoints) {
              if (activeTool === 'draw-wall') { addObstacles([{ type: 'wall', points: [...draftPolyPoints], blocksVision: true, blocksMovement: true, open: false }]); }
              else if (activeTool === 'draw-light-poly') { addLightZones([{ type: 'polygon', points: [...draftPolyPoints], brightness: 1.0, color: '#ffffff' }]); }
              else if (activeTool === 'draw-audio-poly') { openAudioZoneConfigModal(config => { addAudioZones([{ type: 'polygon', points: [...draftPolyPoints], ...config }]); }); }
              else if (activeTool === 'draw-trigger-poly') { openTriggerZoneConfigModal(handoutId => { addTriggerZones([{ type: 'polygon', points: [...draftPolyPoints], handoutId }]); }); }
              else if (activeTool === 'fog-poly') {
                let pathString = `M${draftPolyPoints[0].x},${draftPolyPoints[0].y}`;
                for (let i = 1; i < draftPolyPoints.length; i++) pathString += ` L${draftPolyPoints[i].x},${draftPolyPoints[i].y}`;
                pathString += " Z";
                updateFog(scene?.fogPath + ' ' + pathString);
              }
            }
            setDraftPolyPoints([]);
            return;
          }
        }
        setDraftPolyPoints([...draftPolyPoints, worldPos]);
        return;
      }

      if (['draw-door', 'draw-window'].includes(activeTool)) { setDrawingObstacle({ type: activeTool === 'draw-door' ? 'door' : 'window', p1: worldPos }); return; }

      if (isGM && clickedAttackZone && activeTool === 'select') {
        // Shift+drag = rotation mode for cones/lines
        const isRotating = e.shiftKey && (clickedAttackZone.shape === 'cone' || clickedAttackZone.shape === 'line');
        setDraggedAttackZone({
          id: clickedAttackZone.id,
          startX: worldPos.x,
          startY: worldPos.y,
          originX: clickedAttackZone.origin.x,
          originY: clickedAttackZone.origin.y,
          rotating: isRotating
        });
        return;
      }

      if (clickedToken) {
        const alreadySelected = selectedTokenIds?.includes(clickedToken.id);
        if (e.shiftKey) { if (selectToken) selectToken(clickedToken.id, true); }
        else if (!alreadySelected && selectToken && clearSelection) { clearSelection(); selectToken(clickedToken.id, false); }

        const isController = clickedToken.controlledBy?.includes(currentUser?.id || '');
        if (isGM || isController) {
          if (!permissionHelper.canMoveToken(clickedToken)) {
            console.warn('[MapCanvas] Token movement denied');
            return;
          }
          dragState.current.isDragging = true;
          setIsTokenDragging(true);
          setDragging?.(true); // Remote cursor visibility
          dragState.current.token = clickedToken;
          dragState.current.dragStartX = pos.x;
          dragState.current.dragStartY = pos.y;
          const gridSize = scene?.grid.size || 70;
          dragState.current.offset = { x: worldPos.x - clickedToken.x * gridSize, y: worldPos.y - clickedToken.y * gridSize };
          dragState.current.lastValidGridX = clickedToken.x;
          dragState.current.lastValidGridY = clickedToken.y;
          dragState.current.lastCheckedGridX = clickedToken.x;
          dragState.current.lastCheckedGridY = clickedToken.y;
          setCalculatedPath([{ x: clickedToken.x, y: clickedToken.y }]);
          let tokensToDrag = [clickedToken];
          if (selectedTokenIds && selectedTokenIds.includes(clickedToken.id) && selectedTokenIds.length > 1) {
            tokensToDrag = tokens.filter(t => selectedTokenIds.includes(t.id));
          }
          dragState.current.draggedGroup = tokensToDrag.map(t => ({ id: t.id, offsetX: worldPos.x - t.x * gridSize, offsetY: worldPos.y - t.y * gridSize, startGridX: t.x, startGridY: t.y }));
        }
        return;
      }
      if (!isDrawingTool) { setIsPanning(true); }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Remote cursor click release logic - ALWAYS execute first
    if (pressingTimerRef.current) {
      clearTimeout(pressingTimerRef.current);
      pressingTimerRef.current = null;
    }
    setCursorClickState(false);

    if (isPanning) { setIsPanning(false); return; }

    if (draggedAttackZone) { setDraggedAttackZone(null); return; }

    // Commit Fog Rect
    if (activeTool === 'fog-rect' && fogRectStart && currentFogRect) {
      const x = currentFogRect.w < 0 ? currentFogRect.x + currentFogRect.w : currentFogRect.x;
      const y = currentFogRect.h < 0 ? currentFogRect.y + currentFogRect.h : currentFogRect.y;
      const w = Math.abs(currentFogRect.w);
      const h = Math.abs(currentFogRect.h);
      const rectPath = `M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`;
      updateFog(scene?.fogPath + ' ' + rectPath);
      setFogRectStart(null); setCurrentFogRect(null); setActiveTool('select');
      return;
    }

    // Commit Light/Audio/Trigger Rect
    if ((activeTool === 'draw-light-rect' || activeTool === 'draw-audio-rect' || activeTool === 'draw-trigger-rect') && currentFogRect) {
      const x = currentFogRect.w < 0 ? currentFogRect.x + currentFogRect.w : currentFogRect.x;
      const y = currentFogRect.h < 0 ? currentFogRect.y + currentFogRect.h : currentFogRect.y;
      const w = Math.abs(currentFogRect.w);
      const h = Math.abs(currentFogRect.h);

      if (activeTool === 'draw-light-rect') { addLightZones([{ type: 'rect', rect: { x, y, w, h }, brightness: 1.0, color: '#ffffff' }]); setDrawingLightZone(null); }
      else if (activeTool === 'draw-audio-rect') { openAudioZoneConfigModal(config => { addAudioZones([{ type: 'rect', rect: { x, y, w, h }, ...config }]); }); setDrawingAudioZone(null); }
      else if (activeTool === 'draw-trigger-rect') { openTriggerZoneConfigModal(handoutId => { addTriggerZones([{ type: 'rect', rect: { x, y, w, h }, handoutId }]); }); setDrawingTriggerZone(null); }
      setCurrentFogRect(null); setActiveTool('select');
      return;
    }

    // Grid Alignment Logic (Commit)
    if (activeTool === 'map-align-drag' && gridDragState.current.isDragging) {
      gridDragState.current.isDragging = false;
      return;
    }

    // Commit Brush/Freehand
    if (activeTool === 'brush' || activeTool === 'freehand-wall') {
      isDrawingRef.current = false;
      if (liveDrawingPointsRef.current.length > 1) {
        if (activeTool === 'brush') {
          addDrawing({ id: Math.random().toString(), userId: currentUser?.id || '', points: [...liveDrawingPointsRef.current], ...drawingSettings });
        } else {
          addObstacles([{ type: 'wall', points: [...liveDrawingPointsRef.current], blocksVision: true, blocksMovement: true, open: true }]);
        }
      }
      liveDrawingPointsRef.current = [];
    }

    // Commit Drag-Draw Obstacle (Door/Window)
    if (drawingObstacle) {
      const p1 = drawingObstacle.p1;
      const pos = getMousePos(e);
      const p2 = screenToWorld(pos.x, pos.y);
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (dist > 10 / viewport.zoom) {
        addObstacles([{ type: drawingObstacle.type as 'door' | 'window', p1, p2, blocksVision: drawingObstacle.type === 'door', blocksMovement: true, hidden: false }]);
      }
      setDrawingObstacle(null); setActiveTool('select');
      return;
    }

    if (dragState.current.isDragging && dragState.current.token) {
      const token = dragState.current.token;
      const path = props.calculatedPath || []; // Use prop because it's state
      const finalPos = path.length > 0 ? path[path.length - 1] : { x: token.x, y: token.y };
      moveToken(token.id, finalPos.x, finalPos.y);
      if (dragState.current.draggedGroup.length > 0) {
        const dx = finalPos.x - token.x;
        const dy = finalPos.y - token.y;
        const groupMoves = dragState.current.draggedGroup.filter(g => g.id !== token.id).map(g => ({ id: g.id, x: g.startGridX + dx, y: g.startGridY + dy }));
        if (groupMoves.length > 0 && moveTokens) { moveTokens(groupMoves); }
      }
    }
    dragState.current.isDragging = false;
    setIsTokenDragging(false);
    setDragging?.(false); // Remote cursor visibility
    dragState.current.token = null;
    setCalculatedPath([]);

    // Force immediate cursor update to sync position for other clients
    const pos = getMousePos(e);
    const worldPos = screenToWorld(pos.x, pos.y);
    emitCursorMove(worldPos.x, worldPos.y, true);
    return;
  };

  const handleDoubleLeftClick = (e: React.MouseEvent) => {
    if (['fog-poly', 'draw-wall', 'draw-light-poly', 'draw-audio-poly', 'draw-trigger-poly'].includes(activeTool) && draftPolyPoints.length >= 2) {
      const minPoints = activeTool === 'draw-wall' ? 2 : 3;
      if (draftPolyPoints.length >= minPoints) {
        if (activeTool === 'draw-wall') {
          let points = [...draftPolyPoints];
          const last = points[points.length - 1]; const secondLast = points[points.length - 2];
          if (Math.abs(last.x - secondLast.x) < 1 && Math.abs(last.y - secondLast.y) < 1) { points.pop(); }
          addObstacles([{ type: 'wall', points, blocksVision: true, blocksMovement: true, open: true }]);
        } else if (activeTool === 'draw-light-poly') { addLightZones([{ type: 'polygon', points: [...draftPolyPoints], brightness: 1.0, color: '#ffffff' }]); }
        else if (activeTool === 'draw-audio-poly') { openAudioZoneConfigModal(config => { addAudioZones([{ type: 'polygon', points: [...draftPolyPoints], ...config }]); }); }
        else if (activeTool === 'draw-trigger-poly') { openTriggerZoneConfigModal(handoutId => { addTriggerZones([{ type: 'polygon', points: [...draftPolyPoints], handoutId }]); }); }
        else {
          let pathString = `M${draftPolyPoints[0].x},${draftPolyPoints[0].y}`;
          for (let i = 1; i < draftPolyPoints.length; i++) pathString += ` L${draftPolyPoints[i].x},${draftPolyPoints[i].y}`;
          pathString += " Z";
          updateFog(scene?.fogPath + ' ' + pathString);
        }
      }
      setDraftPolyPoints([]); setActiveTool('select');
    } else if (activeTool === 'measure-path') { setMovementPath([]); setActiveTool('select'); }
  };

  // 3-Point Calibration Actions
  const confirm3PointCalibration = () => {
    if (alignPointsRef.current.length !== 3) return;
    const [p1, p2, p3] = alignPointsRef.current;

    // P1: Top-Left (Original Offset) -> P2: Top-Right -> P3: Bottom-Left
    const distP1P2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    // const distP1P3 = Math.hypot(p3.x - p1.x, p3.y - p1.y); // Height check optional

    const computedSize = Math.round(distP1P2);

    // Offset calculation: P1 should be an intersection point.
    // So P1 = (N * size) + Offset
    // Offset = P1 % size
    // We need positive modulo behavior
    const newOffsetX = ((p1.x % computedSize) + computedSize) % computedSize;
    const newOffsetY = ((p1.y % computedSize) + computedSize) % computedSize;

    // LOCAL UPDATE ONLY (No Server Commit)
    window.dispatchEvent(new CustomEvent('questbinder:grid-local-update', {
      detail: { size: computedSize, offsetX: newOffsetX, offsetY: newOffsetY }
    }));

    // Switch back to inspector to review visual change
    setActiveTool('map-align');
    alignPointsRef.current = [];
  };

  const cancel3PointCalibration = () => {
    alignPointsRef.current = [];
  };

  const handleWheel = (e: React.WheelEvent) => {
    setHoveredTokenId(null);
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
    const scale = e.deltaY > 0 ? 0.9 : 1.1; const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * scale));
    const pos = getMousePos(e); const worldPos = screenToWorld(pos.x, pos.y);
    const newX = pos.x - worldPos.x * newZoom; const newY = pos.y - worldPos.y * newZoom;
    setViewport({ zoom: newZoom, x: newX, y: newY });
  };

  const handleMouseLeave = () => {
    if (!hoverCloseTimerRef.current) {
      hoverCloseTimerRef.current = setTimeout(() => { setHoveredTokenId(null); hoverCloseTimerRef.current = null; }, 300);
    }
    if (hoverOpenTimerRef.current) clearTimeout(hoverOpenTimerRef.current);

    // Clear pressing timer and force Depress
    if (pressingTimerRef.current) {
      clearTimeout(pressingTimerRef.current);
      pressingTimerRef.current = null;
    }
    setCursorClickState(false);

    isDrawingRef.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wheelHandler = (e: WheelEvent) => { e.preventDefault(); const reactEvent = e as any; handleWheel(reactEvent); };
    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    return () => canvas.removeEventListener('wheel', wheelHandler);
  }, [viewport, handleWheel]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleLeftClick,
    handleMouseLeave,
    handleWheel,
    alignPointsRef, // Expose for UI visualization
    confirm3PointCalibration,
    cancel3PointCalibration
  };
};
