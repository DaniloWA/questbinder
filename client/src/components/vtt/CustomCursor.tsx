import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getCursorShape } from './constants/cursorShapes';
import { renderToStaticMarkup } from 'react-dom/server';

interface CustomCursorProps {
  shapeId: string;
  color: string;
  enabled?: boolean;
}

/**
 * DOM-based custom cursor with physics animation
 * - Smooth lerp following
 * - Rotation based on movement direction
 * - Velocity-based stretch (squash & stretch)
 * - Click feedback (pulse/shrink)
 * - Mix-blend-mode for visibility on any background
 */
export const CustomCursor: React.FC<CustomCursorProps> = ({
  shapeId = 'default',
  color = '#fbbf24',
  enabled = true,
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<{ x: number, y: number, vx: number, vy: number, age: number, el: HTMLDivElement; }[]>([]);
  const [isClicking, setIsClicking] = useState(false);

  // Animation state (refs to avoid re-renders)
  const mousePos = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const angle = useRef(0);
  const animationRef = useRef<number>(0);

  // Config
  const LERP_SPEED = 0.75; // Higher = faster follow (0.45 feels responsive yet smooth)
  const STRETCH_FACTOR = 0.05; // How much stretch on fast movement (reduced for faster lerp)

  // Responsive cursor size (larger on bigger screens)
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

  // Animation loop
  useEffect(() => {
    if (!enabled) return;

    const animate = () => {
      const cursor = cursorRef.current;
      if (!cursor) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculate distances
      const distX = mousePos.current.x - cursorPos.current.x;
      const distY = mousePos.current.y - cursorPos.current.y;

      // Lerp movement (smooth follow)
      cursorPos.current.x += distX * LERP_SPEED;
      cursorPos.current.y += distY * LERP_SPEED;

      // Calculate velocity (how fast mouse is moving)
      const velocity = Math.sqrt(distX ** 2 + distY ** 2);

      // Squash & Stretch based on velocity
      // scaleY increases with speed, scaleX decreases to preserve "volume"
      const scaleY = 1 + Math.min(velocity * STRETCH_FACTOR, 0.5);
      const scaleX = 1 - Math.min(velocity * STRETCH_FACTOR * 0.5, 0.2);

      // Calculate angle (only when moving)
      if (velocity > 0.5) {
        // atan2 gives angle in radians, convert to degrees, +90 to point cursor tip forward
        angle.current = Math.atan2(distY, distX) * (180 / Math.PI) + 90;
      }

      // Apply transform
      // Order: translate -> rotate -> scale
      const halfSize = CURSOR_SIZE / 2;
      cursor.style.transform = `
        translate3d(${cursorPos.current.x - halfSize}px, ${cursorPos.current.y - halfSize}px, 0)
        rotate(${angle.current}deg)
        scale(${scaleX}, ${scaleY})
      `;

      // Update Particles
      if (trailRef.current) {
        const particles = particlesRef.current;
        const PARTICLE_LIFETIME = 25; // frames

        // Spawn new particle if moved significantly
        if (velocity > 1.5 && Math.random() > 0.3) { // Reduced to 0.3 for more continuous trail
          const el = document.createElement('div');
          el.style.position = 'absolute';
          el.style.width = '6px';
          el.style.height = '6px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = color;
          el.style.opacity = '0.6';
          el.style.pointerEvents = 'none';
          trailRef.current.appendChild(el);

          particles.push({
            x: cursorPos.current.x,
            y: cursorPos.current.y,
            vx: (Math.random() - 0.5) * 2, // Slight scatter
            vy: (Math.random() - 0.5) * 2,
            age: 0,
            el
          });
        }

        // Update existing particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.age++;
          p.x += p.vx * 0.5;
          p.y += p.vy * 0.5;

          if (p.age > PARTICLE_LIFETIME) {
            if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
            particles.splice(i, 1);
          } else {
            const life = 1 - (p.age / PARTICLE_LIFETIME);
            p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${life})`;
            p.el.style.opacity = (life * 0.5).toString();
          }
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
  }, [enabled, handleMouseMove, handleMouseDown, handleMouseUp]);

  if (!enabled || !svgContent) return null;

  return (
    <>
      {/* Custom cursor element - cursor:none is applied via MapCanvas container */}

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

      {/* Particle Trail Container */}
      <div
        ref={trailRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 99998, // Below cursor
          overflow: 'hidden',
          mixBlendMode: 'difference',
        }}
      />
    </>
  );
};

export default CustomCursor;
