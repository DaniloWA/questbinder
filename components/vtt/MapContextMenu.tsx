
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, RadioTower, Eye, EyeOff, Trash2, MapPin, Share2, Edit, Music, Lightbulb } from 'lucide-react';
import { useGameSession } from '../../context/GameSessionContext';
import { useNotification } from '../../context/NotificationContext';

interface MapContextMenuProps {
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  isGM: boolean;
  canCreateToken?: boolean; // Allow players with permission
  obstacleId?: string;
  triggerZoneId?: string;
  audioZoneId?: string;
  onClose: () => void;
  onAddToken: () => void;
  onAddLight?: () => void; // New callback
  onPing: () => void;
  onToggleObstacleVisibility?: () => void;
  onToggleObstacleBlock?: () => void;
  onDeleteObstacle?: () => void;
  onEditTriggerZone?: () => void;
  onDeleteTriggerZone?: () => void;
  onEditAudioZone?: () => void;
  onDeleteAudioZone?: () => void;
}

export const MapContextMenu: React.FC<MapContextMenuProps> = ({ 
  x, y, worldX, worldY, isGM, canCreateToken, obstacleId, triggerZoneId, audioZoneId, onClose, 
  onAddToken, onAddLight, onPing, onToggleObstacleVisibility, onDeleteObstacle,
  onEditTriggerZone, onDeleteTriggerZone, onEditAudioZone, onDeleteAudioZone
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { sendChatMessage, activeScene } = useGameSession();
  const { show } = useNotification();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 50);
    return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  // Smart positioning to prevent overflow
  const adjustedStyle = {
    top: Math.min(y, window.innerHeight - 250),
    left: Math.min(x, window.innerWidth - 220),
  };

  const handleShareLocation = () => {
      const gridSize = activeScene?.grid.size || 70;
      const gridX = Math.floor(worldX / gridSize);
      const gridY = Math.floor(worldY / gridSize);
      
      sendChatMessage(
          `Compartilhou uma localização no mapa.`, 
          'message', 
          undefined,
          { type: 'position', label: `[${gridX}, ${gridY}]`, data: { x: gridX, y: gridY } }
      );
      show({ type: 'success', message: 'Localização enviada ao chat.' });
      onClose();
  };

  const hasCreationPerms = isGM || canCreateToken;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] w-56 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
      style={adjustedStyle}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="px-3 py-2 mb-1 border-b border-zinc-800">
         <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            {obstacleId ? 'Opções de Estrutura' : triggerZoneId ? 'Opções de Gatilho' : audioZoneId ? 'Opções de Áudio' : 'Opções de Mapa'}
         </p>
      </div>

      <div className="flex flex-col gap-1">
        
        {/* OBSTACLE ACTIONS (GM ONLY) */}
        {isGM && obstacleId && (
             <div className="bg-zinc-800/50 rounded-lg p-1 mb-1">
                <button
                    onClick={() => { if(onToggleObstacleVisibility) onToggleObstacleVisibility(); onClose(); }}
                    className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-200 rounded-md hover:bg-primary/20 hover:text-white transition-colors"
                >
                    <EyeOff className="w-4 h-4 text-primary" />
                    <span>Alternar Invisibilidade</span>
                </button>
                
                <div className="h-px bg-zinc-700/50 my-1 mx-2" />
                
                <button
                    onClick={() => { if(onDeleteObstacle) onDeleteObstacle(); onClose(); }}
                    className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-red-400 rounded-md hover:bg-red-500/20 hover:text-red-300 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    <span>Destruir Estrutura</span>
                </button>
             </div>
        )}

        {/* TRIGGER ZONE ACTIONS (GM ONLY) */}
        {isGM && triggerZoneId && (
             <div className="bg-zinc-800/50 rounded-lg p-1 mb-1">
                <button
                    onClick={() => { if(onEditTriggerZone) onEditTriggerZone(); onClose(); }}
                    className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-200 rounded-md hover:bg-primary/20 hover:text-white transition-colors"
                >
                    <Edit className="w-4 h-4 text-purple-400" />
                    <span>Editar Gatilho</span>
                </button>
                
                <div className="h-px bg-zinc-700/50 my-1 mx-2" />
                
                <button
                    onClick={() => { if(onDeleteTriggerZone) onDeleteTriggerZone(); onClose(); }}
                    className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-red-400 rounded-md hover:bg-red-500/20 hover:text-red-300 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    <span>Remover Gatilho</span>
                </button>
             </div>
        )}

        {/* AUDIO ZONE ACTIONS (GM ONLY) */}
        {isGM && audioZoneId && (
             <div className="bg-zinc-800/50 rounded-lg p-1 mb-1">
                <button
                    onClick={() => { if(onEditAudioZone) onEditAudioZone(); onClose(); }}
                    className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-200 rounded-md hover:bg-primary/20 hover:text-white transition-colors"
                >
                    <Music className="w-4 h-4 text-cyan-400" />
                    <span>Editar Zona de Áudio</span>
                </button>
                
                <div className="h-px bg-zinc-700/50 my-1 mx-2" />
                
                <button
                    onClick={() => { if(onDeleteAudioZone) onDeleteAudioZone(); onClose(); }}
                    className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-red-400 rounded-md hover:bg-red-500/20 hover:text-red-300 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    <span>Remover Zona</span>
                </button>
             </div>
        )}

        {/* GENERAL MAP ACTIONS */}
        {!obstacleId && !triggerZoneId && !audioZoneId && hasCreationPerms && (
            <div className="bg-zinc-800/50 rounded-lg p-1 mb-1 flex flex-col gap-1">
                <button
                    onClick={() => { onAddToken(); onClose(); }}
                    className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Token
                </button>
                
                {onAddLight && (
                    <button
                        onClick={() => { onAddLight(); onClose(); }}
                        className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-amber-400 rounded-md hover:bg-amber-500/10 hover:text-amber-200 transition-colors"
                    >
                        <Lightbulb className="w-4 h-4" />
                        Adicionar Luz
                    </button>
                )}
            </div>
        )}
        
        <button
            onClick={() => { onPing(); onClose(); }}
            className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors"
        >
            <RadioTower className="w-4 h-4 text-amber-500" />
            Pingar Localização
        </button>

        <button
            onClick={handleShareLocation}
            className="flex items-center gap-3 w-full text-left px-2 py-2 text-sm text-zinc-300 rounded-md hover:bg-white/10 hover:text-white transition-colors"
        >
            <Share2 className="w-4 h-4 text-blue-500" />
            Compartilhar Posição
        </button>

      </div>
    </div>,
    document.body
  );
};
