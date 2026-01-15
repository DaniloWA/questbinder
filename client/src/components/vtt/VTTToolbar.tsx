import React, { useState, useRef, useMemo, useEffect, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { VTTTool, User as UserType, PermissionSet } from '../../types';
import {
    PenTool, EyeOff, UserPlus, Settings, Ruler, Swords,
    ShieldOff, DoorOpen, Fence, Eye, Eraser,
    Square, Grid, MousePointer2, ChevronRight, ChevronDown,
    User, Crown, Lightbulb, Sun, Hexagon, Users, Lock,
    LayoutGrid, RefreshCw, ArrowLeft, ScanEye, Dices, BookOpen,
    Music, Speaker, FileText, Book, Zap, Brush, Wand2, Target,
    Link, Monitor, Magnet, X
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useGameSession } from '../../context/GameSessionContext';
import { useModal } from '../../context/ModalContext';
import { useTranslation } from '../../i18n/TranslationContext';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { AccessGate, AccessMode } from '../AccessGate';
import { BooleanPermissionKey } from '../../context/gameSession/types';
import { GameRole, PremiumFeatureKey } from '../../types/acl';

// Hook para detectar mobile/touch
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
};

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
    requirePermission?: BooleanPermissionKey;
    requireRole?: GameRole;
    requireFeature?: PremiumFeatureKey;
    accessMode?: AccessMode; // Defaults to 'hide' for toolbar items usually
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
    onOpenSettings: () => void;
    onStartCombat: () => void;
    onEndCombat: () => void;
    onToggleViewMode: () => void;
    onToggleGhostWalls?: () => void;
    onOpenPermissions?: () => void;
    onOpenCursorSettings?: () => void;
    onOpenViewSettings?: () => void;
}

const SubMenuPortal: React.FC<{
    children: React.ReactNode;
    parentRect: DOMRect;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}> = ({ children, parentRect, onMouseEnter, onMouseLeave }) => {
    const [coords, setCoords] = useState<{ top: number, left: number; } | null>(null);

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

    if (!coords) return null; // Don't render until coords are calculated

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
    isMobile: boolean;
    openMenuId: string | null;
    setOpenMenuId: (id: string | null) => void;
}> = ({ item, activeTool, depth, onToolSelect, isMobile, openMenuId, setOpenMenuId }) => {

    if (item.hidden) return null;

    // We wrap the Item content in AccessGate
    // If it's a group, we might want to check permissions on the group itself
    // but usually groups are hidden if the user lacks role/permission.


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

        // Mobile: toggle menu on click for groups
        if (hasChildren && isMobile && depth === 0) {
            setOpenMenuId(openMenuId === item.id ? null : item.id);
            return;
        }

        if (item.type === 'tool') {
            onToolSelect(item.id as VTTTool);
            setOpenMenuId(null); // Close menu after selection
        } else if (item.onClick) {
            item.onClick();
            setOpenMenuId(null); // Close menu after action
        }
    };

    // For mobile: check if this menu is open
    const isMenuOpen = isMobile ? openMenuId === item.id : isHovered;

    if (depth === 0) {
        return (
            <AccessGate
                requirePermission={item.requirePermission}
                requireRole={item.requireRole}
                requireFeature={item.requireFeature}
                mode={item.accessMode || 'hide'}
            >
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
                        relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-300 ease-out
                        ${isParentActive
                                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(124,58,237,0.6)] scale-110 -translate-y-1 sm:-translate-y-2 z-20 ring-1 ring-white/20'
                                    : item.danger
                                        ? 'text-red-400 hover:bg-red-950/30 hover:text-red-200 active:bg-red-950/50'
                                        : 'text-zinc-400 hover:bg-white/10 hover:text-white active:bg-white/20'
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
                        ${isMenuOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}
                    `}
                            >
                                <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl flex flex-col gap-1 min-w-[200px] sm:min-w-[220px] ring-1 ring-white/10 max-w-[90vw]">
                                    <div className="px-2 sm:px-3 py-2 border-b border-white/5 mb-1 flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            {!isMobile && item.shortcut && <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 rounded">{item.shortcut}</span>}
                                            {isMobile && (
                                                <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} className="p-1 text-zinc-500 hover:text-white">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                        {item.children?.map(child => (
                                            <MenuItem
                                                key={child.id}
                                                item={child}
                                                activeTool={activeTool}
                                                depth={depth + 1}
                                                onToolSelect={onToolSelect}
                                                isMobile={isMobile}
                                                openMenuId={openMenuId}
                                                setOpenMenuId={setOpenMenuId}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950/90 border-b border-r border-zinc-800 rotate-45"></div>
                            </div>
                        )
                    }
                </div >
            </AccessGate>
        );
    }


    return (
        <AccessGate
            requirePermission={item.requirePermission}
            requireRole={item.requireRole}
            requireFeature={item.requireFeature}
            mode={item.accessMode || 'hide'}
        >
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
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className={`shrink-0 ${isActive ? 'text-white' : ''}`}>
                            {React.cloneElement(item.icon as React.ReactElement<{ className?: string; }>, { className: "w-4 h-4" })}
                        </div>
                        <span className="truncate text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {!isMobile && item.shortcut && (
                            <span className={`text-[9px] font-mono px-1.5 rounded border ${isActive ? 'border-white/30 text-white/80' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}>
                                {item.shortcut}
                            </span>
                        )}
                        {hasChildren && <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-600'}`} />}
                    </div>
                </button>

                {hasChildren && isMenuOpen && (
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
                                isMobile={isMobile}
                                openMenuId={openMenuId}
                                setOpenMenuId={setOpenMenuId}
                            />
                        ))}
                    </SubMenuPortal>
                )}
            </div>
        </AccessGate>
    );
};

export const VTTToolbar: React.FC<VTTToolbarProps> = (props) => {
    const { permissionHelper, toggleVisionRanges, toggleGridCoordinates, ui, permissions, pullView, viewport, toggleFollowMode, isFollowingGM, updatePermissions } = useGameSession();
    const { openModal, closeModal } = useModal();
    const { t } = useTranslation();

    // Check if all cursor permissions are disabled (for non-GM players)
    const allCursorPermsDisabled = !permissionHelper.isGameMaster() &&
        permissions?.cursorAllowColorChange === false &&
        permissions?.cursorAllowShapeChange === false &&
        permissions?.cursorAllowNameChange === false;

    const toolbarConfig = useMemo<ToolbarItemConfig[][]>(() => {


        const interactionGroup: ToolbarItemConfig[] = [
            { id: 'select', type: 'tool', label: t('vtt.tools.toolbar.selectTool.button.label'), icon: <MousePointer2 />, shortcut: 'V' },
            { id: 'measure-path', type: 'tool', label: t('vtt.tools.toolbar.rulerTool.button.label'), icon: <Ruler />, shortcut: 'M', requirePermission: 'measure' },
            {
                id: 'drawings',
                type: 'group',
                label: t('vtt.tools.toolbar.drawingTools.group.label'),
                icon: <Brush />,
                requirePermission: 'drawings',
                children: [
                    { id: 'brush', type: 'tool', label: t('vtt.tools.toolbar.drawingTools.brush.button.label'), icon: <PenTool /> },
                    { id: 'eraser-drawing', type: 'tool', label: t('vtt.tools.toolbar.drawingTools.eraser.button.label'), icon: <Eraser />, danger: true, requirePermission: 'drawingDelete' }
                ]
            },
            {
                id: 'cursor-settings', type: 'action', label: t('vtt.tools.toolbar.cursorSettings.button.label'), icon: <MousePointer2 />, onClick: props.onOpenCursorSettings,
                hidden: allCursorPermsDisabled
            }
        ];

        const creationGroup: ToolbarItemConfig[] = [
            {
                id: 'architecture',
                type: 'group',
                label: t('vtt.tools.toolbar.architectureTools.group.label'),
                icon: <LayoutGrid />,
                requireRole: GameRole.GM,
                children: [
                    { id: 'draw-wall', type: 'tool', label: t('vtt.tools.toolbar.architectureTools.wall.button.label'), icon: <Fence /> },
                    { id: 'freehand-wall', type: 'tool', label: t('vtt.tools.toolbar.architectureTools.freehandWall.button.label'), icon: <PenTool /> },
                    { id: 'smart-wall', type: 'tool', label: t('vtt.tools.toolbar.architectureTools.smartWall.button.label'), icon: <Wand2 /> },
                    { id: 'draw-door', type: 'tool', label: t('vtt.tools.toolbar.architectureTools.door.button.label'), icon: <DoorOpen /> },
                    { id: 'draw-window', type: 'tool', label: t('vtt.tools.toolbar.architectureTools.window.button.label'), icon: <Grid /> },
                    { id: 'eraser', type: 'tool', label: t('vtt.tools.toolbar.architectureTools.eraser.button.label'), icon: <Eraser />, danger: true },
                ]
            },
            {
                id: 'lighting',
                type: 'group',
                label: t('vtt.tools.toolbar.lightingTools.group.label'),
                icon: <Lightbulb />,
                requireRole: GameRole.GM,
                children: [
                    { id: 'draw-light-rect', type: 'tool', label: t('vtt.tools.toolbar.lightingTools.lightRect.button.label'), icon: <Sun /> },
                    { id: 'draw-light-poly', type: 'tool', label: t('vtt.tools.toolbar.lightingTools.lightPoly.button.label'), icon: <Hexagon /> },
                    {
                        id: 'fog-menu', type: 'group', label: t('vtt.tools.toolbar.lightingTools.fogOfWar.submenu.title'), icon: <EyeOff />, children: [
                            { id: 'fog-poly', type: 'tool', label: t('vtt.tools.toolbar.lightingTools.fogOfWar.revealPoly.button.label'), icon: <PenTool /> },
                            { id: 'fog-rect', type: 'tool', label: t('vtt.tools.toolbar.lightingTools.fogOfWar.revealRect.button.label'), icon: <Square /> },
                            { id: 'fog-reset', type: 'action', label: t('vtt.tools.toolbar.lightingTools.fogOfWar.reset.button.label'), icon: <RefreshCw />, danger: true, onClick: props.onResetFog }
                        ]
                    }
                ]
            },
            {
                id: 'audio',
                type: 'group',
                label: t('vtt.tools.toolbar.audioTools.group.label'),
                icon: <Music />,
                requireRole: GameRole.GM,
                children: [
                    { id: 'audio-panel-action', type: 'action', label: t('vtt.tools.toolbar.audioTools.panel.button.label'), icon: <Music />, onClick: props.onToggleAudioPanel, isActive: props.isAudioPanelOpen },
                    {
                        id: 'audio-zones-group', type: 'group', label: t('vtt.tools.toolbar.audioTools.zones.submenu.title'), icon: <Speaker />, children: [
                            { id: 'draw-audio-rect', type: 'tool', label: t('vtt.tools.toolbar.audioTools.zones.rect.button.label'), icon: <Square /> },
                            { id: 'draw-audio-poly', type: 'tool', label: t('vtt.tools.toolbar.audioTools.zones.poly.button.label'), icon: <Hexagon /> },
                            { id: 'eraser-audio', type: 'tool', label: t('vtt.tools.toolbar.audioTools.zones.eraser.button.label'), icon: <Eraser />, danger: true },
                        ]
                    }
                ]
            },
            {
                id: 'triggers',
                type: 'group',
                label: t('vtt.tools.toolbar.triggerTools.group.label'),
                icon: <Zap />,
                requireRole: GameRole.GM,
                children: [
                    { id: 'draw-trigger-rect', type: 'tool', label: t('vtt.tools.toolbar.triggerTools.rect.button.label'), icon: <Square /> },
                    { id: 'draw-trigger-poly', type: 'tool', label: t('vtt.tools.toolbar.triggerTools.poly.button.label'), icon: <Hexagon /> },
                    { id: 'eraser-trigger', type: 'tool', label: t('vtt.tools.toolbar.triggerTools.eraser.button.label'), icon: <Eraser />, danger: true },
                ]
            }
        ];

        const gameplayGroup: ToolbarItemConfig[] = [
            {
                id: 'attack-zones',
                type: 'action',
                label: t('vtt.tools.toolbar.gameplayTools.attackZones.button.label'),
                icon: <Target />,
                onClick: props.onToggleAttackZones,
                isActive: !!props.isAttackZonePanelOpen,
                requirePermission: 'attackZoneUse',
            },
            {
                id: 'dice-roller',
                type: 'action',
                label: t('vtt.tools.toolbar.gameplayTools.diceRoller.button.label'),
                icon: <Dices />,
                onClick: props.onToggleDiceRoller,
                isActive: !!props.isDiceRollerOpen,
                requirePermission: 'diceRolling'
            },
            {
                id: 'bestiary',
                type: 'action',
                label: t('vtt.tools.toolbar.gameplayTools.bestiary.button.label'),
                icon: <BookOpen />,
                onClick: props.onToggleLibrary,
                isActive: props.isLibraryOpen,
                requirePermission: "bestiaryBrowse",
            },
            {
                id: 'compendium',
                type: 'action',
                label: t('vtt.tools.toolbar.gameplayTools.compendium.button.label'),
                icon: <Book />,
                onClick: props.onToggleCompendium,
                isActive: !!props.isCompendiumOpen,
                requirePermission: 'compendiumBrowse',
            },
            {
                id: 'handouts',
                type: 'action',
                label: t('vtt.tools.toolbar.gameplayTools.handouts.button.label'),
                icon: <FileText />,
                onClick: props.onToggleHandouts,
                isActive: !!props.isHandoutTrayOpen,
                requireRole: GameRole.GM,
            },
            {
                id: 'add-token',
                type: 'action',
                label: t('vtt.tools.toolbar.gameplayTools.addToken.button.label'),
                icon: <UserPlus />,
                onClick: props.onAddToken,
                requirePermission: 'tokenCreate'
            },
            {
                id: 'combat',
                type: 'action',
                label: props.isCombatActive ? t('vtt.tools.toolbar.gameplayTools.endCombat.button.label') : t('vtt.tools.toolbar.gameplayTools.startCombat.button.label'),
                icon: props.isCombatActive ? <ShieldOff /> : <Swords />,
                danger: props.isCombatActive,
                onClick: props.isCombatActive ? props.onEndCombat : props.onStartCombat,
                requireRole: GameRole.GM
            }
        ];

        const gmGroup: ToolbarItemConfig[] = [
            {
                id: 'gm-tools',
                type: 'group',
                label: t('vtt.tools.toolbar.gmTools.group.label'),
                icon: <Crown />,
                requireRole: GameRole.GM,
                children: [
                    {
                        id: 'view-settings',
                        type: 'action',
                        label: t('vtt.tools.toolbar.gmTools.viewSettings.button.label'),
                        icon: <Eye />,
                        onClick: () => {
                            if (props.onOpenViewSettings) props.onOpenViewSettings();
                        }
                    },
                    {
                        id: 'permissions',
                        type: 'action',
                        label: t('vtt.tools.toolbar.gmTools.permissions.button.label'),
                        icon: <Lock />,
                        onClick: props.onOpenPermissions
                    },
                    {
                        id: 'grid-coords',
                        type: 'action',
                        label: t('vtt.tools.toolbar.gmTools.gridCoords.button.label'),
                        icon: <Grid />,
                        isActive: ui.showGridCoordinates,
                        onClick: toggleGridCoordinates
                    },
                    {
                        id: 'map-align',
                        type: 'tool',
                        label: t('vtt.grid.inspector.title'),
                        icon: <Magnet />,
                        shortcut: 'G'
                    },
                    {
                        id: 'settings',
                        type: 'action',
                        label: t('vtt.tools.toolbar.gmTools.mapSettings.button.label'),
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
    }, [props, permissionHelper, toggleVisionRanges, toggleGridCoordinates, ui, isFollowingGM, permissions]); // Dependencies updated

    const isMobile = useIsMobile();
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        if (openMenuId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openMenuId]);

    return (
        <div
            className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl ring-1 ring-white/10 pointer-events-auto animate-in slide-in-from-bottom-8 duration-500"
            onClick={(e) => e.stopPropagation()}
        >
            {toolbarConfig.map((group, index) => (
                <React.Fragment key={index}>
                    {index > 0 && group.length > 0 && <div className="w-px h-6 sm:h-8 bg-white/10 mx-0.5 sm:mx-1"></div>}
                    {group.map(item => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            activeTool={props.activeTool}
                            depth={0}
                            onToolSelect={props.onToolSelect}
                            isMobile={isMobile}
                            openMenuId={openMenuId}
                            setOpenMenuId={setOpenMenuId}
                        />
                    ))}
                </React.Fragment>
            ))}
        </div>
    );
};
