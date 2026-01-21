import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { socketService } from '../../../services/socketService';
import { CursorClickPayload } from '../../../types/socket';
import { MapCanvasProps } from './types';
import { useMapState } from './hooks/useMapState';
import { useTokenLayer } from './hooks/useTokenLayer';
import { useVisionLayer } from './hooks/useVisionLayer';
import { useImageLoader } from './hooks/useImageLoader';
import { useLayeredInteraction } from './hooks/useLayeredInteraction';
import { useLayerEngine } from './hooks/useLayerEngine';
import { TokenHoverCard } from './TokenHoverCard';
import { LocalCursor } from '../LocalCursor';
import { PrecisionCursor } from '../PrecisionCursor';
import { useGameSession } from '../../../context/GameSessionContext';
import { useModal } from '../../../context/ModalContext';
import { AudioZoneConfigModalContent, TriggerZoneConfigModalContent } from './modals';

/**
 * MapCanvas - Main VTT rendering component.
 * 
 * Uses the new modular layer engine for rendering.
 */
export const MapCanvas = (props: MapCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Track if mouse is over VTT area (to show/hide custom cursor)
  const [isMouseOverVTT, setIsMouseOverVTT] = useState(false);

  // PERFORMANCE: Ref for immediate viewport updates during pan/zoom
  const viewportRef = useRef({ x: props.viewport.x, y: props.viewport.y, zoom: props.viewport.zoom });

  // Get UI settings from GameSession
  const { ui, drawingSettings, rulerSettings, addDrawing, audioSettings, handouts } = useGameSession();
  const { openModal, closeModal } = useModal();

  // Modal callbacks for zone configuration
  const openAudioZoneConfigModal = useCallback((onSave: (config: { audioUrl: string; volume: number; radius: number; }) => void) => {
    openModal(
      <AudioZoneConfigModalContent
        audioSettings={audioSettings}
        onSave={(config) => { onSave(config); closeModal(); }}
        onClose={closeModal}
      />,
      { title: 'Configurar Zona de Áudio', size: 'md' }
    );
  }, [audioSettings, openModal, closeModal]);

  const openTriggerZoneConfigModal = useCallback((onSave: (handoutId: string) => void) => {
    openModal(
      <TriggerZoneConfigModalContent
        handouts={handouts}
        onSave={(handoutId) => { onSave(handoutId); closeModal(); }}
        onClose={closeModal}
      />,
      { title: 'Configurar Gatilho', size: 'sm' }
    );
  }, [handouts, openModal, closeModal]);

  // 1. State Management
  const mapState = useMapState();

  // 2. Token Layer (Animations)
  const tokenLayer = useTokenLayer(props.tokens, mapState.dragState);

  // Debug: Monitor tokens prop
  useEffect(() => {
    const newToken = props.tokens[props.tokens.length - 1];
    if (newToken) {
      console.log('[MapCanvas] Tokens Updated:', {
        count: props.tokens.length,
        lastTokenId: newToken.id,
        owner: newToken.ownerId,
        pos: { x: newToken.x, y: newToken.y }
      });
    }
  }, [props.tokens]);

  // Debug Props
  useEffect(() => {
    // console.log('[MapCanvas] Props update:', { isGM: props.isGM, tokens: props.tokens.length });
  }, [props.isGM, props.tokens.length]);

  // 3. Vision Layer (Filtering)
  const visionTokens = useVisionLayer(props.tokens, props.isGM, props.gmViewMode, props.previewPlayerId, props.currentUser);

  // 4. Image Loader
  const imageCache = useImageLoader(props.scene, props.tokens);

  // Shared Ref for Click Animations (Visual Feedback)
  // Use imported types from interaction engine
  const clickAnimationsRef = useRef<import('./interaction/utils/clickAnimations').ClickAnimation[]>([]);

  // Listen for Remote Clicks
  useEffect(() => {
    const handleRemoteClick = (payload: CursorClickPayload) => {
      if (payload.userId === props.currentUser?.id) return;
      if (props.activeTool.startsWith('map-align')) return;
      clickAnimationsRef.current.push({
        x: payload.x,
        y: payload.y,
        color: payload.color,
        style: payload.style,
        startTime: Date.now()
      });
    };

    socketService.on('cursor:click', handleRemoteClick);
    return () => {
      socketService.off('cursor:click', handleRemoteClick);
    };
  }, [props.currentUser?.id, props.activeTool]);

  // Handle Window Resize (Fix for map clipping/stretching)
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        // Force re-render of layer engine if methods exposed? 
        // Actually, orchestrator loop uses canvas.width directly, so it picks up the change next frame!
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 5. Map Interaction (Event Handlers)
  // Replaced monolithic useMapInteraction with modular useLayeredInteraction

  // High-performance Refs for dragging
  // We use existing mapState.dragState (Ref)
  // We need a ref for calculatedPath to avoid re-renders during drag
  const calculatedPathRef = useRef<import('../../../types').Point[]>([]);

  const interaction = useLayeredInteraction({
    ...props,
    canvasRef,
    ...mapState, // Keeping mapState for non-interaction state if needed (like hoveredTokenId)
    ...tokenLayer,
    clickAnimationsRef,
    viewportRef,
    mouseWorldPosRef: mapState.mouseWorldPosRef,
    lastMousePos: mapState.lastMousePos,
    dragStateRef: mapState.dragState, // Pass the REF
    calculatedPathRef: calculatedPathRef, // Pass the REF
    addDrawing,
    liveDrawingPointsRef: mapState.liveDrawingPointsRef,
    // Modal callbacks for zone configuration
    openAudioZoneConfigModal,
    openTriggerZoneConfigModal,
  });

  const isInteracting = mapState.isPanning || interaction?.getPanZoomHandler?.()?.getIsPanning?.();

  // 6. NEW: Layer Engine (replaces useMapRenderer)
  const { orchestrator, getFps, toggleLayer, getLayerStates } = useLayerEngine(
    canvasRef,
    {
      ...props,
      viewportRef, // Pass ref for immediate high-performance access
      visionTokens,
      imageCache,
      hoveredTokenId: mapState.hoveredTokenId,
      hoveredObstacleId: mapState.hoveredObstacleId,
      mouseWorldPos: mapState.mouseWorldPos,
      mouseWorldPosRef: mapState.mouseWorldPosRef,
      dragState: mapState.dragState,
      animationsRef: tokenLayer.animationsRef,
      calculatedPath: mapState.calculatedPath, // keeping generic prop if used elsewhere but Ref is key
      calculatedPathRef: calculatedPathRef,
      liveDrawingPointsRef: mapState.liveDrawingPointsRef,
      isDrawingRef: mapState.isDrawingRef,
      currentFogRect: mapState.currentFogRect,
      draggedAttackZone: mapState.draggedAttackZone,
    },
    { debug: false }
  );

  // Sync additional context data to orchestrator
  useEffect(() => {
    if (!orchestrator) return;

    orchestrator.updateContext({
      clickAnimations: clickAnimationsRef.current,
      ui: {
        showGridCoordinates: ui.showGridCoordinates,
        showVisionRanges: ui.showVisionRanges ?? false,
        gmHideObstacles: ui.gmHideObstacles ?? false,
      },
      drawingState: {
        livePoints: mapState.liveDrawingPointsRef?.current || [],
        liveDrawingPointsRef: mapState.liveDrawingPointsRef,
        isDrawing: mapState.isDrawingRef?.current || false,
        settings: drawingSettings || { color: '#ffffff', width: 3, opacity: 1 },
      },
      rulerSettings: rulerSettings || { snapToGrid: true, metric: 'chebyshev' },
      dragState: {
        isDragging: mapState.dragState?.current?.isDragging || false,
        token: mapState.dragState?.current?.token || null,
        draggedGroup: mapState.dragState?.current?.draggedGroup || [],
        offset: mapState.dragState?.current?.offset || { x: 0, y: 0 },
      },
      localCursorPos: mapState.mouseWorldPosRef?.current || { x: 0, y: 0 },
      cursorSettings: cursorConfig,
    });
  });

  // Get cursor config from user's settings or GM overrides
  const cursorConfig = useMemo(() => {
    const userId = props.currentUser?.id || '';
    const overrides = (props.permissions?.cursorOverrides?.[userId] || {}) as {
      shape?: string;
      color?: string;
      trailEnabled?: boolean;
      trailAnimation?: string;
      trailColor?: string;
      trailLength?: number;
      trailThickness?: number;
      trailCustomImage?: string;
      trailSize?: number;
      showMyTrail?: boolean;
    };
    const settings = props.cursorSettings;

    return {
      shapeId: overrides.shape || settings?.shape || 'default',
      color: overrides.color || settings?.color || '#fbbf24',
      trailEnabled: overrides.trailEnabled ?? settings?.trailEnabled ?? false,
      trailAnimation: overrides.trailAnimation || settings?.trailAnimation || 'line',
      trailColor: overrides.trailColor || settings?.trailColor || settings?.color || '#fbbf24',
      trailLength: overrides.trailLength ?? settings?.trailLength ?? 20,
      trailThickness: overrides.trailThickness ?? settings?.trailThickness ?? 1,
      trailCustomImage: overrides.trailCustomImage || settings?.trailCustomImage,
      trailSize: overrides.trailSize ?? settings?.trailSize ?? 4,
      showMyTrail: overrides.showMyTrail ?? settings?.showMyTrail ?? true,
    };
  }, [
    props.currentUser?.id,
    props.permissions?.cursorOverrides,
    props.cursorSettings?.shape,
    props.cursorSettings?.color,
    props.cursorSettings?.trailEnabled,
    props.cursorSettings?.trailAnimation,
    props.cursorSettings?.trailColor,
    props.cursorSettings?.trailLength,
    props.cursorSettings?.trailThickness,
    props.cursorSettings?.trailCustomImage,
    props.cursorSettings?.trailSize,
    props.cursorSettings?.showMyTrail,
  ]);

  const { hoveredTokenId, dragState } = mapState;

  // Render TokenHoverCard
  const renderHoverCard = () => {
    if (props.activeTool.startsWith('map-align')) return null;
    if (dragState.current.isDragging) return null;
    if (!hoveredTokenId || !props.scene) return null;

    const liveToken = props.tokens.find(t => t.id === hoveredTokenId);
    if (!liveToken) return null;

    const linkedCharacter = props.campaignCharacters?.find(c => c.id === liveToken.linkedId);

    const gridSize = props.scene.grid.size;
    const tokenWorldX = (liveToken.x * gridSize) + (liveToken.size * gridSize / 2);
    const tokenWorldY = (liveToken.y * gridSize);

    const screenX = (tokenWorldX * props.viewport.zoom) + props.viewport.x;
    const screenY = (tokenWorldY * props.viewport.zoom) + props.viewport.y;

    const reactiveKey = [
      hoveredTokenId,
      linkedCharacter?.hpCurrent,
      linkedCharacter?.hpMax,
      liveToken.bars?.bar1?.value,
      liveToken.name,
      liveToken.conditions?.join(','),
    ].join('-');

    return (
      <TokenHoverCard
        key={reactiveKey}
        token={liveToken}
        character={linkedCharacter}
        position={{ x: screenX, y: screenY }}
        tokenWorldPos={{ x: tokenWorldX, y: tokenWorldY }}
        viewportRef={viewportRef}
        isGM={props.isGM && props.gmViewMode === 'gm'}
        currentUserId={props.currentUser?.id}
        permissions={props.campaign?.permissions?.tokenHover}
        onUpdate={props.updateToken}
        onCharacterUpdate={props.onCharacterUpdate}
        onOpenSheet={props.onOpenSheet}
        onRoll={props.onRollDice}
        onMouseEnter={() => {
          if (mapState.hoverCloseTimerRef.current) {
            clearTimeout(mapState.hoverCloseTimerRef.current);
            mapState.hoverCloseTimerRef.current = null;
          }
        }}
        onMouseLeave={() => {
          if (mapState.hoverCloseTimerRef.current) {
            mapState.hoverCloseTimerRef.current = setTimeout(() => {
              mapState.setHoveredTokenId(null);
              mapState.hoverCloseTimerRef.current = null;
            }, 300);
          }
        }}
      />
    );
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black select-none"
      style={{
        cursor: props.activeTool.startsWith('map-align')
          ? 'none'
          : ((isMouseOverVTT && !mapState.hoveredTokenId) || mapState.isTokenDragging ? 'none' : 'auto')
      }}
      onContextMenu={e => e.preventDefault()}
      onMouseEnter={() => setIsMouseOverVTT(true)}
      onMouseLeave={() => setIsMouseOverVTT(false)}
    >
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="absolute inset-0 block touch-none"
        onMouseDown={interaction.handleMouseDown}
        onMouseMove={interaction.handleMouseMove}
        onMouseUp={interaction.handleMouseUp}
        onMouseLeave={interaction.handleMouseLeave}
        onDoubleClick={interaction.handleDoubleClick}
        onWheel={interaction.handleWheel}
      />

      {/* Render Hover Card outside Canvas */}
      {renderHoverCard()}

      {/* DOM-based Local Cursor */}
      <LocalCursor
        shapeId={cursorConfig.shapeId}
        color={cursorConfig.color}
        enabled={isMouseOverVTT && !mapState.hoveredTokenId && !mapState.isTokenDragging && !props.activeTool.startsWith('map-align')}
        trailEnabled={cursorConfig.trailEnabled && cursorConfig.showMyTrail && !props.activeTool.startsWith('map-align')}
        trailAnimation={cursorConfig.trailAnimation}
        trailColor={cursorConfig.trailColor}
        trailLength={cursorConfig.trailLength}
        trailThickness={cursorConfig.trailThickness}
        trailCustomImage={cursorConfig.trailCustomImage}
        trailSize={cursorConfig.trailSize}
        activeTool={props.activeTool}
        isContexting={props.isContexting}
        isChatting={props.isChatting}
        isDragging={mapState.dragState.current.isDragging}
        healthStatus={(() => {
          if (!props.currentUser?.id || !props.campaignCharacters) return 'healthy';
          const char = props.campaignCharacters.find(c => c.ownerId === props.currentUser?.id);
          if (!char) return 'healthy';
          if (char.hpCurrent <= 0) return 'unconscious';
          if (char.hpCurrent <= (char.hpMax / 2)) return 'bloodied';
          return 'healthy';
        })()}
      />

      {/* Precision Cursor for Grid Alignment */}
      <PrecisionCursor
        enabled={props.activeTool.startsWith('map-align')}
        mode={props.activeTool === 'map-align' ? 'inspect' : (props.activeTool.replace('map-align-', '') as any)}
        gridSize={props.scene?.grid.size || 70}
        offsetX={props.scene?.grid.offsetX || 0}
        offsetY={props.scene?.grid.offsetY || 0}
        cols={props.scene?.grid.cols || 30}
        rows={props.scene?.grid.rows || 20}
        viewport={props.viewport}
        activeCalibrationRef={interaction.alignPointsRef}
        onConfirmCalibration={interaction.confirm3PointCalibration}
        onCancelCalibration={interaction.cancel3PointCalibration}
        canvasRef={canvasRef}
      />
    </div>
  );
};
