import React, { memo } from 'react';
import { Html } from '@react-three/drei';
import { Condition } from '../../../types/token.types';
import { useMapStore } from '../../../store/mapStore';
import {
  Skull, Droplets, Zap, Shield, AlertCircle, ArrowDown,
  Pause, Moon, FlaskConical, EyeOff, EarOff, Ghost,
  Heart, Eye, Lock, Hand, Brain
} from 'lucide-react';

/**
 * Map condition to icon component.
 * Using lucide-react for consistent, lightweight SVG icons.
 */
const CONDITION_ICONS: Record<Condition, React.ReactNode> = {
  dead: <Skull className="w-3 h-3" />,
  bloodied: <Droplets className="w-3 h-3" />,
  stunned: <Zap className="w-3 h-3" />,
  shielded: <Shield className="w-3 h-3" />,
  alert: <AlertCircle className="w-3 h-3" />,
  prone: <ArrowDown className="w-3 h-3" />,
  paralyzed: <Pause className="w-3 h-3" />,
  unconscious: <Moon className="w-3 h-3" />,
  poisoned: <FlaskConical className="w-3 h-3" />,
  blinded: <EyeOff className="w-3 h-3" />,
  deafened: <EarOff className="w-3 h-3" />,
  frightened: <Ghost className="w-3 h-3" />,
  charmed: <Heart className="w-3 h-3" />,
  invisible: <Eye className="w-3 h-3" />,
  restrained: <Lock className="w-3 h-3" />,
  grappled: <Hand className="w-3 h-3" />,
  concentrating: <Brain className="w-3 h-3" />
};

/**
 * Map condition to background color for visual distinction.
 */
const CONDITION_COLORS: Partial<Record<Condition, string>> = {
  dead: '#1c1c1c',
  bloodied: '#dc2626',
  stunned: '#facc15',
  shielded: '#3b82f6',
  poisoned: '#22c55e',
  blinded: '#6b7280',
  unconscious: '#4b5563',
  concentrating: '#a855f7'
};

interface TokenConditionsProps {
  conditions: Condition[];
  tokenSize: number;
}

/**
 * Renders condition icons as a billboard overlay above the token.
 * 
 * Performance optimizations:
 * - Memoized to prevent re-renders unless conditions change
 * - Uses Html component with pointer-events:none
 * - Icons use CSS flexbox for auto-wrap
 */
export const TokenConditions: React.FC<TokenConditionsProps> = memo(({ conditions, tokenSize }) => {
  const { grid } = useMapStore(state => state.mapData);

  if (!conditions || conditions.length === 0) return null;

  // Position above the token nameplate
  const yOffset = (tokenSize * grid.size) / 2 + 8;

  return (
    <Html
      position={[0, yOffset, 0]}
      center
      style={{ pointerEvents: 'none', userSelect: 'none' }}
      zIndexRange={[100, 0]}
    >
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '2px',
        maxWidth: '80px',
        transform: 'translateY(-100%)'
      }}>
        {conditions.slice(0, 8).map((condition) => (
          <div
            key={condition}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              borderRadius: '4px',
              backgroundColor: CONDITION_COLORS[condition] || '#374151',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}
            title={condition}
          >
            {CONDITION_ICONS[condition]}
          </div>
        ))}
        {/* Overflow indicator */}
        {conditions.length > 8 && (
          <div style={{
            fontSize: '10px',
            color: 'white',
            backgroundColor: '#374151',
            padding: '2px 4px',
            borderRadius: '4px'
          }}>
            +{conditions.length - 8}
          </div>
        )}
      </div>
    </Html>
  );
});

TokenConditions.displayName = 'TokenConditions';
