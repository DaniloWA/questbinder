import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ColorPicker } from '../ui/ColorPicker';
import { Check, RefreshCw, User as UserIcon, Lock, Crown, Stars, Activity, CircleDot, Zap, Wind, Triangle, Target, Disc, Sun, Podcast, Radio } from 'lucide-react';
import { getContrastColor } from '../../utils/colors';
import { CURSOR_SHAPES, getCursorShape, CursorShape } from './constants/cursorShapes';

interface CursorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#fbbf24', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef', '#f43f5e',
];

// Animation preview that only animates when active (hovered or in viewport)
const AnimationPreview: React.FC<{ style: string; color: string; size?: number; }> = React.memo(({ style, color, size = 60 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(true); // Start active, pause after initial cycle
  const initialCycleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only animate if active
    if (!isActive && !initialCycleRef.current) {
      return;
    }

    let startTime = Date.now();
    let animationFrame: number;
    let cycleCount = 0;

    const render = () => {
      const now = Date.now();
      const DURATION = 500;
      const LOOP_DELAY = 1500;

      // Reset loop
      if (now - startTime > LOOP_DELAY) {
        startTime = now;
        cycleCount++;
        // After 1 initial cycle, stop animating unless hovered
        if (cycleCount >= 1 && !isActive) {
          initialCycleRef.current = false;
          return;
        }
      }

      const progress = Math.min(1, (now - startTime) / DURATION);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, size, size);

      // Don't render if waiting for loop delay (gap between animations)
      if (now - startTime <= DURATION) {
        ctx.save();
        ctx.translate(size / 2, size / 2);

        // Scale down slightly to fit canvas
        const scale = 0.5;

        ctx.globalAlpha = 1 - easeOut;

        if (style === 'radar') {
          // Radar Scan
          ctx.rotate(progress * Math.PI * 4);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, size / 2 * scale * 1.5, 0, Math.PI / 4);
          ctx.lineTo(0, 0);
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2 * scale * 1.5);
          grad.addColorStop(0, color);
          grad.addColorStop(1, 'transparent'); // adjustAlpha not avail here, imply opacity via color usually but here simple
          ctx.fillStyle = color; // Simple fill for preview
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.rotate(-progress * Math.PI * 4);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 1 - progress;
          ctx.beginPath(); ctx.arc(0, 0, size / 2 * scale * 2 * progress, 0, Math.PI * 2); ctx.stroke();
        } else if (style === 'beacon') {
          const h = size / 2 * scale * 2 * easeOut;
          ctx.globalAlpha = 1 - progress;
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
          for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2 * i + (progress * 2));
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size / 2 * scale * 2, 0);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        } else if (style === 'target') {
          const r = size / 2 * scale * 1.5 * (1 - easeOut);
          ctx.globalAlpha = Math.min(1, easeOut * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.beginPath(); ctx.arc(0, 0, Math.max(0, r), 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(-size / 4, 0); ctx.lineTo(size / 4, 0);
          ctx.moveTo(0, -size / 4); ctx.lineTo(0, size / 4);
          ctx.stroke();
        } else if (style === 'sonar') {
          for (let i = 0; i < 3; i++) {
            const waveProgress = (progress * 3 + i) % 3 / 3;
            const r = size / 2 * scale * 2 * waveProgress;
            ctx.globalAlpha = 1 - waveProgress;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
          }
        } else if (style === 'flare') {
          ctx.globalAlpha = Math.pow(1 - progress, 5);
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(0, 0, size / 2 * scale * 2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        } else if (style === 'diamond') {
          ctx.rotate(progress * Math.PI);
          const r = size / 2 * scale * (1 + easeOut);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 1 - progress;
          ctx.strokeRect(-r / 2, -r / 2, r, r);
          ctx.rotate(Math.PI / 4);
          ctx.strokeRect(-r / 2, -r / 2, r, r);
        } else if (style === 'cross') {
          const s = 1 + easeOut;
          ctx.scale(s, s);
          ctx.lineWidth = 2;
          ctx.strokeStyle = color;
          ctx.globalAlpha = 1 - progress;
          const len = size / 4;
          ctx.beginPath();
          ctx.moveTo(-len, -len); ctx.lineTo(len, len);
          ctx.moveTo(len, -len); ctx.lineTo(-len, len);
          ctx.stroke();
        } else if (style === 'burst') {
          const maxR = size * scale;
          const currentR = maxR * easeOut;
          const lines = 8;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          for (let i = 0; i < lines; i++) {
            const angle = (Math.PI * 2 / lines) * i;
            const x1 = Math.cos(angle) * (currentR * 0.4);
            const y1 = Math.sin(angle) * (currentR * 0.4);
            const x2 = Math.cos(angle) * currentR;
            const y2 = Math.sin(angle) * currentR;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          }
        } else if (style === 'sparkle') {
          const maxDist = size * scale * 0.8;
          const particles = 5;
          ctx.fillStyle = color;
          for (let i = 0; i < particles; i++) {
            const angle = (Math.PI * 2 / particles) * i + (now / 200);
            const dist = maxDist * easeOut;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
          }
        } else if (style === 'pulse') {
          const maxR = size * scale * 0.8;
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(0, 0, maxR * easeOut, 0, Math.PI * 2); ctx.fill();
        } else if (style === 'vortex') {
          const maxR = size * scale;
          const spirals = 3;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          for (let j = 0; j < spirals; j++) {
            const angleOffset = (Math.PI * 2 / spirals) * j + (easeOut * Math.PI * 2);
            ctx.beginPath();
            for (let i = 0; i < 15; i++) {
              const r = (i / 15) * maxR * easeOut;
              const a = angleOffset + (i / 4);
              const x = Math.cos(a) * r;
              const y = Math.sin(a) * r;
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        } else if (style === 'shard') {
          const shards = 5;
          const dist = size * scale * 0.8 * easeOut;
          ctx.fillStyle = color;
          for (let i = 0; i < shards; i++) {
            const angle = (Math.PI * 2 / shards) * i;
            const sx = Math.cos(angle) * dist;
            const sy = Math.sin(angle) * dist;
            ctx.beginPath(); ctx.moveTo(sx, sy);
            const s = 4;
            ctx.lineTo(sx + Math.cos(angle + 2.5) * s, sy + Math.sin(angle + 2.5) * s);
            ctx.lineTo(sx + Math.cos(angle - 2.5) * s, sy + Math.sin(angle - 2.5) * s);
            ctx.fill();
          }
        } else if (style === 'ring') {
          const r1 = size * scale * 0.6 * easeOut;
          const r2 = size * scale * 0.4 * easeOut;
          ctx.strokeStyle = color; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, r1, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, r2, 0, Math.PI * 2); ctx.stroke();
        } else if (style === 'echo') {
          const count = 3;
          ctx.strokeStyle = color; ctx.lineWidth = 1.5;
          for (let i = 0; i < count; i++) {
            const r = (size * scale) * easeOut * (1 - i * 0.25);
            if (r > 0) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
          }
        } else if (style === 'orb') {
          const r = size * scale * 0.5 * easeOut;
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = (1 - easeOut) * 0.5;
          ctx.beginPath(); ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2); ctx.fill();
        } else {
          // Ripple
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
  }, [style, color, size, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="bg-zinc-950/30 rounded-lg border border-zinc-800/50 cursor-pointer"
      onMouseEnter={() => { setIsActive(true); initialCycleRef.current = true; }}
      onMouseLeave={() => setIsActive(false)}
    />
  );
});

// Memoized cursor shape button to prevent unnecessary re-renders
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
    className={`aspect-square rounded transition-all flex items-center justify-center border overflow-hidden ${isSelected ? 'bg-primary/20 border-primary' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
      } ${disabled ? 'cursor-not-allowed' : ''}`}
    title={shape.label}
  >
    {shape.Component ? (
      <shape.Component color={isSelected ? color : '#71717a'} size={18} />
    ) : shape.imageUrl ? (
      <img src={shape.imageUrl} alt={shape.label} className="w-5 h-5 object-contain" />
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d={shape.path} fill={isSelected ? color : '#71717a'} />
      </svg>
    )}
  </button>
));


export const CursorSettingsModal: React.FC<CursorSettingsModalProps> = ({ isOpen, onClose }) => {
  const { cursorSettings, setCursorSettings, permissions, isGM, players, updatePermissions, campaign } = useGameSession();
  const { user } = useAuth();

  // For self-editing
  const [activeTab, setActiveTab] = useState<'general' | 'animations' | 'ping'>('general');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#fbbf24');
  const [shapeId, setShapeId] = useState('default');
  const [clickAnimation, setClickAnimation] = useState<'ripple' | 'burst' | 'sparkle' | 'pulse' | 'vortex' | 'shard' | 'ring' | 'echo' | 'orb'>('ripple');
  const [clickColorLeft, setClickColorLeft] = useState('#3b82f6');
  const [clickColorRight, setClickColorRight] = useState('#f59e0b');
  const [pingColor, setPingColor] = useState('#fbbf24');
  const [pingAnimation, setPingAnimation] = useState<'radar' | 'beacon' | 'sonar' | 'pulse' | 'target' | 'ripple' | 'flare' | 'diamond' | 'cross'>('radar');

  // For GM player management
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeOverrideTab, setActiveOverrideTab] = useState<'general' | 'animations' | 'ping'>('general');
  const [localOverrides, setLocalOverrides] = useState<Record<string, {
    color?: string, shape?: string, name?: string;
    clickAnimation?: string; clickColorLeft?: string; clickColorRight?: string;
    pingColor?: string; pingAnimation?: string;
  }>>({});

  // Check permissions - use flat permissions with per-user override support
  const canChangeColor = isGM || (permissions?.cursorAllowColorChange ?? true);
  const canChangeShape = isGM || (permissions?.cursorAllowShapeChange ?? true);
  const canChangeName = isGM || (permissions?.cursorAllowNameChange ?? true);
  const canChangeAnimation = isGM || (permissions?.cursorAllowAnimationChange ?? true);
  const canChangeAnimationColor = isGM || (permissions?.cursorAllowAnimationColorChange ?? true);
  // Ping permissions (reuse animation permissions for simplicity or add new ones if strictly required, sticking to plan: reuse/mirror)
  const canChangePing = isGM || (permissions?.cursorAllowAnimationChange ?? true); // Reusing logic as per conversation

  // Check if there's a GM override for current user
  const myOverride = (permissions?.cursorOverrides?.[user?.id || ''] || {}) as {
    color?: string, shape?: string, name?: string;
    clickAnimation?: string; clickColorLeft?: string; clickColorRight?: string;
    pingColor?: string; pingAnimation?: string;
  };

  // Determine effective values and lock status
  const isShapeOverridden = !!myOverride.shape;
  const isNameOverridden = !!myOverride.name;
  const isColorOverridden = !!myOverride.color;
  const isAnimOverridden = !!myOverride.clickAnimation;
  const isLeftColorOverridden = !!myOverride.clickColorLeft;
  const isRightColorOverridden = !!myOverride.clickColorRight;
  const isPingColorOverridden = !!myOverride.pingColor;
  const isPingAnimOverridden = !!myOverride.pingAnimation;

  const canEditShape = (canChangeShape && !isShapeOverridden);
  const canEditName = (canChangeName && !isNameOverridden);
  const canEditColor = (canChangeColor && !isColorOverridden);
  const canEditAnim = (canChangeAnimation && !isAnimOverridden);
  const canEditLeft = (canChangeAnimationColor && !isLeftColorOverridden);
  const canEditRight = (canChangeAnimationColor && !isRightColorOverridden);
  const canEditPingColor = (canChangeColor && !isPingColorOverridden); // Reuse global color change permission? Or AnimColor? Let's use AnimColor for Ping Color
  const canEditPingAnim = (canChangeAnimation && !isPingAnimOverridden);

  const effectiveShapeId = myOverride.shape || shapeId;
  const effectiveColor = myOverride.color || color;
  const effectiveName = myOverride.name || name;
  const effectiveAnim = myOverride.clickAnimation || clickAnimation;
  const effectiveLeft = myOverride.clickColorLeft || clickColorLeft;
  const effectiveRight = myOverride.clickColorRight || clickColorRight;
  const effectivePingColor = myOverride.pingColor || pingColor;
  const effectivePingAnim = myOverride.pingAnimation || pingAnimation;

  // Filter players: exclude campaign owner (GM)
  const nonGMPlayers = players.filter(p => p.id !== campaign?.ownerId);

  useEffect(() => {
    if (isOpen) {
      setName(cursorSettings?.name || user?.name || '');
      setColor(cursorSettings?.color || '#fbbf24');
      setShapeId(cursorSettings?.shape || 'default');
      setClickAnimation(cursorSettings?.clickAnimation || 'ripple');
      setClickColorLeft(cursorSettings?.clickColorLeft || '#3b82f6');
      setClickColorRight(cursorSettings?.clickColorRight || '#f59e0b');
      setPingColor(cursorSettings?.pingColor || cursorSettings?.color || '#fbbf24');
      setPingAnimation(cursorSettings?.pingAnimation || 'radar');
      setLocalOverrides(permissions?.cursorOverrides || {});
      setSelectedPlayerId(null);
      setActiveTab('general');
      setActiveOverrideTab('general');
      initialSettingsRef.current = { ...cursorSettings };
    }
  }, [isOpen]);

  const initialSettingsRef = useRef<any>(null);

  const handleLiveUpdate = (updates: any) => {
    setCursorSettings({ ...cursorSettings, ...updates });
  };

  const handleCancel = () => {
    if (initialSettingsRef.current) {
      setCursorSettings(initialSettingsRef.current);
    }
    onClose();
  };

  const handleSaveAll = () => {
    setCursorSettings({
      name, color, shape: shapeId,
      clickAnimation,
      clickColorLeft,
      clickColorRight,
      pingAnimation: pingAnimation as any,
      pingColor
    });
    if (isGM) {
      updatePermissions({ cursorOverrides: localOverrides });
    }
    onClose();
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const currentOverride = selectedPlayerId ? (localOverrides[selectedPlayerId] || {}) : {};
  const selectedShape = getCursorShape(shapeId);

  const updateOverride = (field: 'color' | 'shape' | 'name' | 'clickAnimation' | 'clickColorLeft' | 'clickColorRight' | 'pingColor' | 'pingAnimation', value: string | undefined) => {
    if (!selectedPlayerId) return;

    const newOverrides = { ...localOverrides };
    const current = newOverrides[selectedPlayerId] || {};
    const updated = { ...current, [field]: value };

    if (value === undefined) delete updated[field];

    if (Object.keys(updated).length === 0) {
      delete newOverrides[selectedPlayerId];
    } else {
      newOverrides[selectedPlayerId] = updated;
    }

    setLocalOverrides(newOverrides);
    // Live update permissions
    updatePermissions({ cursorOverrides: newOverrides });
  };

  const clearOverride = () => {
    if (!selectedPlayerId) return;

    const newOverrides = { ...localOverrides };
    delete newOverrides[selectedPlayerId];

    setLocalOverrides(newOverrides);
    updatePermissions({ cursorOverrides: newOverrides });
  };

  // Helper to render GM override info for players
  const renderOverrideInfo = () => {
    const parts = [];
    if (myOverride.name) {
      parts.push(<div key="name" className="flex items-center gap-2 text-xs">
        <Crown className="w-3 h-3 text-amber-400" />
        <span>Nome definido pelo Mestre: <strong className="text-white">{myOverride.name}</strong></span>
      </div>);
    }
    if (myOverride.color) {
      parts.push(<div key="color" className="flex items-center gap-2 text-xs">
        <Crown className="w-3 h-3 text-amber-400" />
        <span>Cor definida pelo Mestre:</span>
        <div className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: myOverride.color }} />
      </div>);
    }
    if (myOverride.shape) {
      const shape = getCursorShape(myOverride.shape);
      parts.push(<div key="shape" className="flex items-center gap-2 text-xs">
        <Crown className="w-3 h-3 text-amber-400" />
        <span>Formato definido pelo Mestre: <strong className="text-white">{shape.label}</strong></span>
      </div>);
    }
    return parts.length > 0 ? (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 space-y-1 text-amber-200">
        {parts}
      </div>
    ) : null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cursores" size={isGM ? 'lg' : 'md'}>
      <div className={`flex gap-4 ${isGM ? 'h-[420px]' : ''}`}>

        {/* GM: Player List Sidebar */}
        {isGM && (
          <div className="w-44 flex-shrink-0 border-r border-zinc-800 pr-3 flex flex-col">
            <button
              onClick={() => setSelectedPlayerId(null)}
              className={`w-full flex items-center gap-2 p-2 rounded-md text-sm mb-2 ${selectedPlayerId === null
                ? 'bg-primary/20 text-primary font-bold'
                : 'text-zinc-400 hover:bg-zinc-800'
                }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Meu Cursor</span>
            </button>

            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 px-2">Jogadores</div>

            <div className="flex-1 overflow-y-auto space-y-0.5">
              {nonGMPlayers.map(p => {
                const hasOverride = Object.keys(localOverrides[p.id] || {}).length > 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`w-full flex items-center gap-2 p-1.5 rounded-md text-xs ${selectedPlayerId === p.id
                      ? 'bg-amber-500/20 text-amber-400 font-bold'
                      : 'text-zinc-400 hover:bg-zinc-800'
                      }`}
                  >
                    <img src={p.avatarUrl} className="w-4 h-4 rounded-full bg-zinc-800" alt={p.name} />
                    <span className="truncate flex-1 text-left">{p.name}</span>
                    {hasOverride && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </button>
                );
              })}
              {nonGMPlayers.length === 0 && (
                <p className="text-[10px] text-zinc-600 italic px-2">Nenhum jogador.</p>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Self Editing Mode */}
          {selectedPlayerId === null && (
            <div className="flex-1 flex flex-col gap-2">

              {/* GM Override Info for players */}
              {!isGM && renderOverrideInfo()}

              {/* Preview */}
              <div className="flex justify-center py-2 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800">
                <div className="relative">
                  {selectedShape.Component ? (
                    <selectedShape.Component color={effectiveColor} size={50} className="drop-shadow-md" />
                  ) : selectedShape.imageUrl ? (
                    <img
                      src={selectedShape.imageUrl}
                      alt={selectedShape.label}
                      className="w-[50px] h-[50px] object-contain drop-shadow-md"
                    />
                  ) : (
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.3))' }}>
                      <g transform="translate(30, 30) scale(1.2)">
                        <g transform={`scale(${selectedShape.scale || 1}) translate(${-selectedShape.hotspot.x}, ${-selectedShape.hotspot.y})`}>
                          <path d={selectedShape.path} fill={effectiveColor} stroke="white" strokeWidth="1" />
                        </g>
                      </g>
                    </svg>
                  )}
                  <div
                    className="absolute left-[42px] top-[42px] px-1 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap shadow-sm z-10"
                    style={{ backgroundColor: effectiveColor, color: getContrastColor(effectiveColor) }}
                  >
                    {effectiveName || user?.name || 'Nome'}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`flex-1 text-[10px] py-1 rounded transition-all ${activeTab === 'general' ? 'bg-zinc-700 text-white shadow font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Geral
                </button>
                <button
                  onClick={() => setActiveTab('animations')}
                  className={`flex-1 text-[10px] py-1 rounded transition-all ${activeTab === 'animations' ? 'bg-zinc-700 text-white shadow font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Animações
                </button>
                <button
                  onClick={() => setActiveTab('ping')}
                  className={`flex-1 text-[10px] py-1 rounded transition-all ${activeTab === 'ping' ? 'bg-zinc-700 text-white shadow font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Ping
                </button>
              </div>

              {/* Content: General */}
              {activeTab === 'general' && (
                <>
                  {/* Shape Selection */}
                  <div className={!canEditShape ? 'opacity-60' : ''}>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                      Formato
                      {isShapeOverridden && <><Crown className="w-3 h-3 text-amber-500" /><span className="text-amber-500">Definido pelo GM</span></>}
                      {!canChangeShape && !isShapeOverridden && <><Lock className="w-3 h-3 text-red-400" /><span className="text-red-400">Bloqueado</span></>}
                    </label>
                    <div className="grid grid-cols-9 gap-0.5">
                      {CURSOR_SHAPES.map(s => (
                        <CursorShapeButton
                          key={s.id}
                          shape={s}
                          isSelected={effectiveShapeId === s.id}
                          color={effectiveColor}
                          onClick={() => canEditShape && setShapeId(s.id)}
                          disabled={!canEditShape}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Name Input */}
                  <div className={!canEditName ? 'opacity-60' : ''}>
                    <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block flex items-center gap-1">
                      Nome de Exibição
                      {isNameOverridden && <><Crown className="w-3 h-3 text-amber-500" /><span className="text-amber-500">Definido pelo GM</span></>}
                      {!canChangeName && !isNameOverridden && <><Lock className="w-3 h-3 text-red-400" /><span className="text-red-400">Bloqueado</span></>}
                    </label>
                    <Input
                      value={effectiveName}
                      onChange={(e) => canEditName && setName(e.target.value)}
                      placeholder={user?.name}
                      maxLength={20}
                      disabled={!canEditName}
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* Color Selection */}
                  <div className={!canEditColor ? 'opacity-60' : ''}>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                      Cor Principal
                      {isColorOverridden && <><Crown className="w-3 h-3 text-amber-500" /><span className="text-amber-500">Definido pelo GM</span></>}
                      {!canChangeColor && !isColorOverridden && <><Lock className="w-3 h-3 text-red-400" /><span className="text-red-400">Bloqueado</span></>}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="grid grid-cols-12 gap-0.5 flex-1">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => canEditColor && setColor(c)}
                            disabled={!canEditColor}
                            className={`w-5 h-5 rounded-full transition-all flex items-center justify-center ${effectiveColor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                              } ${!canEditColor ? 'cursor-not-allowed' : ''}`}
                            style={{ backgroundColor: c }}
                          >
                            {effectiveColor === c && <Check className="w-2.5 h-2.5 text-white drop-shadow-md" />}
                          </button>
                        ))}
                      </div>
                      <input
                        type="color"
                        value={effectiveColor}
                        onChange={(e) => canEditColor && setColor(e.target.value)}
                        disabled={!canEditColor}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border border-zinc-700"
                        title="Cor personalizada"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Content: Animations */}
              {activeTab === 'animations' && (
                <div className="space-y-3 pt-1">

                  {!canChangeAnimation && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-1.5 rounded flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      <span>Configuração bloqueada pelo Mestre</span>
                    </div>
                  )}

                  {/* Main Preview */}
                  <div className="flex justify-center py-4 bg-zinc-950/50 rounded-lg border border-dashed border-zinc-800 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex gap-8 items-center">
                      <div className="flex flex-col items-center gap-1">
                        <AnimationPreview style={effectiveAnim} color={effectiveLeft} size={80} />
                        <span className="text-[9px] text-zinc-500">Esquerdo</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <AnimationPreview style={effectiveAnim} color={effectiveRight} size={80} />
                        <span className="text-[9px] text-zinc-500">Direito</span>
                      </div>
                    </div>
                  </div>

                  {/* Style Selection */}
                  <div>
                    <label className={`text-[10px] font-medium text-muted-foreground mb-1 block ${!canEditAnim ? 'opacity-50' : ''} flex items-center gap-1`}>
                      Estilo do Clique
                      {isAnimOverridden && <><Crown className="w-3 h-3 text-amber-500" /><span className="text-amber-500">Definido pelo GM</span></>}
                      {!canChangeAnimation && !isAnimOverridden && <><Lock className="w-3 h-3 text-red-400" /><span className="text-red-400">Bloqueado</span></>}
                    </label>
                    <div className={`grid grid-cols-3 gap-2 ${!canEditAnim ? 'pointer-events-none opacity-50' : ''}`}>
                      {[
                        { id: 'ripple', label: 'Ondas', icon: CircleDot },
                        { id: 'burst', label: 'Explosão', icon: Activity },
                        { id: 'sparkle', label: 'Brilho', icon: Stars },
                        { id: 'pulse', label: 'Pulso', icon: Target },
                        { id: 'vortex', label: 'Vórtice', icon: Wind },
                        { id: 'shard', label: 'Estilhaços', icon: Triangle },
                        { id: 'ring', label: 'Anel Duplo', icon: Disc },
                        { id: 'echo', label: 'Eco', icon: Podcast },
                        { id: 'orb', label: 'Orbe', icon: Sun },
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => {
                            if (canEditAnim) {
                              setClickAnimation(type.id as any);
                              handleLiveUpdate({ clickAnimation: type.id });
                            }
                          }}
                          className={`flex flex-col items-center gap-1 p-2 rounded border transition-all ${effectiveAnim === type.id
                            ? 'bg-primary/20 border-primary text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                            }`}
                        >
                          <type.icon className="w-4 h-4" />
                          <span className="text-[10px]">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors Row */}
                  <div className={`grid grid-cols-2 gap-2 mt-2 ${!(canEditLeft || canEditRight) ? 'opacity-80' : ''}`}>
                    {/* Left Click Color */}
                    <div className={`flex items-center justify-between bg-zinc-900/50 p-2 rounded border border-zinc-800 relative ${!canEditLeft ? 'opacity-60 pointer-events-none' : ''}`}>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-300">Botão Esquerdo</span>
                        <span className="text-[9px] text-zinc-500">Primário</span>
                        {isLeftColorOverridden && <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5"><Crown className="w-2 h-2" /> GM</span>}
                      </div>
                      <ColorPicker
                        value={effectiveLeft}
                        onChange={(v) => { if (canEditLeft) { setClickColorLeft(v); handleLiveUpdate({ clickColorLeft: v }); } }}
                      />
                    </div>

                    {/* Right Click Color */}
                    <div className={`flex items-center justify-between bg-zinc-900/50 p-2 rounded border border-zinc-800 relative ${!canEditRight ? 'opacity-60 pointer-events-none' : ''}`}>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-300">Botão Direito</span>
                        <span className="text-[9px] text-zinc-500">Secundário</span>
                        {isRightColorOverridden && <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5"><Crown className="w-2 h-2" /> GM</span>}
                      </div>
                      <ColorPicker
                        value={effectiveRight}
                        onChange={(v) => { if (canEditRight) { setClickColorRight(v); handleLiveUpdate({ clickColorRight: v }); } }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Content: Ping */}
              {activeTab === 'ping' && (
                <div className="space-y-3 pt-1">

                  {!canChangePing && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-1.5 rounded flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      <span>Configuração bloqueada pelo Mestre</span>
                    </div>
                  )}

                  {/* Preview */}
                  <div className="flex justify-center py-4 bg-zinc-950/50 rounded-lg border border-dashed border-zinc-800 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex flex-col items-center gap-1">
                      <AnimationPreview style={effectivePingAnim} color={effectivePingColor} size={100} />
                      <span className="text-[9px] text-zinc-500">Visualização do Ping</span>
                    </div>
                  </div>

                  {/* Style Selection */}
                  <div>
                    <label className={`text-[10px] font-medium text-muted-foreground mb-1 block ${!canEditPingAnim ? 'opacity-50' : ''} flex items-center gap-1`}>
                      Estilo do Ping
                      {isPingAnimOverridden && <><Crown className="w-3 h-3 text-amber-500" /><span className="text-amber-500">Definido pelo GM</span></>}
                      {!canChangePing && !isPingAnimOverridden && <><Lock className="w-3 h-3 text-red-400" /><span className="text-red-400">Bloqueado</span></>}
                    </label>
                    <div className={`grid grid-cols-3 gap-2 ${!canEditPingAnim ? 'pointer-events-none opacity-50' : ''}`}>
                      {[
                        { id: 'radar', label: 'Radar', icon: Radio },
                        { id: 'beacon', label: 'Beacon', icon: Zap },
                        { id: 'sonar', label: 'Sonar', icon: Podcast },
                        { id: 'pulse', label: 'Pulso', icon: Activity },
                        { id: 'target', label: 'Alvo', icon: Target },
                        { id: 'ripple', label: 'Ondas', icon: CircleDot },
                        { id: 'flare', label: 'Clarão', icon: Sun },
                        { id: 'diamond', label: 'Losango', icon: Triangle },
                        { id: 'cross', label: 'Cruz', icon: Wind }, // Using Wind as placeholder for Cross/X
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => {
                            if (canEditPingAnim) {
                              setPingAnimation(type.id as any);
                              handleLiveUpdate({ pingAnimation: type.id });
                            }
                          }}
                          className={`flex flex-col items-center gap-1 p-2 rounded border transition-all ${effectivePingAnim === type.id
                            ? 'bg-primary/20 border-primary text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                            }`}
                        >
                          <type.icon className="w-4 h-4" />
                          <span className="text-[10px]">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div className={`mt-2 ${!canEditPingColor ? 'opacity-60 pointer-events-none' : ''}`}>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                      Cor do Ping
                      {isPingColorOverridden && <><Crown className="w-3 h-3 text-amber-500" /><span className="text-amber-500">Definido pelo GM</span></>}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="grid grid-cols-12 gap-0.5 flex-1">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => { if (canEditPingColor) { setPingColor(c); handleLiveUpdate({ pingColor: c }); } }}
                            className={`w-5 h-5 rounded-full transition-all flex items-center justify-center ${effectivePingColor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                              }`}
                            style={{ backgroundColor: c }}
                          >
                            {effectivePingColor === c && <Check className="w-2.5 h-2.5 text-white drop-shadow-md" />}
                          </button>
                        ))}
                      </div>
                      <input
                        type="color"
                        value={effectivePingColor}
                        onChange={(e) => { if (canEditPingColor) { setPingColor(e.target.value); handleLiveUpdate({ pingColor: e.target.value }); } }}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border border-zinc-700"
                        title="Cor personalizada"
                      />
                    </div>
                  </div>

                </div>
              )}


            </div>
          )}

          {/* GM: Player Override Mode */}
          {selectedPlayerId !== null && selectedPlayer && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 shrink-0">
                <div>
                  <h3 className="text-xs font-bold text-white">{selectedPlayer.name}</h3>
                  <p className="text-[9px] text-zinc-500">Definir override</p>
                </div>
                {Object.keys(currentOverride).length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearOverride} className="text-amber-400 text-[10px] h-6 px-2">
                    <RefreshCw className="w-3 h-3 mr-1" /> Limpar
                  </Button>
                )}
              </div>

              {/* GM Tabs */}
              <div className="flex bg-zinc-900 p-0.5 rounded-md border border-zinc-800 my-2 shrink-0">
                <button
                  onClick={() => setActiveOverrideTab('general')}
                  className={`flex-1 text-[10px] py-1 rounded transition-all ${activeOverrideTab === 'general' ? 'bg-zinc-700 text-white shadow font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Geral
                </button>
                <button
                  onClick={() => setActiveOverrideTab('animations')}
                  className={`flex-1 text-[10px] py-1 rounded transition-all flex items-center justify-center gap-1 ${activeOverrideTab === 'animations' ? 'bg-zinc-700 text-white shadow font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Animações
                  {currentOverride.clickAnimation && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
                </button>
                <button
                  onClick={() => setActiveOverrideTab('ping')}
                  className={`flex-1 text-[10px] py-1 rounded transition-all flex items-center justify-center gap-1 ${activeOverrideTab === 'ping' ? 'bg-zinc-700 text-white shadow font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Ping
                  {(currentOverride.pingAnimation || currentOverride.pingColor) && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                {activeOverrideTab === 'general' && (
                  <>
                    {/* Preview */}
                    <div className="flex justify-center py-2 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800">
                      <div className="relative">
                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.3))' }}>
                          <g transform="translate(30, 30) scale(1.2)">
                            <g transform={`scale(${getCursorShape(currentOverride.shape || 'default').scale || 1}) translate(${-getCursorShape(currentOverride.shape || 'default').hotspot.x}, ${-getCursorShape(currentOverride.shape || 'default').hotspot.y})`}>
                              {getCursorShape(currentOverride.shape || 'default').imageUrl ? (
                                <image href={getCursorShape(currentOverride.shape || 'default').imageUrl} width="512" height="512" />
                              ) : (
                                <path d={getCursorShape(currentOverride.shape || 'default').path} fill={currentOverride.color || '#fbbf24'} stroke="white" strokeWidth="1" />
                              )}
                            </g>
                          </g>
                        </svg>
                        <div
                          className="absolute left-[42px] top-[42px] px-1 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap shadow-sm z-10"
                          style={{ backgroundColor: currentOverride.color || '#fbbf24', color: getContrastColor(currentOverride.color || '#fbbf24') }}
                        >
                          {currentOverride.name || selectedPlayer.name}
                        </div>
                      </div>
                    </div>

                    {/* Shape Override */}
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Formato</label>
                      <div className="grid grid-cols-9 gap-0.5">
                        {CURSOR_SHAPES.map(s => (
                          <CursorShapeButton
                            key={s.id}
                            shape={s}
                            isSelected={currentOverride.shape === s.id}
                            color={currentOverride.color || '#fbbf24'}
                            onClick={() => updateOverride('shape', currentOverride.shape === s.id ? undefined : s.id)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Name Override */}
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Nome</label>
                      <Input
                        value={currentOverride.name || ''}
                        onChange={(e) => updateOverride('name', e.target.value || undefined)}
                        placeholder={selectedPlayer.name}
                        maxLength={20}
                        className="h-7 text-xs"
                      />
                    </div>

                    {/* Color Override */}
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Cor</label>
                      <div className="flex items-center gap-1.5">
                        <div className="grid grid-cols-12 gap-0.5 flex-1">
                          {PRESET_COLORS.map(c => (
                            <button
                              key={c}
                              onClick={() => updateOverride('color', currentOverride.color === c ? undefined : c)}
                              className={`w-5 h-5 rounded-full transition-all flex items-center justify-center ${currentOverride.color === c ? 'ring-2 ring-amber-500 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                                }`}
                              style={{ backgroundColor: c }}
                            >
                              {currentOverride.color === c && <Check className="w-2.5 h-2.5 text-white drop-shadow-md" />}
                            </button>
                          ))}
                        </div>
                        <input
                          type="color"
                          value={currentOverride.color || '#fbbf24'}
                          onChange={(e) => updateOverride('color', e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border border-zinc-700"
                          title="Cor personalizada"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeOverrideTab === 'animations' && (
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Animação de Clique e Cor</label>
                    <div className="flex gap-2">
                      {/* Tiny Preview */}
                      <div className="shrink-0 pt-1">
                        <AnimationPreview style={currentOverride.clickAnimation || 'ripple'} color={currentOverride.clickColorLeft || '#3b82f6'} size={40} />
                      </div>
                      {/* Grid */}
                      <div className="flex-1 grid grid-cols-5 gap-1">
                        {[
                          { id: 'ripple', label: 'Rl', icon: CircleDot },
                          { id: 'burst', label: 'Bu', icon: Activity },
                          { id: 'sparkle', label: 'Sp', icon: Stars },
                          { id: 'pulse', label: 'Pu', icon: Target },
                          { id: 'vortex', label: 'Vo', icon: Wind },
                          { id: 'shard', label: 'Sh', icon: Triangle },
                          { id: 'ring', label: 'Ri', icon: Disc },
                          { id: 'echo', label: 'Ec', icon: Podcast },
                          { id: 'orb', label: 'Or', icon: Sun },
                        ].map(type => (
                          <button
                            key={type.id}
                            onClick={() => updateOverride('clickAnimation', currentOverride.clickAnimation === type.id ? undefined : type.id)}
                            className={`aspect-square rounded transition-all flex items-center justify-center border ${currentOverride.clickAnimation === type.id
                              ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                              }`}
                            title={`Animation: ${type.id}`}
                          >
                            <type.icon className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Colors Override */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center justify-between bg-zinc-900/50 p-1.5 rounded border border-zinc-800">
                        <span className="text-[9px] text-zinc-400">Esq.</span>
                        <ColorPicker value={currentOverride.clickColorLeft || '#3b82f6'} onChange={(v) => updateOverride('clickColorLeft', v)} />
                      </div>
                      <div className="flex items-center justify-between bg-zinc-900/50 p-1.5 rounded border border-zinc-800">
                        <span className="text-[9px] text-zinc-400">Dir.</span>
                        <ColorPicker value={currentOverride.clickColorRight || '#f59e0b'} onChange={(v) => updateOverride('clickColorRight', v)} />
                      </div>
                    </div>
                  </div>
                )}

                {activeOverrideTab === 'ping' && (
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Animação de Ping e Cor</label>
                    <div className="flex gap-2">
                      {/* Tiny Preview */}
                      <div className="shrink-0 pt-1">
                        <AnimationPreview style={currentOverride.pingAnimation || 'radar'} color={currentOverride.pingColor || currentOverride.color || '#fbbf24'} size={40} />
                      </div>
                      {/* Grid */}
                      <div className="flex-1 grid grid-cols-5 gap-1">
                        {[
                          { id: 'radar', label: 'Ra', icon: Radio },
                          { id: 'beacon', label: 'Be', icon: Zap },
                          { id: 'sonar', label: 'So', icon: Podcast },
                          { id: 'pulse', label: 'Pu', icon: Activity },
                          { id: 'target', label: 'Ta', icon: Target },
                          { id: 'ripple', label: 'Ri', icon: CircleDot },
                          { id: 'flare', label: 'Fl', icon: Sun },
                          { id: 'diamond', label: 'Di', icon: Triangle },
                          { id: 'cross', label: 'Cr', icon: Wind },
                        ].map(type => (
                          <button
                            key={type.id}
                            onClick={() => updateOverride('pingAnimation', currentOverride.pingAnimation === type.id ? undefined : type.id)}
                            className={`aspect-square rounded transition-all flex items-center justify-center border ${currentOverride.pingAnimation === type.id
                              ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                              }`}
                            title={`Ping Animation: ${type.id}`}
                          >
                            <type.icon className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Ping Color Override */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between bg-zinc-900/50 p-1.5 rounded border border-zinc-800">
                        <span className="text-[9px] text-zinc-400">Cor do Ping</span>
                        <ColorPicker value={currentOverride.pingColor || currentOverride.color || '#fbbf24'} onChange={(v) => updateOverride('pingColor', v)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 mt-auto border-t border-zinc-800">
            <Button variant="ghost" onClick={handleCancel} size="sm">Cancelar</Button>
            <Button onClick={handleSaveAll} size="sm">Salvar</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
