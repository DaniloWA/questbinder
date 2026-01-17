import React from 'react';
import { AlignHorizontalJustifyStart, Timer, Wind, Scaling, Palette, CloudRain, Snowflake, Move } from 'lucide-react';
import { SFXConfig, SFXParticleConfig, SFXFogConfig } from '../../types/models';

interface SFXEditorProps {
  config: SFXConfig;
  onChange: (config: SFXConfig) => void;
  className?: string;
}

export const SFXEditor: React.FC<SFXEditorProps> = ({ config, onChange, className = '' }) => {

  const updateSFX = (key: keyof SFXConfig, updates: Partial<SFXParticleConfig | SFXFogConfig>) => {
    const current = config[key] || { enabled: false, intensity: 0.5 };
    // @ts-ignore - Dynamic key access with partial union type is tricky in TS
    const newConfig = { ...current, ...updates };

    onChange({
      ...config,
      [key]: newConfig
    });
  };

  const toggleEffect = (key: keyof SFXConfig) => {
    const current = config[key];
    updateSFX(key, { enabled: !current?.enabled });
  };

  const ControlRow = ({ icon: Icon, label, children }: { icon: any, label: string, children: React.ReactNode; }) => (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-24 flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );

  const Slider = ({ value, min, max, step, onChange, format = (v: number) => Math.round(v * 100) + '%' }: any) => (
    <div className="flex items-center gap-3 group">
      <div className="relative flex-1 h-6 flex items-center">
        <div className="absolute inset-x-0 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-700 w-full origin-left scale-x-0 transition-transform" style={{ transform: `scaleX(${(value - min) / (max - min)})` }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative z-10 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute h-3 w-3 bg-zinc-400 rounded-full shadow-md pointer-events-none transition-all group-hover:scale-125 group-hover:bg-white"
          style={{ left: `${((value - min) / (max - min)) * 100}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <span className="w-12 text-[10px] font-mono text-zinc-400 text-right bg-zinc-800/50 px-1.5 py-0.5 rounded">{format(value)}</span>
    </div>
  );

  const renderParticleControls = (key: 'rain' | 'snow') => {
    const sfxConfig = (config[key] as SFXParticleConfig) || {};
    const defaults = key === 'rain'
      ? { intensity: 0.5, speed: 1, wind: -50, size: 1, color: '#aabedc' }
      : { intensity: 0.5, speed: 1, wind: 20, size: 1, color: '#ffffff' };

    const vals = { ...defaults, ...sfxConfig };

    return (
      <div className="mt-4 pt-4 border-t border-zinc-800/30 space-y-2 animate-in fade-in slide-in-from-top-1">
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
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1 h-8 rounded-md overflow-hidden ring-1 ring-zinc-700/50 group">
              <input
                type="color"
                value={vals.color}
                onChange={(e) => updateSFX(key, { color: e.target.value })}
                className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-2 py-1 rounded select-all">{vals.color}</span>
          </div>
        </ControlRow>
      </div>
    );
  };

  const renderFogControls = () => {
    const key = 'fog';
    const sfxConfig = (config[key] as SFXFogConfig) || {};
    const defaults = { intensity: 0.5, speedX: 10, speedY: 5, color: '#ffffff' };
    const vals = { ...defaults, ...sfxConfig };

    return (
      <div className="mt-4 pt-4 border-t border-zinc-800/30 space-y-2 animate-in fade-in slide-in-from-top-1">
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
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1 h-8 rounded-md overflow-hidden ring-1 ring-zinc-700/50 group">
              <input
                type="color"
                value={vals.color || '#ffffff'}
                onChange={(e) => updateSFX(key, { color: e.target.value })}
                className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-2 py-1 rounded select-all">{vals.color || '#ffffff'}</span>
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
    const enabled = config[key]?.enabled;
    const activeClass = enabled ? 'bg-zinc-900/80 border-zinc-700 shadow-xl' : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-zinc-800/30';

    return (
      <div className={`p-4 rounded-xl border transition-all duration-300 ${activeClass} mb-2`}>
        <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleEffect(key)}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${enabled ? colorClass + ' shadow-lg scale-110' : 'bg-zinc-800 text-zinc-500 group-hover:scale-105'}`}>
              {icon}
            </div>
            <span className={`font-bold text-sm tracking-wide ${enabled ? 'text-zinc-100' : 'text-zinc-500'}`}>{label}</span>
          </div>
          <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${enabled ? 'bg-indigo-500' : 'bg-zinc-800'} relative`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </div>

        {enabled && renderControls()}
      </div>
    );
  };

  return (
    <div className={className}>
      {renderEffectCard('rain', 'Rain Storm', <CloudRain className="w-5 h-5" />, 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white', () => renderParticleControls('rain'))}
      {renderEffectCard('snow', 'Blizzard', <Snowflake className="w-5 h-5" />, 'bg-gradient-to-br from-cyan-400 to-blue-300 text-white', () => renderParticleControls('snow'))}
      {renderEffectCard('fog', 'Atmosphere', <Wind className="w-5 h-5" />, 'bg-gradient-to-br from-emerald-500 to-teal-400 text-white', renderFogControls)}
    </div>
  );
};
