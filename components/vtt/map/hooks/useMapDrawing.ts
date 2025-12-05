import React, { useCallback } from 'react';
import { MapScene as Scene, MapDrawing, AudioZone, TriggerZone } from '../../../../types';
import { distanceToSegment, isPointInPolygon } from '../../../../utils/geometry';
import { getContourFromPoint } from '../../../../utils/imageProcessing';

interface UseMapDrawingProps {
  scene: Scene | null;
  viewport: { zoom: number; };
  activeTool: string;
  isGM: boolean;
  draftPolyPoints: { x: number, y: number; }[];
  setDraftPolyPoints: (points: { x: number, y: number; }[]) => void;
  liveDrawingPointsRef: React.MutableRefObject<{ x: number, y: number; }[]>;
  isDrawingRef: React.MutableRefObject<boolean>;
  drawingSettings: any;
  currentUser: any;
  permissionHelper: any;
  addObstacles: (obstacles: any[]) => void;
  updateObstacle: (id: string, updates: any) => void;
  removeObstacle: (id: string) => void;
  addLightZones: (zones: any[]) => void;
  addAudioZones: (zones: any[]) => void;
  removeAudioZone: (id: string) => void;
  addTriggerZones: (zones: any[]) => void;
  removeTriggerZone: (id: string) => void;
  addDrawing: (drawing: any) => void;
  removeDrawing: (id: string) => void;
  updateFog: (path: string) => void;
  openAudioZoneConfigModal: (callback: (config: any) => void) => void;
  openTriggerZoneConfigModal: (callback: (handoutId: string) => void) => void;
  setDrawingObstacle: (obs: any) => void;
  setDrawingLightZone: (zone: any) => void;
  setDrawingAudioZone: (zone: any) => void;
  setDrawingTriggerZone: (zone: any) => void;
  setFogRectStart: (p: { x: number, y: number; } | null) => void;
  setCurrentFogRect: (r: any) => void;
  setActiveTool: (tool: string) => void;
  imageCache: { [src: string]: HTMLImageElement; };
}

export const useMapDrawing = ({
  scene,
  viewport,
  activeTool,
  isGM,
  draftPolyPoints,
  setDraftPolyPoints,
  liveDrawingPointsRef,
  isDrawingRef,
  drawingSettings,
  currentUser,
  permissionHelper,
  addObstacles,
  updateObstacle,
  removeObstacle,
  addLightZones,
  addAudioZones,
  removeAudioZone,
  addTriggerZones,
  removeTriggerZone,
  addDrawing,
  removeDrawing,
  updateFog,
  openAudioZoneConfigModal,
  openTriggerZoneConfigModal,
  setDrawingObstacle,
  setDrawingLightZone,
  setDrawingAudioZone,
  setDrawingTriggerZone,
  setFogRectStart,
  setCurrentFogRect,
  setActiveTool,
  imageCache
}: UseMapDrawingProps) => {

  const findObstacleAt = useCallback((worldX: number, worldY: number) => {
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
  }, [scene, viewport]);

  const findAudioZoneAt = useCallback((worldX: number, worldY: number): AudioZone | null => {
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
  }, [scene]);

  const findTriggerZoneAt = useCallback((worldX: number, worldY: number): TriggerZone | null => {
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
  }, [scene]);

  const findDrawingAt = useCallback((worldX: number, worldY: number): MapDrawing | null => {
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
  }, [scene, viewport]);

  const handleDrawingMouseDown = useCallback((worldPos: { x: number, y: number; }, e: React.MouseEvent) => {
    if (activeTool === 'brush' || activeTool === 'freehand-wall') {
      isDrawingRef.current = true;
      liveDrawingPointsRef.current = [worldPos];
      return true;
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
          const contour = getContourFromPoint(img, ix, iy, 40);
          if (contour.length > 2) {
            const worldContour = contour.map(p => ({ x: p.x / scaleX, y: p.y / scaleY }));
            addObstacles([{ type: 'wall', points: worldContour, blocksVision: true, blocksMovement: true, open: false }]);
          }
        } catch (e) { console.error("Smart wall error:", e); }
      }
      return true;
    }

    if (activeTool === 'eraser-drawing') {
      const clickedDrawing = findDrawingAt(worldPos.x, worldPos.y);
      if (clickedDrawing && permissionHelper.canDeleteDrawing(clickedDrawing.userId)) { removeDrawing(clickedDrawing.id); }
      return true;
    }

    if (activeTool === 'eraser-trigger' && isGM) {
      const clickedTriggerZone = findTriggerZoneAt(worldPos.x, worldPos.y);
      if (clickedTriggerZone) { removeTriggerZone(clickedTriggerZone.id); }
      return true;
    }

    if (activeTool === 'eraser-audio' && isGM) {
      const clickedAudioZone = findAudioZoneAt(worldPos.x, worldPos.y);
      if (clickedAudioZone) { removeAudioZone(clickedAudioZone.id); }
      return true;
    }

    if (activeTool === 'eraser' && isGM) {
      const clickedObstacle = findObstacleAt(worldPos.x, worldPos.y);
      if (clickedObstacle) { removeObstacle(clickedObstacle.id); }
      return true;
    }

    const clickedObstacle = findObstacleAt(worldPos.x, worldPos.y);
    if (clickedObstacle && activeTool === 'select' && ['door', 'window'].includes(clickedObstacle.type)) {
      if (permissionHelper.canAsGMOr('doorControl')) {
        const isOpen = !clickedObstacle.blocksMovement;
        const newOpen = !isOpen;
        updateObstacle(clickedObstacle.id, { blocksMovement: !newOpen, blocksVision: clickedObstacle.type === 'door' ? !newOpen : false });
        return true;
      } else { console.warn('[MapCanvas] Door control denied - no permission'); }
    }

    if (activeTool === 'fog-rect') { if (isGM) setFogRectStart(worldPos); return true; }
    if (activeTool === 'draw-light-rect') { if (isGM) setDrawingLightZone({ type: 'rect', p1: worldPos }); return true; }
    if (activeTool === 'draw-audio-rect') { if (isGM) setDrawingAudioZone({ type: 'rect', p1: worldPos }); return true; }
    if (activeTool === 'draw-trigger-rect') { if (isGM) setDrawingTriggerZone({ type: 'rect', p1: worldPos }); return true; }

    if (['fog-poly', 'draw-wall', 'draw-light-poly', 'draw-audio-poly', 'draw-trigger-poly'].includes(activeTool)) {
      if (draftPolyPoints.length > 0) {
        const start = draftPolyPoints[0];
        const dist = Math.hypot(worldPos.x - start.x, worldPos.y - start.y);
        if (dist < 15 / viewport.zoom) {
          finishPolyDrawing();
          return true;
        }
      }
      setDraftPolyPoints([...draftPolyPoints, worldPos]);
      return true;
    }

    if (['draw-door', 'draw-window'].includes(activeTool)) {
      setDrawingObstacle({ type: activeTool === 'draw-door' ? 'door' : 'window', p1: worldPos });
      return true;
    }

    return false;
  }, [activeTool, scene, imageCache, isGM, permissionHelper, draftPolyPoints, viewport, findDrawingAt, findTriggerZoneAt, findAudioZoneAt, findObstacleAt, removeDrawing, removeTriggerZone, removeAudioZone, removeObstacle, updateObstacle, setFogRectStart, setDrawingLightZone, setDrawingAudioZone, setDrawingTriggerZone, setDraftPolyPoints, setDrawingObstacle]);

  const finishPolyDrawing = useCallback(() => {
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
  }, [activeTool, draftPolyPoints, addObstacles, addLightZones, openAudioZoneConfigModal, addAudioZones, openTriggerZoneConfigModal, addTriggerZones, updateFog, scene, setDraftPolyPoints]);

  const handleDrawingMouseMove = useCallback((worldPos: { x: number, y: number; }) => {
    if ((activeTool === 'brush' || activeTool === 'freehand-wall') && isDrawingRef.current) {
      const currentPoints = liveDrawingPointsRef.current;
      if (currentPoints.length > 0) {
        const lastPoint = currentPoints[currentPoints.length - 1];
        const dist = Math.hypot(worldPos.x - lastPoint.x, worldPos.y - lastPoint.y);
        if (dist > 5 / viewport.zoom) { liveDrawingPointsRef.current.push(worldPos); }
      } else {
        liveDrawingPointsRef.current.push(worldPos);
      }
      return true;
    }
    return false;
  }, [activeTool, viewport, liveDrawingPointsRef, isDrawingRef]);

  const handleDrawingMouseUp = useCallback((e: React.MouseEvent, worldPos: { x: number, y: number; }, currentFogRect: any, fogRectStart: any, drawingObstacle: any) => {
    if (activeTool === 'fog-rect' && fogRectStart && currentFogRect) {
      const x = currentFogRect.w < 0 ? currentFogRect.x + currentFogRect.w : currentFogRect.x;
      const y = currentFogRect.h < 0 ? currentFogRect.y + currentFogRect.h : currentFogRect.y;
      const w = Math.abs(currentFogRect.w);
      const h = Math.abs(currentFogRect.h);
      const rectPath = `M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`;
      updateFog(scene?.fogPath + ' ' + rectPath);
      setFogRectStart(null); setCurrentFogRect(null); setActiveTool('select');
      return true;
    }

    if ((activeTool === 'draw-light-rect' || activeTool === 'draw-audio-rect' || activeTool === 'draw-trigger-rect') && currentFogRect) {
      const x = currentFogRect.w < 0 ? currentFogRect.x + currentFogRect.w : currentFogRect.x;
      const y = currentFogRect.h < 0 ? currentFogRect.y + currentFogRect.h : currentFogRect.y;
      const w = Math.abs(currentFogRect.w);
      const h = Math.abs(currentFogRect.h);

      if (activeTool === 'draw-light-rect') { addLightZones([{ type: 'rect', rect: { x, y, w, h }, brightness: 1.0, color: '#ffffff' }]); setDrawingLightZone(null); }
      else if (activeTool === 'draw-audio-rect') { openAudioZoneConfigModal(config => { addAudioZones([{ type: 'rect', rect: { x, y, w, h }, ...config }]); }); setDrawingAudioZone(null); }
      else if (activeTool === 'draw-trigger-rect') { openTriggerZoneConfigModal(handoutId => { addTriggerZones([{ type: 'rect', rect: { x, y, w, h }, handoutId }]); }); setDrawingTriggerZone(null); }
      setCurrentFogRect(null); setActiveTool('select');
      return true;
    }

    if (activeTool === 'brush' || activeTool === 'freehand-wall') {
      isDrawingRef.current = false;
      if (liveDrawingPointsRef.current.length > 1) {
        if (activeTool === 'brush') {
          addDrawing({ id: Math.random().toString(), userId: currentUser?.id || '', points: liveDrawingPointsRef.current, ...drawingSettings });
        } else {
          addObstacles([{ type: 'wall', points: [...liveDrawingPointsRef.current], blocksVision: true, blocksMovement: true, open: true }]);
        }
      }
      liveDrawingPointsRef.current = [];
      return true;
    }

    if (drawingObstacle) {
      const p1 = drawingObstacle.p1;
      const p2 = worldPos;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (dist > 10 / viewport.zoom) {
        addObstacles([{ type: drawingObstacle.type as 'door' | 'window', p1, p2, blocksVision: drawingObstacle.type === 'door', blocksMovement: true, hidden: false }]);
      }
      setDrawingObstacle(null); setActiveTool('select');
      return true;
    }
    return false;
  }, [activeTool, updateFog, scene, setFogRectStart, setCurrentFogRect, setActiveTool, addLightZones, setDrawingLightZone, openAudioZoneConfigModal, addAudioZones, setDrawingAudioZone, openTriggerZoneConfigModal, addTriggerZones, setDrawingTriggerZone, isDrawingRef, liveDrawingPointsRef, currentUser, drawingSettings, addDrawing, addObstacles, viewport, setDrawingObstacle]);

  return {
    findObstacleAt,
    findAudioZoneAt,
    findTriggerZoneAt,
    findDrawingAt,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    finishPolyDrawing
  };
};
