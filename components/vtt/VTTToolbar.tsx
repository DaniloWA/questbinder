
import React, { useState, useRef, useMemo, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { VTTTool, User as UserType, PermissionSet } from '../../types';
import {
    PenTool, EyeOff, UserPlus, Settings, Ruler, Swords,
    ShieldOff, DoorOpen, Fence, Eye, Eraser,
    Square, Grid, MousePointer2, ChevronRight,
    User, Crown, Lightbulb, Sun, Hexagon, Users, Lock,
    LayoutGrid, RefreshCw, ArrowLeft, ScanEye, Dices, BookOpen,
    Music, Speaker, FileText, Book, Zap, Brush
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useGameSession } from '../../context/GameSessionContext';

export interface ToolbarItemConfig {
    id: string;
    type: 'tool' | 'action' | 'group';
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
    danger?: boolean;
    hidden?: boolean;
    isActive?: boolean;
    children?: ToolbarItemConfig[];
    onClick?: () => void;
}

interface VTTToolbarProps {
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
    onSetPreviewPlayer?: (id: string | 'all') => void;
    onToolSelect: (tool: VTTTool) => void;
    onResetFog: () => void;
    onAddToken: () => void;
    onToggleLibrary: () => void;
    onToggleDiceRoller?: () => void;
    onToggleAudioPanel?: () => void;
    onToggleHandouts?: () => void;
    onToggleCompendium?: () => void;
    onOpenSettings: () => void;
    onStartCombat: () => void;
    onEndCombat: () => void;
    onToggleViewMode: () => void;
    onToggleGhostWalls?: () => void;
    onOpenPermissions?: () => void;
}

const SubMenuPortal: React.FC<{
    children: React.ReactNode;
    parentRect: DOMRect;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}> = ({ children, parentRect, onMouseEnter, onMouseLeave }) => {
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
        let top = parentRect.top;
        let left = parentRect.right + 8; // Offset to the right

        // Check boundaries
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Estimate submenu size
        const width = 220;
        const height = 300;

        if (top + height > viewportHeight) {
            top = viewportHeight - height - 10;
        }

        if (left + width > viewportWidth) {
            left = parentRect.left - width - 8; // Flip to left
        }

        setCoords({ top, left });
    }, [parentRect]);

    return createPortal(
        <div
            className="fixed z-[9999] animate-in fade-in slide-in-from-left-2 duration-200"
            style={{ top: coords.top, left: coords.left }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl flex flex-col gap-1 min-w-[220px] max-h-[60vh] overflow-y-auto custom-scrollbar ring-1 ring-white/10">
                {children}
            </div>
        </div>,
        document.body
    );
};

const MenuItem: React.FC<{
    item: ToolbarItemConfig;
    activeTool: VTTTool;
    depth: number;
    onToolSelect: (tool: VTTTool) => void;
}> = ({ item, activeTool, depth, onToolSelect }) => {

    if (item.hidden) return null;

    const [isHovered, setIsHovered] = useState(false);
    const itemRef = useRef<HTMLDivElement>(null);
    const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isSelfActive = (item.type === 'tool' && activeTool === item.id) || !!item.isActive;
    const hasActiveChild = useMemo(() => {
        const check = (children?: ToolbarItemConfig[]): boolean => {
            if (!children) return false;
            return children.some(c => (c.type === 'tool' && activeTool === c.id) || !!c.isActive || check(c.children));
        };
        return check(item.children);
    }, [item, activeTool]);


    const isActive = isSelfActive;
    const isParentActive = depth === 0 && (isSelfActive || hasActiveChild);
    const isPathActive = depth > 0 && hasActiveChild;
    const hasChildren = !!(item.children && item.children.length > 0);

    const handleMouseEnter = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        hoverTimeout.current = setTimeout(() => {
            setIsHovered(false);
        }, 200);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.type === 'tool') {
            onToolSelect(item.id as VTTTool);
        } else if (item.onClick) {
            item.onClick();
        }
    };

    if (depth === 0) {
        return (
            <div
                ref={itemRef}
                className="relative flex items-center justify-center px-1"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <Tooltip content={isHovered && hasChildren ? '' : `${item.label} ${item.shortcut ? `(${item.shortcut})` : ''}`} position="top">
                    <button
                        onClick={handleClick}
                        className={`
                        relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ease-out
                        ${isParentActive
                                ? 'bg-primary text-white shadow-[0_0_20px_rgba(124,58,237,0.6)] scale-110 -translate-y-2 z-20 ring-1 ring-white/20'
                                : item.danger
                                    ? 'text-red-400 hover:bg-red-950/30 hover:text-red-200'
                                    : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                            }
                    `}
                    >
                        <div className={`transition-transform duration-300 ${isParentActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {item.icon}
                        </div>

                        {isParentActive && <span className="absolute -bottom-3 w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_rgba(124,58,237,1)]"></span>}
                        {hasChildren && !isParentActive && <span className="absolute top-2.5 right-2.5 w-1 h-1 bg-zinc-600 rounded-full"></span>}
                    </button>
                </Tooltip>

                {
                    hasChildren && (
                        <div
                            className={`
                        absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-50 origin-bottom transition-all duration-200
                        ${isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}
                    `}
                        >
                            <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl flex flex-col gap-1 min-w-[220px] ring-1 ring-white/10">
                                <div className="px-3 py-2 border-b border-white/5 mb-1 flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.label}</span>
                                    {item.shortcut && <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 rounded">{item.shortcut}</span>}
                                </div>

                                <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                    {item.children?.map(child => (
                                        <MenuItem
                                            key={child.id}
                                            item={child}
                                            activeTool={activeTool}
                                            depth={depth + 1}
                                            onToolSelect={onToolSelect}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950/90 border-b border-r border-zinc-800 rotate-45"></div>
                        </div>
                    )
                }
            </div >
        );
    }

    return (
        <>
            <div
                ref={itemRef}
                className="relative group/item w-full"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button
                    onClick={handleClick}
                    className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                    ${isActive
                            ? 'bg-primary text-white font-medium shadow-md'
                            : isPathActive
                                ? 'bg-white/5 text-zinc-200'
                                : item.danger
                                    ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                                    : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
                        }
                `}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`shrink-0 ${isActive ? 'text-white' : ''}`}>
                            {React.cloneElement(item.icon as React.ReactElement<{ className?: string; }>, { className: "w-4 h-4" })}
                        </div>
                        <span className="truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {item.shortcut && (
                            <span className={`text-[9px] font-mono px-1.5 rounded border ${isActive ? 'border-white/30 text-white/80' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}>
                                {item.shortcut}
                            </span>
                        )}
                        {hasChildren && <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-600'}`} />}
                    </div>
                </button>

                {hasChildren && isHovered && (
                    <SubMenuPortal
                        parentRect={itemRef.current!.getBoundingClientRect()}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {item.children?.map(child => (
                            <MenuItem
                                key={child.id}
                                item={child}
                                activeTool={activeTool}
                                depth={depth + 1}
                                onToolSelect={onToolSelect}
                            />
                        ))}
                    </SubMenuPortal>
                )}
            </div>
        </>
    );
};

export const VTTToolbar: React.FC<VTTToolbarProps> = (props) => {
    const { checkPermission, isGM, toggleVisionRanges, ui } = useGameSession();

    const hasPerm = (key: Exclude<keyof PermissionSet, 'userOverrides' | 'logConfig' | 'shareCursor' | 'allowSpectate'>) => checkPermission(key) || isGM;

    const toolbarConfig = useMemo<ToolbarItemConfig[][]>(() => {

        const interactionGroup: ToolbarItemConfig[] = [
            { id: 'select', type: 'tool', label: 'Selecionar', icon: <MousePointer2 />, shortcut: 'V' },
            { id: 'measure-path', type: 'tool', label: 'Régua', icon: <Ruler />, shortcut: 'M', hidden: !hasPerm('measure') },
            {
                id: 'drawings',
                type: 'group',
                label: 'Desenhar',
                icon: <Brush />,
                hidden: !hasPerm('drawings'),
                children: [
                    { id: 'brush', type: 'tool', label: 'Pincel Livre', icon: <PenTool /> },
                    { id: 'eraser-drawing', type: 'tool', label: 'Apagar Desenhos', icon: <Eraser />, danger: true, hidden: !hasPerm('drawingDelete') }
                ]
            }
        ];

        const creationGroup: ToolbarItemConfig[] = [
            {
                id: 'architecture',
                type: 'group',
                label: 'Arquitetura',
                icon: <LayoutGrid />,
                hidden: !isGM,
                children: [
                    { id: 'draw-wall', type: 'tool', label: 'Parede', icon: <Fence /> },
                    { id: 'draw-door', type: 'tool', label: 'Porta', icon: <DoorOpen /> },
                    { id: 'draw-window', type: 'tool', label: 'Janela', icon: <Grid /> },
                    { id: 'eraser', type: 'tool', label: 'Borracha (Estrutura)', icon: <Eraser />, danger: true },
                ]
            },
            {
                id: 'lighting',
                type: 'group',
                label: 'Iluminação & Neblina',
                icon: <Lightbulb />,
                hidden: !isGM,
                children: [
                    { id: 'draw-light-rect', type: 'tool', label: 'Luz (Retângulo)', icon: <Sun /> },
                    { id: 'draw-light-poly', type: 'tool', label: 'Luz (Polígono)', icon: <Hexagon /> },
                    {
                        id: 'fog-menu', type: 'group', label: 'Neblina de Guerra', icon: <EyeOff />, children: [
                            { id: 'fog-poly', type: 'tool', label: 'Revelar (Polígono)', icon: <PenTool /> },
                            { id: 'fog-rect', type: 'tool', label: 'Revelar (Retângulo)', icon: <Square /> },
                            { id: 'fog-reset', type: 'action', label: 'Resetar Neblina', icon: <RefreshCw />, danger: true, onClick: props.onResetFog }
                        ]
                    }
                ]
            },
            {
                id: 'audio',
                type: 'group',
                label: 'Áudio',
                icon: <Music />,
                hidden: !isGM,
                children: [
                    { id: 'audio-panel-action', type: 'action', label: 'Painel de Áudio', icon: <Music />, onClick: props.onToggleAudioPanel, isActive: props.isAudioPanelOpen },
                    {
                        id: 'audio-zones-group', type: 'group', label: 'Zonas de Áudio', icon: <Speaker />, children: [
                            { id: 'draw-audio-rect', type: 'tool', label: 'Zona (Retângulo)', icon: <Square /> },
                            { id: 'draw-audio-poly', type: 'tool', label: 'Zona (Polígono)', icon: <Hexagon /> },
                            { id: 'eraser-audio', type: 'tool', label: 'Apagar Zona de Áudio', icon: <Eraser />, danger: true },
                        ]
                    }
                ]
            },
            {
                id: 'triggers',
                type: 'group',
                label: 'Gatilhos',
                icon: <Zap />,
                hidden: !isGM,
                children: [
                    { id: 'draw-trigger-rect', type: 'tool', label: 'Gatilho (Retângulo)', icon: <Square /> },
                    { id: 'draw-trigger-poly', type: 'tool', label: 'Gatilho (Polígono)', icon: <Hexagon /> },
                    { id: 'eraser-trigger', type: 'tool', label: 'Apagar Gatilho', icon: <Eraser />, danger: true },
                ]
            }
        ];

        const gameplayGroup: ToolbarItemConfig[] = [
            {
                id: 'dice-roller',
                type: 'action',
                label: 'Mesa de Dados',
                icon: <Dices />,
                onClick: props.onToggleDiceRoller,
                isActive: !!props.isDiceRollerOpen,
            },
            {
                id: 'bestiary',
                type: 'action',
                label: 'Bestiário (Tokens)',
                icon: <BookOpen />,
                onClick: props.onToggleLibrary,
                isActive: props.isLibraryOpen,
            },
            {
                id: 'compendium',
                type: 'action',
                label: 'Grimório',
                icon: <Book />,
                onClick: props.onToggleCompendium,
                isActive: !!props.isCompendiumOpen,
            },
            {
                id: 'handouts',
                type: 'action',
                label: 'Recursos',
                icon: <FileText />,
                onClick: props.onToggleHandouts,
                isActive: !!props.isHandoutTrayOpen,
                hidden: !isGM,
            },
            {
                id: 'add-token',
                type: 'action',
                label: 'Novo Token',
                icon: <UserPlus />,
                onClick: props.onAddToken,
                hidden: !hasPerm('tokenCreate')
            },
            {
                id: 'combat',
                type: 'action',
                label: props.isCombatActive ? 'Encerrar Combate' : 'Iniciar Combate',
                icon: props.isCombatActive ? <ShieldOff /> : <Swords />,
                danger: props.isCombatActive,
                onClick: props.isCombatActive ? props.onEndCombat : props.onStartCombat,
                hidden: !isGM
            }
        ];

        const gmGroup: ToolbarItemConfig[] = [
            {
                id: 'gm-tools',
                type: 'group',
                label: 'Mestre',
                icon: <Crown />,
                hidden: !isGM,
                children: [
                    {
                        id: 'view-mode',
                        type: 'action',
                        label: `Modo: ${props.gmViewMode === 'gm' ? 'Mestre (Onisciente)' : 'Jogador (Visão Limitada)'}`,
                        icon: props.gmViewMode === 'gm' ? <Eye /> : <User />,
                        onClick: props.onToggleViewMode
                    },
                    {
                        id: 'preview-player-select',
                        type: 'action',
                        label: `Visão: ${props.previewPlayerId === 'all' ? 'Todos' : props.players?.find(p => p.id === props.previewPlayerId)?.name.split(' ')[0] || '...'}`,
                        icon: <ScanEye />,
                        hidden: props.gmViewMode !== 'player',
                        children: [
                            {
                                id: 'preview-all',
                                type: 'action',
                                label: 'Ver como Todos',
                                icon: <Users />,
                                onClick: () => props.onSetPreviewPlayer?.('all')
                            },
                            ...(props.players || []).map(p => ({
                                id: `preview-${p.id}`,
                                type: 'action' as const,
                                label: p.name,
                                icon: <User />,
                                onClick: () => props.onSetPreviewPlayer?.(p.id)
                            }))
                        ]
                    },
                    {
                        id: 'ghost-walls',
                        type: 'action',
                        label: `Paredes Fantasmas: ${props.gmHideObstacles ? 'Ocultas' : 'Visíveis'}`,
                        icon: props.gmHideObstacles ? <EyeOff /> : <Eye />,
                        onClick: props.onToggleGhostWalls
                    },
                    {
                        id: 'permissions',
                        type: 'action',
                        label: 'Permissões',
                        icon: <Lock />,
                        onClick: props.onOpenPermissions
                    },
                    {
                        id: 'show-vision-ranges',
                        type: 'action',
                        label: `Mostrar Alcances: ${ui.showVisionRanges ? 'Ligado' : 'Desligado'}`,
                        icon: <ScanEye />,
                        onClick: toggleVisionRanges
                    },
                    {
                        id: 'settings',
                        type: 'action',
                        label: 'Configurações do Mapa',
                        icon: <Settings />,
                        onClick: props.onOpenSettings
                    }
                ]
            }
        ];

        const groups = [
            interactionGroup,
            creationGroup.filter(g => !g.hidden),
            gameplayGroup.filter(g => !g.hidden),
            gmGroup.filter(g => !g.hidden)
        ];

        return groups.filter(g => g.length > 0);
    }, [props, hasPerm, isGM, toggleVisionRanges, ui]);

    return (
        <div className="flex items-center gap-2 p-2 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl ring-1 ring-white/10 pointer-events-auto animate-in slide-in-from-bottom-8 duration-500">
            {toolbarConfig.map((group, index) => (
                <React.Fragment key={index}>
                    {index > 0 && group.length > 0 && <div className="w-px h-8 bg-white/10 mx-1"></div>}
                    {group.map(item => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            activeTool={props.activeTool}
                            depth={0}
                            onToolSelect={props.onToolSelect}
                        />
                    ))}
                </React.Fragment>
            ))}
        </div>
    );
};
