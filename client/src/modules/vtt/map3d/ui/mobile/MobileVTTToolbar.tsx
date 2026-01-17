import React, { useState } from 'react';
import {
  Menu, MousePointer2, Ruler, Brush, MoreHorizontal,
  X, ChevronUp, Layers, Settings, User, ArrowLeft,
  Grid, Fence, DoorOpen, Eraser, PenTool, Wand2, Sun, Hexagon, EyeOff, Square, RefreshCw,
  Music, Speaker, Zap, Target, Dices, BookOpen, Book, FileText, UserPlus, Swords, ShieldOff,
  Crown, Eye, Lock, CloudRain
} from 'lucide-react';
import { VTTTool, User as UserType } from '@/types';
import { BooleanPermissionKey } from '@/context/gameSession/types';

// Replicating VTTToolbarProps to ensure parity
interface MobileVTTToolbarProps {
  activeTool: VTTTool;
  isCombatActive: boolean;
  gmViewMode: 'gm' | 'player';
  gmHideObstacles?: boolean;
  players?: UserType[];
  previewPlayerId?: string | 'all';
  isLibraryOpen: boolean;
  isDiceRollerOpen?: boolean;
  isAudioPanelOpen?: boolean;
  isHandoutTrayOpen?: boolean;
  isCompendiumOpen?: boolean;
  isAttackZonePanelOpen?: boolean;
  onSetPreviewPlayer?: (id: string | 'all') => void;
  onToolSelect: (tool: VTTTool) => void;
  onResetFog: () => void;
  onAddToken: () => void;
  onToggleLibrary: () => void;
  onToggleDiceRoller?: () => void;
  onToggleAudioPanel?: () => void;
  onToggleHandouts?: () => void;
  onToggleCompendium?: () => void;
  onToggleAttackZones?: () => void;
  onToggleSFXPanel?: () => void;
  isSFXPanelOpen?: boolean;
  onOpenSettings: () => void;
  onStartCombat: () => void;
  onEndCombat: () => void;
  onToggleViewMode: () => void;
  onToggleGhostWalls?: () => void;
  onOpenPermissions?: () => void;
  onOpenCursorSettings?: () => void;
  onOpenViewSettings?: () => void;
  // Helper to check permissions since we passed session in wrapper
  isGameMaster: boolean;
  canAsGMOr: (perm: BooleanPermissionKey) => boolean;
}

export const MobileVTTToolbar: React.FC<MobileVTTToolbarProps> = (props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleToolSelect = (toolId: string) => {
    props.onToolSelect(toolId as any);
    setIsMenuOpen(false);
    setActiveCategory(null);
  };

  // Define Groups (Mirrors VTTToolbar structure)
  const categories = [
    {
      id: 'interaction',
      label: 'Interação',
      icon: <MousePointer2 />,
      items: [
        { id: 'select', label: 'Selecionar', icon: <MousePointer2 />, action: () => handleToolSelect('select'), isActive: props.activeTool === 'select' },
        { id: 'measure-path', label: 'Régua', icon: <Ruler />, action: () => handleToolSelect('measure-path'), isActive: props.activeTool === 'measure-path', hidden: !props.canAsGMOr('measure') },
        { id: 'cursor-settings', label: 'Cursores', icon: <MousePointer2 />, action: props.onOpenCursorSettings }
      ]
    },
    {
      id: 'drawings',
      label: 'Desenhos',
      icon: <Brush />,
      hidden: !props.canAsGMOr('drawings'),
      items: [
        { id: 'brush', label: 'Pincel', icon: <Brush />, action: () => handleToolSelect('brush'), isActive: props.activeTool === 'brush' },
        { id: 'eraser-drawing', label: 'Apagar', icon: <Eraser />, action: () => handleToolSelect('eraser-drawing'), isActive: props.activeTool === 'eraser-drawing', hidden: !props.canAsGMOr('drawingDelete') }
      ]
    },
    {
      id: 'architecture',
      label: 'Arquitetura',
      icon: <Grid />,
      hidden: !props.isGameMaster,
      items: [
        { id: 'draw-wall', label: 'Parede', icon: <Fence />, action: () => handleToolSelect('draw-wall'), isActive: props.activeTool === 'draw-wall' },
        { id: 'freehand-wall', label: 'Livre', icon: <PenTool />, action: () => handleToolSelect('freehand-wall'), isActive: props.activeTool === 'freehand-wall' },
        { id: 'smart-wall', label: 'Smart', icon: <Wand2 />, action: () => handleToolSelect('smart-wall'), isActive: props.activeTool === 'smart-wall' },
        { id: 'draw-door', label: 'Porta', icon: <DoorOpen />, action: () => handleToolSelect('draw-door'), isActive: props.activeTool === 'draw-door' },
        { id: 'draw-window', label: 'Janela', icon: <Grid />, action: () => handleToolSelect('draw-window'), isActive: props.activeTool === 'draw-window' },
        { id: 'eraser', label: 'Borracha', icon: <Eraser />, action: () => handleToolSelect('eraser'), isActive: props.activeTool === 'eraser' },
      ]
    },
    {
      id: 'lighting',
      label: 'Luz & Neblina',
      icon: <Sun />,
      hidden: !props.isGameMaster,
      items: [
        { id: 'draw-light-rect', label: 'Luz Rect', icon: <Sun />, action: () => handleToolSelect('draw-light-rect'), isActive: props.activeTool === 'draw-light-rect' },
        { id: 'draw-light-poly', label: 'Luz Poly', icon: <Hexagon />, action: () => handleToolSelect('draw-light-poly'), isActive: props.activeTool === 'draw-light-poly' },
        { id: 'fog-poly', label: 'Revelar Poly', icon: <EyeOff />, action: () => handleToolSelect('fog-poly'), isActive: props.activeTool === 'fog-poly' },
        { id: 'fog-rect', label: 'Revelar Rect', icon: <Square />, action: () => handleToolSelect('fog-rect'), isActive: props.activeTool === 'fog-rect' },
        { id: 'fog-rect', label: 'Revelar Rect', icon: <Square />, action: () => handleToolSelect('fog-rect'), isActive: props.activeTool === 'fog-rect' },
        { id: 'sfx', label: 'Ambiente', icon: <CloudRain />, action: props.onToggleSFXPanel, isActive: props.isSFXPanelOpen },
        { id: 'fog-reset', label: 'Resetar Fog', icon: <RefreshCw />, action: props.onResetFog, danger: true },
      ]
    },
    {
      id: 'gameplay',
      label: 'Gameplay',
      icon: <Dices />,
      items: [
        { id: 'attack-zones', label: 'Zonas', icon: <Target />, action: props.onToggleAttackZones, isActive: props.isAttackZonePanelOpen, hidden: !props.canAsGMOr('attackZoneUse') },
        { id: 'dice-roller', label: 'Dados', icon: <Dices />, action: props.onToggleDiceRoller, isActive: props.isDiceRollerOpen, hidden: !props.canAsGMOr('diceRolling') },
        { id: 'tokens', label: 'Bestiário', icon: <BookOpen />, action: props.onToggleLibrary, isActive: props.isLibraryOpen, hidden: !props.canAsGMOr('bestiaryBrowse') },
        { id: 'compendium', label: 'Grimório', icon: <Book />, action: props.onToggleCompendium, isActive: props.isCompendiumOpen, hidden: !props.canAsGMOr('compendiumBrowse') },
        { id: 'handouts', label: 'Recursos', icon: <FileText />, action: props.onToggleHandouts, isActive: props.isHandoutTrayOpen, hidden: !props.isGameMaster },
        { id: 'add-token', label: 'Novo Token', icon: <UserPlus />, action: props.onAddToken, hidden: !props.canAsGMOr('tokenCreate') },
        { id: 'combat', label: props.isCombatActive ? 'Parar Combate' : 'Iniciar Combate', icon: props.isCombatActive ? <ShieldOff /> : <Swords />, action: props.isCombatActive ? props.onEndCombat : props.onStartCombat, danger: props.isCombatActive, hidden: !props.isGameMaster }
      ]
    },
    {
      id: 'gm',
      label: 'Mestre',
      icon: <Crown />,
      hidden: !props.isGameMaster,
      items: [
        { id: 'view', label: 'Visualizar', icon: <Eye />, action: props.onOpenViewSettings },
        { id: 'perms', label: 'Permissões', icon: <Lock />, action: props.onOpenPermissions },
        { id: 'settings', label: 'Configurações', icon: <Settings />, action: props.onOpenSettings },
      ]
    }
  ];

  const visibleCategories = categories.filter(c => !c.hidden);
  const activeCategoryData = visibleCategories.find(c => c.id === activeCategory);

  return (
    <div className="pointer-events-none w-full flex flex-col items-center z-[1000]">

      {/* Expanded Menu (Bottom Sheet Style) with explicit Header */}
      {isMenuOpen && (
        <div className="pointer-events-auto w-full bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 rounded-t-3xl shadow-2xl pb-safe min-h-[350px] animate-in slide-in-from-bottom-5">

          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            {activeCategory ? (
              <button
                onClick={() => setActiveCategory(null)}
                className="flex items-center gap-2 text-zinc-300 hover:text-white bg-zinc-800/50 px-3 py-1.5 rounded-full active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wide">Voltar</span>
              </button>
            ) : (
              <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider pl-2">Menu Principal</h3>
            )}

            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 rounded-full active:scale-95 transition-all"
            >
              <ChevronUp className="w-5 h-5 rotate-180" />
            </button>
          </div>

          {/* Title Context (breadcrumbs) */}
          {activeCategory && (
            <div className="px-6 py-2 bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/10 mb-2">
              <div className="flex items-center gap-2 text-primary">
                {activeCategoryData?.icon}
                <span className="text-sm font-bold uppercase tracking-wider">{activeCategoryData?.label}</span>
              </div>
            </div>
          )}

          {/* Grid Content */}
          <div className="p-4 grid grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar">

            {/* Level 1: Categories */}
            {!activeCategory && visibleCategories.map(cat => (
              <MobileToolBtn
                key={cat.id}
                icon={cat.icon}
                label={cat.label}
                onClick={() => setActiveCategory(cat.id)}
                variant="category"
              />
            ))}

            {/* Level 2: Items in Category */}
            {activeCategory && activeCategoryData?.items.filter((i: any) => !i.hidden).map((item: any) => (
              <MobileToolBtn
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={item.isActive}
                onClick={item.action}
                isDanger={item.danger}
              />
            ))}
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      {!isMenuOpen && (
        <div className="pointer-events-auto flex items-center gap-4 bg-zinc-950/80 backdrop-blur-xl px-6 py-3 rounded-full border border-zinc-800 shadow-2xl mb-6 ring-1 ring-white/10">
          {/* Quick Access: Select */}
          <button
            onClick={() => handleToolSelect('select')}
            className={`p-3 rounded-full transition-all active:scale-90 ${props.activeTool === 'select' ? 'bg-primary text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]' : 'text-zinc-400 hover:text-white'}`}
          >
            <MousePointer2 className="w-6 h-6" />
          </button>

          <div className="w-px h-8 bg-zinc-800 mx-1" />

          {/* Quick Access: Draw (if allowed) */}
          {props.canAsGMOr('drawings') && (
            <button
              onClick={() => handleToolSelect('brush')}
              className={`p-3 rounded-full transition-all active:scale-90 ${props.activeTool === 'brush' ? 'bg-primary text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]' : 'text-zinc-400 hover:text-white'}`}
            >
              <Brush className="w-6 h-6" />
            </button>
          )}

          {/* Quick Access: Measure */}
          {props.canAsGMOr('measure') && (
            <button
              onClick={() => handleToolSelect('measure-path')}
              className={`p-3 rounded-full transition-all active:scale-90 ${props.activeTool === 'measure-path' ? 'bg-primary text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]' : 'text-zinc-400 hover:text-white'}`}
            >
              <Ruler className="w-6 h-6" />
            </button>
          )}


          <div className="w-px h-8 bg-zinc-800 mx-1" />

          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 rounded-full text-zinc-200 font-bold text-sm shadow-inner active:scale-95 transition-transform border border-zinc-700 hover:bg-zinc-700"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

const MobileToolBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isDanger?: boolean;
  variant?: 'tool' | 'category';
  onClick: () => void;
}> = ({ icon, label, isActive, isDanger, variant = 'tool', onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all active:scale-95
      ${variant === 'category' ? 'aspect-square bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700' : ''}
      ${isActive
        ? 'bg-primary text-white border border-primary/50 shadow-[0_0_15px_rgba(124,58,237,0.3)]'
        : isDanger
          ? 'bg-red-950/30 text-red-400 border border-red-900/50'
          : variant !== 'category' ? 'bg-zinc-900/50 text-zinc-400 border border-transparent hover:bg-zinc-800' : 'text-zinc-400'
      }
    `}
  >
    <div className={`${variant === 'category' ? 'scale-125 mb-1' : ''} ${isActive ? 'scale-110' : ''}`}>
      {React.cloneElement(icon as React.ReactElement<{ className?: string; }>, { className: variant === 'category' ? "w-6 h-6" : "w-5 h-5" })}
    </div>
    <span className="text-[10px] font-bold text-center leading-tight uppercase tracking-tight">{label}</span>
  </button>
);

