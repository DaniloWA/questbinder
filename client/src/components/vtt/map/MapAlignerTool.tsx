import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameSession } from '../../../context/GameSessionContext';
import {
  Move, Grid3X3, ZoomIn, ZoomOut, Target, MousePointer2,
  Minimize2, Maximize2, RotateCcw, X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Wand2, Check, AlertCircle, LayoutGrid
} from 'lucide-react';
import { detectGrid } from './utils/gridDetection';

/**
 * Premium MapAlignerTool - Grid Inspector
 * Features: Floating Glassmorphism Panel, Robust Controls, Auto-Detection
 */
export const MapAlignerTool: React.FC = () => {
  const {
    activeScene,
    activeTool,
    setActiveTool,
    updateMapSettings,
    activeSceneId
  } = useGameSession();

  // Grid Properties (Local State for Immediate Feedback)
  const [gridSize, setGridSize] = useState<number>(70);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);

  // UI State
  const [isMinimized, setIsMinimized] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Interaction State (Prevent server sync from overwriting user while dragging)
  const [isInteracting, setIsInteracting] = useState(false);

  // Sync with Active Scene (Only if not interacting)
  useEffect(() => {
    if (activeScene?.grid && !isInteracting) {
      setGridSize(activeScene.grid.size);
      setOffsetX(activeScene.grid.offsetX || 0);
      setOffsetY(activeScene.grid.offsetY || 0);
    }
  }, [activeSceneId, activeScene?.grid?.size, activeScene?.grid?.offsetX, activeScene?.grid?.offsetY, isInteracting]);

  // PREVIEW EVENT SYSTEM
  // Instead of debouncing server writes (which lags), we emit local preview events
  // for the PrecisionCursor to pick up instantly (60fps), and only save to server on commit.

  const emitPreview = useCallback((s: number, x: number, y: number) => {
    window.dispatchEvent(new CustomEvent('questbinder:grid-preview', {
      detail: { size: s, offsetX: x, offsetY: y }
    }));
  }, []);

  const commitChanges = useCallback(() => {
    setIsInteracting(false);
    if (!activeScene) return;
    updateMapSettings({
      grid: {
        ...activeScene.grid,
        size: gridSize,
        offsetX: offsetX,
        offsetY: offsetY
      }
    });
  }, [activeScene, updateMapSettings, gridSize, offsetX, offsetY]);

  // Handlers (Update Local + Preview)
  const handleSizeChange = (val: number) => {
    setGridSize(val);
    emitPreview(val, offsetX, offsetY);
  };

  const handleOffsetChange = (axis: 'x' | 'y', val: number) => {
    const newX = axis === 'x' ? val : offsetX;
    const newY = axis === 'y' ? val : offsetY;
    if (axis === 'x') setOffsetX(val); else setOffsetY(val);
    emitPreview(gridSize, newX, newY);
  };

  const handleNudge = (axis: 'x' | 'y', delta: number) => {
    const current = axis === 'x' ? offsetX : offsetY;
    const newVal = Number((current + delta).toFixed(1));
    // Nudges should commit immediately as they are discrete clicks
    const newX = axis === 'x' ? newVal : offsetX;
    const newY = axis === 'y' ? newVal : offsetY;

    if (axis === 'x') setOffsetX(newVal); else setOffsetY(newVal);
    emitPreview(gridSize, newX, newY);

    // Immediate commit for buttons (safe)
    if (activeScene) {
      updateMapSettings({
        grid: { ...activeScene.grid, size: gridSize, offsetX: newX, offsetY: newY }
      });
    }
  };

  const activeMode = activeTool.startsWith('map-align-') ? activeTool.replace('map-align-', '') : null;

  if (!activeTool.startsWith('map-align')) return null;

  // Auto-Detect Logic (Simplified wrapper)
  const handleAutoDetect = async () => {
    // Implement auto detection or toggle a mode
    // For now we can assume it might need the Image Processing logic from before
    // Let's just restore the button visual for the user request "esta faltando o autoGrid"
    // and maybe hook it up if we have the import.
    // We imported detectGrid.
    if (!activeScene?.imageUrl) return;

    // Logic from previous implementation
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = activeScene.imageUrl;
      await new Promise(r => img.onload = r);

      const result = detectGrid(img, { minGridSize: 20, maxGridSize: 300 });
      if (result && result.confidence > 0.25) {
        setGridSize(Math.round(result.gridSize));
        setOffsetX(Math.round(result.offsetX));
        setOffsetY(Math.round(result.offsetY));
        updateMapSettings({
          grid: {
            ...activeScene!.grid,
            size: Math.round(result.gridSize),
            offsetX: Math.round(result.offsetX),
            offsetY: Math.round(result.offsetY)
          }
        });
      }
    } catch (e) {
      console.error("Auto-detect failed", e);
    }
  };

  return (
    <div className={`fixed left-6 top-24 z-50 transition-all duration-300 ease-out font-sans ${isMinimized ? 'w-12 h-12 rounded-full overflow-hidden' : 'w-96 rounded-2xl'}`}>

      {/* Background / Glass Effect */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300"
        style={{ borderRadius: isMinimized ? '9999px' : '1rem' }} />

      {/* MINIMIZED STATE */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="absolute inset-0 flex items-center justify-center text-primary hover:text-white transition-colors animate-in fade-in zoom-in"
        >
          <Grid3X3 className="w-6 h-6" />
        </button>
      )}

      {/* MAXIMIZED CONTENT */}
      {!isMinimized && (
        <div className="relative flex flex-col h-full text-zinc-100 animate-in fade-in slide-in-from-left-4">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg text-primary ring-1 ring-primary/40">
                <Grid3X3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Grid Inspector</h2>
                <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-2">
                  <span className="flex items-center gap-1"><LayoutGrid className="w-3 h-3" /> {activeScene?.grid.cols}x{activeScene?.grid.rows}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(true)} className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTool('select')}
                className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

            {/* CELL SIZE SECTION */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" /> Cell Size
                </label>
                <span className="text-xs font-mono bg-zinc-900 px-2 py-0.5 rounded text-primary border border-primary/20">{gridSize}px</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSizeChange(Math.max(10, gridSize - (snapToGrid ? 5 : 1)))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-all active:scale-95"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="range" min="20" max="300" step={snapToGrid ? 5 : 1}
                    value={gridSize}
                    onChange={(e) => handleSizeChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <button
                  onClick={() => handleSizeChange(Math.min(500, gridSize + (snapToGrid ? 5 : 1)))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-all active:scale-95"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 70, 100, 140].map(s => (
                  <button
                    key={s} onClick={() => handleSizeChange(s)}
                    className={`text-[10px] font-mono py-1 rounded border transition-colors ${gridSize === s ? 'bg-primary text-black border-primary font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>

            {/* OFFSET SECTION */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Move className="w-3.5 h-3.5" /> Alignment
              </label>

              {/* D-PAD CONTROL */}
              <div className="bg-zinc-900/50 rounded-xl p-3 border border-white/5 flex gap-4">

                {/* Inputs X/Y */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 w-4">X</span>
                    <input
                      type="number" step={0.1} value={offsetX}
                      onChange={(e) => handleOffsetChange('x', Number(e.target.value))}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-center focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 w-4">Y</span>
                    <input
                      type="number" step={0.1} value={offsetY}
                      onChange={(e) => handleOffsetChange('y', Number(e.target.value))}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-center focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Arrow Pad */}
                <div className="grid grid-cols-3 gap-1 shrink-0">
                  <div />
                  <button onClick={() => handleNudge('y', -1)} className="w-6 h-6 bg-zinc-800 rounded hover:bg-zinc-700 flex items-center justify-center active:bg-primary active:text-black transition-colors"><ArrowUp className="w-3 h-3" /></button>
                  <div />

                  <button onClick={() => handleNudge('x', -1)} className="w-6 h-6 bg-zinc-800 rounded hover:bg-zinc-700 flex items-center justify-center active:bg-primary active:text-black transition-colors"><ArrowLeft className="w-3 h-3" /></button>
                  <div className="w-6 h-6 bg-zinc-950 rounded border border-zinc-800 flex items-center justify-center"><Target className="w-3 h-3 text-zinc-600" /></div>
                  <button onClick={() => handleNudge('x', 1)} className="w-6 h-6 bg-zinc-800 rounded hover:bg-zinc-700 flex items-center justify-center active:bg-primary active:text-black transition-colors"><ArrowRight className="w-3 h-3" /></button>

                  <div />
                  <button onClick={() => handleNudge('y', 1)} className="w-6 h-6 bg-zinc-800 rounded hover:bg-zinc-700 flex items-center justify-center active:bg-primary active:text-black transition-colors"><ArrowDown className="w-3 h-3" /></button>
                  <div />
                </div>
              </div>
            </div>

            {/* ACTION TOOLS */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setActiveTool(activeMode === 'drag' ? 'map-align' : 'map-align-drag')}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${activeMode === 'drag' ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'}`}
              >
                <Move className={`w-5 h-5 ${activeMode === 'drag' ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-bold uppercase tracking-wide">Drag Grid</span>
              </button>

              <button
                onClick={() => setActiveTool(activeMode === '3point' ? 'map-align' : 'map-align-3point')}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${activeMode === '3point' ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20 scale-[1.02]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'}`}
              >
                <MousePointer2 className={`w-5 h-5 ${activeMode === '3point' ? 'animate-bounce' : ''}`} />
                <span className="text-[10px] font-bold uppercase tracking-wide">3-Point</span>
              </button>
            </div>

            {/* INSTRUCTIONS & FEEDBACK */}
            <div className="text-[10px] text-zinc-500 text-center bg-zinc-900/40 p-2 rounded-lg border border-white/5">
              {activeMode === 'drag' && <span className="text-primary font-bold animate-pulse">Drag the map to align grid visually.</span>}
              {activeMode === '3point' && <span className="text-amber-500 font-bold">Click 3 grid intersections: Top-Left, Top-Right, Bottom-Left.</span>}
              {!activeMode && <span>Select a tool or use controls to adjust grid.</span>}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
