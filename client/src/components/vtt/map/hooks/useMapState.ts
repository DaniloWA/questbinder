import { useState, useRef } from 'react';
import { DragState } from '../types';

export const useMapState = () => {
  const [isPanning, setIsPanning] = useState(false);
  const [fogRectStart, setFogRectStart] = useState<{ x: number, y: number; } | null>(null);
  const [currentFogRect, setCurrentFogRect] = useState<{ x: number, y: number, w: number, h: number; } | null>(null);
  const [mouseWorldPos, setMouseWorldPos] = useState({ x: 0, y: 0 });
  const [hoveredObstacleId, setHoveredObstacleId] = useState<string | null>(null);
  const [calculatedPath, setCalculatedPath] = useState<{ x: number, y: number; }[]>([]);
  const [draggedAttackZone, setDraggedAttackZone] = useState<{ id: string, startX: number, startY: number, originX: number, originY: number, rotating?: boolean; } | null>(null);
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);

  // Refs for performance-critical or non-rendering state
  const liveDrawingPointsRef = useRef<{ x: number, y: number; }[]>([]);
  const isDrawingRef = useRef(false);
  const lastCursorEmit = useRef(0);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const hoverOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dragState = useRef<DragState>({
    isDragging: false,
    token: null,
    draggedGroup: [],
    offset: { x: 0, y: 0 },
    dragStartX: 0,
    dragStartY: 0,
    lastValidGridX: 0,
    lastValidGridY: 0,
    lastCheckedGridX: -1,
    lastCheckedGridY: -1
  });

  return {
    isPanning, setIsPanning,
    fogRectStart, setFogRectStart,
    currentFogRect, setCurrentFogRect,
    mouseWorldPos, setMouseWorldPos,
    hoveredObstacleId, setHoveredObstacleId,
    calculatedPath, setCalculatedPath,
    draggedAttackZone, setDraggedAttackZone,
    hoveredTokenId, setHoveredTokenId,
    liveDrawingPointsRef,
    isDrawingRef,
    lastCursorEmit,
    lastMousePos,
    hoverOpenTimerRef,
    hoverCloseTimerRef,
    dragState
  };
};
