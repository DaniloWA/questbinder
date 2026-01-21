import React, { useEffect, useRef, useCallback, memo } from 'react';
import { Move, MousePointer2, Grid3X3, ZoomIn, Map } from 'lucide-react';

interface PrecisionCursorProps {
  enabled: boolean;
  mode: 'inspect' | 'drag' | '3point';
  gridSize: number;
  offsetX: number;
  offsetY: number;
  cols: number;
  rows: number;
  viewport: { x: number; y: number; zoom: number; };
  activeCalibrationRef?: React.RefObject<{ x: number, y: number; }[]>;
  onConfirmCalibration?: () => void;
  onCancelCalibration?: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

/**
 * Premium Precision Cursor & HUD
 * Optimized with React.memo and dedicated animation frame loop for zero lag.
 */
const PrecisionCursorComponent: React.FC<PrecisionCursorProps> = ({
  enabled,
  mode,
  gridSize,
  offsetX,
  offsetY,
  cols,
  rows,
  viewport,
  activeCalibrationRef,
  onConfirmCalibration,
  onCancelCalibration,
  canvasRef
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const lensCanvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);

  // Refs for DOM elements (Direct Update)
  const coordsRef = useRef<HTMLSpanElement>(null);
  const cellRef = useRef<HTMLSpanElement>(null);
  const offsetRef = useRef<HTMLSpanElement>(null);
  const snapRef = useRef<HTMLDivElement>(null);
  const calibrationRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null); // NEW: Buttons container
  const zoomRef = useRef<HTMLSpanElement>(null);

  // Calibration Overlay Refs (Pool)
  const overlayRef = useRef<SVGSVGElement>(null);
  const markersRef = useRef<(SVGCircleElement | null)[]>([]);
  const linesRef = useRef<(SVGLineElement | null)[]>([]);
  const labelsRef = useRef<(SVGTextElement | null)[]>([]);

  // Animation Loop for Smoothness (60fps decoupled from React)
  useEffect(() => {
    if (!enabled) return;

    let animationFrameId: number;

    const render = () => {
      const { x, y } = mousePos.current;

      // 1. Position Update (Zero Lag)
      if (cursorRef.current && hudRef.current) {
        cursorRef.current.style.transform = `translate(${x - 24}px, ${y - 24}px) scale(${isMouseDown.current ? 0.9 : 1})`;
        hudRef.current.style.transform = `translate(${x + 40}px, ${y + 20}px)`;
      }

      // 2. Data Calculation
      // Check for preview override (from MapAlignerTool)
      const preview = (cursorRef as any).currentPreview;
      // Use preview values if they exist, otherwise fall back to props (Server True State)
      // Check if preview is recent? (Not strictly necessary if we manage it well, but good for safety)
      // For now, simple override.
      const activeGridSize = preview ? preview.size : gridSize;
      const activeOffsetX = preview ? preview.offsetX : offsetX;
      const activeOffsetY = preview ? preview.offsetY : offsetY;

      // Avoid destructuring big props if possible inside loop, but needed for math
      const worldX = (x - viewport.x) / viewport.zoom;
      const worldY = (y - viewport.y) / viewport.zoom;

      const gridRelX = worldX - activeOffsetX;
      const gridRelY = worldY - activeOffsetY;
      const cellCol = Math.floor(gridRelX / activeGridSize);
      const cellRow = Math.floor(gridRelY / activeGridSize);
      const cellInternalX = ((gridRelX % activeGridSize) + activeGridSize) % activeGridSize;
      const cellInternalY = ((gridRelY % activeGridSize) + activeGridSize) % activeGridSize;

      const distToLeft = cellInternalX;
      const distToRight = activeGridSize - cellInternalX;
      const distToTop = cellInternalY;
      const distToBottom = activeGridSize - cellInternalY;
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      const isSnapping = minDist <= (5 / viewport.zoom);

      // 3. Zoom Lens Update
      if (lensCanvasRef.current && canvasRef?.current) {
        const ctx = lensCanvasRef.current.getContext('2d');
        const mainCanvas = canvasRef.current;
        if (ctx && mainCanvas) {
          // Lens settings
          const lensSize = 80; // Size of lens box
          const lensZoom = 2;  // Magnification factor

          // Clear
          ctx.clearRect(0, 0, lensSize, lensSize);

          // Draw scaled chunk
          // Source: mouse position on canvas (screen coords should match canvas size if pixel ratio 1:1, usually mostly true for extract)
          // But canvas has its own resolution. Assuming canvas width = screen width logic or utilizing scale.
          // If canvas is high-DPI, usage might be complex. Simplest: drawImage with generic coords.
          const sWidth = lensSize / lensZoom;
          const sHeight = lensSize / lensZoom;
          const sx = x * (mainCanvas.width / window.innerWidth) - (sWidth / 2);
          const sy = y * (mainCanvas.height / window.innerHeight) - (sHeight / 2);

          ctx.imageSmoothingEnabled = false; // Pixelated for precision check? Or smooth? Pixelated is better for grid align.

          try {
            ctx.drawImage(
              mainCanvas,
              sx, sy, sWidth, sHeight,
              0, 0, lensSize, lensSize
            );
          } catch (e) {
            // Canvas state might be not ready
          }

          // Draw Crosshair on Lens (Cyan/Teal for contrast against Red Grid)
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)'; // Cyan-500
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lensSize / 2, 0); ctx.lineTo(lensSize / 2, lensSize);
          ctx.moveTo(0, lensSize / 2); ctx.lineTo(lensSize, lensSize / 2);
          ctx.stroke();
        }
      }

      // 4. Data Updates (Text Content)
      if (coordsRef.current) coordsRef.current.textContent = `${Math.round(worldX)}, ${Math.round(worldY)}`;
      if (offsetRef.current) offsetRef.current.textContent = `${Math.round(cellInternalX)} : ${Math.round(cellInternalY)}`;
      if (cellRef.current) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let colLabel = '';
        if (cellCol >= 0 && cellCol < cols) {
          if (cellCol < 26) colLabel = letters[cellCol];
          else colLabel = letters[Math.floor(cellCol / 26) - 1] + letters[cellCol % 26];
        } else { colLabel = '?'; }
        const rowLabel = (cellRow >= 0 && cellRow < rows) ? (cellRow + 1).toString() : '?';
        cellRef.current.textContent = `${colLabel}${rowLabel}`;
        cellRef.current.style.color = (colLabel === '?' || rowLabel === '?') ? '#ef4444' : '#ffffff';
      }

      if (snapRef.current) {
        if (isSnapping) {
          if (snapRef.current.style.opacity !== '1') snapRef.current.style.opacity = '1';
          snapRef.current.innerHTML = `<span class="text-emerald-400 font-bold tracking-widest text-[9px]">SNAP</span> <span class="text-zinc-500 text-[9px]">${Math.round(minDist)}px</span>`;
          snapRef.current.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        } else {
          if (snapRef.current.style.opacity !== '0.5') snapRef.current.style.opacity = '0.5';
          snapRef.current.innerHTML = `<span class="text-zinc-600 font-medium text-[9px]">FREE</span>`;
          snapRef.current.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        }
      }

      // Update Zoom Text (Optimization: only if changed? TextContent is fast enough here)
      if (zoomRef.current) zoomRef.current.textContent = `${Math.round(viewport.zoom * 100)}%`;

      // 5. Calibration Overlay & HUD
      // Always clear overlay first (hide all)
      markersRef.current.forEach(el => { if (el) el.setAttribute('display', 'none'); });
      linesRef.current.forEach(el => { if (el) el.setAttribute('display', 'none'); });
      labelsRef.current.forEach(el => { if (el) el.setAttribute('display', 'none'); });

      if (mode === '3point' && activeCalibrationRef) {
        const points = activeCalibrationRef.current;
        const count = points.length;

        // Draw stored points
        points.forEach((p, i) => {
          const sx = p.x * viewport.zoom + viewport.x;
          const sy = p.y * viewport.zoom + viewport.y;

          const marker = markersRef.current[i];
          if (marker) {
            marker.setAttribute('display', 'block');
            marker.setAttribute('cx', sx.toString());
            marker.setAttribute('cy', sy.toString());
          }

          // Draw line to next point (or cursor if it's the active segment)
          if (i < count - 1) {
            const pNext = points[i + 1];
            const sx2 = pNext.x * viewport.zoom + viewport.x;
            const sy2 = pNext.y * viewport.zoom + viewport.y;
            const line = linesRef.current[i];
            const label = labelsRef.current[i];
            if (line && label) {
              line.setAttribute('display', 'block');
              line.setAttribute('x1', sx.toString());
              line.setAttribute('y1', sy.toString());
              line.setAttribute('x2', sx2.toString());
              line.setAttribute('y2', sy2.toString());

              // Distance label
              const dist = Math.hypot(pNext.x - p.x, pNext.y - p.y);
              label.setAttribute('display', 'block');
              label.setAttribute('x', ((sx + sx2) / 2).toString());
              label.setAttribute('y', ((sy + sy2) / 2 - 10).toString());
              label.textContent = `${Math.round(dist)}px`;
            }
          }
        });

        // Draw active line from last point to cursor
        if (count > 0 && count < 3) {
          const lastP = points[count - 1];
          const sx = lastP.x * viewport.zoom + viewport.x;
          const sy = lastP.y * viewport.zoom + viewport.y;

          const line = linesRef.current[count - 1]; // Use next available line slot (0 for 1st segment, 1 for 2nd)
          const label = labelsRef.current[count - 1];

          if (line && label) {
            line.setAttribute('display', 'block');
            line.setAttribute('x1', sx.toString());
            line.setAttribute('y1', sy.toString());
            line.setAttribute('x2', x.toString());
            line.setAttribute('y2', y.toString());
            line.setAttribute('stroke-dasharray', '4,4'); // Dashed for partial

            // Calc world dist
            const dist = Math.hypot(worldX - lastP.x, worldY - lastP.y);
            label.setAttribute('display', 'block');
            label.setAttribute('x', ((sx + x) / 2).toString());
            label.setAttribute('y', ((sy + y) / 2 - 10).toString());
            label.textContent = `${Math.round(dist)}px`;
          }
        }

        // Update HUD visual
        if (calibrationRef.current) {

          // If 3 points, show confirmation buttons instead of next instruction
          if (count === 3) {
            calibrationRef.current.style.display = 'none'; // Hide text/dots

            if (buttonsRef.current) {
              buttonsRef.current.style.display = 'flex';
              // Position buttons near the last point (P3)
              const p3 = points[2];
              if (p3) {
                const p3sx = p3.x * viewport.zoom + viewport.x;
                const p3sy = p3.y * viewport.zoom + viewport.y;
                // Offset slightly to right/bottom
                buttonsRef.current.style.transform = `translate(${p3sx + 10}px, ${p3sy + 10}px)`;
              }
            }
          } else {
            if (buttonsRef.current) buttonsRef.current.style.display = 'none';
            calibrationRef.current.style.display = 'flex';

            let label = "Click Point 1 (Top-Left)";
            if (count === 1) label = "Click Point 2 (Top-Right)";
            if (count === 2) label = "Click Point 3 (Bottom-Left)";

            calibrationRef.current.innerHTML = `
                  <div class="flex gap-1 mb-1">
                     <div class="w-2 h-2 rounded-full ${count >= 0 ? 'bg-amber-500' : 'bg-zinc-800 border border-zinc-700'}"></div>
                     <div class="w-2 h-2 rounded-full ${count >= 1 ? 'bg-amber-500' : 'bg-zinc-800 border border-zinc-700'}"></div>
                     <div class="w-2 h-2 rounded-full ${count >= 2 ? 'bg-amber-500' : 'bg-zinc-800 border border-zinc-700'}"></div>
                  </div>
                  <span class="text-[9px] font-bold text-amber-500">${label}</span>
               `;
          }
        }
      } else {
        if (calibrationRef.current) calibrationRef.current.style.display = 'none';
        if (buttonsRef.current) buttonsRef.current.style.display = 'none';
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [enabled, viewport, gridSize, offsetX, offsetY, cols, rows, mode, activeCalibrationRef, canvasRef]);

  // Mouse Events attached to Window to capture everything
  useEffect(() => {
    if (!enabled) return;
    const handleMouseMove = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    const handleMouseDown = () => { isMouseDown.current = true; };
    const handleMouseUp = () => { isMouseDown.current = false; };

    // PREVIEW SYSTEM: Listen for local updates from MapAlignerTool
    // This allows instant 60fps feedback without round-tripping to the server
    const handleGridPreview = (e: CustomEvent) => {
      e.stopPropagation(); // Keep it local
      const { size, offsetX: offX, offsetY: offY } = e.detail;

      // Store in a ref so the animation loop picks it up immediately
      // We attach a timestamp so we know when to expire/fallback if needed (optional)
      (cursorRef as any).currentPreview = { size, offsetX: offX, offsetY: offY, ts: Date.now() };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('questbinder:grid-preview' as any, handleGridPreview as any);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('questbinder:grid-preview' as any, handleGridPreview as any);
    };
  }, [enabled]);

  if (!enabled) return null;

  const modeConfig = {
    'inspect': { label: 'INSPECTOR', color: '#3b82f6', icon: <Grid3X3 className="w-3 h-3" /> },
    'drag': { label: 'DRAG ALIGN', color: '#a855f7', icon: <Move className="w-3 h-3" /> },
    '3point': { label: '3-POINT', color: '#f59e0b', icon: <MousePointer2 className="w-3 h-3" /> }
  };
  const currentMode = modeConfig[mode] || modeConfig['inspect'];

  return (
    <>
      {/* 3-Point Calibration Full Screen Overlay */}
      <svg className="fixed inset-0 pointer-events-none z-[99990] overflow-visible">
        {/* Pool of elements (Max 3 points, 2 lines, 2 labels for this specific tool) */}
        <line ref={el => { linesRef.current[0] = el; }} stroke="#f59e0b" strokeWidth="2" display="none" />
        <line ref={el => { linesRef.current[1] = el; }} stroke="#f59e0b" strokeWidth="2" display="none" />

        <text ref={el => { labelsRef.current[0] = el; }} fill="#f59e0b" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle" display="none" style={{ textShadow: '0 2px 4px black' }} />
        <text ref={el => { labelsRef.current[1] = el; }} fill="#f59e0b" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle" display="none" style={{ textShadow: '0 2px 4px black' }} />

        <circle ref={el => { markersRef.current[0] = el; }} r="4" fill="#f59e0b" stroke="white" strokeWidth="1" display="none" />
        <circle ref={el => { markersRef.current[1] = el; }} r="4" fill="#f59e0b" stroke="white" strokeWidth="1" display="none" />
        <circle ref={el => { markersRef.current[2] = el; }} r="4" fill="#f59e0b" stroke="white" strokeWidth="1" display="none" />
      </svg>
      {/* Precision Crosshair */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[99999] transition-transform duration-75 ease-out"
        style={{ willChange: 'transform' }}
      >
        <svg width={48} height={48} viewBox="0 0 48 48" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>
          {/* Outer Ring */}
          <circle cx={24} cy={24} r={12} fill="none" stroke="white" strokeWidth={1.5} style={{ mixBlendMode: 'difference' }} />
          {/* Crosshairs */}
          <line x1={24} y1={0} x2={24} y2={48} stroke="white" strokeWidth={1} style={{ mixBlendMode: 'difference' }} />
          <line x1={0} y1={24} x2={48} y2={24} stroke="white" strokeWidth={1} style={{ mixBlendMode: 'difference' }} />
          {/* Center Dot - REMOVED per user request */}
        </svg>
      </div>

      {/* RICH HUD PANEL */}
      <div
        ref={hudRef}
        className="fixed top-0 left-0 pointer-events-none z-[99998] flex gap-2 items-start"
        style={{ willChange: 'transform' }}
      >
        {/* ZOOM LENS (Left Side) */}
        <div className="bg-black border border-zinc-700 rounded-lg overflow-hidden shadow-xl" style={{ width: 82, height: 82 }}>
          <canvas ref={lensCanvasRef} width={80} height={80} className="w-full h-full block" />
        </div>

        {/* 3-Point Actions Bar (Repositioned to Global Fixed, moved out of HUD flow visually via Matrix, but in DOM structure here for simplicity or move it out?) 
            Actually, to separate it from HUD movement, it should be outside this div or we counteract the transform. 
            Easiest is to move it outside the hudRef div. 
        */}


        {/* DATA PANEL (Right Side) */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <div className="bg-zinc-950/90 backdrop-blur border border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5" style={{ backgroundColor: `${currentMode.color}15` }}>
              <div className="flex items-center gap-1.5" style={{ color: currentMode.color }}>
                {currentMode.icon}
                <span className="text-[10px] font-black tracking-wider">{currentMode.label}</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-500">
                <ZoomIn className="w-2.5 h-2.5" />
                <span ref={zoomRef} className="text-[9px] font-mono">100%</span>
              </div>
            </div>

            {/* Grid Coordinates */}
            <div className="grid grid-cols-[1fr_1px_1fr] border-b border-white/5 bg-zinc-900/50">
              <div className="p-2 flex flex-col items-center justify-center">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Cell</span>
                <span ref={cellRef} className="text-sm font-mono font-bold text-white leading-none mt-0.5">A1</span>
              </div>
              <div className="bg-white/5 h-full" />
              <div className="p-2 flex flex-col items-center justify-center">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Rel. Pos</span>
                <span ref={offsetRef} className="text-xs font-mono text-zinc-300 leading-none mt-0.5">0 : 0</span>
              </div>
            </div>

            {/* World Coords & Snap */}
            <div className="p-2 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Map className="w-3 h-3" />
                <span ref={coordsRef} className="text-[10px] font-mono">0, 0</span>
              </div>
              <div ref={snapRef} className="border border-white/5 px-1.5 py-0.5 rounded flex items-center gap-1.5 transition-all duration-200">
                <span className="text-zinc-600 text-[9px] font-medium">FREE</span>
              </div>
            </div>
          </div>

          {/* Helper Tip / 3-Point Calibration */}
          <div ref={calibrationRef} className="bg-zinc-950/90 border border-zinc-800 p-2 rounded-lg backdrop-blur flex-col items-center justify-center" style={{ display: 'none' }}></div>

          {mode === 'drag' && (
            <div className="bg-primary/90 text-zinc-950 text-[9px] font-bold px-2 py-1 rounded backdrop-blur self-start animate-pulse">
              Click & Drag to move grid
            </div>
          )}
        </div>
      </div>
      {/* GLOBAL FIXED ELEMENTS (Outside HUD transform) */}

      {/* 3-Point Actions Bar (Save/Cancel) - Positioned manually in Render Loop */}
      <div
        ref={buttonsRef}
        className="fixed top-0 left-0 z-[100000] bg-zinc-950/90 border border-zinc-800 p-1.5 rounded-lg backdrop-blur flex items-center gap-2 shadow-2xl animate-in fade-in zoom-in-90"
        style={{ display: 'none', pointerEvents: 'auto', willChange: 'transform' }}
      >
        <span className="text-[10px] font-bold text-amber-500 uppercase px-1">Save?</span>
        <button
          onClick={(e) => { e.stopPropagation(); onCancelCalibration?.(); }}
          className="w-6 h-6 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 transition-colors"
          title="Cancel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onConfirmCalibration?.(); }}
          className="w-6 h-6 flex items-center justify-center rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/50 transition-colors"
          title="Confirm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </button>
      </div>
    </>
  );
};

// Optimization: Memoize to prevent re-renders when parent (MapCanvas) re-renders
// Only re-render if fundamental props change.
export const PrecisionCursor = memo(PrecisionCursorComponent, (prev, next) => {
  return (
    prev.enabled === next.enabled &&
    prev.mode === next.mode &&
    prev.gridSize === next.gridSize &&
    prev.offsetX === next.offsetX &&
    prev.offsetY === next.offsetY &&
    prev.cols === next.cols &&
    prev.rows === next.rows &&
    prev.viewport.zoom === next.viewport.zoom &&
    prev.viewport.x === next.viewport.x &&
    prev.viewport.y === next.viewport.y &&
    prev.canvasRef === next.canvasRef &&
    prev.onConfirmCalibration === next.onConfirmCalibration &&
    prev.onCancelCalibration === next.onCancelCalibration
  );
});
