import React, { useState, useRef, useEffect } from 'react';
import { Crown, Lock, CircleDot, Activity, Stars, Target, Disc, Sun, Podcast, Radio, Zap, Wind, Triangle } from 'lucide-react';
import { useTranslation } from '../../i18n/TranslationContext';
import { Input } from '../ui/Input';
import { ColorPicker } from '../ui/ColorPicker';
import { CURSOR_SHAPES, getCursorShape, CursorShape } from './constants/cursorShapes';
import { getContrastColor } from '../../utils/colors';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#fbbf24', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef', '#f43f5e',
];

// PERFORMANCE: Animation preview - animates when visible (tab active) or hovered
const AnimationPreview: React.FC<{
  style: string;
  color: string;
  size?: number;
  isVisible?: boolean;
}> = React.memo(({ style, color, size = 60, isVisible = false }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const shouldAnimate = isVisible || isHovered;
  const initialCycleRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!shouldAnimate && !initialCycleRef.current) {
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    let startTime = Date.now();
    let animationFrame: number;
    let cycleCount = 0;

    const render = () => {
      const now = Date.now();
      const DURATION = 500;
      const LOOP_DELAY = 1500;

      if (now - startTime > LOOP_DELAY) {
        startTime = now;
        cycleCount++;
        if (cycleCount >= 1 && !shouldAnimate) {
          initialCycleRef.current = false;
          return;
        }
      }

      const progress = Math.min(1, (now - startTime) / DURATION);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, size, size);

      if (now - startTime <= DURATION) {
        ctx.save();
        ctx.translate(size / 2, size / 2);
        const scale = 0.5;
        ctx.globalAlpha = 1 - easeOut;

        // Full animation rendering based on style
        if (style === 'burst') {
          const maxR = size * scale;
          const currentR = maxR * easeOut;
          const lines = 8;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          for (let i = 0; i < lines; i++) {
            const angle = (Math.PI * 2 / lines) * i;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * (currentR * 0.4), Math.sin(angle) * (currentR * 0.4));
            ctx.lineTo(Math.cos(angle) * currentR, Math.sin(angle) * currentR);
            ctx.stroke();
          }
        } else if (style === 'sparkle') {
          const maxDist = size * scale * 0.8;
          const particles = 5;
          ctx.fillStyle = color;
          for (let i = 0; i < particles; i++) {
            const angle = (Math.PI * 2 / particles) * i + (now / 200);
            const dist = maxDist * easeOut;
            ctx.beginPath(); ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 2, 0, Math.PI * 2); ctx.fill();
          }
        } else if (style === 'vortex') {
          const maxR = size * scale;
          ctx.strokeStyle = color; ctx.lineWidth = 2;
          for (let j = 0; j < 3; j++) {
            const angleOffset = (Math.PI * 2 / 3) * j + (easeOut * Math.PI * 2);
            ctx.beginPath();
            for (let i = 0; i < 15; i++) {
              const r = (i / 15) * maxR * easeOut;
              const a = angleOffset + (i / 4);
              if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
              else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.stroke();
          }
        } else if (style === 'shard') {
          const dist = size * scale * 0.8 * easeOut;
          ctx.fillStyle = color;
          for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
            ctx.lineTo(Math.cos(angle + 2.5) * 4, Math.sin(angle + 2.5) * 4);
            ctx.lineTo(Math.cos(angle - 2.5) * 4, Math.sin(angle - 2.5) * 4);
            ctx.fill();
          }
        } else if (style === 'pulse' || style === 'orb') {
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(0, 0, size * scale * 0.8 * easeOut, 0, Math.PI * 2); ctx.fill();
        } else if (style === 'ring' || style === 'echo') {
          ctx.strokeStyle = color; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, size * scale * 0.6 * easeOut, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, size * scale * 0.4 * easeOut, 0, Math.PI * 2); ctx.stroke();
        } else if (style === 'radar') {
          ctx.rotate(progress * Math.PI * 4);
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.arc(0, 0, size / 2 * scale * 1.5, 0, Math.PI / 4);
          ctx.lineTo(0, 0);
          ctx.fillStyle = color; ctx.globalAlpha = 0.5; ctx.fill();
        } else if (style === 'beacon') {
          ctx.globalAlpha = 1 - progress;
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = color; ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate(Math.PI / 2 * i + progress * 2);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size * scale, 0); ctx.stroke();
            ctx.restore();
          }
        } else if (style === 'sonar') {
          for (let i = 0; i < 3; i++) {
            const waveProgress = (progress * 3 + i) % 3 / 3;
            const r = size * scale * waveProgress;
            ctx.globalAlpha = 1 - waveProgress;
            ctx.strokeStyle = color; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
          }
        } else if (style === 'target') {
          const r = size * scale * 1.5 * (1 - easeOut);
          ctx.globalAlpha = Math.min(1, easeOut * 2);
          ctx.strokeStyle = color; ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.beginPath(); ctx.arc(0, 0, Math.max(0, r), 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath(); ctx.moveTo(-size / 4, 0); ctx.lineTo(size / 4, 0);
          ctx.moveTo(0, -size / 4); ctx.lineTo(0, size / 4); ctx.stroke();
        } else if (style === 'flare') {
          ctx.globalAlpha = Math.pow(1 - progress, 5);
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(0, 0, size * scale * 2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        } else if (style === 'diamond') {
          ctx.rotate(progress * Math.PI);
          const r = size * scale * (1 + easeOut);
          ctx.strokeStyle = color; ctx.lineWidth = 1;
          ctx.globalAlpha = 1 - progress;
          ctx.strokeRect(-r / 2, -r / 2, r, r);
          ctx.rotate(Math.PI / 4);
          ctx.strokeRect(-r / 2, -r / 2, r, r);
        } else if (style === 'cross') {
          const s = 1 + easeOut;
          ctx.scale(s, s); ctx.lineWidth = 2;
          ctx.strokeStyle = color; ctx.globalAlpha = 1 - progress;
          const len = size / 4;
          ctx.beginPath();
          ctx.moveTo(-len, -len); ctx.lineTo(len, len);
          ctx.moveTo(len, -len); ctx.lineTo(-len, len);
          ctx.stroke();
        } else {
          // Default ripple
          const radius = (size * scale * 0.4) + (size * scale * 0.4 * easeOut);
          ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.restore();
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [style, color, size, shouldAnimate]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="bg-zinc-950/30 rounded-lg border border-zinc-800/50 cursor-pointer"
      onMouseEnter={() => { setIsHovered(true); initialCycleRef.current = true; }}
      onMouseLeave={() => setIsHovered(false)}
    />
  );
});

// Memoized cursor shape button
const CursorShapeButton: React.FC<{
  shape: CursorShape;
  isSelected: boolean;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}> = React.memo(({ shape, isSelected, color, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-1 rounded-md border transition-all ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:border-zinc-700 opacity-50 hover:opacity-100'} ${disabled ? 'cursor-not-allowed' : ''}`}
    title={shape.label}
  >
    {shape.Component ? (
      <shape.Component color={isSelected ? color : '#71717a'} size={16} className="w-4 h-4" />
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d={shape.path} fill={isSelected ? color : '#71717a'} />
      </svg>
    )}
  </button>
));

export interface CursorEditorValues {
  shapeId: string;
  color: string;
  name: string;
  clickAnimation: string;
  clickColorLeft: string;
  clickColorRight: string;
  pingColor: string;
  pingAnimation: string;
  // Trail
  trailEnabled: boolean;
  trailSize: number;
  trailColor: string;
  trailAnimation: string;
  trailLength: number;
  // Options
  showOthersTrails: boolean;
  showMyTrail: boolean;
  useAppCursor: boolean;
  explosionOnCollision: boolean;
}

export interface CursorEditorPermissions {
  shape: boolean;
  color: boolean;
  name: boolean;
  animation: boolean;
  leftColor: boolean;
  rightColor: boolean;
  pingColor: boolean;
  pingAnimation: boolean;
  trail: boolean; // Grouped permission/validation for all trail settings
}

export interface CursorEditorOverrides {
  shape?: boolean;
  color?: boolean;
  name?: boolean;
  animation?: boolean;
  leftColor?: boolean;
  rightColor?: boolean;
  pingColor?: boolean;
  pingAnimation?: boolean;
  trail?: boolean;
}

export interface CursorEditorProps {
  values: CursorEditorValues;
  onChange: (field: keyof CursorEditorValues, value: string) => void;
  canEdit: CursorEditorPermissions;
  overrides?: CursorEditorOverrides;
  isVisible: boolean;
  showPreview?: boolean;
  userName?: string;
  isGMMode?: boolean; // True when GM is editing a player (no lock/override UI)
}

export const CursorEditor: React.FC<CursorEditorProps> = ({
  values,
  onChange,
  canEdit,
  overrides: overridesInput,
  isVisible,
  showPreview = true,
  userName = 'Nome',
  isGMMode = false,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'general' | 'animations' | 'ping' | 'trail' | 'options'>('general');

  // Default empty overrides to proper type for TS
  const overrides: CursorEditorOverrides = overridesInput || {};

  const selectedShape = getCursorShape(values.shapeId);

  return (
    <div className="flex flex-col gap-2">
      {/* Preview */}
      {showPreview && (
        <div className="flex justify-center py-2 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800">
          <div className="relative">
            {selectedShape.Component ? (
              <selectedShape.Component color={values.color} size={50} className="drop-shadow-md" />
            ) : selectedShape.imageUrl ? (
              <img src={selectedShape.imageUrl} alt={selectedShape.label} className="w-[50px] h-[50px] object-contain drop-shadow-md" />
            ) : (
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.3))' }}>
                <g transform="translate(30, 30) scale(1.2)">
                  <g transform={`scale(${selectedShape.scale || 1}) translate(${-selectedShape.hotspot.x}, ${-selectedShape.hotspot.y})`}>
                    <path d={selectedShape.path} fill={values.color} stroke="white" strokeWidth="1" />
                  </g>
                </g>
              </svg>
            )}
            <div
              className="absolute left-[42px] top-[42px] px-1 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap shadow-sm z-10"
              style={{ backgroundColor: values.color, color: getContrastColor(values.color) }}
            >
              {values.name || userName}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 text-[10px] py-1 rounded transition-all ${activeTab === 'general' ? 'bg-zinc-700 text-white shadow font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {t('vtt.cursor.editor.tabs.general')}
        </button>
        <button
          onClick={() => setActiveTab('animations')}
          className={`flex-1 text-[10px] py-1 rounded transition-all ${activeTab === 'animations' ? 'bg-zinc-700 text-white shadow font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {t('vtt.cursor.editor.tabs.animations')}
        </button>
        <button
          onClick={() => setActiveTab('ping')}
          className={`flex-1 text-[10px] py-1 rounded transition-all ${activeTab === 'ping' ? 'bg-zinc-700 text-white shadow font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {t('vtt.cursor.editor.tabs.ping')}
        </button>
        <button
          onClick={() => setActiveTab('trail')}
          className={`flex-1 text-[10px] py-1 rounded transition-all ${activeTab === 'trail' ? 'bg-zinc-700 text-white shadow font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {t('vtt.cursor.editor.tabs.trail')}
        </button>
        <button
          onClick={() => setActiveTab('options')}
          className={`flex-1 text-[10px] py-1 rounded transition-all ${activeTab === 'options' ? 'bg-zinc-700 text-white shadow font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {t('vtt.cursor.editor.tabs.options')}
        </button>
      </div>

      {/* Tab Content - with max height and scroll */}
      <div className="flex-1 overflow-y-auto space-y-3 max-h-[60vh] sm:max-h-[280px] pr-1">
        {/* General Tab */}
        {activeTab === 'general' && (
          <>
            {/* Shape Selection */}
            <div className={!canEdit.shape ? 'opacity-60' : ''}>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                {t('vtt.cursor.editor.general.shape.label')}
                {!isGMMode && overrides.shape && <><Crown className="w-3 h-3 text-amber-500" /><span className="text-amber-500">{t('vtt.cursor.editor.overrides.gmSet')}</span></>}
                {!isGMMode && !canEdit.shape && !overrides.shape && <><Lock className="w-3 h-3 text-red-400" /><span className="text-red-400">{t('vtt.cursor.editor.overrides.locked')}</span></>}
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-0.5 justify-items-center">
                {CURSOR_SHAPES.map(s => (
                  <CursorShapeButton
                    key={s.id}
                    shape={s}
                    isSelected={values.shapeId === s.id}
                    color={values.color}
                    onClick={() => canEdit.shape && onChange('shapeId', s.id)}
                    disabled={!canEdit.shape}
                  />
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className={!canEdit.name ? 'opacity-60' : ''}>
              <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block flex items-center gap-1">
                {t('vtt.cursor.editor.general.name.label')}
                {!isGMMode && overrides.name && <><Crown className="w-3 h-3 text-amber-500" /><span className="text-amber-500">{t('vtt.cursor.editor.overrides.gmSet')}</span></>}
                {!isGMMode && !canEdit.name && !overrides.name && <><Lock className="w-3 h-3 text-red-400" /><span className="text-red-400">{t('vtt.cursor.editor.overrides.locked')}</span></>}
              </label>
              <Input
                value={values.name}
                onChange={(e) => canEdit.name && onChange('name', e.target.value)}
                placeholder={userName}
                maxLength={20}
                disabled={!canEdit.name}
                className="h-7 text-xs"
              />
            </div>

            {/* Color Selection */}
            <div className={!canEdit.color ? 'opacity-60' : ''}>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                {t('vtt.cursor.editor.general.color.label')}
                {!isGMMode && overrides.color && <><Crown className="w-3 h-3 text-amber-500" /><span className="text-amber-500">{t('vtt.cursor.editor.overrides.gmSet')}</span></>}
                {!isGMMode && !canEdit.color && !overrides.color && <><Lock className="w-3 h-3 text-red-400" /><span className="text-red-400">{t('vtt.cursor.editor.overrides.locked')}</span></>}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => canEdit.color && onChange('color', c)}
                    disabled={!canEdit.color}
                    className={`h-5 rounded-md border-2 transition-all ${values.color === c ? 'border-white scale-105 shadow-lg' : 'border-transparent hover:border-zinc-600'} ${!canEdit.color ? 'cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <ColorPicker
                value={values.color}
                onChange={(c) => canEdit.color && onChange('color', c)}
                disabled={!canEdit.color}
              />
            </div>
          </>
        )}

        {/* Animations Tab */}
        {activeTab === 'animations' && (
          <>
            {/* Animation Preview */}
            <div className="flex justify-center py-4 bg-zinc-950/50 rounded-lg border border-dashed border-zinc-800 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex gap-8 items-center">
                <div className="flex flex-col items-center gap-1">
                  <AnimationPreview style={values.clickAnimation} color={values.clickColorLeft} size={80} isVisible={isVisible && activeTab === 'animations'} />
                  <span className="text-[9px] text-zinc-500">{t('vtt.cursor.editor.preview.left')}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <AnimationPreview style={values.clickAnimation} color={values.clickColorRight} size={80} isVisible={isVisible && activeTab === 'animations'} />
                  <span className="text-[9px] text-zinc-500">{t('vtt.cursor.editor.preview.right')}</span>
                </div>
              </div>
            </div>

            {/* Animation Style */}
            <div className={!canEdit.animation ? 'opacity-60' : ''}>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                {t('vtt.cursor.editor.animations.style.label')}
                {!isGMMode && overrides.animation && <><Crown className="w-3 h-3 text-amber-500" /><span className="text-amber-500">{t('vtt.cursor.editor.overrides.gmSet')}</span></>}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {[
                  { id: 'ripple', label: t('vtt.cursor.animations.ripple'), icon: CircleDot },
                  { id: 'burst', label: t('vtt.cursor.animations.burst'), icon: Activity },
                  { id: 'sparkle', label: t('vtt.cursor.animations.sparkle'), icon: Stars },
                  { id: 'pulse', label: t('vtt.cursor.animations.pulse'), icon: Target },
                  { id: 'vortex', label: t('vtt.cursor.animations.vortex'), icon: Disc },
                  { id: 'shard', label: t('vtt.cursor.animations.shard'), icon: Sun },
                  { id: 'ring', label: t('vtt.cursor.animations.ring'), icon: Podcast },
                  { id: 'echo', label: t('vtt.cursor.animations.echo'), icon: Radio },
                  { id: 'orb', label: t('vtt.cursor.animations.orb'), icon: Zap },
                ].map(a => (
                  <button
                    key={a.id}
                    onClick={() => canEdit.animation && onChange('clickAnimation', a.id)}
                    disabled={!canEdit.animation}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[9px] border transition-all ${values.clickAnimation === a.id ? 'bg-primary/10 border-primary text-primary' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'} ${!canEdit.animation ? 'cursor-not-allowed' : ''}`}
                  >
                    <a.icon className="w-3 h-3" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Click Colors */}
            <div className="grid grid-cols-2 gap-2">
              <div className={!canEdit.leftColor ? 'opacity-60' : ''}>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('vtt.cursor.editor.animations.leftColor.label')}</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-0.5">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => canEdit.leftColor && onChange('clickColorLeft', c)}
                      disabled={!canEdit.leftColor}
                      className={`h-4 rounded-sm border ${values.clickColorLeft === c ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className={!canEdit.rightColor ? 'opacity-60' : ''}>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('vtt.cursor.editor.animations.rightColor.label')}</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-0.5">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => canEdit.rightColor && onChange('clickColorRight', c)}
                      disabled={!canEdit.rightColor}
                      className={`h-4 rounded-sm border ${values.clickColorRight === c ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Ping Tab */}
        {activeTab === 'ping' && (
          <>
            {/* Ping Preview */}
            <div className="flex justify-center py-4 bg-zinc-950/50 rounded-lg border border-dashed border-zinc-800 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex flex-col items-center gap-1">
                <AnimationPreview style={values.pingAnimation} color={values.pingColor} size={100} isVisible={isVisible && activeTab === 'ping'} />
                <span className="text-[9px] text-zinc-500">{t('vtt.cursor.editor.preview.ping')}</span>
              </div>
            </div>

            {/* Ping Animation Style */}
            <div className={!canEdit.pingAnimation ? 'opacity-60' : ''}>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                {t('vtt.cursor.editor.ping.style.label')}
                {!isGMMode && overrides.pingAnimation && <><Crown className="w-3 h-3 text-amber-500" /><span className="text-amber-500">{t('vtt.cursor.editor.overrides.gmSet')}</span></>}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {[
                  { id: 'radar', label: t('vtt.cursor.pings.radar'), icon: Radio },
                  { id: 'beacon', label: t('vtt.cursor.pings.beacon'), icon: Zap },
                  { id: 'sonar', label: t('vtt.cursor.pings.sonar'), icon: Podcast },
                  { id: 'pulse', label: t('vtt.cursor.animations.pulse'), icon: Activity },
                  { id: 'target', label: t('vtt.cursor.pings.target'), icon: Target },
                  { id: 'ripple', label: t('vtt.cursor.animations.ripple'), icon: CircleDot },
                  { id: 'flare', label: t('vtt.cursor.pings.flare'), icon: Sun },
                  { id: 'diamond', label: t('vtt.cursor.pings.diamond'), icon: Triangle },
                  { id: 'cross', label: t('vtt.cursor.pings.cross'), icon: Wind },
                ].map(a => (
                  <button
                    key={a.id}
                    onClick={() => canEdit.pingAnimation && onChange('pingAnimation', a.id)}
                    disabled={!canEdit.pingAnimation}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[9px] border transition-all ${values.pingAnimation === a.id ? 'bg-primary/10 border-primary text-primary' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'} ${!canEdit.pingAnimation ? 'cursor-not-allowed' : ''}`}
                  >
                    <a.icon className="w-3 h-3" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ping Color */}
            <div className={!canEdit.pingColor ? 'opacity-60' : ''}>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                {t('vtt.cursor.editor.ping.color.label')}
                {!isGMMode && overrides.pingColor && <><Crown className="w-3 h-3 text-amber-500" /><span className="text-amber-500">{t('vtt.cursor.editor.overrides.gmSet')}</span></>}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => canEdit.pingColor && onChange('pingColor', c)}
                    disabled={!canEdit.pingColor}
                    className={`h-5 rounded-md border-2 transition-all ${values.pingColor === c ? 'border-white scale-105 shadow-lg' : 'border-transparent hover:border-zinc-600'} ${!canEdit.pingColor ? 'cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <ColorPicker
                value={values.pingColor}
                onChange={(c) => canEdit.pingColor && onChange('pingColor', c)}
                disabled={!canEdit.pingColor}
              />
            </div>
          </>
        )}
        {activeTab === 'trail' && (
          <div className={!canEdit.trail ? 'opacity-60' : ''}>
            {/* Trail Enable Toggle */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-semibold text-white flex items-center gap-1">
                {t('vtt.cursor.editor.trail.enable')}
                {!isGMMode && overrides.trail && <><Crown className="w-3 h-3 text-amber-500" /></>}
              </label>
              <div
                onClick={() => canEdit.trail && onChange('trailEnabled', String(!values.trailEnabled))}
                className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${values.trailEnabled ? 'bg-primary' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${values.trailEnabled ? 'left-6' : 'left-1'}`} />
              </div>
            </div>

            {values.trailEnabled && (
              <>
                {/* Trail Style */}
                <div className="mb-3">
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('vtt.cursor.editor.trail.style')}</label>
                  <div className="grid grid-cols-2 gap-1">
                    {['line', 'particles', 'dice', 'sparkles', 'smoke', 'electric'].map(style => (
                      <button
                        key={style}
                        onClick={() => canEdit.trail && onChange('trailAnimation', style)}
                        className={`px-2 py-1.5 rounded text-[10px] border transition-all ${values.trailAnimation === style ? 'bg-primary/20 border-primary text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                      >
                        {t(`vtt.cursor.trails.${style}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trail Color */}
                <div className="mb-3">
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('vtt.cursor.editor.trail.color')}</label>
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    {PRESET_COLORS.slice(0, 6).map(c => (
                      <button key={c} onClick={() => canEdit.trail && onChange('trailColor', c)} className={`h-5 rounded border ${values.trailColor === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <ColorPicker value={values.trailColor} onChange={c => canEdit.trail && onChange('trailColor', c)} disabled={!canEdit.trail} />
                </div>

                {/* Trail Length/Size */}
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t('vtt.cursor.editor.trail.length')}</label>
                  <input
                    type="range" min="5" max="50"
                    value={values.trailLength}
                    onChange={e => canEdit.trail && onChange('trailLength', e.target.value)}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'options' && (
          <div className="space-y-3">
            {/* Show Others' Trails */}
            <div className="flex items-center justify-between p-2 bg-zinc-900 rounded border border-zinc-800">
              <span className="text-[11px] text-zinc-300">{t('vtt.cursor.editor.options.showOthersTrails')}</span>
              <div
                onClick={() => onChange('showOthersTrails', String(!values.showOthersTrails))}
                className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${values.showOthersTrails ? 'bg-primary' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${values.showOthersTrails ? 'left-4.5' : 'left-0.5'}`} />
              </div>
            </div>

            {/* Show My Trail */}
            <div className="flex items-center justify-between p-2 bg-zinc-900 rounded border border-zinc-800">
              <span className="text-[11px] text-zinc-300">{t('vtt.cursor.editor.options.showMyTrail')}</span>
              <div
                onClick={() => onChange('showMyTrail', String(!values.showMyTrail))}
                className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${values.showMyTrail ? 'bg-primary' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${values.showMyTrail ? 'left-4.5' : 'left-0.5'}`} />
              </div>
            </div>

            {/* Explosion on Collision */}
            <div className="flex items-center justify-between p-2 bg-zinc-900 rounded border border-zinc-800">
              <span className="text-[11px] text-zinc-300">{t('vtt.cursor.editor.options.explosionOnCollision')}</span>
              <div
                onClick={() => onChange('explosionOnCollision', String(!values.explosionOnCollision))}
                className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${values.explosionOnCollision ? 'bg-primary' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${values.explosionOnCollision ? 'left-4.5' : 'left-0.5'}`} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
