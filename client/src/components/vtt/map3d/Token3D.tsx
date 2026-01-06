import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Token } from '../../../types';
import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useGridCoordinates } from './hooks/useGridCoordinates';
import { useDrag } from '@use-gesture/react';

interface Token3DProps {
  token: Token;
  mapWidth: number;
  mapHeight: number;
  gridSize: number;
  unitsPerSquare: number;
  isSelected?: boolean;
  onSelect?: (multi: boolean) => void;
  onDrag?: (x: number, y: number) => void;
  onDragEnd?: (x: number, y: number) => void;
}

export const Token3D: React.FC<Token3DProps> = ({
  token,
  mapWidth,
  mapHeight,
  gridSize,
  unitsPerSquare,
  isSelected,
  onSelect,
  onDrag,
  onDragEnd
}) => {
  const { to3D, to2D } = useGridCoordinates(mapWidth, mapHeight);
  const { size, viewport } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  // Load texture
  const fallbackUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const texture = useLoader(THREE.TextureLoader, token.imgUrl || fallbackUrl);

  const worldSize = (token.size || 1) * gridSize;
  const radius = worldSize / 2;
  const centerX = token.x + worldSize / 2;
  const centerY = token.y + worldSize / 2;
  const [initialX, initialY] = to3D(centerX, centerY);

  // Light Logic
  const lightRange = Math.max(token.light?.dimRadius || 0, token.light?.brightRadius || 0);
  const worldLightDistance = (lightRange / unitsPerSquare) * gridSize;
  const lightColor = token.light?.color || '#ffffff';
  // Boost intensity significantly for MeshStandardMaterial
  const lightIntensity = (token.light?.intensity || 0.5) * 5;

  // Sync position with props when not dragging
  useEffect(() => {
    if (!isDragging && groupRef.current) {
      groupRef.current.position.set(initialX, initialY, 0.1);
    }
  }, [initialX, initialY, isDragging]);

  const bind = useDrag(({ active, movement: [mx, my], first, event }) => {
    if (first) {
      // @ts-ignore
      event.stopPropagation();
      setIsDragging(true);
      onSelect?.(false);
    }

    // Convert screen movement to world units
    const factor = viewport.width / size.width;
    const dx = mx * factor;
    const dy = -my * factor;

    // Calculate new position relative to where we started dragging
    const newX = initialX + dx;
    const newY = initialY + dy;

    if (groupRef.current) {
      groupRef.current.position.set(newX, newY, 0.1);
    }

    // Convert back to 2D
    const [final2Dx, final2Dy] = to2D(newX, newY);
    const topLeftX = final2Dx - worldSize / 2;
    const topLeftY = final2Dy - worldSize / 2;

    if (active) {
      onDrag?.(topLeftX, topLeftY);
    } else {
      setIsDragging(false);
      onDragEnd?.(topLeftX, topLeftY);
    }
  }, { pointerEvents: true });

  const borderColor = token.border?.color || '#ffffff';

  const handleClick = (e: any) => {
    if (!isDragging) {
      e.stopPropagation();
      onSelect?.(e.shiftKey);
    }
  };

  return (
    // @ts-ignore
    <group ref={groupRef} {...bind()} position={[initialX, initialY, 0.1]} onClick={handleClick}>

      {/* Dynamic Light */}
      {token.light?.enabled && worldLightDistance > 0 && (
        <pointLight
          color={lightColor}
          distance={worldLightDistance}
          decay={1} // Linear falloff for better visibility range
          intensity={lightIntensity}
          position={[0, 0, gridSize * 0.5]} // Elevated light source
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
      )}

      {/* Selection Ring */}
      {isSelected && (
        <mesh position={[0, 0, -0.02]}>
          <ringGeometry args={[radius * 1.1, radius * 1.25, 32]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
        </mesh>
      )}

      {/* Token Base/Backing */}
      <mesh position={[0, 0, -0.01]} castShadow receiveShadow>
        <circleGeometry args={[radius * 1.05, 32]} />
        <meshStandardMaterial color={borderColor} roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Token Image */}
      <mesh castShadow receiveShadow>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>

      {/* Name Label */}
      {token.displayMode !== 'image' && (
        <Text
          position={[0, -radius - (gridSize * 0.2), 0]}
          fontSize={gridSize * 0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="black"
        >
          {token.name}
        </Text>
      )}

      {/* HP Bar */}
      {token.bars?.bar1 && token.bars.bar1.max > 0 && (token.bars.bar1.visible !== false) && (
        <group position={[0, radius + (gridSize * 0.15), 0]}>
          <mesh>
            <planeGeometry args={[worldSize, gridSize * 0.15]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh
            position={[
              (worldSize / 2) * ((Math.min(token.bars.bar1.value, token.bars.bar1.max) / token.bars.bar1.max) - 1),
              0,
              0.01
            ]}
          >
            <planeGeometry args={[
              worldSize * (Math.min(token.bars.bar1.value, token.bars.bar1.max) / token.bars.bar1.max),
              gridSize * 0.15
            ]} />
            <meshBasicMaterial color={token.bars.bar1.color || '#22c55e'} />
          </mesh>
        </group>
      )}
    </group>
  );
};
