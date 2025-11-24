
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { MapScene, Token, Viewport, Ping, Obstacle, User, PolygonObstacle, LineObstacle, VTTTool, LightZone, SessionPermissions, Point, AudioZone, Playlist, TriggerZone, MapDrawing, Character } from '../../types';
import { TokenDragPayload, CursorMovePayload } from '../../types/socket';
import { TokenHoverCard } from './TokenHoverCard';
import { calculateVisibilityPolygon, isPointInPolygon, distanceToSegment } from '../../utils/geometry';
import { drawGrid, drawToken, drawRuler, drawObstacles, drawLabel, drawLightingLayer, drawAudioZones } from '../../utils/canvasRenderer';
import { findPath } from '../../utils/pathfinding';
import { useGameSession } from '../../context/GameSessionContext';
import { useModal } from '../../context/ModalContext';
import { Button } from '../ui/Button';
import { SheetSelect, SheetInput, SheetLabel, SheetSelectOption } from '../ui/SheetPrimitives';
import { UploadCloud, Trash2, Pointer } from 'lucide-react';

interface MapCanvasProps {
    scene: MapScene | null;
    tokens: Token[];
    viewport: Viewport;
    isGM: boolean;
    gmViewMode: 'gm' | 'player';
    currentUser: User | null;
    activeTool: VTTTool;
    movementPath: { x: number, y: number; }[];
    pings: Ping[];
    drawingObstacle: { type: Obstacle['type'], p1: { x: number, y: number; }; } | null;
    drawingLightZone: { type: 'polygon' | 'rect', p1: { x: number, y: number; }; } | null;
    drawingAudioZone: { type: 'polygon' | 'rect', p1: { x: number, y: number; }; } | null;
    drawingTriggerZone: { type: 'polygon' | 'rect', p1: { x: number, y: number; }, handoutId?: string; } | null;
    draftPolyPoints: { x: number, y: number; }[];
    selectedTokenIds?: string[];
    previewPlayerId?: string | 'all';
    remoteDrags?: Record<string, TokenDragPayload>;
    remoteCursors: Record<string, CursorMovePayload>;
    permissions: SessionPermissions;

    setViewport: (newViewport: Partial<Viewport>) => void;
    moveToken: (tokenId: string, newX: number, newY: number) => void;
    moveTokens?: (deltas: { id: string, x: number, y: number; }[]) => void;
    selectToken?: (id: string, multi: boolean) => void;
    clearSelection?: () => void;

    updateFog: (newPath: string) => void;
    setActiveTool: (tool: VTTTool) => void;
    onTokenContextMenu: (e: React.MouseEvent, tokenId: string) => void;
    onMapContextMenu: (e: React.MouseEvent, worldX: number, worldY: number, obstacleId?: string, triggerZoneId?: string, audioZoneId?: string) => void;
    setMovementPath: (path: { x: number, y: number; }[]) => void;
    addObstacles: (obstacles: (Omit<LineObstacle, 'id'> | Omit<PolygonObstacle, 'id'>)[]) => void;
    updateObstacle: (id: string, updates: Partial<Obstacle>) => void;
    setDrawingObstacle: (obstacle: { type: Obstacle['type'], p1: { x: number, y: number; }; } | null) => void;
    setDrawingLightZone: (zone: { type: 'polygon' | 'rect', p1: { x: number, y: number; }; } | null) => void;
    addLightZones: (zones: Omit<LightZone, 'id'>[]) => void;
    setDrawingAudioZone: (zone: { type: 'polygon' | 'rect', p1: { x: number, y: number; }; } | null) => void;
    addAudioZones: (zones: Omit<AudioZone, 'id'>[]) => void;
    setDrawingTriggerZone: (zone: { type: 'polygon' | 'rect', p1: { x: number, y: number; }; } | null) => void;
    addTriggerZones: (zones: Omit<TriggerZone, 'id'>[]) => void;
    removeTriggerZone: (id: string) => void;
    setDraftPolyPoints: (points: { x: number, y: number; }[]) => void;
    updateToken: (id: string, data: Partial<Token>) => void;
    onOpenSheet?: (token: Token) => void;
    emitTokenDrag?: (tokenId: string, x: number, y: number, path: { x: number, y: number; }[]) => void;
    emitCursorMove: (x: number, y: number) => void;

    // NEW PROPS
    campaignCharacters?: Character[];
    onRollDice?: (formula: string, label: string) => void;
    onCharacterUpdate?: (id: string, data: Partial<Character>) => void;
}

const imageCache: { [src: string]: HTMLImageElement; } = {};

const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
};

const adjustAlpha = (rgba: string | undefined, alpha: number) => {
    if (!rgba) return `rgba(255, 255, 255, ${alpha})`;
    if (rgba.startsWith('#')) {
        return rgba;
    }
    return rgba.replace(/[\d\.]+\)$/g, `${alpha})`);
};

interface TokenAnimation {
    id: string;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    startTime: number;
    duration: number;
}

// Audio Modals...
export const AudioZoneConfigModalContent: React.FC<{
    audioSettings: { playlists: Playlist[]; };
    onSave: (config: { audioUrl: string; volume: number; radius: number; }) => void;
    onClose: () => void;
}> = ({ audioSettings, onSave, onClose }) => {
    const [audioUrl, setAudioUrl] = useState('');
    const [customUrl, setCustomUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const audioTracksForSelect = useMemo(() => {
        const tracks: SheetSelectOption[] = (audioSettings.playlists || []).flatMap(p =>
            p.tracks.map(t => ({ label: `${p.name} - ${t.name}`, value: t.url }))
        );
        return [
            { label: 'Nenhuma Música', value: '' },
            ...tracks,
            { label: 'URL Personalizada / Upload', value: 'custom' }
        ];
    }, [audioSettings]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => { setCustomUrl(reader.result as string); };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        onSave({ audioUrl: audioUrl === 'custom' ? customUrl : audioUrl, volume: 1.0, radius: 5 });
        onClose();
    };

    return (
        <div className="space-y-4">
            <SheetLabel>Música da Zona</SheetLabel>
            <SheetSelect value={audioUrl} onChange={setAudioUrl} options={audioTracksForSelect} placeholder="Selecione uma faixa..." variant="box" />
            {audioUrl === 'custom' && (
                <div className="flex gap-2 items-end mt-2">
                    <SheetInput value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="Cole URL ou faça upload..." variant="box" className="flex-1" />
                    <input type="file" ref={fileInputRef} className="hidden" accept=".mp3,.wav,.ogg,.m4a,.flac,.aac,audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/flac,audio/mp4" onChange={handleFileUpload} />
                    <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}><UploadCloud className="w-4 h-4" /></Button>
                </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Zona</Button>
            </div>
        </div>
    );
};

// Trigger Zone Config Modal - Exported for reuse
export const TriggerZoneConfigModalContent: React.FC<{
    handouts: any[];
    onSave: (handoutId: string) => void;
    onClose: () => void;
    initialHandoutId?: string;
}> = ({ handouts, onSave, onClose, initialHandoutId }) => {
    const [selectedHandout, setSelectedHandout] = useState(initialHandoutId || '');

    const options = [
        { label: 'Selecione um Recurso...', value: '' },
        ...handouts.map(h => ({ label: h.name, value: h.id }))
    ];

    return (
        <div className="space-y-4">
            <SheetLabel>Recurso a Abrir</SheetLabel>
            <SheetSelect
                value={selectedHandout}
                onChange={setSelectedHandout}
                options={options}
                placeholder="Selecione o recurso..."
                variant="box"
            />
            <p className="text-xs text-zinc-500">
                Quando um jogador entrar nesta área, este recurso abrirá automaticamente na tela dele.
            </p>
            <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={() => { if (selectedHandout) onSave(selectedHandout); onClose(); }} disabled={!selectedHandout}>Salvar Gatilho</Button>
            </div>
        </div>
    );
};

export const AudioZoneEditModalContent: React.FC<{
    zone: AudioZone;
    audioSettings: { playlists: Playlist[]; };
    onSave: (updates: Partial<AudioZone>) => void;
    onDelete?: () => void; // Made optional as it might be handled by context menu
    onClose: () => void;
}> = ({ zone, audioSettings, onSave, onDelete, onClose }) => {
    const [selectedOption, setSelectedOption] = useState('');
    const [customUrl, setCustomUrl] = useState('');
    const [volume, setVolume] = useState(zone.volume);
    const [radius, setRadius] = useState(zone.radius);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const audioTracksForSelect = useMemo(() => {
        const tracks: SheetSelectOption[] = (audioSettings.playlists || []).flatMap(p =>
            p.tracks.map(t => ({ label: `${p.name} - ${t.name}`, value: t.url }))
        );
        return [
            { label: 'Nenhuma Música', value: '' },
            ...tracks,
            { label: 'URL Personalizada / Upload', value: 'custom' }
        ];
    }, [audioSettings]);

    useEffect(() => {
        const isCustom = !audioTracksForSelect.some(o => o.value === zone.audioUrl) && zone.audioUrl !== '';
        if (isCustom) {
            setSelectedOption('custom');
            setCustomUrl(zone.audioUrl);
        } else {
            setSelectedOption(zone.audioUrl);
        }
    }, [zone, audioTracksForSelect]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => { setCustomUrl(reader.result as string); };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        onSave({ audioUrl: selectedOption === 'custom' ? customUrl : selectedOption, volume, radius });
        onClose();
    };

    return (
        <div className="space-y-4">
            <SheetLabel>Música da Zona</SheetLabel>
            <SheetSelect value={selectedOption} onChange={setSelectedOption} options={audioTracksForSelect} variant="box" />
            {selectedOption === 'custom' && (
                <div className="flex gap-2 items-end mt-2">
                    <SheetInput value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="Cole URL ou faça upload..." variant="box" className="flex-1" />
                    <input type="file" ref={fileInputRef} className="hidden" accept=".mp3,.wav,.ogg,.m4a,.flac,.aac,audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/flac,audio/mp4" onChange={handleFileUpload} />
                    <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}><UploadCloud className="w-4 h-4" /></Button>
                </div>
            )}
            <SheetLabel>Volume ({Math.round(volume * 100)}%)</SheetLabel>
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary" />
            <SheetInput label="Raio de Efeito (Falloff)" type="number" value={radius} onChange={e => setRadius(Number(e.target.value))} variant="box" />
            <div className="flex justify-between gap-2 mt-6 pt-4 border-t border-zinc-700">
                {onDelete ? (
                    <Button variant="destructive" onClick={onDelete}><Trash2 className="w-4 h-4 mr-2" /> Apagar Zona</Button>
                ) : <div></div>}
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar Alterações</Button>
                </div>
            </div>
        </div>
    );
};


export const MapCanvas: React.FC<MapCanvasProps> = (props) => {
    const {
        scene, tokens, viewport, isGM, gmViewMode, currentUser, activeTool, movementPath, pings, drawingObstacle, draftPolyPoints, selectedTokenIds = [], previewPlayerId = 'all', remoteDrags = {}, permissions, remoteCursors,
        setViewport, moveToken, moveTokens, updateFog, setActiveTool, onTokenContextMenu,
        onMapContextMenu, setMovementPath, addObstacles, updateObstacle, setDrawingObstacle, setDraftPolyPoints,
        selectToken, clearSelection, updateToken, onOpenSheet, emitTokenDrag,
        drawingLightZone, setDrawingLightZone, addLightZones,
        drawingAudioZone, setDrawingAudioZone, addAudioZones, emitCursorMove,
        drawingTriggerZone, setDrawingTriggerZone, addTriggerZones, removeTriggerZone,
        campaignCharacters = [], onRollDice, onCharacterUpdate
    } = props;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lightCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const { removeObstacle, ui, audioSettings, updateAudioZone, removeAudioZone, checkPermission, handouts, addDrawing, removeDrawing, drawingSettings, rulerSettings } = useGameSession();
    const { openModal, closeModal } = useModal();

    const [isPanning, setIsPanning] = useState(false);
    const [fogRectStart, setFogRectStart] = useState<{ x: number, y: number; } | null>(null);
    const [currentFogRect, setCurrentFogRect] = useState<{ x: number, y: number, w: number, h: number; } | null>(null);
    const [mouseWorldPos, setMouseWorldPos] = useState({ x: 0, y: 0 });
    const [hoveredObstacleId, setHoveredObstacleId] = useState<string | null>(null);
    const [calculatedPath, setCalculatedPath] = useState<{ x: number, y: number; }[]>([]);

    // Drawing State (Ref for performance, State for syncing)
    // We use a Ref to track points during the drag to avoid react renders on every mousemove
    const liveDrawingPointsRef = useRef<{ x: number, y: number; }[]>([]);
    const isDrawingRef = useRef(false);

    const [animatingTokens, setAnimatingTokens] = useState<Map<string, TokenAnimation>>(new Map());
    const animationsRef = useRef<Map<string, TokenAnimation>>(new Map());
    const prevTokensRef = useRef<Token[]>(tokens);

    // HOVER STATE
    const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);

    // HOVER INTERACTION REFS
    const hoverOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleCardMouseEnter = () => {
        if (hoverCloseTimerRef.current) {
            clearTimeout(hoverCloseTimerRef.current);
            hoverCloseTimerRef.current = null;
        }
    };

    const handleCardMouseLeave = () => {
        if (!hoverCloseTimerRef.current) {
            hoverCloseTimerRef.current = setTimeout(() => {
                setHoveredTokenId(null);
                hoverCloseTimerRef.current = null;
            }, 300);
        }
    };

    const lastCursorEmit = useRef(0);

    const dragState = useRef<{
        isDragging: boolean;
        token: Token | null;
        draggedGroup: { id: string, offsetX: number, offsetY: number, startGridX: number, startGridY: number; }[];
        offset: { x: number, y: number; };
        dragStartX: number;
        dragStartY: number;
        lastValidGridX: number;
        lastValidGridY: number;
        lastCheckedGridX: number;
        lastCheckedGridY: number;
    }>({
        isDragging: false,
        token: null,
        draggedGroup: [],
        offset: { x: 0, y: 0 },
        dragStartX: 0,
        dragStartY: 0,
        lastValidGridX: 0,
        lastValidGridY: 0,
        lastCheckedGridX: -1,
        lastCheckedGridY: -1
    }).current;

    const lastMousePos = useRef({ x: 0, y: 0 });
    const isDrawingTool = ['draw-wall', 'draw-door', 'draw-window', 'fog-poly', 'fog-rect', 'measure-path', 'eraser', 'draw-light-rect', 'draw-light-poly', 'draw-audio-rect', 'draw-audio-poly', 'eraser-audio', 'draw-trigger-rect', 'draw-trigger-poly', 'eraser-trigger', 'brush', 'eraser-drawing'].includes(activeTool);

    const visionTokens = React.useMemo(() => {
        if (isGM && gmViewMode === 'player') {
            if (previewPlayerId === 'all') {
                return tokens.filter(t => t.type === 'pc');
            } else {
                return tokens.filter(t => t.ownerId === previewPlayerId || t.controlledBy?.includes(previewPlayerId));
            }
        } else if (!isGM) {
            return tokens.filter(t => t.ownerId === currentUser?.id || t.controlledBy?.includes(currentUser?.id || ''));
        }
        return [];
    }, [tokens, isGM, gmViewMode, previewPlayerId, currentUser]);

    useEffect(() => { animationsRef.current = animatingTokens; }, [animatingTokens]);

    useEffect(() => {
        const newAnimations = new Map(animationsRef.current);
        let changed = false;
        tokens.forEach(token => {
            const prevToken = prevTokensRef.current.find(t => t.id === token.id);
            if (prevToken && (token.x !== prevToken.x || token.y !== prevToken.y)) {
                if (dragState.isDragging && dragState.token?.id === token.id) return;
                const dist = Math.hypot(token.x - prevToken.x, token.y - prevToken.y);
                if (dist > 0.1) {
                    newAnimations.delete(token.id);
                    const duration = Math.min(500, 150 + dist * 30);
                    newAnimations.set(token.id, {
                        id: token.id,
                        startX: prevToken.x,
                        startY: prevToken.y,
                        targetX: token.x,
                        targetY: token.y,
                        startTime: Date.now(),
                        duration
                    });
                    changed = true;
                }
            }
        });
        if (changed) setAnimatingTokens(newAnimations);
        prevTokensRef.current = tokens;
    }, [tokens, dragState.isDragging]);

    useEffect(() => {
        setFogRectStart(null);
        setCurrentFogRect(null);
        setDraftPolyPoints([]);
        setDrawingObstacle(null);
        setDrawingLightZone(null);
        setDrawingAudioZone(null);
        setDrawingTriggerZone(null);
        setMovementPath([]);
        setIsPanning(false);
        setHoveredTokenId(null);
        setCalculatedPath([]);
        setHoveredObstacleId(null);

        // Reset Brush
        liveDrawingPointsRef.current = [];
        isDrawingRef.current = false;
    }, [activeTool]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (dragState.isDragging) {
                    dragState.isDragging = false;
                    dragState.token = null;
                    setCalculatedPath([]);
                } else if (draftPolyPoints.length > 0 || drawingObstacle || movementPath.length > 0 || drawingLightZone || drawingAudioZone || drawingTriggerZone || liveDrawingPointsRef.current.length > 0) {
                    setDraftPolyPoints([]);
                    setDrawingObstacle(null);
                    setDrawingLightZone(null);
                    setDrawingAudioZone(null);
                    setDrawingTriggerZone(null);
                    setMovementPath([]);
                    liveDrawingPointsRef.current = [];
                    isDrawingRef.current = false;
                } else if (activeTool !== 'select') {
                    setActiveTool('select');
                } else {
                    if (clearSelection) clearSelection();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTool, draftPolyPoints, drawingObstacle, movementPath, dragState, setActiveTool, clearSelection, drawingLightZone, drawingAudioZone, drawingTriggerZone]);

    useEffect(() => {
        if (!scene) return;
        const imagesToLoad = [scene.imageUrl, ...tokens.map(t => t.imgUrl)];
        imagesToLoad.forEach(src => {
            if (src && !imageCache[src]) {
                const img = new Image();
                img.src = src;
                img.onload = () => { imageCache[src] = img; };
            }
        });
    }, [scene, tokens]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !scene) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const lightCanvas = lightCanvasRef.current;
        if (lightCanvas.width !== canvas.width || lightCanvas.height !== canvas.height) {
            lightCanvas.width = canvas.width;
            lightCanvas.height = canvas.height;
        }
        const lightCtx = lightCanvas.getContext('2d');

        let animationFrameId: number;

        const render = () => {
            const now = Date.now();
            let animationsChanged = false;
            const newAnimations = new Map(animationsRef.current);
            animationsRef.current.forEach((anim, id) => {
                if (now > anim.startTime + anim.duration) {
                    newAnimations.delete(id);
                    animationsChanged = true;
                }
            });
            if (animationsChanged) setAnimatingTokens(newAnimations);

            const mapWidth = scene.grid.size * scene.grid.cols;
            const mapHeight = scene.grid.size * scene.grid.rows;
            const effectiveIsGM = isGM && gmViewMode === 'gm';
            const mapImage = imageCache[scene.imageUrl];
            const { size: gridSize, color: gridColor, alpha: gridAlpha, unitsPerSquare } = scene.grid;
            const renderTime = Date.now();

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(viewport.x, viewport.y);
            ctx.scale(viewport.zoom, viewport.zoom);

            const allVisionPolygons: Point[][] = [];

            // --- VISION CALCULATION ---
            // Use ALL obstacles for vision calculation to ensure consistency with GM view.
            // Hidden obstacles (like secret doors) should still block vision if they are walls/closed doors.
            const visionObstacles = scene.obstacles;

            if (effectiveIsGM) {
                if (mapImage?.complete) ctx.drawImage(mapImage, 0, 0, mapWidth, mapHeight);
                else { ctx.fillStyle = '#202020'; ctx.fillRect(0, 0, mapWidth, mapHeight); }
                drawGrid(ctx, mapWidth, mapHeight, gridSize, gridColor, gridAlpha, viewport.zoom);
                if (scene.fogPath) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fill(new Path2D(scene.fogPath));
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 2 / viewport.zoom;
                    ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);
                    ctx.stroke(new Path2D(scene.fogPath));
                    ctx.restore();
                }
            } else {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, mapWidth, mapHeight);
                const visibilityPath = new Path2D();
                if (scene.fogPath) visibilityPath.addPath(new Path2D(scene.fogPath));

                const unitScale = gridSize / (unitsPerSquare || 1.5);

                visionTokens.forEach(token => {
                    const anim = animationsRef.current.get(token.id);
                    let currX = token.x;
                    let currY = token.y;
                    if (anim) {
                        const progress = Math.min(1, (renderTime - anim.startTime) / anim.duration);
                        const ease = easeOutCubic(progress);
                        currX = anim.startX + (anim.targetX - anim.startX) * ease;
                        currY = anim.startY + (anim.targetY - anim.startY) * ease;
                    }
                    const origin = { x: (currX + token.size / 2) * gridSize, y: (currY + token.size / 2) * gridSize };

                    // FIX: Use unitScale for correct radius calculation (matching GM view)
                    const visionRangePx = (token.visionRange || 0) * unitScale;
                    const darkvisionRangePx = (token.darkvisionRange || 0) * unitScale;
                    const effectiveRadius = Math.max(gridSize * 0.6, Math.max(visionRangePx, darkvisionRangePx));

                    if (effectiveRadius > 0) {
                        const poly = calculateVisibilityPolygon(origin, visionObstacles, effectiveRadius);
                        if (poly.length > 0) {
                            allVisionPolygons.push(poly);
                            const p = new Path2D();
                            p.moveTo(poly[0].x, poly[0].y);
                            for (let i = 1; i < poly.length; i++) p.lineTo(poly[i].x, poly[i].y);
                            p.closePath();
                            visibilityPath.addPath(p);
                        }
                    }
                });

                ctx.save();
                ctx.clip(visibilityPath);
                if (mapImage?.complete) ctx.drawImage(mapImage, 0, 0, mapWidth, mapHeight);
                else { ctx.fillStyle = '#202020'; ctx.fillRect(0, 0, mapWidth, mapHeight); }
                drawGrid(ctx, mapWidth, mapHeight, gridSize, gridColor, gridAlpha, viewport.zoom);
                ctx.restore();
            }

            // ... (Drawings code skipped for brevity, assumed unchanged) ...

            if (scene.drawings) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                scene.drawings.forEach(drawing => {
                    if (drawing.points.length < 2) return;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
                    for (let i = 1; i < drawing.points.length; i++) {
                        ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
                    }
                    ctx.strokeStyle = drawing.color;
                    ctx.lineWidth = drawing.width / viewport.zoom;
                    ctx.globalAlpha = drawing.opacity !== undefined ? drawing.opacity : 1.0;
                    ctx.stroke();
                    ctx.restore();
                });

                // Live Drawing
                const livePoints = liveDrawingPointsRef.current;
                if (livePoints.length > 1) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(livePoints[0].x, livePoints[0].y);
                    for (let i = 1; i < livePoints.length; i++) {
                        ctx.lineTo(livePoints[i].x, livePoints[i].y);
                    }
                    ctx.strokeStyle = drawingSettings.color;
                    ctx.lineWidth = drawingSettings.width / viewport.zoom;
                    ctx.globalAlpha = drawingSettings.opacity;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            if (scene.obstacles && scene.obstacles.length > 0) {
                drawObstacles(ctx, scene.obstacles, effectiveIsGM, viewport.zoom, hoveredObstacleId || undefined, ui.gmHideObstacles);
            }

            if (effectiveIsGM && scene.triggerZones && scene.triggerZones.length > 0) {
                drawTriggerZones(ctx, scene.triggerZones, viewport.zoom);
            }

            if (scene.audioZones && scene.audioZones.length > 0) {
                drawAudioZones(ctx, scene.audioZones, effectiveIsGM, viewport.zoom);
            }

            Object.entries(remoteDrags).forEach(([uid, dragItem]) => {
                const drag = dragItem as TokenDragPayload;
                const ghostToken = tokens.find(t => t.id === drag.tokenId);
                if (ghostToken) {
                    const dragPosWorld = { x: drag.x * gridSize + (ghostToken.size * gridSize) / 2, y: drag.y * gridSize + (ghostToken.size * gridSize) / 2 };
                    const pathWorld = drag.path.map(p => ({ x: p.x * gridSize + (ghostToken.size * gridSize) / 2, y: p.y * gridSize + (ghostToken.size * gridSize) / 2 }));
                    if (pathWorld.length > 0) {
                        drawRuler(ctx, pathWorld, dragPosWorld, gridSize, unitsPerSquare, viewport.zoom, drag.color || '#fbbf24', ghostToken.speed || 9);
                    }
                    const visualToken = { ...ghostToken, x: drag.x, y: drag.y };
                    ctx.globalAlpha = 0.6;
                    drawToken(ctx, visualToken, gridSize, false, viewport.zoom, imageCache, true);
                    ctx.globalAlpha = 1.0;
                    drawLabel(ctx, `Arrastando...`, drag.x * gridSize + (ghostToken.size * gridSize) / 2, drag.y * gridSize - 20 / viewport.zoom, viewport.zoom, drag.color || '#fbbf24');
                }
            });

            tokens.forEach(token => {
                const isOwner = token.ownerId === currentUser?.id || token.controlledBy?.includes(currentUser?.id || '');
                let shouldRender = true;
                if (!effectiveIsGM) {
                    const isVisibleToOthers = token.isVisibleToPlayers;
                    if (previewPlayerId === 'all') shouldRender = isVisibleToOthers || token.type === 'pc';
                    else if (previewPlayerId) shouldRender = isVisibleToOthers || token.ownerId === previewPlayerId;
                    else shouldRender = isVisibleToOthers || isOwner;
                }
                if (!shouldRender) return;

                const isBeingDragged = dragState.isDragging && (dragState.token?.id === token.id || selectedTokenIds.includes(token.id));
                let renderAsGhost = false;
                if (!token.isVisibleToPlayers) {
                    if (effectiveIsGM) renderAsGhost = true;
                    else if (!previewPlayerId && isOwner) renderAsGhost = true;
                }
                if (isBeingDragged) renderAsGhost = true;

                const anim = animationsRef.current.get(token.id);
                let currX = token.x;
                let currY = token.y;

                if (anim) {
                    const progress = Math.min(1, (renderTime - anim.startTime) / anim.duration);
                    const ease = easeOutCubic(progress);
                    currX = anim.startX + (anim.targetX - anim.startX) * ease;
                    currY = anim.startY + (anim.targetY - anim.startY) * ease;
                }

                const animToken = { ...token, x: currX, y: currY };

                if (!effectiveIsGM && !isOwner && allVisionPolygons.length > 0) {
                    const tGx = animToken.x * gridSize;
                    const tGy = animToken.y * gridSize;
                    const tSize = token.size * gridSize;
                    const pointsToCheck = [{ x: tGx + tSize / 2, y: tGy + tSize / 2 }, { x: tGx, y: tGy }, { x: tGx + tSize, y: tGy }, { x: tGx + tSize, y: tGy + tSize }, { x: tGx, y: tGy + tSize }];
                    const isVisible = pointsToCheck.some(p => allVisionPolygons.some(poly => isPointInPolygon(p, poly)));
                    if (!isVisible) return;
                } else if (!effectiveIsGM && !isOwner && allVisionPolygons.length === 0 && scene.fogPath) {
                    const center = { x: animToken.x * gridSize + animToken.size * gridSize / 2, y: animToken.y * gridSize + animToken.size * gridSize / 2 };
                    if (!ctx.isPointInPath(new Path2D(scene.fogPath), center.x, center.y)) return;
                }

                if (effectiveIsGM && (ui.showVisionRanges || selectedTokenIds.includes(token.id))) {
                    const cx = (currX + token.size / 2) * gridSize;
                    const cy = (currY + token.size / 2) * gridSize;
                    const unitScale = gridSize / (unitsPerSquare || 1.5);

                    if ((token.darkvisionRange || 0) > 0) {
                        const r = (token.darkvisionRange || 0) * unitScale;
                        const visColor = token.visionColor || 'rgba(139, 92, 246, 0.5)';
                        const poly = calculateVisibilityPolygon({ x: cx, y: cy }, scene.obstacles, r);
                        if (poly.length > 0) {
                            ctx.save(); ctx.beginPath(); ctx.moveTo(poly[0].x, poly[0].y); for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y); ctx.closePath();
                            ctx.lineWidth = 2 / viewport.zoom; ctx.strokeStyle = visColor; ctx.setLineDash([8 / viewport.zoom, 4 / viewport.zoom]); ctx.stroke();
                            ctx.fillStyle = adjustAlpha(visColor, 0.05); ctx.fill();
                            drawLabel(ctx, `DV: ${token.darkvisionRange}m`, cx, cy + r + (20 / viewport.zoom), viewport.zoom, visColor.replace(')', ', 0.8)')); ctx.restore();
                        }
                    }

                    if ((token.visionRange || 0) > 0) {
                        const r = (token.visionRange || 0) * unitScale;
                        const poly = calculateVisibilityPolygon({ x: cx, y: cy }, scene.obstacles, r);

                        if (poly.length > 0) {
                            ctx.save(); ctx.beginPath(); ctx.moveTo(poly[0].x, poly[0].y); for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y); ctx.closePath();
                            const visColor = token.visionColor || 'rgba(34, 211, 238, 0.5)';
                            ctx.lineWidth = 2 / viewport.zoom; ctx.strokeStyle = visColor; ctx.setLineDash([]); ctx.stroke();
                            ctx.fillStyle = adjustAlpha(visColor, 0.1); ctx.fill();
                            drawLabel(ctx, `Vis: ${token.visionRange}m`, cx, cy - r - (10 / viewport.zoom), viewport.zoom, visColor.replace(')', ', 0.8)')); ctx.restore();
                        }
                    }
                }

                const linkedCharacter = token.linkedId ? campaignCharacters.find(c => c.id === token.linkedId) : undefined;
                drawToken(ctx, animToken, gridSize, selectedTokenIds.includes(token.id), viewport.zoom, imageCache, renderAsGhost, linkedCharacter);
            });

            if (lightCtx) {
                // PASS visionObstacles to drawLightingLayer
                drawLightingLayer(lightCtx, canvas.width, canvas.height, scene, tokens, animationsRef.current, viewport, visionTokens, !effectiveIsGM, (!effectiveIsGM && allVisionPolygons.length > 0) ? allVisionPolygons : undefined, visionObstacles);
                ctx.save(); ctx.resetTransform(); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(lightCanvas, 0, 0); ctx.restore();
            }

            if (activeTool === 'measure-path') {
                if (movementPath.length > 0) {
                    drawRuler(ctx, movementPath, mouseWorldPos, gridSize, unitsPerSquare, viewport.zoom, undefined, undefined, rulerSettings.metric, true);
                } else {
                    ctx.beginPath(); ctx.arc(mouseWorldPos.x, mouseWorldPos.y, 4 / viewport.zoom, 0, Math.PI * 2); ctx.fillStyle = '#fbbf24'; ctx.fill();
                }
            }

            if (activeTool === 'eraser' || activeTool === 'eraser-audio' || activeTool === 'eraser-drawing') {
                ctx.save(); ctx.beginPath(); ctx.arc(mouseWorldPos.x, mouseWorldPos.y, 8 / viewport.zoom, 0, Math.PI * 2); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2 / viewport.zoom; ctx.stroke(); ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; ctx.fill(); ctx.restore();
            }

            if (activeTool === 'eraser-trigger') {
                ctx.save(); ctx.beginPath(); ctx.arc(mouseWorldPos.x, mouseWorldPos.y, 8 / viewport.zoom, 0, Math.PI * 2); ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2 / viewport.zoom; ctx.stroke(); ctx.fillStyle = 'rgba(168, 85, 247, 0.2)'; ctx.fill(); ctx.restore();
            }

            if (dragState.isDragging && dragState.token) {
                const leader = dragState.token;
                const mouseX = mouseWorldPos.x; const mouseY = mouseWorldPos.y;
                const leaderGridX = Math.round((mouseX - dragState.offset.x) / gridSize);
                const leaderGridY = Math.round((mouseY - dragState.offset.y) / gridSize);
                const deltaGridX = leaderGridX - leader.x;
                const deltaGridY = leaderGridY - leader.y;

                dragState.draggedGroup.forEach(groupItem => {
                    const token = tokens.find(t => t.id === groupItem.id);
                    if (!token) return;
                    const smoothX = mouseX - groupItem.offsetX; const smoothY = mouseY - groupItem.offsetY;
                    ctx.save(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1 / viewport.zoom; ctx.strokeRect((groupItem.startGridX + deltaGridX) * gridSize, (groupItem.startGridY + deltaGridY) * gridSize, token.size * gridSize, token.size * gridSize); ctx.restore();
                    const movingToken = { ...token, x: smoothX / gridSize, y: smoothY / gridSize };
                    drawToken(ctx, movingToken, gridSize, true, viewport.zoom, imageCache, false);
                    if (token.id === leader.id) {
                        const pathWorldPoints = calculatedPath.map(p => ({ x: p.x * gridSize + (token.size * gridSize) / 2, y: p.y * gridSize + (token.size * gridSize) / 2 }));
                        const currentSnap = { x: (groupItem.startGridX + deltaGridX) * gridSize + (token.size * gridSize) / 2, y: (groupItem.startGridY + deltaGridY) * gridSize + (token.size * gridSize) / 2 };
                        if (pathWorldPoints.length > 0) drawRuler(ctx, pathWorldPoints, currentSnap, gridSize, unitsPerSquare, viewport.zoom, '#fbbf24', token.speed || 9);
                    }
                });
            }

            if (currentFogRect || (activeTool === 'draw-light-rect' && drawingLightZone?.type === 'rect') || (activeTool === 'draw-audio-rect' && drawingAudioZone?.type === 'rect') || (activeTool === 'draw-trigger-rect' && drawingTriggerZone?.type === 'rect')) {
                const rect = currentFogRect
                    || (drawingLightZone?.type === 'rect' && mouseWorldPos && drawingLightZone.p1 ? { x: drawingLightZone.p1.x, y: drawingLightZone.p1.y, w: mouseWorldPos.x - drawingLightZone.p1.x, h: mouseWorldPos.y - drawingLightZone.p1.y } : null)
                    || (drawingAudioZone?.type === 'rect' && mouseWorldPos && drawingAudioZone.p1 ? { x: drawingAudioZone.p1.x, y: drawingAudioZone.p1.y, w: mouseWorldPos.x - drawingAudioZone.p1.x, h: mouseWorldPos.y - drawingAudioZone.p1.y } : null)
                    || (drawingTriggerZone?.type === 'rect' && mouseWorldPos && drawingTriggerZone.p1 ? { x: drawingTriggerZone.p1.x, y: drawingTriggerZone.p1.y, w: mouseWorldPos.x - drawingTriggerZone.p1.x, h: mouseWorldPos.y - drawingTriggerZone.p1.y } : null);
                if (rect) {
                    ctx.save();
                    let color = 'rgba(255, 255, 255, 0.9)';
                    if (activeTool.includes('light')) color = 'rgba(251, 191, 36, 0.9)';
                    else if (activeTool.includes('audio')) color = 'rgba(0, 255, 255, 0.9)';
                    else if (activeTool.includes('trigger')) color = 'rgba(168, 85, 247, 0.9)';
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2 / viewport.zoom;
                    ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);
                    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
                    ctx.restore();
                }
            }

            if ((['fog-poly', 'draw-wall', 'draw-light-poly', 'draw-audio-poly', 'draw-trigger-poly'].includes(activeTool)) && draftPolyPoints.length > 0) {
                ctx.save();
                let color = 'rgba(255, 255, 255, 0.9)';
                if (activeTool === 'draw-wall') color = 'rgba(255, 0, 255, 0.8)';
                else if (activeTool.includes('light')) color = 'rgba(251, 191, 36, 0.8)';
                else if (activeTool.includes('audio')) color = 'rgba(0, 255, 255, 0.8)';
                else if (activeTool.includes('trigger')) color = 'rgba(168, 85, 247, 0.8)';

                ctx.strokeStyle = color;
                ctx.lineWidth = 3 / viewport.zoom;
                draftPolyPoints.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4 / viewport.zoom, 0, Math.PI * 2); ctx.fill(); });
                ctx.beginPath(); ctx.moveTo(draftPolyPoints[0].x, draftPolyPoints[0].y); for (let i = 1; i < draftPolyPoints.length; i++) ctx.lineTo(draftPolyPoints[i].x, draftPolyPoints[i].y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(draftPolyPoints[draftPolyPoints.length - 1].x, draftPolyPoints[draftPolyPoints.length - 1].y); ctx.lineTo(mouseWorldPos.x, mouseWorldPos.y); ctx.stroke();
                if (draftPolyPoints.length >= (activeTool === 'draw-wall' ? 2 : 3)) {
                    const distToStart = Math.hypot(mouseWorldPos.x - draftPolyPoints[0].x, mouseWorldPos.y - draftPolyPoints[0].y);
                    if (distToStart < 15 / viewport.zoom) {
                        ctx.beginPath(); ctx.arc(draftPolyPoints[0].x, draftPolyPoints[0].y, 8 / viewport.zoom, 0, Math.PI * 2); ctx.strokeStyle = 'yellow'; ctx.lineWidth = 2 / viewport.zoom; ctx.stroke(); drawLabel(ctx, "Fechar", draftPolyPoints[0].x, draftPolyPoints[0].y - 20 / viewport.zoom, viewport.zoom);
                    }
                }
                ctx.restore();
            }

            if (drawingObstacle) {
                ctx.save(); ctx.strokeStyle = drawingObstacle.type === 'window' ? 'cyan' : 'rgba(139, 92, 246, 0.9)'; ctx.lineWidth = 5 / viewport.zoom; ctx.beginPath(); ctx.moveTo(drawingObstacle.p1.x, drawingObstacle.p1.y); ctx.lineTo(mouseWorldPos.x, mouseWorldPos.y); ctx.stroke(); ctx.restore();
            }

            pings.forEach(ping => {
                const duration = 3000; const elapsed = Date.now() - ping.createdAt; const progress = Math.min(1, elapsed / duration);
                if (progress >= 1) return;
                const easeOut = 1 - Math.pow(1 - progress, 3); const maxRadius = gridSize * 1.5;
                ctx.save(); ctx.translate(ping.x, ping.y); ctx.globalAlpha = Math.max(0, 1 - progress * 1.5); ctx.beginPath(); ctx.arc(0, 0, (gridSize * 0.2) * (1 - progress * 0.5), 0, Math.PI * 2); ctx.fillStyle = ping.color; ctx.fill();
                ctx.globalAlpha = 1; ctx.globalAlpha = (1 - progress); ctx.lineWidth = Math.max(0.5, (5 - progress * 4) / viewport.zoom); ctx.strokeStyle = ping.color; ctx.beginPath(); ctx.arc(0, 0, maxRadius * easeOut, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
            });

            Object.values(remoteCursors).forEach((cursor: CursorMovePayload) => {
                if (cursor.userId === currentUser?.id) return;
                ctx.save(); ctx.translate(cursor.x, cursor.y); ctx.fillStyle = cursor.userColor || '#FFFFFF'; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 2 / viewport.zoom;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12 / viewport.zoom, 20 / viewport.zoom); ctx.lineTo(4 / viewport.zoom, 12 / viewport.zoom); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.font = `bold ${12 / viewport.zoom}px sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                const textX = 16 / viewport.zoom; const textY = 16 / viewport.zoom; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 4 / viewport.zoom;
                ctx.strokeText(cursor.userName, textX, textY); ctx.fillStyle = 'white'; ctx.fillText(cursor.userName, textX, textY); ctx.restore();
            });

            ctx.restore();
            animationFrameId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [scene, tokens, viewport, isGM, gmViewMode, currentUser, activeTool, movementPath, pings, dragState.isDragging, drawingObstacle, draftPolyPoints, currentFogRect, selectedTokenIds, mouseWorldPos, animatingTokens, calculatedPath, hoveredObstacleId, ui.gmHideObstacles, ui.showVisionRanges, drawingLightZone, drawingAudioZone, drawingTriggerZone, previewPlayerId, visionTokens, remoteDrags, remoteCursors, drawingSettings, rulerSettings]);

    const getMousePos = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const screenToWorld = (screenX: number, screenY: number) => ({
        x: (screenX - viewport.x) / viewport.zoom,
        y: (screenY - viewport.y) / viewport.zoom,
    });

    const findTokenAt = (worldX: number, worldY: number) => {
        if (!scene) return null;
        const gridSize = scene.grid.size;
        return [...tokens].reverse().find(t =>
            worldX >= t.x * gridSize && worldX < (t.x + t.size) * gridSize &&
            worldY >= t.y * gridSize && worldY < (t.y + t.size) * gridSize
        );
    };

    const findObstacleAt = (worldX: number, worldY: number) => {
        if (!scene || !scene.obstacles) return null;
        const clickRadius = 10 / viewport.zoom;
        const p = { x: worldX, y: worldY };
        return scene.obstacles.find(obs => {
            if (obs.type === 'wall') {
                if (!obs.points || obs.points.length < 2) return false;
                for (let i = 0; i < obs.points.length; i++) {
                    if (obs.open && i === obs.points.length - 1) continue;
                    const p1 = obs.points[i];
                    const p2 = obs.points[(i + 1) % obs.points.length];
                    if (!p1 || !p2) continue;
                    if (distanceToSegment(p, p1, p2) < clickRadius) return true;
                }
                return false;
            } else {
                if (!obs.p1 || !obs.p2) return false;
                return distanceToSegment(p, obs.p1, obs.p2) < clickRadius;
            }
        });
    };

    const findAudioZoneAt = (worldX: number, worldY: number): AudioZone | null => {
        if (!scene || !scene.audioZones) return null;
        const p = { x: worldX, y: worldY };
        for (let i = scene.audioZones.length - 1; i >= 0; i--) {
            const zone = scene.audioZones[i];
            if (zone.type === 'rect' && zone.rect) {
                const { x, y, w, h } = zone.rect;
                const x1 = Math.min(x, x + w); const x2 = Math.max(x, x + w);
                const y1 = Math.min(y, y + h); const y2 = Math.max(y, y + h);
                if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) return zone;
            } else if (zone.type === 'polygon' && zone.points) {
                if (isPointInPolygon(p, zone.points)) return zone;
            }
        }
        return null;
    };

    const findTriggerZoneAt = (worldX: number, worldY: number): TriggerZone | null => {
        if (!scene || !scene.triggerZones) return null;
        const p = { x: worldX, y: worldY };
        for (let i = scene.triggerZones.length - 1; i >= 0; i--) {
            const zone = scene.triggerZones[i];
            if (zone.type === 'rect' && zone.rect) {
                const { x, y, w, h } = zone.rect;
                const x1 = Math.min(x, x + w); const x2 = Math.max(x, x + w);
                const y1 = Math.min(y, y + h); const y2 = Math.max(y, y + h);
                if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) return zone;
            } else if (zone.type === 'polygon' && zone.points) {
                if (isPointInPolygon(p, zone.points)) return zone;
            }
        }
        return null;
    };

    const findDrawingAt = (worldX: number, worldY: number): MapDrawing | null => {
        if (!scene || !scene.drawings) return null;
        const clickRadius = 10 / viewport.zoom;
        const p = { x: worldX, y: worldY };

        for (let i = scene.drawings.length - 1; i >= 0; i--) {
            const drawing = scene.drawings[i];
            if (drawing.points.length < 2) continue;

            for (let j = 0; j < drawing.points.length - 1; j++) {
                const p1 = drawing.points[j];
                const p2 = drawing.points[j + 1];
                if (distanceToSegment(p, p1, p2) < Math.max(clickRadius, drawing.width / 2)) {
                    return drawing;
                }
            }
        }
        return null;
    };

    const openAudioZoneConfigModal = (onSaveConfig: (config: { audioUrl: string; volume: number; radius: number; }) => void) => {
        openModal(<AudioZoneConfigModalContent audioSettings={audioSettings} onSave={onSaveConfig} onClose={closeModal} />, { title: 'Configurar Zona de Áudio', size: 'md' });
    };

    const openTriggerZoneConfigModal = (onSaveConfig: (handoutId: string) => void) => {
        openModal(<TriggerZoneConfigModalContent handouts={handouts} onSave={onSaveConfig} onClose={closeModal} />, { title: 'Configurar Gatilho', size: 'sm' });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const pos = getMousePos(e);
        const worldPos = screenToWorld(pos.x, pos.y);
        setMouseWorldPos(worldPos);

        const now = Date.now();
        if (now - lastCursorEmit.current > 50) {
            emitCursorMove(worldPos.x, worldPos.y);
            lastCursorEmit.current = now;
        }

        if (isPanning) {
            const dx = pos.x - lastMousePos.current.x;
            const dy = pos.y - lastMousePos.current.y;
            setViewport({ x: viewport.x + dx, y: viewport.y + dy });
            lastMousePos.current = pos;
            return;
        }

        // LIVE DRAWING LOGIC
        if (activeTool === 'brush' && isDrawingRef.current) {
            const currentPoints = liveDrawingPointsRef.current;
            // Add point only if moved enough to save memory
            if (currentPoints.length > 0) {
                const lastPoint = currentPoints[currentPoints.length - 1];
                const dist = Math.hypot(worldPos.x - lastPoint.x, worldPos.y - lastPoint.y);
                if (dist > 5 / viewport.zoom) {
                    liveDrawingPointsRef.current.push(worldPos);
                }
            } else {
                liveDrawingPointsRef.current.push(worldPos);
            }
            lastMousePos.current = pos;
            return;
        }

        if (dragState.isDragging && dragState.token) {
            const gridSize = scene?.grid.size || 70;
            const newGridX = Math.round((worldPos.x - dragState.offset.x) / gridSize);
            const newGridY = Math.round((worldPos.y - dragState.offset.y) / gridSize);

            if (newGridX !== dragState.lastCheckedGridX || newGridY !== dragState.lastCheckedGridY) {
                dragState.lastCheckedGridX = newGridX;
                dragState.lastCheckedGridY = newGridY;

                const startPoint = { x: dragState.token.x, y: dragState.token.y };
                const endPoint = { x: newGridX, y: newGridY };

                const path = findPath(startPoint, endPoint, scene!.grid, scene!.obstacles);
                setCalculatedPath(path);

                if (emitTokenDrag) {
                    emitTokenDrag(dragState.token.id, newGridX, newGridY, path);
                }
            }
            lastMousePos.current = pos;
            return;
        }

        if (fogRectStart || (drawingLightZone?.type === 'rect' && drawingLightZone.p1) || (drawingAudioZone?.type === 'rect' && drawingAudioZone.p1) || (drawingTriggerZone?.type === 'rect' && drawingTriggerZone.p1)) {
            const start = fogRectStart || drawingLightZone?.p1 || drawingAudioZone?.p1 || drawingTriggerZone?.p1;
            if (start) {
                setCurrentFogRect({
                    x: start.x,
                    y: start.y,
                    w: worldPos.x - start.x,
                    h: worldPos.y - start.y
                });
            }
            lastMousePos.current = pos;
            return;
        }

        if (!isDrawingTool && !dragState.isDragging) {
            const token = findTokenAt(worldPos.x, worldPos.y);

            if (token) {
                if (hoverCloseTimerRef.current) {
                    clearTimeout(hoverCloseTimerRef.current);
                    hoverCloseTimerRef.current = null;
                }

                if (hoveredTokenId !== token.id) {
                    // Instant open or minimal delay
                    setHoveredTokenId(token.id);
                }
            } else {
                if (hoveredTokenId && !hoverCloseTimerRef.current) {
                    hoverCloseTimerRef.current = setTimeout(() => {
                        setHoveredTokenId(null);
                        hoverCloseTimerRef.current = null;
                    }, 300); // Bridge time
                }
            }

            const obs = findObstacleAt(worldPos.x, worldPos.y);
            setHoveredObstacleId(obs ? obs.id : null);
        }

        lastMousePos.current = pos;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const pos = getMousePos(e);
        lastMousePos.current = pos;

        let worldPos = screenToWorld(pos.x, pos.y);

        if (activeTool === 'measure-path' && rulerSettings.snapToGrid && scene) {
            const gridSize = scene.grid.size;
            const gx = Math.floor(worldPos.x / gridSize);
            const gy = Math.floor(worldPos.y / gridSize);
            worldPos = { x: gx * gridSize + gridSize / 2, y: gy * gridSize + gridSize / 2 };
        }

        const clickedToken = findTokenAt(worldPos.x, worldPos.y);
        const clickedObstacle = findObstacleAt(worldPos.x, worldPos.y);
        const clickedAudioZone = findAudioZoneAt(worldPos.x, worldPos.y);
        const clickedTriggerZone = findTriggerZoneAt(worldPos.x, worldPos.y);
        const clickedDrawing = findDrawingAt(worldPos.x, worldPos.y);

        if (e.button === 1 || (e.button === 0 && (e.metaKey || e.ctrlKey))) { setIsPanning(true); return; }

        if (e.button === 2) {
            e.stopPropagation();
            if (dragState.isDragging) { dragState.isDragging = false; dragState.token = null; setCalculatedPath([]); return; }

            if (isGM) {
                if (clickedAudioZone) {
                    onMapContextMenu(e, worldPos.x, worldPos.y, undefined, undefined, clickedAudioZone.id);
                    return;
                }
                if (clickedTriggerZone) {
                    onMapContextMenu(e, worldPos.x, worldPos.y, undefined, clickedTriggerZone.id);
                    return;
                }
            }

            if (['draw-wall', 'fog-poly', 'draw-light-poly', 'draw-audio-poly', 'draw-trigger-poly'].includes(activeTool) && draftPolyPoints.length > 0) {
                const minPoints = activeTool === 'draw-wall' ? 2 : 3;
                if (draftPolyPoints.length >= minPoints) {
                    if (activeTool === 'draw-wall') {
                        addObstacles([{ type: 'wall', points: [...draftPolyPoints], blocksVision: true, blocksMovement: true, open: true }]);
                    } else if (activeTool === 'draw-light-poly') {
                        addLightZones([{ type: 'polygon', points: [...draftPolyPoints], brightness: 1.0, color: '#ffffff' }]);
                    } else if (activeTool === 'draw-audio-poly') {
                        openAudioZoneConfigModal(config => { addAudioZones([{ type: 'polygon', points: [...draftPolyPoints], ...config }]); });
                    } else if (activeTool === 'draw-trigger-poly') {
                        openTriggerZoneConfigModal(handoutId => { addTriggerZones([{ type: 'polygon', points: [...draftPolyPoints], handoutId }]); });
                    } else {
                        let pathString = `M${draftPolyPoints[0].x},${draftPolyPoints[0].y}`;
                        for (let i = 1; i < draftPolyPoints.length; i++) pathString += ` L${draftPolyPoints[i].x},${draftPolyPoints[i].y}`;
                        pathString += " Z";
                        updateFog(scene?.fogPath + ' ' + pathString);
                    }
                }
                setDraftPolyPoints([]);
                return;
            }

            if (activeTool === 'measure-path' && movementPath.length > 0) { setMovementPath([]); return; }
            if (drawingObstacle || drawingLightZone || drawingAudioZone || drawingTriggerZone) { setDrawingObstacle(null); setDrawingLightZone(null); setDrawingAudioZone(null); setDrawingTriggerZone(null); return; }
            if (activeTool !== 'select') { setActiveTool('select'); return; }
            if (activeTool === 'select') { if (clickedToken) { onTokenContextMenu(e, clickedToken.id); } else { onMapContextMenu(e, worldPos.x, worldPos.y, clickedObstacle?.id); } }
            return;
        }

        if (e.button === 0) {
            if (activeTool === 'brush') {
                isDrawingRef.current = true;
                liveDrawingPointsRef.current = [worldPos];
                return;
            }

            if (activeTool === 'eraser-drawing') {
                if (clickedDrawing) {
                    removeDrawing(clickedDrawing.id);
                }
                return;
            }

            if (activeTool === 'eraser-trigger' && isGM) {
                if (clickedTriggerZone) { removeTriggerZone(clickedTriggerZone.id); }
                return;
            }
            if (activeTool === 'eraser-audio' && isGM) {
                if (clickedAudioZone) { removeAudioZone(clickedAudioZone.id); }
                return;
            }
            if (activeTool === 'eraser' && isGM) {
                if (clickedObstacle) { removeObstacle(clickedObstacle.id); setHoveredObstacleId(null); }
                return;
            }

            if (clickedObstacle && activeTool === 'select' && ['door', 'window'].includes(clickedObstacle.type)) {
                const canInteract = isGM || permissions.doorControl;
                if (canInteract) {
                    const isOpen = !clickedObstacle.blocksMovement;
                    const newOpen = !isOpen;

                    updateObstacle(clickedObstacle.id, {
                        blocksMovement: !newOpen,
                        blocksVision: clickedObstacle.type === 'door' ? !newOpen : false
                    });
                    return;
                } else {
                    console.warn('[MapCanvas] Door control denied - no permission');
                }
            }

            if (activeTool === 'measure-path') {
                const p = worldPos;
                setMovementPath(movementPath.length === 0 ? [p] : [...movementPath, p]);
                return;
            }

            if (activeTool === 'fog-rect') { if (isGM) setFogRectStart(worldPos); return; }
            if (activeTool === 'draw-light-rect') { if (isGM) setDrawingLightZone({ type: 'rect', p1: worldPos }); return; }
            if (activeTool === 'draw-audio-rect') { if (isGM) setDrawingAudioZone({ type: 'rect', p1: worldPos }); return; }
            if (activeTool === 'draw-trigger-rect') { if (isGM) setDrawingTriggerZone({ type: 'rect', p1: worldPos }); return; }

            if (['fog-poly', 'draw-wall', 'draw-light-poly', 'draw-audio-poly', 'draw-trigger-poly'].includes(activeTool)) {
                if (draftPolyPoints.length > 0) {
                    const start = draftPolyPoints[0];
                    const dist = Math.hypot(worldPos.x - start.x, worldPos.y - start.y);
                    if (dist < 15 / viewport.zoom) {
                        const minPoints = activeTool === 'draw-wall' ? 2 : 3;
                        if (draftPolyPoints.length >= minPoints) {
                            if (activeTool === 'draw-wall') {
                                addObstacles([{ type: 'wall', points: [...draftPolyPoints], blocksVision: true, blocksMovement: true, open: false }]);
                            } else if (activeTool === 'draw-light-poly') {
                                addLightZones([{ type: 'polygon', points: [...draftPolyPoints], brightness: 1.0, color: '#ffffff' }]);
                            } else if (activeTool === 'draw-audio-poly') {
                                openAudioZoneConfigModal(config => { addAudioZones([{ type: 'polygon', points: [...draftPolyPoints], ...config }]); });
                            } else if (activeTool === 'draw-trigger-poly') {
                                openTriggerZoneConfigModal(handoutId => { addTriggerZones([{ type: 'polygon', points: [...draftPolyPoints], handoutId }]); });
                            } else if (activeTool === 'fog-poly') {
                                let pathString = `M${draftPolyPoints[0].x},${draftPolyPoints[0].y}`;
                                for (let i = 1; i < draftPolyPoints.length; i++) pathString += ` L${draftPolyPoints[i].x},${draftPolyPoints[i].y}`;
                                pathString += " Z";
                                updateFog(scene?.fogPath + ' ' + pathString);
                            }
                        }
                        setDraftPolyPoints([]);
                        return;
                    }
                }
                setDraftPolyPoints([...draftPolyPoints, worldPos]);
                return;
            }

            if (['draw-door', 'draw-window'].includes(activeTool)) { setDrawingObstacle({ type: activeTool === 'draw-door' ? 'door' : 'window', p1: worldPos }); return; }

            if (clickedToken) {
                const alreadySelected = selectedTokenIds?.includes(clickedToken.id);
                if (e.shiftKey) {
                    if (selectToken) selectToken(clickedToken.id, true);
                } else if (!alreadySelected && selectToken && clearSelection) {
                    clearSelection();
                    selectToken(clickedToken.id, false);
                }

                const isController = clickedToken.ownerId === currentUser?.id || clickedToken.controlledBy?.includes(currentUser?.id || '');

                if (isGM || isController) {
                    if (!isGM && !permissions.tokenMovement) return;
                    dragState.isDragging = true;
                    dragState.token = clickedToken;
                    dragState.dragStartX = pos.x;
                    dragState.dragStartY = pos.y;
                    const gridSize = scene?.grid.size || 70;
                    dragState.offset = { x: worldPos.x - clickedToken.x * gridSize, y: worldPos.y - clickedToken.y * gridSize };
                    dragState.lastValidGridX = clickedToken.x;
                    dragState.lastValidGridY = clickedToken.y;
                    dragState.lastCheckedGridX = clickedToken.x;
                    dragState.lastCheckedGridY = clickedToken.y;
                    setCalculatedPath([{ x: clickedToken.x, y: clickedToken.y }]);
                    let tokensToDrag = [clickedToken];
                    if (selectedTokenIds && selectedTokenIds.includes(clickedToken.id) && selectedTokenIds.length > 1) {
                        tokensToDrag = tokens.filter(t => selectedTokenIds.includes(t.id));
                    }
                    dragState.draggedGroup = tokensToDrag.map(t => ({ id: t.id, offsetX: worldPos.x - t.x * gridSize, offsetY: worldPos.y - t.y * gridSize, startGridX: t.x, startGridY: t.y }));
                }
                return;
            }

            if (!isDrawingTool) { setIsPanning(true); }
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        if (dragState.isDragging && dragState.token) {
            const token = dragState.token;
            const path = calculatedPath;

            const finalPos = path.length > 0 ? path[path.length - 1] : { x: token.x, y: token.y };

            moveToken(token.id, finalPos.x, finalPos.y);

            if (dragState.draggedGroup.length > 0) {
                const dx = finalPos.x - token.x;
                const dy = finalPos.y - token.y;
                const groupMoves = dragState.draggedGroup
                    .filter(g => g.id !== token.id)
                    .map(g => ({ id: g.id, x: g.startGridX + dx, y: g.startGridY + dy }));

                if (groupMoves.length > 0 && moveTokens) {
                    moveTokens(groupMoves);
                }
            }

            dragState.isDragging = false;
            dragState.token = null;
            setCalculatedPath([]);
            return;
        }

        if (activeTool === 'fog-rect' && fogRectStart && currentFogRect) {
            const x = currentFogRect.w < 0 ? currentFogRect.x + currentFogRect.w : currentFogRect.x;
            const y = currentFogRect.h < 0 ? currentFogRect.y + currentFogRect.h : currentFogRect.y;
            const w = Math.abs(currentFogRect.w);
            const h = Math.abs(currentFogRect.h);

            const rectPath = `M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`;
            updateFog(scene?.fogPath + ' ' + rectPath);

            setFogRectStart(null);
            setCurrentFogRect(null);
            setActiveTool('select');
            return;
        }

        if ((activeTool === 'draw-light-rect' || activeTool === 'draw-audio-rect' || activeTool === 'draw-trigger-rect') && currentFogRect) {
            const x = currentFogRect.w < 0 ? currentFogRect.x + currentFogRect.w : currentFogRect.x;
            const y = currentFogRect.h < 0 ? currentFogRect.y + currentFogRect.h : currentFogRect.y;
            const w = Math.abs(currentFogRect.w);
            const h = Math.abs(currentFogRect.h);

            if (activeTool === 'draw-light-rect') {
                addLightZones([{ type: 'rect', rect: { x, y, w, h }, brightness: 1.0, color: '#ffffff' }]);
                setDrawingLightZone(null);
            } else if (activeTool === 'draw-audio-rect') {
                openAudioZoneConfigModal(config => {
                    addAudioZones([{ type: 'rect', rect: { x, y, w, h }, ...config }]);
                });
                setDrawingAudioZone(null);
            } else if (activeTool === 'draw-trigger-rect') {
                openTriggerZoneConfigModal(handoutId => {
                    addTriggerZones([{ type: 'rect', rect: { x, y, w, h }, handoutId }]);
                });
                setDrawingTriggerZone(null);
            }

            setCurrentFogRect(null);
            setActiveTool('select');
            return;
        }

        if (activeTool === 'brush') {
            isDrawingRef.current = false;
            if (liveDrawingPointsRef.current.length > 1) {
                addDrawing({
                    id: Math.random().toString(),
                    userId: currentUser?.id || '',
                    points: liveDrawingPointsRef.current,
                    ...drawingSettings
                });
            }
            liveDrawingPointsRef.current = [];
        }

        if (drawingObstacle) {
            const p1 = drawingObstacle.p1;
            const p2 = screenToWorld(e.clientX - canvasRef.current!.getBoundingClientRect().left, e.clientY - canvasRef.current!.getBoundingClientRect().top);

            // Minimum length check to avoid accidental clicks
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (dist > 10 / viewport.zoom) {
                addObstacles([{
                    type: drawingObstacle.type as 'door' | 'window',
                    p1,
                    p2,
                    blocksVision: drawingObstacle.type === 'door', // Doors block vision by default
                    blocksMovement: true,
                    hidden: false
                }]);
            }
            setDrawingObstacle(null);
            setActiveTool('select');
            return;
        }
    };

    const handleDoubleLeftClick = (e: React.MouseEvent) => {
        if (['fog-poly', 'draw-wall', 'draw-light-poly', 'draw-audio-poly', 'draw-trigger-poly'].includes(activeTool) && draftPolyPoints.length >= 2) {
            const minPoints = activeTool === 'draw-wall' ? 2 : 3;
            if (draftPolyPoints.length >= minPoints) {
                if (activeTool === 'draw-wall') {
                    let points = [...draftPolyPoints];
                    const last = points[points.length - 1]; const secondLast = points[points.length - 2];
                    if (Math.abs(last.x - secondLast.x) < 1 && Math.abs(last.y - secondLast.y) < 1) { points.pop(); }
                    addObstacles([{ type: 'wall', points, blocksVision: true, blocksMovement: true, open: true }]);
                } else if (activeTool === 'draw-light-poly') {
                    addLightZones([{ type: 'polygon', points: [...draftPolyPoints], brightness: 1.0, color: '#ffffff' }]);
                } else if (activeTool === 'draw-audio-poly') {
                    openAudioZoneConfigModal(config => { addAudioZones([{ type: 'polygon', points: [...draftPolyPoints], ...config }]); });
                } else if (activeTool === 'draw-trigger-poly') {
                    openTriggerZoneConfigModal(handoutId => { addTriggerZones([{ type: 'polygon', points: [...draftPolyPoints], handoutId }]); });
                } else {
                    let pathString = `M${draftPolyPoints[0].x},${draftPolyPoints[0].y}`;
                    for (let i = 1; i < draftPolyPoints.length; i++) pathString += ` L${draftPolyPoints[i].x},${draftPolyPoints[i].y}`;
                    pathString += " Z";
                    updateFog(scene?.fogPath + ' ' + pathString);
                }
            }
            setDraftPolyPoints([]); setActiveTool('select');
        } else if (activeTool === 'measure-path') { setMovementPath([]); setActiveTool('select'); }
    };

    const handleWheel = (e: React.WheelEvent) => {
        setHoveredTokenId(null);
        if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);

        const scale = e.deltaY > 0 ? 0.9 : 1.1; const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * scale));
        const pos = getMousePos(e); const worldPos = screenToWorld(pos.x, pos.y);
        const newX = pos.x - worldPos.x * newZoom; const newY = pos.y - worldPos.y * newZoom;
        setViewport({ zoom: newZoom, x: newX, y: newY });
    };

    const handleMouseLeave = () => {
        if (!hoverCloseTimerRef.current) {
            hoverCloseTimerRef.current = setTimeout(() => {
                setHoveredTokenId(null);
                hoverCloseTimerRef.current = null;
            }, 300);
        }
        if (hoverOpenTimerRef.current) clearTimeout(hoverOpenTimerRef.current);
        isDrawingRef.current = false;
    };

    // --- RENDER HOVER CARD ANCHORED TO TOKEN ---
    const renderHoverCard = () => {
        if (!hoveredTokenId || !scene) return null;
        // Find the LIVE token object to ensure we have the latest HP/Conditions from WebSocket
        const liveToken = tokens.find(t => t.id === hoveredTokenId);
        if (!liveToken) return null;

        // Calculate precise anchor point: Top Center of the Token in Screen Coordinates
        const gridSize = scene.grid.size;
        // World coordinates
        const tokenWorldX = (liveToken.x * gridSize) + (liveToken.size * gridSize / 2);
        const tokenWorldY = (liveToken.y * gridSize); // Top edge

        // Screen coordinates
        const screenX = (tokenWorldX * viewport.zoom) + viewport.x;
        const screenY = (tokenWorldY * viewport.zoom) + viewport.y;

        return (
            <TokenHoverCard
                token={liveToken}
                character={campaignCharacters ? campaignCharacters.find(c => c.id === liveToken.linkedId) : null}
                position={{ x: screenX, y: screenY }}
                isGM={isGM && gmViewMode === 'gm'}
                currentUserId={currentUser?.id}
                onUpdate={updateToken}
                onCharacterUpdate={onCharacterUpdate}
                onOpenSheet={onOpenSheet}
                onRoll={onRollDice}
                onMouseEnter={handleCardMouseEnter}
                onMouseLeave={handleCardMouseLeave}
            />
        );
    };

    // Add wheel event listener with passive: false to allow preventDefault
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const wheelHandler = (e: WheelEvent) => {
            e.preventDefault();
            const reactEvent = e as any;
            handleWheel(reactEvent);
        };

        canvas.addEventListener('wheel', wheelHandler, { passive: false });
        return () => canvas.removeEventListener('wheel', wheelHandler);
    }, [viewport, handleWheel]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            <canvas
                ref={canvasRef}
                width={window.innerWidth}
                height={window.innerHeight}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onDoubleClick={handleDoubleLeftClick}
                onContextMenu={(e) => e.preventDefault()}
                className={`block touch-none w-full h-full ${isPanning ? 'cursor-grabbing' : isDrawingTool ? 'cursor-crosshair' : 'cursor-default'}`}
            />

            {/* Render Hover Card outside Canvas but inside Container */}
            {!isPanning && !dragState.isDragging && renderHoverCard()}
        </div>
    );
};

// Helper for rendering Trigger Zones
const drawTriggerZones = (ctx: CanvasRenderingContext2D, zones: TriggerZone[], zoom: number) => {
    ctx.save();
    ctx.font = `bold ${16 / zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    zones.forEach(zone => {
        ctx.beginPath();
        if (zone.type === 'rect' && zone.rect) {
            ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
        } else if (zone.type === 'polygon' && zone.points) {
            if (zone.points.length > 0) {
                ctx.moveTo(zone.points[0].x, zone.points[0].y);
                for (let i = 1; i < zone.points.length; i++) {
                    ctx.lineTo(zone.points[i].x, zone.points[i].y);
                }
                ctx.closePath();
            }
        }

        ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)'; // Purple
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([8 / zoom, 4 / zoom]);
        ctx.stroke();

        ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
        ctx.fill();

        // Find center
        let cx = 0, cy = 0;
        if (zone.rect) {
            cx = zone.rect.x + zone.rect.w / 2;
            cy = zone.rect.y + zone.rect.h / 2;
        } else if (zone.points) {
            zone.points.forEach((p: Point) => { cx += p.x; cy += p.y; });
            cx /= zone.points.length;
            cy /= zone.points.length;
        }

        ctx.fillStyle = 'rgba(168, 85, 247, 1)';
        ctx.fillText('⚡', cx, cy); // Zap icon for trigger
    });

    ctx.restore();
};
