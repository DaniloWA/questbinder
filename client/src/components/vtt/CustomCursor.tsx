import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getCursorShape } from './constants/cursorShapes';
import { renderToStaticMarkup } from 'react-dom/server';

interface CustomCursorProps {
  shapeId: string;
  color: string;
  enabled?: boolean;
  // Trail settings
  trailEnabled?: boolean;
  trailAnimation?: string;
  trailColor?: string;
  trailLength?: number;
}

/**
 * DOM-based custom cursor with physics animation
 * - Smooth lerp following
 * - Rotation based on movement direction
 * - Velocity-based stretch (squash & stretch)
 * - Click feedback (pulse/shrink)
 * - Trail animations matching remote cursor rendering
 */
export const CustomCursor: React.FC<CustomCursorProps> = ({
  shapeId = 'default',
  color = '#fbbf24',
  enabled = true,
  trailEnabled = false,
  trailAnimation = 'line',
  trailColor,
  trailLength = 20,
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
  const trailHistory = useRef<{ x: number, y: number, time: number; }[]>([]);
  const lastTrailTime = useRef(0);

  // Config
  const LERP_SPEED = 0.75;
  const STRETCH_FACTOR = 0.05;
  const TRAIL_MAX_AGE = 400; // ms - matching remote cursor

  // Responsive cursor size
  const screenMin = Math.min(window.innerWidth, window.innerHeight);
  const CURSOR_SIZE = Math.max(48, Math.min(64, Math.round(screenMin * 0.04)));

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

  // Helper to adjust alpha
  const adjustAlpha = (hexColor: string, alpha: number): string => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

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

      // Lerp movement
      cursorPos.current.x += distX * LERP_SPEED;
      cursorPos.current.y += distY * LERP_SPEED;

      // Calculate velocity
      const velocity = Math.sqrt(distX ** 2 + distY ** 2);

      // Squash & Stretch
      const scaleY = 1 + Math.min(velocity * STRETCH_FACTOR, 0.5);
      const scaleX = 1 - Math.min(velocity * STRETCH_FACTOR * 0.5, 0.2);

      // Calculate angle
      if (velocity > 0.5) {
        angle.current = Math.atan2(distY, distX) * (180 / Math.PI) + 90;
      }

      // Apply transform to cursor
      const halfSize = CURSOR_SIZE / 2;
      cursor.style.transform = `
        translate3d(${cursorPos.current.x - halfSize}px, ${cursorPos.current.y - halfSize}px, 0)
        rotate(${angle.current}deg)
        scale(${scaleX}, ${scaleY})
      `;

      // Trail Logic
      if (trailEnabled && trailCanvas) {
        const ctx = trailCanvas.getContext('2d');
        if (ctx) {
          const now = performance.now();

          // Add point to trail history if moving
          if (velocity > 2 && now - lastTrailTime.current > 16) { // ~60fps
            trailHistory.current.push({
              x: cursorPos.current.x,
              y: cursorPos.current.y,
              time: now,
            });
            lastTrailTime.current = now;

            // Limit trail length
            const maxPoints = trailLength * 2;
            if (trailHistory.current.length > maxPoints) {
              trailHistory.current = trailHistory.current.slice(-maxPoints);
            }
          }

          // Clear canvas
          ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

          // Render trail based on animation type
          const history = trailHistory.current;

          if (trailAnimation === 'line' && history.length > 2) {
            // Smooth Line (matching remote cursor)
            ctx.beginPath();
            ctx.moveTo(history[0].x, history[0].y);
            for (let i = 1; i < history.length - 1; i++) {
              const p0 = history[i];
              const p1 = history[i + 1];
              const midX = (p0.x + p1.x) / 2;
              const midY = (p0.y + p1.y) / 2;
              ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
            }
            ctx.lineTo(cursorPos.current.x, cursorPos.current.y);

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 4;
            ctx.strokeStyle = adjustAlpha(effectiveTrailColor, 0.4);
            ctx.stroke();
            // Core
            ctx.lineWidth = 1;
            ctx.strokeStyle = adjustAlpha(effectiveTrailColor, 0.8);
            ctx.stroke();

          } else if (trailAnimation === 'particles' || trailAnimation === 'sparkles' || trailAnimation === 'smoke' || trailAnimation === 'electric') {
            // Particle-based trails
            for (let i = 0; i < history.length; i++) {
              const trail = history[i];
              const age = now - trail.time;
              if (age > TRAIL_MAX_AGE) continue;

              const progress = age / TRAIL_MAX_AGE;
              const alpha = 1 - progress;
              const size = (4 + (i * 0.2)) * (1 - progress * 0.5);

              ctx.save();
              ctx.translate(trail.x, trail.y);
              ctx.globalAlpha = alpha * 0.6;

              if (trailAnimation === 'sparkles') {
                // Star shape
                ctx.fillStyle = effectiveTrailColor;
                const rot = progress * Math.PI;
                ctx.rotate(rot);
                ctx.beginPath();
                for (let k = 0; k < 5; k++) {
                  ctx.lineTo(Math.cos((18 + k * 72) / 180 * Math.PI) * size, -Math.sin((18 + k * 72) / 180 * Math.PI) * size);
                  ctx.lineTo(Math.cos((54 + k * 72) / 180 * Math.PI) * size * 0.4, -Math.sin((54 + k * 72) / 180 * Math.PI) * size * 0.4);
                }
                ctx.closePath();
                ctx.fill();
              } else if (trailAnimation === 'smoke') {
                // Smoky circles
                const driftY = -age * 0.05;
                ctx.translate(0, driftY);
                ctx.beginPath();
                ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
                ctx.fillStyle = '#666666';
                ctx.fill();
              } else if (trailAnimation === 'electric') {
                // Jittery lines
                const jitterX = (Math.random() - 0.5) * 10;
                const jitterY = (Math.random() - 0.5) * 10;
                ctx.translate(jitterX, jitterY);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-size, -size);
                ctx.lineTo(size, size);
                ctx.stroke();
              } else {
                // Standard particles
                ctx.fillStyle = effectiveTrailColor;
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
              }

              ctx.restore();
            }
          } else if (trailAnimation === 'dice') {
            // Dice trail
            for (let i = 0; i < history.length; i++) {
              const trail = history[i];
              const age = now - trail.time;
              if (age > TRAIL_MAX_AGE * 1.5) continue;

              const progress = age / (TRAIL_MAX_AGE * 1.5);
              const alpha = 1 - Math.pow(progress, 3);
              const val = Math.floor((trail.time % 20)) + 1;
              const size = 16;

              ctx.save();
              ctx.translate(trail.x, trail.y);
              ctx.rotate((age * 0.005) + (trail.time % Math.PI));
              ctx.translate(0, age * 0.05); // Gravity

              ctx.globalAlpha = alpha;
              ctx.fillStyle = '#FFFFFF';
              ctx.strokeStyle = effectiveTrailColor;
              ctx.lineWidth = 1;

              // Hexagon shape
              ctx.beginPath();
              for (let s = 0; s < 6; s++) {
                const angle = 2 * Math.PI / 6 * s;
                ctx.lineTo(size * Math.cos(angle), size * Math.sin(angle));
              }
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Number
              ctx.fillStyle = effectiveTrailColor;
              ctx.font = `bold 10px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(val.toString(), 0, 0);

              ctx.restore();
            }
          }

          // Cleanup old trail points
          trailHistory.current = history.filter(t => now - t.time < TRAIL_MAX_AGE * 2);
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
  }, [enabled, handleMouseMove, handleMouseDown, handleMouseUp, trailEnabled, trailAnimation, effectiveTrailColor, trailLength]);

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
          pointerEvents: 'none',
          zIndex: 99999,
          transformOrigin: 'center center',
          mixBlendMode: 'difference',
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
    </>
  );
};

export default CustomCursor;
