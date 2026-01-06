import { useRef, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import { useThree } from '@react-three/fiber';
import { Plane, Vector3, Raycaster, Vector2 } from 'three';
import { useMapStore } from '../../../store/mapStore';
import { useGameSession } from '../../../../../../context/GameSessionContext';

// Performance: Reusable objects to avoid GC pressure
const _raycaster = new Raycaster();
const _pointer = new Vector2();
const _intersection = new Vector3();
const _xzPlane = new Plane(new Vector3(0, 1, 0), 0); // Y-up, XZ ground plane

interface DragState {
  startPos: [number, number];
  path: Array<{ x: number; y: number; }>;
  lastEmitTime: number;
}

const EMIT_THROTTLE_MS = 50; // Throttle socket emissions for performance

/**
 * High-performance token drag hook using XZ plane raycasting.
 * 
 * Coordinate System:
 * - World: worldX = gridCol * gridSize, worldZ = gridRow * gridSize
 * - Grid: token.x = column, token.y = row (fractional for sub-grid positioning)
 * - Map origin is at world (0, 0, 0)
 */
export const useTokenDrag = (
  tokenId: string,
  initialPosition: [number, number],
  onDragUpdate?: (x: number, z: number, isDragging: boolean) => void
) => {
  const { camera, gl } = useThree();
  const { grid } = useMapStore(state => state.mapData);
  const { emitTokenDrag, moveToken } = useGameSession();

  // Refs for performance (avoid re-renders during drag)
  const dragStateRef = useRef<DragState>({
    startPos: initialPosition,
    path: [],
    lastEmitTime: 0
  });

  /**
   * Convert screen coordinates to world XZ position via raycasting.
   */
  const screenToWorld = useCallback((clientX: number, clientY: number): { x: number; z: number; } | null => {
    const rect = gl.domElement.getBoundingClientRect();

    // Normalize to NDC [-1, 1]
    _pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    // Cast ray from camera through pointer
    _raycaster.setFromCamera(_pointer, camera);

    // Intersect with XZ plane (ground)
    const hit = _raycaster.ray.intersectPlane(_xzPlane, _intersection);
    if (!hit) return null;

    return { x: _intersection.x, z: _intersection.z };
  }, [camera, gl]);

  /**
   * Snap world position to grid center.
   */
  const snapToGridCenter = useCallback((worldX: number, worldZ: number): { x: number; z: number; } => {
    // Convert to grid coords, floor to get cell, then back to world center
    const col = Math.floor(worldX / grid.size);
    const row = Math.floor(worldZ / grid.size);

    return {
      x: col * grid.size + grid.size / 2,
      z: row * grid.size + grid.size / 2
    };
  }, [grid.size]);

  /**
   * Convert world XZ to grid coordinates for GameSession API.
   */
  const worldToGridCoords = useCallback((worldX: number, worldZ: number): { x: number; y: number; } => {
    // Simple division: grid col/row = world pos / gridSize
    const col = worldX / grid.size;
    const row = worldZ / grid.size;
    return { x: col, y: row };
  }, [grid.size]);

  const bind = useDrag(
    ({ active, first, last, event }) => {
      // CRITICAL: Stop propagation to prevent MapControls from panning
      if (event) {
        event.stopPropagation();
        (event as any).nativeEvent?.stopPropagation?.();
        (event as any).nativeEvent?.stopImmediatePropagation?.();
      }

      // Get native event for coordinates
      const nativeEvent = (event as any)?.nativeEvent as PointerEvent | undefined;
      if (!nativeEvent) return;

      const worldPos = screenToWorld(nativeEvent.clientX, nativeEvent.clientY);
      if (!worldPos) return;

      const now = Date.now();

      if (first) {
        // Start drag - initialize state
        dragStateRef.current = {
          startPos: [worldPos.x, worldPos.z],
          path: [worldToGridCoords(worldPos.x, worldPos.z)],
          lastEmitTime: now
        };
      }

      if (active) {
        // During drag - update visual immediately
        onDragUpdate?.(worldPos.x, worldPos.z, true);

        // Throttle socket emissions for performance
        if (now - dragStateRef.current.lastEmitTime > EMIT_THROTTLE_MS) {
          const gridCoords = worldToGridCoords(worldPos.x, worldPos.z);

          // Add to path for ruler visualization
          dragStateRef.current.path.push(gridCoords);

          // Emit to other players
          emitTokenDrag(tokenId, gridCoords.x, gridCoords.y, dragStateRef.current.path);
          dragStateRef.current.lastEmitTime = now;
        }
      }

      if (last) {
        // End drag - snap to grid and commit
        const snapped = snapToGridCenter(worldPos.x, worldPos.z);
        const finalGridCoords = worldToGridCoords(snapped.x, snapped.z);

        // Update visual to snapped position
        onDragUpdate?.(snapped.x, snapped.z, false);

        // Commit to server
        moveToken(tokenId, Math.floor(finalGridCoords.x), Math.floor(finalGridCoords.y));

        // Clear path
        dragStateRef.current.path = [];
      }
    },
    {
      filterTaps: true,
    }
  );

  return {
    bind,
    dragPath: dragStateRef.current.path
  };
};
