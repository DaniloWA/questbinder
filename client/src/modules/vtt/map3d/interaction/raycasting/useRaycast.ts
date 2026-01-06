import { useThree } from '@react-three/fiber';
import { Vector2, Raycaster } from 'three';
import { useCallback } from 'react';

export const useRaycast = () => {
  const { raycaster, camera, scene } = useThree();

  const raycastAt = useCallback((screenPos: Vector2) => {
    raycaster.setFromCamera(screenPos, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    return intersects;
  }, [raycaster, camera, scene]);

  return { raycastAt };
};
