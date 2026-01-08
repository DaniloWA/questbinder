import React, { useRef, useEffect, useState } from 'react';
import { getContourFromPoint } from '../../utils/imageProcessing';
import { Sparkles, MousePointer2, RefreshCw } from 'lucide-react';
import { WandSettings } from '../../context/gameSession/types';

const SAMPLE_MAP_URL = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800';

interface SmartWallPreviewModalProps {
  wandSettings: WandSettings;
  setWandSettings: (settings: WandSettings) => void;
}

export const SmartWallPreviewModal: React.FC<SmartWallPreviewModalProps> = ({ wandSettings: globalWandSettings, setWandSettings }) => {
  const [wandSettings, setLocalWandSettings] = useState(globalWandSettings);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [clickPos, setClickPos] = useState<{ x: number, y: number; } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with global settings when local changes
  useEffect(() => {
    setWandSettings(wandSettings);
  }, [wandSettings, setWandSettings]);

  // Load sample image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = SAMPLE_MAP_URL;
    img.onload = () => {
      setImage(img);
      setIsLoading(false);
      // Default click in the middle to show something
      setClickPos({ x: img.width / 2, y: img.height / 2 });
    };
  }, []);

  // Draw preview
  useEffect(() => {
    if (!image || !canvasRef.current || !clickPos) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw image
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    // Draw selection crosshair
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(clickPos.x - 10, clickPos.y);
    ctx.lineTo(clickPos.x + 10, clickPos.y);
    ctx.moveTo(clickPos.x, clickPos.y - 10);
    ctx.lineTo(clickPos.x, clickPos.y + 10);
    ctx.stroke();

    // Run algorithm
    try {
      const contour = getContourFromPoint(
        image,
        clickPos.x,
        clickPos.y,
        wandSettings.tolerance,
        wandSettings.resolution,
        wandSettings.simplification
      );

      if (contour.length > 2) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(contour[0].x, contour[0].y);
        for (let i = 1; i < contour.length; i++) {
          ctx.lineTo(contour[i].x, contour[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Highlight points
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        contour.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    } catch (e) {
      console.error('Preview error:', e);
    }
  }, [image, clickPos, wandSettings]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = image.width / rect.width;
    const scaleY = image.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setClickPos({ x, y });
  };

  return (
    <div className="flex flex-col gap-6 p-1">
      <div className="flex items-start gap-4 bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Modo de Visualização (Sandbox)</h3>
          <p className="text-xs text-zinc-400">Clique na imagem abaixo para simular onde você clicaria no mapa. O contorno vermelho mostra como a parede será gerada.</p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 shadow-inner group cursor-crosshair"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin" />
            <span className="text-zinc-500 text-sm italic">Carregando imagem de teste...</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full object-contain"
          />
        )}

        <div className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 pointer-events-none">
          <MousePointer2 className="w-3 h-3 text-primary" />
          <span className="text-[10px] text-zinc-300 font-medium lowercase">Clique para testar</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase">Tolerância</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="255"
              value={wandSettings.tolerance}
              onChange={(e) => setLocalWandSettings({ ...wandSettings, tolerance: parseInt(e.target.value) })}
              className="h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary grow"
            />
            <span className="text-xs font-mono text-zinc-300 w-8">{wandSettings.tolerance}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase">Simplificação</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={wandSettings.simplification}
              onChange={(e) => setLocalWandSettings({ ...wandSettings, simplification: parseFloat(e.target.value) })}
              className="h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary grow"
            />
            <span className="text-xs font-mono text-zinc-300 w-8">{wandSettings.simplification.toFixed(1)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase">Resolução</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="128"
              max="1024"
              step="64"
              value={wandSettings.resolution}
              onChange={(e) => setLocalWandSettings({ ...wandSettings, resolution: parseInt(e.target.value) })}
              className="h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary grow"
            />
            <span className="text-xs font-mono text-zinc-300 w-12">{wandSettings.resolution}px</span>
          </div>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-800 pt-4 italic">
        <span className="text-primary font-bold not-italic">Dica:</span> Use tolerância baixa para cores muito específicas e alta para áreas maiores. A resolução afeta a precisão e o desempenho.
      </div>
    </div>
  );
};
