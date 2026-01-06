// SIMPLE POC GRID RENDERER
// Using native helper to avoid shader type complexity in POC phase
import React from 'react';

interface GridRendererProps {
  width: number;
  height: number;
  gridSize: number;
  color: string;
}

export const GridRenderer: React.FC<GridRendererProps> = ({ width, height, gridSize, color }) => {
  // gridHelper(size, divisions, colorCenter, colorGrid)
  // Three.js gridHelper is square. We need to handle aspect ratio or just make a large enough square.
  const size = Math.max(width, height);
  const divisions = Math.floor(size / gridSize);

  return (
    <gridHelper
      args={[size, divisions, color, color]}
      position={[0, 0, 0.05]}
      rotation={[Math.PI / 2, 0, 0]} // Rotate to lie flat on XY plane (default is XZ)
    />
  );
};

export const ShaderGridRenderer = GridRenderer; // Fallback export
