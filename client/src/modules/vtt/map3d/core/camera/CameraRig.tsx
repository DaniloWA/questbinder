import React, { useRef } from 'react';
import { MapControls, OrthographicCamera } from '@react-three/drei';
import { MapControls as ThreeMapControls } from 'three-stdlib';
import { useCameraSync } from './hooks/useCameraSync';
import { useMapStore } from '../../store/mapStore';

export const CameraRig: React.FC = () => {
  const controlsRef = useRef<ThreeMapControls>(null);
  const viewport = useMapStore((state) => state.viewport);

  const { onChange } = useCameraSync(controlsRef);

  // Force-fix rotation on mount or update
  React.useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      // Ensure strictly looking down -Z
      controls.object.lookAt(controls.target.x, controls.target.y, 0);
      controls.object.up.set(0, 1, 0); // Standard Camera Up is Y on screen
      controls.update();
    }
  }, []);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[viewport.x, viewport.y, 100]}
        zoom={viewport.zoom}
        near={0.1}
        far={1000}
      // Force Z-up orientation if needed, but usually default Y-up for camera is fine if looking down -Z.
      // Actually, for MapControls to pan in X-Y, we need to tell it Z is up? No, controls.up defines the "ground plane" normal.
      // If controls.up is (0,1,0), ground is X-Z.
      // If controls.up is (0,0,1), ground is X-Y.
      // We want X-Y ground.
      />
      <MapControls
        ref={controlsRef}
        screenSpacePanning={true} // Pan orthogonal to direction
        enableRotate={false}
        minZoom={0.1}
        maxZoom={5.0}
        onChange={onChange}
      // Fix for "Crooked" / "Torto" view:
      // By default MapControls uses Y-up (X-Z plane). We use X-Y plane.
      // BUT 'screenSpacePanning=true' usually ignores this for Ortho.
      // However, let's enforce Z as up to be safe if that's the issue.
      // Actually, for X-Y map, we want standard panning.
      // If "torto", maybe previous MapControls saved a bad rotation state?
      // Let's force reset rotation.
      />
    </>
  );
};
