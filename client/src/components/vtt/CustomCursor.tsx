import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getCursorShape } from './constants/cursorShapes';
import { renderToStaticMarkup } from 'react-dom/server';
import { getToolIcon } from '../../constants/toolIcons';
import {
  renderTrail,
  TrailPoint,
  TrailAnimation,
  HealthStatus,
  cleanupTrailHistory,
} from '../../utils/trailRenderer';
import {
  getDynamicCursorSize,
  VISUAL_LERP_SPEED,
  STRETCH_FACTOR,
  MAX_STRETCH,
  MAX_SQUASH,
  TRAIL_MAX_POINTS,
  TRAIL_MIN_DISTANCE,
  TRAIL_THROTTLE_MS,
} from '../../constants/cursorConstants';

interface CustomCursorProps {
  shapeId: string;
  color: string;
  enabled?: boolean;
  // Trail settings
  trailEnabled?: boolean;
  trailAnimation?: string;
  trailColor?: string;
  trailLength?: number;
  healthStatus?: HealthStatus;
  activeTool?: string;
  isContexting?: boolean;
  isChatting?: boolean;
}

/**
 * DOM-based custom cursor with physics animation
 * - Smooth lerp following
 * - Rotation based on movement direction
 * - Velocity-based stretch (squash & stretch)
 * - Click feedback (pulse/shrink)
 * - Trail animations using shared trailRenderer module
 */
export const CustomCursor: React.FC<CustomCursorProps> = ({
  shapeId = 'default',
  color = '#fbbf24',
  enabled = true,
  trailEnabled = false,
  trailAnimation = 'line',
  trailColor,
  trailLength = 20,
  healthStatus = 'healthy',
  activeTool,
  isContexting,
  isChatting,
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isClicking, setIsClicking] = useState(false);

  // Use trailColor or default to cursor color
  const effectiveTrailColor = trailColor || color;

  // Animation state (refs to avoid re-renders)
  const mousePos = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const angle = useRef(0);
  const animationRef = useRef<number>(0);

  // Trail history storage
  const trailHistory = useRef<TrailPoint[]>([]);
  const lastTrailTime = useRef(0);

  // Dynamic cursor size (from shared constants)
  const CURSOR_SIZE = getDynamicCursorSize();

  // Generate SVG content
  const svgContent = React.useMemo(() => {
    const shape = getCursorShape(shapeId);
    if (!shape.Component) return null;

    const markup = renderToStaticMarkup(
      React.createElement(shape.Component, { color, size: CURSOR_SIZE })
    );
    return markup;
  }, [shapeId, color]);

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
      const trailCanvas = trailCanvasRef.current;

      if (!cursor) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculate distances
      const distX = mousePos.current.x - cursorPos.current.x;
      const distY = mousePos.current.y - cursorPos.current.y;

      // Lerp movement (using shared constant)
      cursorPos.current.x += distX * VISUAL_LERP_SPEED;
      cursorPos.current.y += distY * VISUAL_LERP_SPEED;

      // Calculate velocity
      const velocity = Math.sqrt(distX ** 2 + distY ** 2);

      // Squash & Stretch (using shared constants)
      const scaleY = 1 + Math.min(velocity * STRETCH_FACTOR, MAX_STRETCH);
      const scaleX = 1 - Math.min(velocity * STRETCH_FACTOR * 0.5, MAX_SQUASH);

      // Calculate angle
      if (velocity > 0.5) {
        angle.current = Math.atan2(distY, distX) * (180 / Math.PI) + 90;
      }

      // Apply transform to cursor
      const halfSize = CURSOR_SIZE / 2;
      cursor.style.transform = `translate3d(${cursorPos.current.x - halfSize}px, ${cursorPos.current.y - halfSize}px, 0) rotate(${angle.current}deg) scale(${scaleX}, ${scaleY})`;

      // Trail Logic - Using shared trailRenderer module
      if (trailEnabled && trailCanvas) {
        const ctx = trailCanvas.getContext('2d');
        if (ctx) {
          const now = performance.now();

          // Add point to trail history if moving fast enough (using shared constants)
          if (velocity > TRAIL_MIN_DISTANCE && now - lastTrailTime.current > TRAIL_THROTTLE_MS) {
            trailHistory.current.push({
              x: cursorPos.current.x,
              y: cursorPos.current.y,
              time: now,
            });
            lastTrailTime.current = now;

            // Limit trail length (using shared constant)
            if (trailHistory.current.length > TRAIL_MAX_POINTS) {
              trailHistory.current = trailHistory.current.slice(-TRAIL_MAX_POINTS);
            }
          }

          // Clear canvas
          ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

          // Render trail using shared module (zoom=1 for screen coordinates)
          if (trailHistory.current.length > 0) {
            renderTrail(
              ctx,
              trailHistory.current,
              {
                enabled: true,
                color: effectiveTrailColor,
                animation: trailAnimation as TrailAnimation,
              },
              {
                zoom: 1, // Screen coordinates, no zoom
                currentPosition: cursorPos.current,
                healthStatus,
              }
            );
          }

          // Cleanup old trail points
          trailHistory.current = cleanupTrailHistory(trailHistory.current, healthStatus);
        }
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
  }, [enabled, handleMouseMove, handleMouseDown, handleMouseUp, trailEnabled, trailAnimation, effectiveTrailColor, trailLength, healthStatus]);

  if (!enabled || !svgContent) return null;

  return (
    <>
      {/* Trail Canvas - below cursor */}
      {trailEnabled && (
        <canvas
          ref={trailCanvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 99998,
          }}
        />
      )}

      {/* Custom cursor element */}
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

        {/* Status Indicator (Chat or Combat) */}
        {(isChatting || activeTool === 'combat') && (
          <div className="absolute -top-4 -left-4 text-sm filter drop-shadow-md z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {isChatting ? '💬' : '⚔️'}
          </div>
        )}

        {/* Context Menu Indicator */}
        {isContexting && (
          <div className="absolute -top-4 -right-4 bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-zinc-200 z-50 animate-in fade-in zoom-in duration-200">
            <span className="text-[10px] font-bold text-zinc-800 leading-none pb-1">•••</span>
          </div>
        )}

        {/* Active Tool Indicator */}
        {activeTool && activeTool !== 'select' && activeTool !== 'pan' && activeTool !== 'combat' && (
          <div className="absolute -bottom-4 -right-4 text-lg filter drop-shadow-md z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {getToolIcon(activeTool)}
          </div>
        )}
      </div>
    </>
  );
};

export default CustomCursor;
