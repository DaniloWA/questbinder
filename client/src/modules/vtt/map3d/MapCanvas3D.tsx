import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { Map3DProvider } from './core/providers/Map3DContext';
import { Stage } from './core/Stage';
import { Leva } from 'leva';

export const MapCanvas3D: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Debug GUI */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1000,
        pointerEvents: 'none' // Allow clicks to pass through container
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <Leva fill />
        </div>
      </div>

      <Map3DProvider>
        <Canvas
          shadows
          orthographic
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            gl.setClearColor('#111111');
          }}
        >
          <Suspense fallback={null}>
            <Stage />
          </Suspense>
          <Stats />
        </Canvas>
      </Map3DProvider>
    </div>
  );
};
