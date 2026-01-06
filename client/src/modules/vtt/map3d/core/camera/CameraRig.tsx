import React, { useRef } from 'react';
import { MapControls, OrthographicCamera } from '@react-three/drei';
import { MapControls as ThreeMapControls } from 'three-stdlib';
import { useCameraSync } from './hooks/useCameraSync';
import { useMapStore } from '../../store/mapStore';

export const CameraRig: React.FC = () => {
  const controlsRef = useRef<ThreeMapControls>(null);
  const viewport = useMapStore((state) => state.viewport);

  const { onChange } = useCameraSync(controlsRef);

  // No manual rotation hacks needed for standard Y-up XZ-plane setup.
  // MapControls defaults to this.

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[viewport.x, 100, viewport.y]}
        zoom={viewport.zoom}
        near={0.1}
        far={1000}
      // Removed hard onUpdate lock to allow controls to take over
      />
      <MapControls
        ref={controlsRef}
        makeDefault // Ensure these grab the event loop
        screenSpacePanning={false} // False is often better for top-down XZ map panning
        enableRotate={false}
        enableDamping={true}
        dampingFactor={0.1}
        minZoom={0.1}
        maxZoom={5.0}
        onChange={onChange}
      />

    </>
  );
};
