import React, { useState, useRef, useEffect } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { Cloud, X, CloudRain, Snowflake, Wind, Droplets, Move, GripHorizontal } from 'lucide-react';
import { useTranslation } from '../../i18n/TranslationContext';
import { SFXConfig } from '../../types/models';

interface SFXPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SFXPanel: React.FC<SFXPanelProps> = ({ isOpen, onClose }) => {
  const { activeScene, updateSceneData } = useGameSession();
  const { t } = useTranslation();

  // --- Draggable State ---
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const dragRef = useRef<{ isDragging: boolean, startX: number, startY: number, initialX: number, initialY: number; }>({
    isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(0, dragRef.current.initialX + dx),
        y: Math.max(0, dragRef.current.initialY + dy)
      });
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen || !activeScene) return null;

  const sfx = activeScene.sfx || {};

  const toggleEffect = (key: 'rain' | 'snow' | 'fog', enabled: boolean) => {
    const current = sfx[key] || { enabled: false, intensity: 0.5 };
    const newSfx: SFXConfig = {
      ...sfx,
      [key]: {
        ...current,
        enabled,
        intensity: current.intensity || 0.5
      }
    };
    updateSceneData(activeScene.id, { sfx: newSfx });
  };

  const updateIntensity = (key: 'rain' | 'snow' | 'fog', val: number) => {
    const current = sfx[key] || { enabled: true, intensity: 0.5 };
    const newSfx: SFXConfig = {
      ...sfx,
      [key]: {
        ...current,
        intensity: val
      }
    };
    updateSceneData(activeScene.id, { sfx: newSfx });
  };

  const renderEffectControl = (
    key: 'rain' | 'snow' | 'fog',
    label: string,
    icon: React.ReactNode,
    colorClass: string
  ) => {
    const effect = sfx[key] || { enabled: false, intensity: 0.5 };

    return (
      <div className={`p-3 rounded-xl border transition-all ${effect.enabled ? 'bg-zinc-900/80 border-white/10' : 'bg-transparent border-transparent'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${effect.enabled ? colorClass : 'bg-zinc-800 text-zinc-500'}`}>
              {icon}
            </div>
            <span className={`font-bold text-sm ${effect.enabled ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={!!effect.enabled} onChange={(e) => toggleEffect(key, e.target.checked)} className="sr-only peer" />
            <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {effect.enabled && (
          <div className="mt-3 pl-12 pr-2 animate-in slide-in-from-top-1 fade-in duration-200">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase font-bold text-zinc-500 w-12">Intensity</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={effect.intensity}
                onChange={(e) => updateIntensity(key, parseFloat(e.target.value))}
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag on slider
                className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <span className="text-[10px] font-mono text-zinc-400 w-8 text-right">{Math.round(effect.intensity * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed z-50 w-80 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header - Drag Handle */}
      <div
        className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-zinc-100 font-bold tracking-wide">
          <GripHorizontal className="w-4 h-4 text-zinc-500" />
          <span>Environment Control</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-2 space-y-1">
        {renderEffectControl('rain', 'Rain Storm', <CloudRain className="w-5 h-5" />, 'bg-indigo-500/20 text-indigo-300')}
        {renderEffectControl('snow', 'Snow Fall', <Snowflake className="w-5 h-5" />, 'bg-cyan-500/20 text-cyan-300')}
        {renderEffectControl('fog', 'Atmosphere / Fog', <Wind className="w-5 h-5" />, 'bg-emerald-500/20 text-emerald-300')}
      </div>

      {/* Footer */}
      <div className="p-3 bg-zinc-900/50 text-[10px] text-center text-zinc-600 border-t border-zinc-800">
        Changes sync to all players instantly
      </div>
    </div>
  );
};
