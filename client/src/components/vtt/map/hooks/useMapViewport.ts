import React, { useCallback, useEffect, useRef } from 'react';

interface UseMapViewportProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  viewport: { x: number; y: number; zoom: number; };
  setViewport: (viewport: Partial<{ x: number; y: number; zoom: number; }>) => void;
  isPanning: boolean;
  setIsPanning: (isPanning: boolean) => void;
  setHoveredTokenId: (id: string | null) => void;
  hoverCloseTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  lastMousePos: React.MutableRefObject<{ x: number; y: number; }>;
  viewportRef: React.MutableRefObject<{ x: number; y: number; zoom: number; }>;
}

export const useMapViewport = ({
  canvasRef,
  viewport,
  setViewport,
  isPanning,
  setIsPanning,
  setHoveredTokenId,
  hoverCloseTimerRef,
  lastMousePos,
  viewportRef
}: UseMapViewportProps) => {

  // Track if we need to sync state after panning ends
  const needsSync = useRef(false);

  const getMousePos = useCallback((e: React.MouseEvent | React.WheelEvent | WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, [canvasRef]);

  const screenToWorld = useCallback((screenX: number, screenY: number) => ({
    x: (screenX - viewport.x) / viewport.zoom,
    y: (screenY - viewport.y) / viewport.zoom,
  }), [viewport]);

  const handleWheel = useCallback((e: React.WheelEvent | WheelEvent) => {
    setHoveredTokenId(null);
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);

    const deltaY = 'deltaY' in e ? e.deltaY : 0;
    const scale = deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * scale));

    const pos = getMousePos(e);
    const worldPos = screenToWorld(pos.x, pos.y);

    const newX = pos.x - worldPos.x * newZoom;
    const newY = pos.y - worldPos.y * newZoom;

    const newViewport = { zoom: newZoom, x: newX, y: newY };

    // Update ref immediately
    viewportRef.current = { ...viewportRef.current, ...newViewport };

    // Update state
    setViewport(newViewport);
  }, [viewport, setViewport, setHoveredTokenId, hoverCloseTimerRef, getMousePos, screenToWorld, viewportRef]);

  // Miro-style panning: Only update ref during pan, sync state when done
  const handlePanning = useCallback((currentPos: { x: number, y: number; }) => {
    if (!isPanning) return;

    // Calculate delta from last position
    const dx = currentPos.x - lastMousePos.current.x;
    const dy = currentPos.y - lastMousePos.current.y;

    // ONLY update ref (no React state update during panning)
    viewportRef.current.x += dx;
    viewportRef.current.y += dy;

    // Mark that we need to sync when panning stops
    needsSync.current = true;

    // Update last mouse position
    lastMousePos.current = currentPos;
  }, [isPanning, lastMousePos, viewportRef]);

  // Sync state when panning stops
  useEffect(() => {
    if (!isPanning && needsSync.current) {
      setViewport({ x: viewportRef.current.x, y: viewportRef.current.y });
      needsSync.current = false;
    }
  }, [isPanning, setViewport, viewportRef]);

  // Attach wheel listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      handleWheel(e);
    };
    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, [canvasRef, handleWheel]);

  return {
    getMousePos,
    screenToWorld,
    handleWheel,
    handlePanning,
    lastMousePos
  };
};
