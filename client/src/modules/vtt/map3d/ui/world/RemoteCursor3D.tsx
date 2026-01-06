import React from 'react';
import { CursorMovePayload } from '@/types/socket';
import { Html } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';

interface RemoteCursor3DProps {
  cursor: CursorMovePayload;
}

export const RemoteCursor3D: React.FC<RemoteCursor3DProps> = ({ cursor }) => {

  const { position } = useSpring({
    position: [cursor.x, 0.1, cursor.y],
    config: { tension: 150, friction: 15 }
  });

  const cursorColor = cursor.userColor || '#ffffff';

  return (
    <animated.group position={position as any}>
      {/* Render Nameplate via HTML billboard */}
      <Html center position={[0, 0.5, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          backgroundColor: cursorColor,
          padding: '2px 8px',
          borderRadius: '12px',
          color: 'black',
          fontWeight: 'bold',
          fontSize: '10px',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
          opacity: 0.8
        }}>
          {cursor.userName}
        </div>
      </Html>

      {/* Simple 3D Pointer geometry */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.5, 8]} />
        <meshStandardMaterial color={cursorColor} />
      </mesh>
    </animated.group>
  );
};
