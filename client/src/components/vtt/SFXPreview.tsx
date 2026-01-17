import React, { useEffect, useRef } from 'react';
import { SFXConfig } from '../../types/models';
import { SFXLayer } from './map/engine/sfx/SFXLayer';

interface SFXPreviewProps {
  config: SFXConfig;
  className?: string;
}

export const SFXPreview: React.FC<SFXPreviewProps> = ({ config, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<SFXLayer | null>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Layer (once)
    if (!layerRef.current) {
      layerRef.current = new SFXLayer();
    }

    // Update config
    layerRef.current.setConfig(config);

    // Animation Loop
    const animate = (time: number) => {
      if (!canvasRef.current || !layerRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const deltaMs = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Clear
      // Use dark background for contrast or let CSS handle it.
      // Actually we need to wipe the canvas.
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Fake Context for Layer
      // TODO: Improve this mock context
      const renderContext: any = {
        canvas: canvasRef.current,
        ctx: ctx,
        deltaMs: Math.min(deltaMs, 50), // Cap delta to prevent huge jumps
        time: time,
        viewport: { x: 0, y: 0, zoom: 1 }, // Preview is always 1:1 or maybe scaled?
        // .. other props not needed by SFX currently
      };

      // Ensure canvas size matches display size for sharpness
      const rect = canvasRef.current.getBoundingClientRect();
      if (canvasRef.current.width !== rect.width || canvasRef.current.height !== rect.height) {
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }

      // Update & Render
      // SFXLayer expects to be updated then rendered.
      // But update uses the context which we just mocked.

      // We need to simulate the loop of BaseLayer/Sublayers
      // SFXLayer.render calls internal logic.
      // wait, SFXLayer.render calls update internally ??
      // Checking SFXLayer code...
      // "layer.update(dt, context)" then "layer.render...".

      // SFXLayer render loop:
      // const dt = context.deltaMs / 1000;
      // ... for layer of sublayers ... layer.update ... layer.render

      layerRef.current.render(ctx, renderContext);

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [config]); // Re-run config update if config changes, but keep loop running

  return (
    <div className={`relative overflow-hidden bg-black/50 rounded-lg ${className}`}>
      {/* Background placeholder - maybe a grid or simple image? */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#4f4f4f 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />

      <div className="absolute bottom-2 right-2 text-[9px] text-zinc-600 font-mono uppercase tracking-widest pointer-events-none">
        Live Preview
      </div>
    </div>
  );
};
