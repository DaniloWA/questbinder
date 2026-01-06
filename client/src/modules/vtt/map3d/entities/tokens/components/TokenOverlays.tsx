import React from 'react';
import { Html } from '@react-three/drei';
import { Token } from '../../../types/token.types';
import { useMapStore } from '../../../store/mapStore';
import { HP_BAR_COLOR_DEFAULT, HP_BAR_HEIGHT } from '../../../shared/constants/token.constants';

interface TokenOverlaysProps {
  token: Token;
  visible?: boolean;
}

export const TokenOverlays: React.FC<TokenOverlaysProps> = ({ token, visible = true }) => {
  const { grid } = useMapStore(state => state.mapData);

  if (!visible) return null;

  // Position HTML slightly above the token
  // Grid size * size = diameter. Radius = size/2. Plus some padding.
  const yOffset = (token.size * grid.size) / 2;

  return (
    <Html
      position={[0, yOffset, 0]}
      center
      style={{ pointerEvents: 'none', userSelect: 'none' }}
      zIndexRange={[100, 0]} // Ensure UI renders on top
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        transform: 'translateY(-100%)' // Move up so bottom attaches to anchor
      }}>
        {/* Nameplate */}
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 2px black'
        }}>
          {token.name}
        </div>

        {/* HP Bar 1 */}
        {token.bars?.bar1?.visible && (
          <div style={{
            width: '60px',
            height: '6px',
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid rgba(0,0,0,0.5)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(token.bars.bar1.value / token.bars.bar1.max) * 100}%`,
              height: '100%',
              backgroundColor: token.bars.bar1.color || HP_BAR_COLOR_DEFAULT,
              transition: 'width 0.2s ease-out'
            }} />
          </div>
        )}
      </div>
    </Html>
  );
};
