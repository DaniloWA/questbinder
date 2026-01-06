import React, { useMemo } from 'react';
import { useMapStore } from '../../store/mapStore';
import { Z_INDEX } from '../../shared/constants/map.constants';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './GridShader';
import { useUiStore } from '../../store/uiStore';

export const GridLayer: React.FC = () => {
  const { width, height, grid } = useMapStore(state => state.mapData);
  const isGridVisible = useUiStore(state => state.isGridVisible);

  const uniforms = useMemo(() => ({
    uSize: { value: grid.size },
    uColor: { value: new THREE.Color(grid.color) },
    uThickness: { value: 0.05 }, // Adjust for thickness relative to grid cells
    uAlpha: { value: 0.5 }
  }), [grid.size, grid.color]);

  if (!isGridVisible || !grid.enabled) return null;

  return (
    <mesh
      name="GridLayer"
      position={[0, 0, Z_INDEX.GRID]}
      // We render a slightly larger plane or the exact map size
      rotation={[0, 0, 0]}
    >
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false} // Don't write to depth buffer to allow transparency sorting if needed
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
