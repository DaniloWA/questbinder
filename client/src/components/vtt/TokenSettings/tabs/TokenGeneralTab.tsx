import React from 'react';
import { TokenType } from '../../../../types';
import { SheetInput, SheetLabel, SheetSelect } from '../../../ui/SheetPrimitives';
import { Counter } from '../../../ui/Counter';
import { ColorPicker } from '../../../ui/ColorPicker';
import { ScanEye, Moon } from 'lucide-react';

interface TokenGeneralTabProps {
  tokenType: TokenType;
  name: string;
  onNameChange: (val: string) => void;
  size: number;
  onSizeChange: (val: number) => void;
  speed: number;
  onSpeedChange: (val: number) => void;
  disposition?: 'friendly' | 'neutral' | 'hostile';
  onDispositionChange: (val: 'friendly' | 'neutral' | 'hostile') => void;
  visionRange: number;
  onVisionRangeChange: (val: number) => void;
  darkvisionRange: number;
  onDarkvisionRangeChange: (val: number) => void;
  visionHex: string;
  onVisionHexChange: (val: string) => void;
  visionAlpha: number;
  onVisionAlphaChange: (val: number) => void;
}

const DISPOSITION_OPTIONS = [
  { id: 'friendly', label: 'Aliado', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/50' },
  { id: 'neutral', label: 'Neutro', color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' },
  { id: 'hostile', label: 'Inimigo', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/50' },
] as const;

export const TokenGeneralTab: React.FC<TokenGeneralTabProps> = ({
  tokenType,
  name,
  onNameChange,
  size,
  onSizeChange,
  speed,
  onSpeedChange,
  disposition,
  onDispositionChange,
  visionRange,
  onVisionRangeChange,
  darkvisionRange,
  onDarkvisionRangeChange,
  visionHex,
  onVisionHexChange,
  visionAlpha,
  onVisionAlphaChange,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <SheetInput
        variant="title"
        placeholder="Nome do Token"
        value={name}
        onChange={e => onNameChange(e.target.value)}
        className="w-full text-zinc-100"
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <SheetLabel>Tamanho (Quadrados)</SheetLabel>
          <Counter value={size} onChange={onSizeChange} min={0.5} max={10} step={0.5} className="bg-zinc-950 w-full" />
        </div>
        {tokenType !== 'object' && (
          <div className="space-y-1">
            <SheetLabel>Movimento (m)</SheetLabel>
            <Counter value={speed} onChange={onSpeedChange} min={0} max={100} step={1.5} className="bg-zinc-950 w-full" />
          </div>
        )}
      </div>

      {tokenType !== 'object' && (
        <div className="space-y-2">
          <SheetLabel>Disposição (IA)</SheetLabel>
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            {DISPOSITION_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onDispositionChange(opt.id)}
                className={`
                  flex-1 py-1.5 text-xs font-bold rounded transition-all border
                  ${disposition === opt.id ? `${opt.bg} ${opt.color}` : 'border-transparent text-zinc-600 hover:text-zinc-400'}
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tokenType !== 'object' && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/30 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <ScanEye className="w-3 h-3" /> Visão
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <SheetLabel tooltip="Alcance de visão em área iluminada">Alcance Normal</SheetLabel>
              <Counter value={visionRange} onChange={onVisionRangeChange} min={0} max={999} className="bg-zinc-900 w-full" />
            </div>
            <div>
              <SheetLabel icon={<Moon className="w-3 h-3" />} tooltip="Alcance de visão no escuro total">Visão Escuro</SheetLabel>
              <Counter value={darkvisionRange} onChange={onDarkvisionRangeChange} min={0} max={999} className="bg-zinc-900 w-full" />
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <SheetLabel>Cor da Visão (Overlay GM)</SheetLabel>
            <div className="flex gap-2">
              <ColorPicker value={visionHex} onChange={onVisionHexChange} />
              <div className="flex-1 h-10 bg-zinc-900 rounded border border-zinc-700 flex items-center px-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={visionAlpha}
                  onChange={e => onVisionAlphaChange(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
