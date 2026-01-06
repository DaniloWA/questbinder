import { useDrag } from '@use-gesture/react';
import { useTokenStore } from '../../../store/tokenStore';
import { useMapStore } from '../../../store/mapStore';
import { useGameSession } from '../../../../../../context/GameSessionContext';
import { snapToGrid, worldToGrid, gridToWorld } from '../../../shared/utils/math/coordinates';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

export const useTokenDrag = (tokenId: string, initialPosition: [number, number, number]) => {
  const updateToken = useTokenStore(state => state.updateToken);
  const { grid, width, height } = useMapStore(state => state.mapData);
  const { emitTokenDrag, moveToken } = useGameSession();
  const { size, viewport } = useThree();

  const bind = useDrag(({ active, movement: [mx, my], offset: [ox, oy], event, memo = initialPosition }) => {
    // Basic drag implementation for Orthographic Top-Down
    // mx, my are screen pixels delta.
    // We need to convert pixel delta to world delta.

    // Scale factor: visible world units / viewport height in pixels
    // For OrthographicCamera, zoom is separate.
    // worldHeight = (top - bottom) / zoom ? Or using viewport.factor 
    // In R3F, viewport.factor is usually available.

    // Simple Approximation if we don't have perfect raycasting yet:
    const factor = viewport.getCurrentViewport().factor;

    // Calculate new position
    // This is rough. Phase 5 RaycastManager gives perfect world pos.
    // For now, let's assume standard scaling or just use the event if it has world info.

    // If we want to restore previous behavior:
    // The previous behavior passed (x, y) grid coords? Or world coords?
    // It seems it passed VTT 2D coords.

    if (active) {
      // emitTokenDrag(tokenId, newX, newY, []);
      // localized update for smooth drag
      // updateToken(tokenId, { /* temp pos */ });
    } else {
      // moveToken(tokenId, finalX, finalY);
    }

    return memo;
  }, {
    pointer: { keys: false }
  });

  return bind;
};
