import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, MapControls, Preload, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { MapScene, Token, Viewport, GridOptions } from '../../../types';

import { MapPlane } from './MapPlane';
import { GridRenderer } from './GridRenderer';
import { Token3D } from './Token3D';

interface MapCanvas3DProps {
  scene?: MapScene;
  tokens: Token[];
  viewport: Viewport;
  grid: GridOptions;
  setViewport: (v: Viewport) => void;
}

import { useGameSession } from '../../../context/GameSessionContext';

export const MapCanvas3D: React.FC<MapCanvas3DProps> = ({
  scene,
  tokens,
  viewport,
  grid,
  setViewport
}) => {
  const { selectToken, clearSelection, selectedTokenIds, moveToken, emitTokenDrag } = useGameSession(); // Get selection state/actions
  const controlsRef = useRef<any>(null);

  // Handler for background click -> Deselect all
  const handleBackgroundClick = (e: any) => {
    e.stopPropagation();
    clearSelection();
  };

  const handleTokenDrag = (id: string, x: number, y: number) => {
    // x, y are in VTT 2D coordinates
    // Emit for other players
    emitTokenDrag(id, x, y, []); // path empty for now
  };

  const handleTokenDragEnd = (id: string, x: number, y: number) => {
    moveToken(id, x, y);
  };


  const isInitialized = useRef(false);

  // Initial Camera Setup
  useEffect(() => {
    // Only set initial position once to allow free movement afterwards
    if (controlsRef.current && !isInitialized.current) {
      const controls = controlsRef.current;
      const camera = controls.object;

      controls.target.set(viewport.x, viewport.y, 0);
      camera.zoom = viewport.zoom * 10;
      camera.position.set(viewport.x, viewport.y, 10); // Ensure camera is above target

      camera.updateProjectionMatrix();
      controls.update();

      isInitialized.current = true;
    }
  }, [viewport.x, viewport.y, viewport.zoom]); // Dependencies needed for initial value capture

  // Calculate map dimensions from grid
  const mapWidth = (grid?.cols || 50) * (grid?.size || 60);
  const mapHeight = (grid?.rows || 50) * (grid?.size || 60);

  return (
    <div className="w-full h-full bg-zinc-900 border border-zinc-700 relative overflow-hidden">
      <Canvas
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        shadows
      >
        <color attach="background" args={['#18181b']} />

        {/* 
            Orthographic Camera
            Removed props controlled by useEffect to prevent fighting
        */}
        <OrthographicCamera
          makeDefault
          position={[0, 0, 10]}
          near={0.1}
          far={1000}
        />

        {/* 
            MapControls is OrbitControls configured for top-down maps.
            - Pan with Left Click (or Right, configurable)
            - Zoom with Wheel
            - No Rotation (screenSpacePanning=true for top-down)
        */}
        <MapControls
          ref={controlsRef}
          screenSpacePanning={true}
          enableRotate={false}
          enableDamping={true}
          dampingFactor={0.15}
          minZoom={0.1}
          maxZoom={1000}
          onChange={(e) => {
            // TODO: Sync back to setViewport
            // Ideally debounced
          }}
        />

        {/* Lighting - Basic ambient for now, will get fancier later */}
        <ambientLight intensity={0.5} />

        <Suspense fallback={null}>
          <group onClick={handleBackgroundClick}>
            {scene?.imageUrl && <MapPlane imageUrl={scene.imageUrl} width={mapWidth} height={mapHeight} />}
            <GridRenderer width={mapWidth} height={mapHeight} gridSize={grid?.size || 60} color={grid?.color || '#000000'} />
          </group>

          {tokens.map(token => (
            <Token3D
              key={token.id}
              token={token}
              mapWidth={mapWidth}
              mapHeight={mapHeight}
              gridSize={grid?.size || 60}
              unitsPerSquare={grid?.unitsPerSquare || 1.5}
              isSelected={selectedTokenIds.includes(token.id)}
              onSelect={(multi) => selectToken(token.id, multi)}
              onDrag={(x, y) => handleTokenDrag(token.id, x, y)}
              onDragEnd={(x, y) => handleTokenDragEnd(token.id, x, y)}
            />
          ))}
        </Suspense>

        <Stats />
        <Preload all />
      </Canvas>

      <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded pointer-events-none">
        RENDER: THREE.JS (POC)
      </div>
    </div>
  );
};
