import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats, Preload } from '@react-three/drei';
import { MapScene, Token, Viewport, GridOptions } from '../../../types';
import { Map3DProvider } from '../../../modules/vtt/map3d/core/providers/Map3DContext';
import { MapStoreInitializer } from '../../../modules/vtt/map3d/core/providers/MapStoreInitializer';
import { Stage } from '../../../modules/vtt/map3d/core/Stage';
import { MapOverlay } from '../../../modules/vtt/map3d/ui/overlay/MapOverlay';
import { Leva } from 'leva';

interface MapCanvas3DProps {
  scene?: MapScene;
  tokens: Token[];
  viewport: Viewport;
  grid: GridOptions;
  setViewport: (v: Viewport) => void;
}

export const MapCanvas3D: React.FC<MapCanvas3DProps> = (props) => {
  return (
    <div
      className="w-full h-full bg-zinc-900 border border-zinc-700 relative overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      <Map3DProvider>
        {/* Sync props to internal store */}
        <MapStoreInitializer {...props} />

        <Canvas
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 1.5]} // Reduce max DPR to 1.5 for performance
          // shadows // Temporarily disable global shadows to check FPS
          style={{ touchAction: 'none' }}
        // frameloop="demand" // Temporarily disable demand loop to fix frozen controls
        >
          <color attach="background" args={['#18181b']} />

          <Stage />

          <Stats />
          <Preload all />
        </Canvas>

        {/* 2D Overlay UI */}
        <MapOverlay />

        {/* Debug UI */}
        <div className="absolute top-2 right-2 z-50">
          <Leva fill collapsed />
        </div>
      </Map3DProvider>
    </div>
  );
};
