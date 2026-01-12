
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { GameSessionProvider, useGameSession } from '../context/GameSessionContext';
import { useTranslation } from '../i18n/TranslationContext';
import { useNavigation } from '../context/NavigationContext';
import { useModal } from '../context/ModalContext';
import { Token, TokenTemplate, VTTTool, Character, Condition, Handout } from '../types';
import { Loader2, Sparkles, ChevronLeft, Settings, BookOpen, Trash2, X, Lightbulb, MessageSquare, Swords, Wifi, WifiOff, Music, FileText } from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';
import { Button } from '../components/ui/Button';
import { MapCanvas } from '../components/vtt/map/MapCanvas';
import { TriggerZoneConfigModalContent, AudioZoneEditModalContent } from '../components/vtt/map/modals';
import { VTTToolbar } from '../components/vtt/VTTToolbar';
import { MobileVTTToolbar } from '../modules/vtt/map3d/ui/mobile/MobileVTTToolbar';
import { DrawingToolbar } from '../components/vtt/DrawingToolbar';
import { RulerToolbar } from '../components/vtt/RulerToolbar';
import { TokenContextMenu } from '../components/vtt/TokenContextMenu';
import { TokenEditModal } from '../components/vtt/TokenEditModal';
import { MapSettingsModal } from '../components/vtt/MapSettingsModal';
import { MapContextMenu } from '../components/vtt/MapContextMenu';
import { useAuth } from '../context/AuthContext';
import { useAccessControl } from '../hooks/useAccessControl';
import { SceneNavigation } from '../components/vtt/SceneNavigation';
import { Sidebar } from '../components/vtt/Sidebar';
import { CharacterSheetViewer } from '../components/vtt/CharacterSheetViewer';
import { Modal } from '../components/ui/Modal';
import { SmartDiceRoller } from '../components/vtt/SmartDiceRoller';
import { PermissionsModal } from '../components/vtt/PermissionsModal';
import { useNotification } from '../context/NotificationContext';
import { AudioPanel } from '../components/vtt/AudioPanel';
import { SpectateBanner } from '../components/vtt/SpectateBanner';
import { HandoutTray } from '../components/vtt/HandoutTray';
import { SharedHandoutViewer } from '../components/vtt/SharedHandoutViewer';
import { HandoutFormModal } from '../components/vtt/HandoutFormModal';
import { HandoutPreviewModal } from '../components/vtt/HandoutPreviewModal';
import { HandoutShareModal } from '../components/vtt/HandoutShareModal';
import { CompendiumWindow } from '../components/vtt/CompendiumWindow';
import { CombatInitiativeRoller } from '../components/vtt/CombatInitiativeRoller';
import { AttackZonePanel } from '../components/vtt/AttackZonePanel';
import { AttackZoneConfigModal } from '../components/vtt/AttackZoneConfigModal';
import { AttackZoneContextMenu } from '../components/vtt/AttackZoneContextMenu';
import { useAttackZones } from '../context/gameSession/hooks/useAttackZones';
// PERFORMANCE: Lazy load heavy modals for better INP
const CursorSettingsModal = lazy(() => import('../components/vtt/CursorSettingsModal').then(m => ({ default: m.CursorSettingsModal })));
import { PullViewNotification } from '../components/vtt/notifications/PullViewNotification';
import { FollowModeIndicator } from '../components/vtt/notifications/FollowModeIndicator';
import { ViewSettingsModal } from '../components/vtt/settings/ViewSettingsModal';

export const GameSessionView: React.FC = () => {
    const { params, navigateTo } = useNavigation();
    const campaignId = params?.id as string | undefined;

    useEffect(() => {
        if (!campaignId) {
            console.error('Nenhum campaignId encontrado na URL!');
            navigateTo('dashboard');
        }
    }, [campaignId, navigateTo]);

    if (!campaignId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-red-400 gap-4">
                <h1 className="text-3xl font-bold">Campanha não encontrada</h1>
                <Button onClick={() => navigateTo('dashboard')} size="lg">
                    Voltar ao Painel
                </Button>
            </div>
        );
    }

    return (
        <GameSessionProvider campaignId={campaignId}>
            <GameSessionUI />
        </GameSessionProvider>
    );
};

const TokenLibrary: React.FC<{
    templates: TokenTemplate[];
    onUseTemplate: (tpl: TokenTemplate) => void;
    onDeleteTemplate: (id: string) => void;
    onClose: () => void;
}> = ({ templates, onUseTemplate, onDeleteTemplate, onClose }) => {
    const { t } = useTranslation();
    return (
        <div className="h-full flex flex-col bg-zinc-950/95 backdrop-blur-md border-r border-white/10 shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-100">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h3 className="font-bold font-fantasy tracking-wide">{t('vtt.gameSession.library.title')}</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                {templates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-12 text-zinc-600">
                        <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm italic text-zinc-600">{t('vtt.gameSession.library.emptyTitle')}</p>
                        <p className="text-xs mt-2 max-w-[150px]">{t('vtt.gameSession.library.emptyDesc')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {templates.map(tpl => (
                            <div key={tpl.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-2 flex items-center gap-3 hover:border-primary/50 hover:bg-zinc-800 transition-all group cursor-grab active:cursor-grabbing shadow-sm" onClick={() => onUseTemplate(tpl)}>
                                <div className="relative shrink-0">
                                    {tpl.displayMode === 'text' ? (
                                        <div
                                            className="w-12 h-12 rounded-lg border border-white/10 shadow-inner flex items-center justify-center"
                                            style={{ backgroundColor: tpl.textDetails?.backgroundColor || '#333' }}
                                        >
                                            <span className="font-bold" style={{ color: tpl.textDetails?.textColor || '#fff' }}>
                                                {tpl.textDetails?.text || '?'}
                                            </span>
                                        </div>
                                    ) : (
                                        <img src={tpl.imgUrl} className="w-12 h-12 rounded-lg bg-zinc-950 object-cover border border-white/10 shadow-inner" />
                                    )}
                                    <div className="absolute -bottom-1 -right-1 bg-zinc-950 text-[9px] px-1.5 py-0.5 rounded border border-white/10 font-mono text-zinc-400">{tpl.size}x</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate text-zinc-200 group-hover:text-primary transition-colors">{tpl.name}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{tpl.visionRange > 0 ? t('vtt.gameSession.library.vision', { range: tpl.visionRange }) : t('vtt.gameSession.library.blind')}</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteTemplate(tpl.id); }}
                                    className="p-2 hover:bg-destructive/20 text-zinc-600 hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Notifications */}
            {/* Removed internal notifications to place them globally */}
        </div>
    );
};

const GameSessionUI: React.FC = () => {
    const { t } = useTranslation();
    const session = useGameSession();
    const { isGM } = useAccessControl();
    const { user: currentUser } = useAuth();
    const { navigateTo, params } = useNavigation();
    const { openModal, closeModal } = useModal();
    const { show } = useNotification();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCursorSettingsOpen, setIsCursorSettingsOpen] = useState(false);
    const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
    const [isHandoutTrayOpen, setIsHandoutTrayOpen] = useState(false);
    const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);
    const [isAttackZonePanelOpen, setIsAttackZonePanelOpen] = useState(false);
    const [isAttackZoneConfigOpen, setIsAttackZoneConfigOpen] = useState(false);
    const [isViewSettingsOpen, setIsViewSettingsOpen] = useState(false);

    const [tokenContextMenu, setTokenContextMenu] = useState<{ x: number, y: number, token: Token; } | null>(null);
    const [mapContextMenu, setMapContextMenu] = useState<{ x: number, y: number, worldX: number, worldY: number, obstacleId?: string, triggerZoneId?: string, audioZoneId?: string; } | null>(null);
    const [attackZoneContextMenu, setAttackZoneContextMenu] = useState<{ x: number, y: number, zoneId: string; } | null>(null);

    // --- SHEET STATE ---
    const [viewingCharacterId, setViewingCharacterId] = useState<string | null>(null);
    const viewingCharacter = session.campaignCharacters.find(c => c.id === viewingCharacterId) || null;

    // --- HANDOUT STATE ---
    const [editingHandout, setEditingHandout] = useState<Handout | 'new' | null>(null);
    const [previewingHandout, setPreviewingHandout] = useState<Handout | null>(null);
    const [sharingHandout, setSharingHandout] = useState<Handout | null>(null);

    // --- TRIGGER ZONE EDIT STATE ---
    const [editingTriggerZoneId, setEditingTriggerZoneId] = useState<string | null>(null);
    // --- AUDIO ZONE EDIT STATE ---
    const [editingAudioZoneId, setEditingAudioZoneId] = useState<string | null>(null);
    // --- ATTACK ZONE EDIT STATE ---
    const [editingAttackZoneId, setEditingAttackZoneId] = useState<string | null>(null);
    const [isInitiativeRollerOpen, setIsInitiativeRollerOpen] = useState(false);

    // --- ATTACK ZONES ---
    const attackZones = useAttackZones({
        tokens: session.activeScene?.tokens || [],
        obstacles: session.activeScene?.obstacles || [],
        grid: session.activeScene?.grid || { size: 60, color: '#ffffff', alpha: 0.3, cols: 50, rows: 50, unitsPerSquare: 5 },
        // Synced from context
        activeZones: session.attackZones,
        onAddZone: session.addAttackZone,
        onRemoveZone: session.removeAttackZone,
        onUpdateZone: session.updateAttackZone,
        onClearZones: session.clearAttackZones
    });

    // PERFORMANCE: Compute if ANY modal/overlay is open to throttle render loop
    const { isOpen: isGlobalModalOpen } = useModal();
    const isAnyModalOpen = isGlobalModalOpen || isSettingsOpen || isCursorSettingsOpen || isPermissionsOpen
        || isHandoutTrayOpen || isCompendiumOpen || isAttackZonePanelOpen || isAttackZoneConfigOpen
        || isViewSettingsOpen || !!tokenContextMenu || !!mapContextMenu || !!attackZoneContextMenu
        || !!viewingCharacterId || !!editingHandout || !!previewingHandout || !!sharingHandout
        || !!editingTriggerZoneId || !!editingAudioZoneId || !!editingAttackZoneId || isInitiativeRollerOpen;

    // ... (Logic for tools/permissions remains unchanged) ...
    useEffect(() => {
        if (isGM) return;
        const drawingTools = ['draw-wall', 'draw-door', 'draw-window', 'eraser', 'draw-audio-rect', 'draw-audio-poly'];
        const measureTool = 'measure-path';
        const fogTools = ['fog-poly', 'fog-rect'];
        if (drawingTools.includes(session.activeTool) && !session.permissionHelper.can('drawings')) session.setActiveTool('select');
        if (session.activeTool === measureTool && !session.permissionHelper.can('measure')) session.setActiveTool('select');
        if (fogTools.includes(session.activeTool) && !session.permissionHelper.can('fogReveal')) session.setActiveTool('select');
    }, [session.permissions, session.activeTool, isGM, session.permissionHelper, session.setActiveTool]);

    // ... (Modal Handlers remain unchanged) ...
    const handleOpenTokenModal = (token: Token | 'new', initialPosition?: { x: number, y: number; }) => {
        if (!isGM) {
            if (token === 'new') {
                if (!session.permissionHelper.can('tokenCreate')) {
                    show({ type: 'warning', message: t('vtt.gameSession.error.noTokenCreatePerm') });
                    return;
                }
            } else {
                const isOwner = token.ownerId === currentUser?.id || token.controlledBy?.includes(currentUser?.id || '');
                if (!isOwner) {
                    show({ type: 'warning', message: t('vtt.gameSession.error.notController') });
                    return;
                }
                if (!session.permissionHelper.can('tokenEdit')) {
                    show({ type: 'warning', message: t('vtt.gameSession.error.tokenEditBlocked') });
                    return;
                }
            }
        }
        setMapContextMenu(null);
        setTokenContextMenu(null);
        openModal(
            <TokenEditModal
                token={token}
                initialPosition={initialPosition}
                players={session.players}
                availableCharacters={session.campaignCharacters}
                sceneTokens={session.activeScene?.tokens || []}
                onSave={(data, pos) => {
                    if (token === 'new') {
                        session.addToken({ ...data, ...(pos || { x: 0, y: 0 }) });
                    } else {
                        session.updateToken(token.id, data);
                    }
                    closeModal();
                }}
                onSaveTemplate={session.saveTemplate}
                onCancel={closeModal}
                isGM={isGM}
            />,
            { title: token === 'new' ? t('vtt.gameSession.modal.token.create') : t('vtt.gameSession.modal.token.edit'), size: 'xl' }
        );
    };

    const handleOpenSheet = (token: Token) => {
        if (token.linkedId) {
            setViewingCharacterId(token.linkedId);
        }
        setTokenContextMenu(null);
    };

    // ... (Duplicate, Template, ContextMenu handlers unchanged) ...
    const handleDuplicateToken = (token: Token) => {
        if (!isGM && !session.permissionHelper.can('tokenCreate')) {
            show({ type: 'warning', message: t('vtt.gameSession.error.tokenCreateBlocked') });
            return;
        }
        let offset = 1;
        const newToken = { ...token, id: undefined, name: `${token.name} (Clone)`, x: token.x + offset, y: token.y + offset };
        session.addToken(newToken);
    };

    const handleUseTemplate = (tpl: TokenTemplate) => {
        if (!isGM && !session.permissionHelper.can('tokenCreate')) {
            show({ type: 'warning', message: t('vtt.gameSession.error.tokenCreateBlocked') });
            return;
        }
        if (!session.activeScene) return;
        const centerX = Math.floor((-session.viewport.x + (window.innerWidth / 2)) / session.viewport.zoom / session.activeScene.grid.size);
        const centerY = Math.floor((-session.viewport.y + (window.innerHeight / 2)) / session.viewport.zoom / session.activeScene.grid.size);
        session.addToken({
            type: tpl.type || 'npc', name: tpl.name, imgUrl: tpl.imgUrl, size: tpl.size, visionRange: tpl.visionRange, darkvisionRange: tpl.darkvisionRange,
            visionColor: tpl.visionColor, displayMode: tpl.displayMode, textDetails: tpl.textDetails, isVisibleToPlayers: true, x: centerX, y: centerY, light: tpl.light
        });
        session.setActiveTool('select');
    };

    const handleTokenContextMenu = (e: React.MouseEvent, tokenId: string) => {
        if (!tokenId) { setTokenContextMenu(null); return; }
        const token = session.activeScene?.tokens.find(t => t.id === tokenId);
        if (token) {
            const isOwner = token.ownerId === currentUser?.id || token.controlledBy?.includes(currentUser?.id || '');
            if (isGM || isOwner) {
                setMapContextMenu(null);
                setTokenContextMenu({ x: e.clientX, y: e.clientY, token });
            }
        }
    };

    const handleMapContextMenu = (e: React.MouseEvent, worldX: number, worldY: number, obstacleId?: string, triggerZoneId?: string, audioZoneId?: string) => {
        setTokenContextMenu(null);
        setMapContextMenu({ x: e.clientX, y: e.clientY, worldX, worldY, obstacleId, triggerZoneId, audioZoneId });
    };

    const handleToggleObstacleVisibility = () => {
        if (mapContextMenu?.obstacleId) {
            const obs = session.activeScene?.obstacles.find(o => o.id === mapContextMenu.obstacleId);
            if (obs) {
                session.updateObstacle(obs.id, { hidden: !obs.hidden });
            }
        }
        setMapContextMenu(null);
    };

    const handleDeleteObstacle = () => {
        if (mapContextMenu?.obstacleId && session.activeScene) {
            session.removeObstacle(mapContextMenu.obstacleId);
        }
        setMapContextMenu(null);
    };

    const handleToggleTokenCondition = (token: Token, condition: Condition) => {
        const current = token.conditions || [];
        const newConditions = current.includes(condition) ? current.filter(c => c !== condition) : [...current, condition];
        session.updateToken(token.id, { conditions: newConditions });
    };

    const handleSaveHandout = async (data: Omit<Handout, 'id' | 'createdAt' | 'campaignId' | 'sharedWith'>) => {
        if (editingHandout === 'new') {
            await session.createHandout(data);
        } else if (editingHandout) {
            await session.updateHandout(editingHandout.id, data);
        }
        setEditingHandout(null);
        show({ type: 'success', message: t('vtt.gameSession.notification.handoutSaved') });
    };

    const handleDeleteHandout = (handout: Handout) => {
        openModal(
            <>
                <p>{t('vtt.gameSession.modal.handout.deleteConfirm', { name: handout.name })}</p>
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="ghost" onClick={closeModal}>{t('common.cancel')}</Button>
                    <Button variant="destructive" onClick={async () => { await session.deleteHandout(handout.id); closeModal(); }}>{t('common.delete')}</Button>
                </div>
            </>,
            { title: t('vtt.gameSession.modal.handout.deleteTitle'), variant: 'alert' }
        );
    };

    const handleEditTriggerZone = () => {
        if (mapContextMenu?.triggerZoneId) {
            setEditingTriggerZoneId(mapContextMenu.triggerZoneId);
        }
        setMapContextMenu(null);
    };

    const handleDeleteTriggerZone = () => {
        if (mapContextMenu?.triggerZoneId) {
            session.removeTriggerZone(mapContextMenu.triggerZoneId);
        }
        setMapContextMenu(null);
    };

    const handleEditAudioZone = () => {
        if (mapContextMenu?.audioZoneId) {
            setEditingAudioZoneId(mapContextMenu.audioZoneId);
        }
        setMapContextMenu(null);
    };

    const handleDeleteAudioZone = () => {
        if (mapContextMenu?.audioZoneId) {
            session.removeAudioZone(mapContextMenu.audioZoneId);
        }
        setMapContextMenu(null);
    };

    const handleAttackZoneContextMenu = (e: React.MouseEvent, zoneId: string) => {
        setAttackZoneContextMenu({ x: e.clientX, y: e.clientY, zoneId });
    };

    const handleEditAttackZone = (zoneId: string) => {
        setEditingAttackZoneId(zoneId);
        setAttackZoneContextMenu(null);
    };

    const handleDuplicateAttackZone = (zoneId: string) => {
        const centerX = Math.floor((-session.viewport.x + window.innerWidth / 2) / session.viewport.zoom);
        const centerY = Math.floor((-session.viewport.y + window.innerHeight / 2) / session.viewport.zoom);
        attackZones.duplicateZone(zoneId, { x: centerX, y: centerY });
        setAttackZoneContextMenu(null);
        show({ type: 'success', message: t('vtt.gameSession.notification.zoneDuplicated') });
    };

    const handleDeleteAttackZone = () => {
        if (attackZoneContextMenu) {
            attackZones.removeZone(attackZoneContextMenu.zoneId);
            setAttackZoneContextMenu(null);
            show({ type: 'success', message: t('vtt.gameSession.notification.zoneRemoved') });
        }
    };

    if (session.isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
                <div className="relative">
                    <div className="absolute -inset-8 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
                    <Sparkles className="w-16 h-16 text-primary animate-bounce relative z-10" />
                </div>
                <h1 className="text-2xl font-bold font-fantasy tracking-widest mt-8 animate-pulse text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">{t('vtt.gameSession.loading.sync')}</h1>
                <p className="text-zinc-500 mt-2 font-mono text-xs">{session.campaign?.name || t('vtt.gameSession.loading.default')}</p>
            </div>
        );
    }

    if (!session.campaign) {
        return <div className="min-h-screen bg-zinc-950 text-red-400 flex items-center justify-center">{t('vtt.gameSession.error.loadCampaign')}</div>;
    }

    const editingTriggerZone = editingTriggerZoneId ? session.activeScene?.triggerZones?.find(z => z.id === editingTriggerZoneId) : null;
    const editingAudioZone = editingAudioZoneId ? session.activeScene?.audioZones?.find(z => z.id === editingAudioZoneId) : null;

    return (
        <div className="h-screen w-screen bg-zinc-900 text-white overflow-hidden flex flex-col font-sans antialiased relative">

            {/* Reconnection Banner */}
            {!session.isConnected && (
                <div className="absolute top-0 left-0 right-0 z-[9999] bg-red-600/90 backdrop-blur text-white py-2 px-4 flex items-center justify-center gap-3 shadow-2xl animate-in slide-in-from-top-full duration-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-bold tracking-wide">{t('vtt.gameSession.connection.lost')}</span>
                    <span className="text-xs opacity-80 hidden sm:inline">{t('vtt.gameSession.connection.lostSub')}</span>
                </div>
            )}

            {/* Global Notifications - Always Visible */}
            <PullViewNotification show={session.pullNotification} />
            <FollowModeIndicator />

            <div className="absolute inset-0 z-0">
                <MapCanvas
                    scene={session.activeScene}
                    tokens={session.activeScene?.tokens || []}
                    viewport={session.viewport}
                    isGM={isGM}
                    gmViewMode={session.gmViewMode}
                    previewPlayerId={session.previewPlayerId}
                    currentUser={currentUser}
                    activeTool={session.activeTool}
                    movementPath={session.movementPath}
                    pings={session.pings}
                    drawingObstacle={session.drawingObstacle}
                    draftPolyPoints={session.draftPolyPoints}
                    selectedTokenIds={session.selectedTokenIds}
                    remoteDrags={session.remoteDrags}
                    permissions={session.permissions}
                    campaign={session.campaign}
                    cursorSettings={session.cursorSettings}
                    wandSettings={session.wandSettings}
                    drawingLightZone={session.drawingLightZone}
                    drawingAudioZone={session.drawingAudioZone}

                    setViewport={session.setViewport}
                    moveToken={session.moveToken}
                    moveTokens={session.moveTokens}
                    selectToken={session.selectToken}
                    clearSelection={session.clearSelection}

                    updateFog={session.updateFog}
                    setActiveTool={session.setActiveTool}
                    onTokenContextMenu={handleTokenContextMenu}
                    onMapContextMenu={handleMapContextMenu}
                    setMovementPath={session.setMovementPath}
                    addObstacles={session.addObstacles}
                    updateObstacle={session.updateObstacle}
                    setDrawingObstacle={session.setDrawingObstacle}
                    setDraftPolyPoints={session.setDraftPolyPoints}
                    updateToken={session.updateToken}
                    onOpenSheet={handleOpenSheet}
                    emitTokenDrag={session.emitTokenDrag}
                    setDrawingLightZone={session.setDrawingLightZone}
                    addLightZones={session.addLightZones}
                    setDrawingAudioZone={session.setDrawingAudioZone}
                    addAudioZones={session.addAudioZones}
                    emitCursorMove={session.emitCursorMove}
                    remoteCursors={session.remoteCursors}
                    remoteViewports={session.remoteViewports}

                    drawingTriggerZone={session.drawingTriggerZone}
                    setDrawingTriggerZone={session.setDrawingTriggerZone}
                    addTriggerZones={session.addTriggerZones}
                    removeTriggerZone={session.removeTriggerZone}

                    // NEW: Pass characters and roll handler for Hover Card
                    campaignCharacters={session.campaignCharacters}
                    onRollDice={(formula, label) => session.rollDice(label, formula)}
                    onCharacterUpdate={session.updateCharacter}

                    // Attack Zones
                    attackZoneResults={attackZones.activeZoneResults}
                    previewZoneResult={attackZones.previewZoneResult}
                    onAttackZoneContextMenu={handleAttackZoneContextMenu}
                    onUpdateAttackZone={attackZones.updateZone}
                    // Attack Zone Placement Mode
                    isPlacingAttackZone={attackZones.isPlacingZone}
                    onUpdatePreviewOrigin={(origin) => attackZones.updatePreview({ origin })}
                    onConfirmAttackZonePlacement={attackZones.confirmPreview}
                    onCancelAttackZonePlacement={attackZones.cancelPreview}
                    // PERFORMANCE: Throttle render when modal is open
                    isModalOpen={isAnyModalOpen}
                />
            </div>

            <SpectateBanner />

            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
                <div className="flex justify-between items-start w-full">
                    <div className="pointer-events-auto flex items-center gap-3 bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-2 pr-6 shadow-xl hover:bg-zinc-950/90 transition-colors group">
                        <Button variant="ghost" size="icon" onClick={() => navigateTo('dashboard')} className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="font-bold text-sm text-zinc-100 leading-none group-hover:text-primary transition-colors">{session.campaign.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${session.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                    {session.activeScene?.name || t('vtt.gameSession.loading.default')}
                                    {session.isConnected ? <span className="text-green-600/80 ml-1 hidden sm:inline">{t('vtt.gameSession.status.live')}</span> : <span className="text-red-600/80 ml-1 hidden sm:inline">{t('vtt.gameSession.status.offline')}</span>}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3D VIEW - WIP/DISABLED */}
                    {/* <div className="pointer-events-auto ml-2 bg-zinc-950/80 rounded-2xl border border-zinc-700/50 opacity-60 cursor-not-allowed">
                        <div className="relative flex items-center gap-2 h-10 px-3">
                            <span className="font-bold text-xs text-zinc-500">3D ALPHA</span>
                            <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-amber-500/80 text-black px-1.5 py-0.5 rounded-full">WIP</span>
                        </div>
                    </div> */}

                    {session.combat?.isActive && (
                        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 top-6 bg-red-950/90 backdrop-blur-md border border-red-500/30 text-red-100 px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
                            <Swords className="w-4 h-4 text-red-400 animate-pulse" />
                            <div className="flex gap-4 text-sm font-bold font-fantasy tracking-wide">
                                <span>{t('vtt.gameSession.combat.label')}</span>
                                <span className="w-px h-4 bg-red-500/30"></span>
                                <span>{t('vtt.gameSession.combat.round', { round: session.combat.round })}</span>
                            </div>
                        </div>
                    )}

                    <div className="pointer-events-auto flex items-center gap-3">
                        <div className="flex gap-2 bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-xl">
                            <Tooltip content={session.isConnected ? t('vtt.gameSession.status.connected') : t('vtt.gameSession.status.disconnected')}>
                                <div className={`p-2.5 rounded-xl transition-all ${session.isConnected ? 'text-green-500' : 'text-red-500'}`}>
                                    {session.isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                                </div>
                            </Tooltip>
                            <div className="w-px h-6 bg-white/10 self-center mx-1"></div>
                            <Tooltip content={t('vtt.gameSession.toolbar.groupCombat')}>
                                <button onClick={session.toggleRightSidebar} className={`p-2.5 rounded-xl transition-all duration-200 ${session.ui.isRightSidebarOpen ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                                    <Swords className="w-5 h-5" />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-auto self-center mb-4 md:mb-6 flex flex-col items-center gap-4 w-full md:w-auto">
                    {/* Render Drawing Toolbar if active */}
                    <DrawingToolbar />
                    {/* Render Ruler Toolbar if active */}
                    <RulerToolbar />

                    {/* Desktop Toolbar (hidden on mobile) */}
                    <div className="hidden md:block">
                        <VTTToolbar
                            activeTool={session.activeTool}
                            isCombatActive={!!session.combat?.isActive}
                            gmViewMode={session.gmViewMode}
                            gmHideObstacles={session.ui.gmHideObstacles}
                            players={session.players}
                            previewPlayerId={session.previewPlayerId}
                            onSetPreviewPlayer={session.setPreviewPlayerId}
                            onToolSelect={session.setActiveTool}
                            onResetFog={() => session.updateFog('')}
                            onAddToken={() => {
                                const gridSize = session.activeScene?.grid.size || 70;
                                handleOpenTokenModal('new', { x: Math.floor((-session.viewport.x + window.innerWidth / 2) / session.viewport.zoom / gridSize), y: Math.floor((-session.viewport.y + window.innerHeight / 2) / session.viewport.zoom / gridSize) });
                            }}
                            onToggleLibrary={session.toggleLibrary}
                            isLibraryOpen={session.ui.isLibraryOpen}
                            onToggleDiceRoller={session.toggleDiceRoller}
                            isDiceRollerOpen={session.ui.isDiceRollerOpen}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                            onOpenCursorSettings={() => setIsCursorSettingsOpen(true)}
                            onStartCombat={() => setIsInitiativeRollerOpen(true)}
                            onEndCombat={session.endCombat}
                            onToggleViewMode={session.toggleGMViewMode}
                            onToggleGhostWalls={() => session.setGmHideObstacles(!session.ui.gmHideObstacles)}
                            onOpenPermissions={() => setIsPermissionsOpen(true)}
                            isAudioPanelOpen={session.ui.isAudioPanelOpen}
                            onToggleAudioPanel={session.toggleAudioPanel}
                            isHandoutTrayOpen={isHandoutTrayOpen}
                            onToggleHandouts={() => setIsHandoutTrayOpen(!isHandoutTrayOpen)}
                            onToggleCompendium={() => setIsCompendiumOpen(!isCompendiumOpen)}
                            isCompendiumOpen={isCompendiumOpen}
                            isAttackZonePanelOpen={isAttackZonePanelOpen}
                            onToggleAttackZones={() => setIsAttackZonePanelOpen(!isAttackZonePanelOpen)}
                            onOpenViewSettings={() => setIsViewSettingsOpen(true)}
                        />
                    </div>

                    {/* Mobile Toolbar (visible only on mobile) */}
                    <div className="block md:hidden w-full">
                        <MobileVTTToolbar
                            activeTool={session.activeTool}
                            isCombatActive={!!session.combat?.isActive}
                            gmViewMode={session.gmViewMode}
                            gmHideObstacles={session.ui.gmHideObstacles}
                            players={session.players}
                            previewPlayerId={session.previewPlayerId}
                            isLibraryOpen={session.ui.isLibraryOpen}
                            isDiceRollerOpen={session.ui.isDiceRollerOpen}
                            isAudioPanelOpen={session.ui.isAudioPanelOpen}
                            isHandoutTrayOpen={isHandoutTrayOpen}
                            isCompendiumOpen={isCompendiumOpen}
                            isAttackZonePanelOpen={isAttackZonePanelOpen}
                            onSetPreviewPlayer={session.setPreviewPlayerId}
                            onToolSelect={session.setActiveTool}
                            onResetFog={() => session.updateFog('')}
                            onAddToken={() => {
                                const gridSize = session.activeScene?.grid.size || 70;
                                handleOpenTokenModal('new', { x: Math.floor((-session.viewport.x + window.innerWidth / 2) / session.viewport.zoom / gridSize), y: Math.floor((-session.viewport.y + window.innerHeight / 2) / session.viewport.zoom / gridSize) });
                            }}
                            onToggleLibrary={session.toggleLibrary}
                            onToggleDiceRoller={session.toggleDiceRoller}
                            onToggleAudioPanel={session.toggleAudioPanel}
                            onToggleHandouts={() => setIsHandoutTrayOpen(!isHandoutTrayOpen)}
                            onToggleCompendium={() => setIsCompendiumOpen(!isCompendiumOpen)}
                            onToggleAttackZones={() => setIsAttackZonePanelOpen(!isAttackZonePanelOpen)}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                            onStartCombat={() => setIsInitiativeRollerOpen(true)}
                            onEndCombat={session.endCombat}
                            onToggleViewMode={session.toggleGMViewMode}
                            onToggleGhostWalls={() => session.setGmHideObstacles(!session.ui.gmHideObstacles)}
                            onOpenPermissions={() => setIsPermissionsOpen(true)}
                            onOpenCursorSettings={() => setIsCursorSettingsOpen(true)}
                            onOpenViewSettings={() => setIsViewSettingsOpen(true)}
                            isGameMaster={isGM}
                            canAsGMOr={(perm) => session.permissionHelper.canAsGMOr(perm)}
                        />
                    </div>
                </div>
            </div>

            <div className="pointer-events-auto">
                <SceneNavigation />
            </div>

            <div className="pointer-events-auto">
                <SmartDiceRoller isOpen={session.ui.isDiceRollerOpen} onClose={session.toggleDiceRoller} />
            </div>

            <div className="pointer-events-auto">
                <AudioPanel isOpen={session.ui.isAudioPanelOpen} onClose={session.toggleAudioPanel} />
            </div>

            <div className="pointer-events-auto">
                <CompendiumWindow isOpen={isCompendiumOpen} onClose={() => setIsCompendiumOpen(false)} />
            </div>

            <div className="pointer-events-auto">
                <HandoutTray isOpen={isHandoutTrayOpen} onClose={() => setIsHandoutTrayOpen(false)} handouts={session.handouts} onCreate={() => setEditingHandout('new')} onEdit={(h) => setEditingHandout(h)} onShare={(h) => setSharingHandout(h)} onPreview={(h) => setPreviewingHandout(h)} />
            </div>

            {/* Attack Zone Panel */}
            <div className="pointer-events-auto">
                <AttackZonePanel
                    isOpen={isAttackZonePanelOpen}
                    onClose={() => setIsAttackZonePanelOpen(false)}
                    onSelectTemplate={(templateId) => {
                        // Iniciar preview do template no centro da tela
                        const centerX = Math.floor((-session.viewport.x + window.innerWidth / 2) / session.viewport.zoom);
                        const centerY = Math.floor((-session.viewport.y + window.innerHeight / 2) / session.viewport.zoom);
                        attackZones.startPreviewFromTemplate(templateId, { x: centerX, y: centerY });
                        setIsAttackZonePanelOpen(false);
                    }}
                    onCreateCustom={() => {
                        setIsAttackZoneConfigOpen(true);
                        setIsAttackZonePanelOpen(false);
                    }}
                    activeZones={attackZones.activeZones}
                    onRemoveZone={attackZones.removeZone}
                    onToggleZoneVisibility={(zoneId) => {
                        // TODO: Implementar toggle de visibilidade se necessário
                        console.log('Toggle visibility:', zoneId);
                    }}
                    onDuplicateZone={(zoneId) => {
                        const centerX = Math.floor((-session.viewport.x + window.innerWidth / 2) / session.viewport.zoom);
                        const centerY = Math.floor((-session.viewport.y + window.innerHeight / 2) / session.viewport.zoom);
                        attackZones.duplicateZone(zoneId, { x: centerX, y: centerY });
                    }}
                    onEditZone={(zoneId) => {
                        // TODO: Implementar edição se necessário
                        console.log('Edit zone:', zoneId);
                    }}
                />
            </div>

            {/* Attack Zone Config Modal */}
            {isAttackZoneConfigOpen && (
                <AttackZoneConfigModal
                    isOpen={isAttackZoneConfigOpen}
                    onClose={() => setIsAttackZoneConfigOpen(false)}
                    onSave={(config) => {
                        const centerX = Math.floor((-session.viewport.x + window.innerWidth / 2) / session.viewport.zoom);
                        const centerY = Math.floor((-session.viewport.y + window.innerHeight / 2) / session.viewport.zoom);
                        const zone = attackZones.createCustomZone({
                            ...config,
                            origin: { x: centerX, y: centerY },
                        });
                        attackZones.addZone(zone);
                        setIsAttackZoneConfigOpen(false);
                        show({ type: 'success', message: t('vtt.gameSession.notification.zoneCreated') });
                    }}
                    title={t('vtt.gameSession.modal.attackZone.createCustom')}
                />
            )}


            <SharedHandoutViewer />

            <div className={`absolute top-0 left-0 bottom-0 z-20 w-80 transform transition-transform duration-300 ease-out ${session.ui.isLibraryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <TokenLibrary templates={session.templates} onUseTemplate={handleUseTemplate} onDeleteTemplate={session.deleteTemplate} onClose={session.toggleLibrary} />
            </div>

            <div className={`absolute top-0 right-0 bottom-0 z-20 w-80 md:w-96 transform transition-transform duration-300 ease-out ${session.ui.isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <Sidebar />
            </div>

            <PermissionsModal isOpen={isPermissionsOpen} onClose={() => setIsPermissionsOpen(false)} permissions={session.permissions} onUpdate={session.updatePermissions} campaign={session.campaign} players={session.players} />

            {viewingCharacter && (
                <Modal isOpen={!!viewingCharacter} onClose={() => setViewingCharacterId(null)} size="xl" hideCloseButton>
                    <div className="h-[80vh]"><CharacterSheetViewer character={viewingCharacter} isGM={isGM} currentUserId={currentUser?.id} onClose={() => setViewingCharacterId(null)} onUpdate={(updates) => session.updateCharacter(viewingCharacter.id, updates, true)} onRoll={(label, formula) => session.rollDice(label, formula)} onShare={(type, data) => session.sendChatMessage(`Compartilhou ${data.name || 'algo'}`, 'message', undefined, { type, label: data.name, data, id: data.id })} /></div>
                </Modal>
            )}

            {tokenContextMenu && (
                <TokenContextMenu x={tokenContextMenu.x} y={tokenContextMenu.y} token={tokenContextMenu.token} onClose={() => setTokenContextMenu(null)} onEdit={() => handleOpenTokenModal(tokenContextMenu.token)} onDuplicate={() => handleDuplicateToken(tokenContextMenu.token)} onDelete={() => session.removeToken(tokenContextMenu.token.id)} onToggleVisibility={() => session.updateToken(tokenContextMenu.token.id, { isVisibleToPlayers: !tokenContextMenu.token.isVisibleToPlayers })} onToggleCondition={(condition) => handleToggleTokenCondition(tokenContextMenu.token, condition)} onOpenSheet={() => handleOpenSheet(tokenContextMenu.token)} />
            )}

            {isSettingsOpen && session.activeScene && (
                <MapSettingsModal
                    scene={session.activeScene}
                    onClose={() => setIsSettingsOpen(false)}
                    onSave={session.updateMapSettings}
                    audioSettings={session.audioSettings}
                    bulkUpdateObstacles={session.bulkUpdateObstacles}
                    defaultObstacleHidden={session.ui.defaultObstacleHidden}
                    onToggleDefaultObstacleHidden={() => session.setGmHideObstacles(!session.ui.defaultObstacleHidden)}
                />
            )}

            {mapContextMenu && (
                <MapContextMenu
                    x={mapContextMenu.x}
                    y={mapContextMenu.y}
                    worldX={mapContextMenu.worldX}
                    worldY={mapContextMenu.worldY}
                    isGM={isGM}
                    canCreateToken={session.permissionHelper.can('tokenCreate')}
                    obstacleId={mapContextMenu.obstacleId}
                    triggerZoneId={mapContextMenu.triggerZoneId}
                    audioZoneId={mapContextMenu.audioZoneId}
                    onClose={() => setMapContextMenu(null)}
                    onAddToken={() => {
                        const gridSize = session.activeScene?.grid.size || 70;
                        handleOpenTokenModal('new', { x: Math.floor(mapContextMenu.worldX / gridSize), y: Math.floor(mapContextMenu.worldY / gridSize) });
                    }}
                    onAddLight={() => {
                        const gridSize = session.activeScene?.grid.size || 70;
                        session.addLightToken(Math.floor(mapContextMenu.worldX / gridSize), Math.floor(mapContextMenu.worldY / gridSize));
                    }}
                    onPing={() => session.addPing(mapContextMenu.worldX, mapContextMenu.worldY)}
                    onToggleObstacleVisibility={handleToggleObstacleVisibility}
                    onDeleteObstacle={handleDeleteObstacle}
                    onEditTriggerZone={handleEditTriggerZone}
                    onDeleteTriggerZone={handleDeleteTriggerZone}
                    onEditAudioZone={handleEditAudioZone}
                    onDeleteAudioZone={handleDeleteAudioZone}
                />
            )}

            {!!editingHandout && <Modal isOpen={!!editingHandout} onClose={() => setEditingHandout(null)} title={editingHandout === 'new' ? t('vtt.gameSession.modal.handout.new') : t('vtt.gameSession.modal.handout.edit')} size="xl"><HandoutFormModal handout={editingHandout === 'new' ? undefined : editingHandout} onSave={handleSaveHandout} onClose={() => setEditingHandout(null)} /></Modal>}
            {previewingHandout && <HandoutPreviewModal handout={previewingHandout} onClose={() => setPreviewingHandout(null)} onEdit={(h) => { setPreviewingHandout(null); setEditingHandout(h); }} onShare={(h) => { setPreviewingHandout(null); setSharingHandout(h); }} />}
            {sharingHandout && <HandoutShareModal handout={sharingHandout} onClose={() => setSharingHandout(null)} />}

            {/* Trigger Zone Edit Modal */}
            {!!editingTriggerZone && (
                <Modal isOpen={!!editingTriggerZone} onClose={() => setEditingTriggerZoneId(null)} title={t('vtt.gameSession.modal.triggerZone.edit')} size="sm">
                    <TriggerZoneConfigModalContent
                        handouts={session.handouts}
                        onSave={(handoutId) => {
                            if (editingTriggerZoneId) {
                                session.updateTriggerZone(editingTriggerZoneId, { handoutId });
                            }
                            setEditingTriggerZoneId(null);
                        }}
                        onClose={() => setEditingTriggerZoneId(null)}
                        initialHandoutId={editingTriggerZone.handoutId}
                    />
                </Modal>
            )}

            {/* Audio Zone Edit Modal */}
            {!!editingAudioZone && (
                <Modal isOpen={!!editingAudioZone} onClose={() => setEditingAudioZoneId(null)} title={t('vtt.gameSession.modal.audioZone.edit')} size="lg">
                    <AudioZoneEditModalContent
                        zone={editingAudioZone}
                        audioSettings={session.audioSettings}
                        onSave={(updates) => {
                            if (editingAudioZoneId) {
                                session.updateAudioZone(editingAudioZoneId, updates);
                            }
                            setEditingAudioZoneId(null);
                        }}
                        onClose={() => setEditingAudioZoneId(null)}
                    />
                </Modal>
            )}

            {/* Attack Zone Context Menu */}
            {attackZoneContextMenu && (() => {
                const zone = attackZones.activeZones.find(z => z.id === attackZoneContextMenu.zoneId);
                return zone ? (
                    <AttackZoneContextMenu
                        x={attackZoneContextMenu.x}
                        y={attackZoneContextMenu.y}
                        zone={zone}
                        onClose={() => setAttackZoneContextMenu(null)}
                        onEdit={() => handleEditAttackZone(attackZoneContextMenu.zoneId)}
                        onDuplicate={() => handleDuplicateAttackZone(attackZoneContextMenu.zoneId)}
                        onDelete={handleDeleteAttackZone}
                    />
                ) : null;
            })()}

            {/* Attack Zone Edit Modal */}
            {editingAttackZoneId && (() => {
                const zone = attackZones.activeZones.find(z => z.id === editingAttackZoneId);
                return zone ? (
                    <AttackZoneConfigModal
                        isOpen={!!editingAttackZoneId}
                        onClose={() => setEditingAttackZoneId(null)}
                        onSave={(updates) => {
                            attackZones.updateZone(editingAttackZoneId, updates);
                            setEditingAttackZoneId(null);
                            show({ type: 'success', message: t('vtt.gameSession.notification.zoneUpdated') });
                        }}
                        initialConfig={zone}
                        title={t('vtt.gameSession.modal.attackZone.edit')}
                    />
                ) : null;
            })()}

            {/* Combat Initiative Roller */}
            <CombatInitiativeRoller
                isOpen={isInitiativeRollerOpen}
                onClose={() => setIsInitiativeRollerOpen(false)}
            />

            {/* PERFORMANCE: Only mount modal when open (true lazy load) */}
            {isCursorSettingsOpen && (
                <Suspense fallback={null}>
                    <CursorSettingsModal isOpen={isCursorSettingsOpen} onClose={() => setIsCursorSettingsOpen(false)} />
                </Suspense>
            )}

            {/* View Settings Modal */}
            {isViewSettingsOpen && (
                <Modal
                    isOpen={isViewSettingsOpen}
                    onClose={() => setIsViewSettingsOpen(false)}
                    title={t('vtt.settings.view.title')}
                    size="lg"
                    transparent
                >
                    <ViewSettingsModal />
                </Modal>
            )}
        </div>
    );
};
