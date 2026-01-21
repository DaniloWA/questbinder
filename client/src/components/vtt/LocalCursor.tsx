import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getCursorShape } from './constants/cursorShapes';
import { renderToStaticMarkup } from 'react-dom/server';
import { getToolIcon } from '../../constants/toolIcons';
import { HealthStatus } from '../../utils/trailRenderer';
import { getToolTranslationKey } from '../../utils/toolMappings';
import { useTranslation } from '../../i18n/TranslationContext';
import {
  getDynamicCursorSize,
  VISUAL_LERP_SPEED,
  STRETCH_FACTOR,
  MAX_STRETCH,
  MAX_SQUASH,
} from '../../constants/cursorConstants';

interface CustomCursorProps {
  shapeId: string;
  color: string;
  enabled?: boolean;
  trailEnabled?: boolean;
  trailAnimation?: string;
  trailColor?: string;
  trailLength?: number;
  trailThickness?: number;
  trailSize?: number;
  trailCustomImage?: string;
  healthStatus?: HealthStatus;
  activeTool?: string;
  isContexting?: boolean;
  isChatting?: boolean;
  isDragging?: boolean;
}

/**
 * DOM-based local cursor with physics animation
 * - Smooth lerp following
 * - Rotation based on movement direction
 * - Velocity-based stretch (squash & stretch)
 * - Click feedback (pulse/shrink)
 * 
 * NOTE: Trail rendering determines local trail logic but is rendered via Canvas in useMapRenderer.ts
 */
export const LocalCursor: React.FC<CustomCursorProps> = ({
  shapeId = 'default',
  color = '#fbbf24',
  enabled = true,
  activeTool,
  isContexting,
  isChatting,
  isDragging,
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const [isClicking, setIsClicking] = useState(false);
  const { t } = useTranslation();

  // Animation state (refs to avoid re-renders)
  const mousePos = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const angle = useRef(0);
  const animationRef = useRef<number>(0);

  // Dynamic cursor size
  const CURSOR_SIZE = getDynamicCursorSize();

  // Generate SVG content
  const svgContent = React.useMemo(() => {
    const shape = getCursorShape(shapeId);
    if (!shape.Component) return null;

    const markup = renderToStaticMarkup(
      React.createElement(shape.Component, { color, size: CURSOR_SIZE })
    );
    return markup;
  }, [shapeId, color, CURSOR_SIZE]);

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Click handlers
  const handleMouseDown = useCallback(() => setIsClicking(true), []);
  const handleMouseUp = useCallback(() => setIsClicking(false), []);

  // Animation loop
  useEffect(() => {
    if (!enabled) return;

    const animate = () => {
      const cursor = cursorRef.current;
      const badge = badgeRef.current;

      if (!cursor) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculate distances
      const distX = mousePos.current.x - cursorPos.current.x;
      const distY = mousePos.current.y - cursorPos.current.y;

      // Lerp movement
      cursorPos.current.x += distX * VISUAL_LERP_SPEED;
      cursorPos.current.y += distY * VISUAL_LERP_SPEED;

      // Calculate velocity
      const velocity = Math.sqrt(distX ** 2 + distY ** 2);

      // Squash & Stretch
      const scaleY = 1 + Math.min(velocity * STRETCH_FACTOR, MAX_STRETCH);
      const scaleX = 1 - Math.min(velocity * STRETCH_FACTOR * 0.5, MAX_SQUASH);

      // Calculate angle
      if (velocity > 0.5) {
        angle.current = Math.atan2(distY, distX) * (180 / Math.PI) + 90;
      }

      // Apply transform to CURSOR SHAPE (Rotate + Squash)
      const halfSize = CURSOR_SIZE / 2;
      cursor.style.transform = `translate3d(${cursorPos.current.x - halfSize}px, ${cursorPos.current.y - halfSize}px, 0) rotate(${angle.current}deg) scale(${scaleX}, ${scaleY})`;

      // Apply transform to BADGE CONTAINER (Position Only - No Rotation)
      if (badge) {
        badge.style.transform = `translate3d(${cursorPos.current.x}px, ${cursorPos.current.y}px, 0)`;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initialize cursor position
    cursorPos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationRef.current);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [enabled, handleMouseMove, handleMouseDown, handleMouseUp, CURSOR_SIZE]);

  if (!enabled || !svgContent || isDragging) return null;

  const showToolBadge = activeTool && activeTool !== 'select' && activeTool !== 'pan' && activeTool !== 'combat';

  return (
    <>
      {/* 1. Rotated Cursor Shape */}
      <div
        ref={cursorRef}
        className={`custom-cursor ${isClicking ? 'clicking' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: CURSOR_SIZE,
          height: CURSOR_SIZE,
          zIndex: 99999,
          transformOrigin: 'center center',
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      >
        <div
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{
            width: '100%',
            height: '100%',
            transition: 'transform 0.08s ease-out, filter 0.08s ease-out',
            transform: isClicking ? 'scale(0.6)' : 'scale(1)',
            filter: isClicking ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' : 'none',
          }}
        />
      </div>

      {/* 2. Stable Badge Container (No Rotation) */}
      <div
        ref={badgeRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 99999,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      >
        {/* Status Indicator (Chat or Combat) */}
        {(isChatting || activeTool === 'combat') && (
          <div className="absolute -top-6 -left-6 text-lg filter drop-shadow-md z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {isChatting ? '💬' : '⚔️'}
          </div>
        )}

        {/* Context Menu Indicator */}
        {isContexting && (
          <div className="absolute -top-5 -right-5 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md border border-zinc-200 z-50 animate-in fade-in zoom-in duration-200">
            <span className="text-xs font-bold text-zinc-800 leading-none pb-1">•••</span>
          </div>
        )}

        {/* Active Tool Badge (Icon + Text) */}
        {showToolBadge && (
          <div
            className="absolute left-4 top-5 flex items-center gap-1.5 bg-zinc-900/95 text-white text-[11px] font-bold px-2 py-1.5 rounded shadow-lg border border-white/10 whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <span className="text-primary text-xs">{getToolIcon(activeTool)}</span>
            <span className="tracking-tight">{t(getToolTranslationKey(activeTool))}</span>
          </div>
        )}
      </div>
    </>
  );
};
export default LocalCursor;
