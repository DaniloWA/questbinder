import React from 'react';
import { TokenShape, TokenEffect, TokenIdleAnimation, BorderStyle } from '../../../../types';
import { SheetLabel, SheetSelect } from '../../../ui/SheetPrimitives';
import { ColorPicker } from '../../../ui/ColorPicker';
import { SliderField, SliderFieldVertical } from '../../../ui/SliderField';
import { Circle, Square, Hexagon, Ghost, Palette, ArrowDownUp, Wand2, Activity } from 'lucide-react';

interface TokenStyleTabProps {
  displayMode: 'image' | 'text';
  shape: TokenShape;
  onShapeChange: (shape: TokenShape) => void;
  borderColor: string;
  onBorderColorChange: (color: string) => void;
  borderWidth: number;
  onBorderWidthChange: (width: number) => void;
  borderStyle: BorderStyle;
  onBorderStyleChange: (style: BorderStyle) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  imageRotation: number;
  onImageRotationChange: (rotation: number) => void;
  imageX: number;
  onImageXChange: (x: number) => void;
  imageY: number;
  onImageYChange: (y: number) => void;
  tintColor: string;
  onTintColorChange: (color: string) => void;
  tintAlpha: number;
  onTintAlphaChange: (alpha: number) => void;
  effect: TokenEffect;
  onEffectChange: (effect: TokenEffect) => void;
  idleAnimation: TokenIdleAnimation;
  onIdleAnimationChange: (anim: TokenIdleAnimation) => void;
}

const SHAPE_OPTIONS = [
  { id: 'circle', icon: <Circle className="w-4 h-4" />, label: '' },
  { id: 'square', icon: <Square className="w-4 h-4" />, label: '' },
  { id: 'hex', icon: <Hexagon className="w-4 h-4" />, label: '' },
  { id: 'topdown', icon: <Ghost className="w-4 h-4" />, label: 'PNG' },
];

const BORDER_STYLE_OPTIONS = [
  { label: 'Sólido', value: 'solid' },
  { label: 'Tracejado', value: 'dashed' },
  { label: 'Pontilhado', value: 'dotted' },
  { label: 'Duplo', value: 'double' },
];

const EFFECT_OPTIONS = [
  { label: 'Nenhum', value: 'none' },
  { label: 'Fantasma', value: 'ghostly' },
  { label: 'Em Chamas', value: 'burning' },
  { label: 'Congelado', value: 'frozen' },
  { label: 'Glitch', value: 'glitch' },
  { label: 'Outline', value: 'outline' },
];

const ANIMATION_OPTIONS = [
  { label: 'Estático', value: 'none' },
  { label: 'Respirar', value: 'breath' },
  { label: 'Flutuar', value: 'float' },
  { label: 'Girar', value: 'spin' },
  { label: 'Balançar', value: 'wobble' },
];

export const TokenStyleTab: React.FC<TokenStyleTabProps> = ({
  displayMode,
  shape,
  onShapeChange,
  borderColor,
  onBorderColorChange,
  borderWidth,
  onBorderWidthChange,
  borderStyle,
  onBorderStyleChange,
  scale,
  onScaleChange,
  imageRotation,
  onImageRotationChange,
  imageX,
  onImageXChange,
  imageY,
  onImageYChange,
  tintColor,
  onTintColorChange,
  tintAlpha,
  onTintAlphaChange,
  effect,
  onEffectChange,
  idleAnimation,
  onIdleAnimationChange,
}) => {
  const isTopDown = shape === 'topdown';

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Shape & Border */}
      <div className="space-y-3">
        <SheetLabel icon={<Palette className="w-3 h-3" />}>Forma & Borda</SheetLabel>
        <div className="grid grid-cols-4 gap-2">
          {SHAPE_OPTIONS.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => onShapeChange(s.id as TokenShape)}
              className={`
                h-10 flex items-center justify-center rounded-lg border transition-all
                ${shape === s.id ? 'bg-primary/20 border-primary text-primary' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'}
                ${s.id === 'topdown' ? 'text-[10px] font-bold' : ''}
              `}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {!isTopDown && (
          <div className="flex items-center gap-3 mt-2">
            <ColorPicker value={borderColor} onChange={onBorderColorChange} />
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="10"
                value={borderWidth}
                onChange={e => onBorderWidthChange(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
            <div className="w-24">
              <SheetSelect
                value={borderStyle}
                onChange={v => onBorderStyleChange(v as BorderStyle)}
                options={BORDER_STYLE_OPTIONS}
                variant="box"
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Image Positioning */}
      <div className="space-y-2">
        <SheetLabel icon={<ArrowDownUp className="w-3 h-3" />}>Ajuste de Imagem & Posição</SheetLabel>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-4">
          <SliderField
            label="Zoom"
            value={scale}
            onChange={onScaleChange}
            min={0.5}
            max={3}
            step={0.1}
          />
          <SliderField
            label="Rotação"
            value={imageRotation}
            onChange={onImageRotationChange}
            min={0}
            max={360}
            step={15}
          />
          <div className="flex gap-4">
            <SliderFieldVertical
              label="Pos X"
              value={imageX}
              onChange={onImageXChange}
              min={-0.5}
              max={0.5}
              step={0.05}
              accentColor="accent-blue-500"
            />
            <SliderFieldVertical
              label="Pos Y"
              value={imageY}
              onChange={onImageYChange}
              min={-0.5}
              max={0.5}
              step={0.05}
              accentColor="accent-blue-500"
            />
          </div>

          {displayMode === 'image' && !isTopDown && (
            <div className="flex items-center gap-3 pt-2 border-t border-zinc-800/50">
              <span className="text-[10px] uppercase font-bold text-zinc-500 w-16">Tintura</span>
              <ColorPicker value={tintColor} onChange={onTintColorChange} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={tintAlpha}
                onChange={e => onTintAlphaChange(Number(e.target.value))}
                className="flex-1 accent-primary h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Effects & Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <SheetLabel icon={<Wand2 className="w-3 h-3" />}>Efeitos Visuais</SheetLabel>
          <SheetSelect
            value={effect}
            onChange={v => onEffectChange(v as TokenEffect)}
            options={EFFECT_OPTIONS}
            variant="box"
          />
        </div>
        <div className="space-y-2">
          <SheetLabel icon={<Activity className="w-3 h-3" />}>Animação Idle</SheetLabel>
          <SheetSelect
            value={idleAnimation}
            onChange={v => onIdleAnimationChange(v as TokenIdleAnimation)}
            options={ANIMATION_OPTIONS}
            variant="box"
          />
        </div>
      </div>
    </div>
  );
};
