import React, { useState, useRef } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { CloudRain, Snowflake, Wind, X, GripHorizontal, AlignHorizontalJustifyStart, Timer, Palette, Scaling, Move } from 'lucide-react';
import { useTranslation } from '../../i18n/TranslationContext';
import { SFXConfig, SFXParticleConfig, SFXFogConfig } from '../../types/models';

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

  const updateSFX = (key: keyof SFXConfig, updates: Partial<SFXParticleConfig | SFXFogConfig>) => {
    const current = sfx[key] || { enabled: false, intensity: 0.5 };
    const newConfig = { ...current, ...updates };

    updateSceneData(activeScene.id, {
      sfx: {
        ...sfx,
        [key]: newConfig
      }
    });
  };

  const toggleEffect = (key: keyof SFXConfig) => {
    const current = sfx[key];
    updateSFX(key, { enabled: !current?.enabled });
  };

  const ControlRow = ({ icon: Icon, label, children }: { icon: any, label: string, children: React.ReactNode; }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-24 flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );

  const Slider = ({ value, min, max, step, onChange, format = (v: number) => Math.round(v * 100) + '%' }: any) => (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseDown={e => e.stopPropagation()}
        className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-colors"
      />
      <span className="w-8 text-[10px] font-mono text-zinc-500 text-right">{format(value)}</span>
    </div>
  );

  const renderParticleControls = (key: 'rain' | 'snow') => {
    const config = (sfx[key] as SFXParticleConfig) || {};
    const defaults = key === 'rain'
      ? { intensity: 0.5, speed: 1, wind: -50, size: 1, color: '#aabedc' }
      : { intensity: 0.5, speed: 1, wind: 20, size: 1, color: '#ffffff' };

    const vals = { ...defaults, ...config };

    return (
      <div className="mt-4 pt-4 border-t border-zinc-800/50 space-y-3 animate-in fade-in slide-in-from-top-2">
        <ControlRow icon={AlignHorizontalJustifyStart} label="Intensity">
          <Slider value={vals.intensity} min={0} max={1} step={0.05} onChange={(v: number) => updateSFX(key, { intensity: v })} />
        </ControlRow>
        <ControlRow icon={Timer} label="Speed">
          <Slider value={vals.speed} min={0.1} max={5} step={0.1} format={(v: number) => v.toFixed(1) + 'x'} onChange={(v: number) => updateSFX(key, { speed: v })} />
        </ControlRow>
        <ControlRow icon={Wind} label="Wind">
          <Slider value={vals.wind} min={-200} max={200} step={10} format={(v: number) => v} onChange={(v: number) => updateSFX(key, { wind: v })} />
        </ControlRow>
        <ControlRow icon={Scaling} label="Size">
          <Slider value={vals.size} min={0.1} max={5} step={0.1} format={(v: number) => v.toFixed(1) + 'x'} onChange={(v: number) => updateSFX(key, { size: v })} />
        </ControlRow>
        <ControlRow icon={Palette} label="Color">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={vals.color}
              onChange={(e) => updateSFX(key, { color: e.target.value })}
              className="w-full h-6 bg-zinc-800 rounded cursor-pointer border-0 p-0 px-1"
            />
            <span className="text-[10px] font-mono text-zinc-500">{vals.color}</span>
          </div>
        </ControlRow>
      </div>
    );
  };

  const renderFogControls = () => {
    const key = 'fog';
    const config = (sfx[key] as SFXFogConfig) || {};
    const defaults = { intensity: 0.5, speedX: 10, speedY: 5, color: '#ffffff' }; // Default fog color
    const vals = { ...defaults, ...config };

    return (
      <div className="mt-4 pt-4 border-t border-zinc-800/50 space-y-3 animate-in fade-in slide-in-from-top-2">
        <ControlRow icon={AlignHorizontalJustifyStart} label="Opacity">
          <Slider value={vals.intensity} min={0} max={1} step={0.05} onChange={(v: number) => updateSFX(key, { intensity: v })} />
        </ControlRow>
        <ControlRow icon={Move} label="Speed X">
          <Slider value={vals.speedX} min={-100} max={100} step={1} format={(v: number) => v} onChange={(v: number) => updateSFX(key, { speedX: v })} />
        </ControlRow>
        <ControlRow icon={Move} label="Speed Y">
          <Slider value={vals.speedY} min={-100} max={100} step={1} format={(v: number) => v} onChange={(v: number) => updateSFX(key, { speedY: v })} />
        </ControlRow>
        <ControlRow icon={Palette} label="Tint">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={vals.color || '#ffffff'}
              onChange={(e) => updateSFX(key, { color: e.target.value })}
              className="w-full h-6 bg-zinc-800 rounded cursor-pointer border-0 p-0 px-1"
            />
            <span className="text-[10px] font-mono text-zinc-500">{vals.color || 'None'}</span>
          </div>
        </ControlRow>
      </div>
    );
  };

  const renderEffectCard = (
    key: keyof SFXConfig,
    label: string,
    icon: React.ReactNode,
    colorClass: string,
    renderControls: () => React.ReactNode
  ) => {
    const enabled = sfx[key]?.enabled;
    const activeClass = enabled ? 'bg-zinc-900/90 border-zinc-600 ring-1 ring-zinc-700/50' : 'bg-zinc-900/30 border-transparent opacity-75 hover:opacity-100';

    return (
      <div className={`p-3 rounded-xl border transition-all duration-300 ${activeClass}`}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleEffect(key)}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${enabled ? colorClass : 'bg-zinc-800 text-zinc-500'}`}>
              {icon}
            </div>
            <span className={`font-bold text-sm ${enabled ? 'text-zinc-100' : 'text-zinc-500'}`}>{label}</span>
          </div>
          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${enabled ? 'bg-indigo-600' : 'bg-zinc-700'} relative`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>

        {enabled && renderControls()}
      </div>
    );
  };

  return (
    <div
      className="fixed z-50 w-72 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-zinc-100 font-bold tracking-wide text-sm">
          <GripHorizontal className="w-4 h-4 text-zinc-500" />
          <span>SFX Engine</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-2 max-h-[80vh] overflow-y-auto custom-scrollbar">
        {renderEffectCard('rain', 'Rain Storm', <CloudRain className="w-5 h-5" />, 'bg-indigo-500/20 text-indigo-300', () => renderParticleControls('rain'))}
        {renderEffectCard('snow', 'Blizzard', <Snowflake className="w-5 h-5" />, 'bg-cyan-500/20 text-cyan-300', () => renderParticleControls('snow'))}
        {renderEffectCard('fog', 'Atmosphere', <Wind className="w-5 h-5" />, 'bg-emerald-500/20 text-emerald-300', renderFogControls)}
      </div>

      {/* Footer */}
      <div className="p-2 bg-zinc-900/50 text-[10px] text-center text-zinc-600 border-t border-zinc-800">
        realtime • synchronized • gpu-accelerated
      </div>
    </div>
  );
};
