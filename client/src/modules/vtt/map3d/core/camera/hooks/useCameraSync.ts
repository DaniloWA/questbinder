import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { MapControls } from 'three-stdlib';
import { useMapStore } from '../../../store/mapStore';

export const useCameraSync = (controlsRef: React.RefObject<MapControls>) => {
  const { viewport, updateViewport } = useMapStore();
  const { camera } = useThree();
  const isInitialized = useRef(false);

  // Sync Store -> Camera (Only on external changes or init)
  useEffect(() => {
    if (!controlsRef.current) return;

    // TODO: logic to distinguish user interaction from programmatic update
    // For now, we trust the store as the source of truth if we aren't dragging

    // We only force update if the values are significantly different to avoid loops
    // or if we haven't initialized yet.

    if (!isInitialized.current) {
      controlsRef.current.object.position.set(viewport.x, viewport.y, 100);
      controlsRef.current.target.set(viewport.x, viewport.y, 0);
      controlsRef.current.update();
      isInitialized.current = true;
    }

  }, [viewport.x, viewport.y, viewport.zoom]);

  // Sync Camera -> Store (On User Interaction)
  const onChange = () => {
    if (!controlsRef.current) return;

    // We can debounce this if needed for performance
    const target = controlsRef.current.target;
    const zoom = camera.zoom;

    // console.log('Camera Changed:', target.x, target.y, zoom);

    // We refrain from updating store continuously if not needed for other clients yet
    // But for local UI sync, we might want it. 
    // updateViewport({ x: target.x, y: target.y, zoom }); 
  };

  return { onChange };
};
