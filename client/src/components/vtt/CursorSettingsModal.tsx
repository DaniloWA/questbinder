import React, { useState, useEffect } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Check, RefreshCw, User as UserIcon, Lock, Crown } from 'lucide-react';
import { getContrastColor } from '../../utils/colors';
import { CURSOR_SHAPES, getCursorShape } from './constants/cursorShapes';

interface CursorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#fbbf24', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef', '#f43f5e',
];

export const CursorSettingsModal: React.FC<CursorSettingsModalProps> = ({ isOpen, onClose }) => {
  const { cursorSettings, setCursorSettings, permissions, isGM, players, updatePermissions, campaign } = useGameSession();
  const { user } = useAuth();

  // For self-editing
  const [name, setName] = useState('');
  const [color, setColor] = useState('#fbbf24');
  const [shapeId, setShapeId] = useState('default');

  // For GM player management
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Record<string, { color?: string, shape?: string, name?: string; }>>({});

  // Check permissions - use flat permissions with per-user override support
  const canChangeColor = isGM || (permissions?.cursorAllowColorChange ?? true);
  const canChangeShape = isGM || (permissions?.cursorAllowShapeChange ?? true);
  const canChangeName = isGM || (permissions?.cursorAllowNameChange ?? true);

  // Check if there's a GM override for current user
  const myOverride = (permissions?.cursorOverrides?.[user?.id || ''] || {}) as { color?: string, shape?: string, name?: string; };

  // Filter players: exclude campaign owner (GM)
  const nonGMPlayers = players.filter(p => p.id !== campaign?.ownerId);

  useEffect(() => {
    if (isOpen) {
      setName(cursorSettings?.name || user?.name || '');
      setColor(cursorSettings?.color || '#fbbf24');
      setShapeId(cursorSettings?.shape || 'default');
      setLocalOverrides(permissions?.cursorOverrides || {});
      setSelectedPlayerId(null);
    }
  }, [isOpen, cursorSettings, user, permissions]);

  const handleSaveAll = () => {
    setCursorSettings({ name, color, shape: shapeId });
    if (isGM) {
      updatePermissions({ cursorOverrides: localOverrides });
    }
    onClose();
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);
  const currentOverride = selectedPlayerId ? (localOverrides[selectedPlayerId] || {}) : {};
  const selectedShape = getCursorShape(shapeId);

  const updateOverride = (field: 'color' | 'shape' | 'name', value: string | undefined) => {
    if (!selectedPlayerId) return;
    setLocalOverrides(prev => {
      const current = prev[selectedPlayerId] || {};
      const updated = { ...current, [field]: value };
      if (value === undefined) delete updated[field];
      if (Object.keys(updated).length === 0) {
        const { [selectedPlayerId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [selectedPlayerId]: updated };
    });
  };

  const clearOverride = () => {
    if (!selectedPlayerId) return;
    setLocalOverrides(prev => {
      const { [selectedPlayerId]: _, ...rest } = prev;
      return rest;
    });
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
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.3))' }}>
                    <g transform="translate(30, 30) scale(1.2)">
                      <g transform={`scale(${selectedShape.scale || 1}) translate(${-selectedShape.hotspot.x}, ${-selectedShape.hotspot.y})`}>
                        <path d={selectedShape.path} fill={myOverride.color || color} stroke="white" strokeWidth="1" />
                      </g>
                    </g>
                  </svg>
                  <div
                    className="absolute left-[42px] top-[42px] px-1 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap shadow-sm z-10"
                    style={{ backgroundColor: myOverride.color || color, color: getContrastColor(myOverride.color || color) }}
                  >
                    {myOverride.name || name || user?.name || 'Nome'}
                  </div>
                </div>
              </div>

              {/* Shape Selection */}
              <div className={!canChangeShape ? 'opacity-40' : ''}>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                  Formato
                  {!canChangeShape && <><Lock className="w-3 h-3 text-red-400" /><span className="text-red-400">Bloqueado</span></>}
                </label>
                <div className="grid grid-cols-9 gap-0.5">
                  {CURSOR_SHAPES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => canChangeShape && setShapeId(s.id)}
                      disabled={!canChangeShape}
                      className={`aspect-square rounded transition-all flex items-center justify-center border ${(myOverride.shape || shapeId) === s.id ? 'bg-primary/20 border-primary' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                        } ${!canChangeShape ? 'cursor-not-allowed' : ''}`}
                      title={s.label}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <g transform={`scale(${s.scale || 1})`}>
                          <path d={s.path} fill={(myOverride.shape || shapeId) === s.id ? (myOverride.color || color) : '#71717a'} />
                        </g>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className={!canChangeName ? 'opacity-40' : ''}>
                <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block flex items-center gap-1">
                  Nome de Exibição
                  {!canChangeName && <><Lock className="w-3 h-3 text-red-400" /><span className="text-red-400">Bloqueado</span></>}
                </label>
                <Input
                  value={name}
                  onChange={(e) => canChangeName && setName(e.target.value)}
                  placeholder={user?.name}
                  maxLength={20}
                  disabled={!canChangeName}
                  className="h-7 text-xs"
                />
              </div>

              {/* Color Selection */}
              <div className={!canChangeColor ? 'opacity-40' : ''}>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                  Cor
                  {!canChangeColor && <><Lock className="w-3 h-3 text-red-400" /><span className="text-red-400">Bloqueado</span></>}
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="grid grid-cols-12 gap-0.5 flex-1">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => canChangeColor && setColor(c)}
                        disabled={!canChangeColor}
                        className={`w-5 h-5 rounded-full transition-all flex items-center justify-center ${(myOverride.color || color) === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                          } ${!canChangeColor ? 'cursor-not-allowed' : ''}`}
                        style={{ backgroundColor: c }}
                      >
                        {(myOverride.color || color) === c && <Check className="w-2.5 h-2.5 text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => canChangeColor && setColor(e.target.value)}
                    disabled={!canChangeColor}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border border-zinc-700"
                    title="Cor personalizada"
                  />
                </div>
              </div>
            </div>
          )}

          {/* GM: Player Override Mode */}
          {selectedPlayerId !== null && selectedPlayer && (
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                <div>
                  <h3 className="text-xs font-bold text-white">{selectedPlayer.name}</h3>
                  <p className="text-[9px] text-zinc-500">Definir override (substitui configurações do jogador)</p>
                </div>
                {Object.keys(currentOverride).length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearOverride} className="text-amber-400 text-[10px] h-6 px-2">
                    <RefreshCw className="w-3 h-3 mr-1" /> Limpar
                  </Button>
                )}
              </div>

              {/* Preview */}
              <div className="flex justify-center py-2 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800">
                <div className="relative">
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.3))' }}>
                    <g transform="translate(30, 30) scale(1.2)">
                      <g transform={`scale(${getCursorShape(currentOverride.shape || 'default').scale || 1}) translate(${-getCursorShape(currentOverride.shape || 'default').hotspot.x}, ${-getCursorShape(currentOverride.shape || 'default').hotspot.y})`}>
                        <path d={getCursorShape(currentOverride.shape || 'default').path} fill={currentOverride.color || '#fbbf24'} stroke="white" strokeWidth="1" />
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
                    <button
                      key={s.id}
                      onClick={() => updateOverride('shape', currentOverride.shape === s.id ? undefined : s.id)}
                      className={`aspect-square rounded transition-all flex items-center justify-center border ${currentOverride.shape === s.id ? 'bg-amber-500/20 border-amber-500' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                        }`}
                      title={s.label}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <g transform={`scale(${s.scale || 1})`}>
                          <path d={s.path} fill={currentOverride.shape === s.id ? (currentOverride.color || '#fbbf24') : '#71717a'} />
                        </g>
                      </svg>
                    </button>
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
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 mt-auto border-t border-zinc-800">
            <Button variant="ghost" onClick={onClose} size="sm">Cancelar</Button>
            <Button onClick={handleSaveAll} size="sm">Salvar</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
