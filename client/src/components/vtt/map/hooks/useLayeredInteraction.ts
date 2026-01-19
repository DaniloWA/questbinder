/**
 * VTT Interaction Engine - React Integration Hook
 *
 * Provides a React hook interface to the modular interaction system.
 * Drop-in replacement for useMapInteraction.
 */

import { useRef, useEffect, useCallback } from 'react';
import { InteractionOrchestrator } from '../interaction/core/InteractionOrchestrator';
import { PanZoomHandler } from '../interaction/handlers/PanZoomHandler';
import { TokenDragHandler } from '../interaction/handlers/TokenDragHandler';
import { GridAlignHandler } from '../interaction/handlers/GridAlignHandler';
import { ClickAnimationHandler } from '../interaction/handlers/ClickAnimationHandler';
import { CursorSyncHandler } from '../interaction/handlers/CursorSyncHandler';
import { DrawWallHandler } from '../interaction/handlers/DrawWallHandler';
import { MeasureRulerHandler } from '../interaction/handlers/MeasureRulerHandler';
import { FogOfWarHandler } from '../interaction/handlers/FogOfWarHandler';
import { ZoneDrawHandler } from '../interaction/handlers/ZoneDrawHandler';
import { BrushCanvasHandler } from '../interaction/handlers/BrushCanvasHandler';
import { SmartWallHandler } from '../interaction/handlers/SmartWallHandler';
import { AttackZoneHandler } from '../interaction/handlers/AttackZoneHandler';
import { EraserHandler } from '../interaction/handlers/EraserHandler';
import { DoorToggleHandler } from '../interaction/handlers/DoorToggleHandler';
import type { InteractionCallbacks } from '../interaction/core/types';
import type { ClickAnimation } from '../interaction/utils/clickAnimations';
import type { MapCanvasProps } from '../types';
import type { MapDrawing, Point } from '../../../../types';

export interface UseLayeredInteractionProps extends MapCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  viewportRef: React.RefObject<{ x: number; y: number; zoom: number; }>;
  mouseWorldPosRef: React.RefObject<Point>;
  lastMousePos: React.RefObject<Point>;
  clickAnimationsRef: React.RefObject<ClickAnimation[]>;
  setHoveredTokenId?: (id: string | null) => void;
  setHoveredObstacleId?: (id: string | null) => void;
  setDragging?: (isDragging: boolean) => void;
  dragStateRef?: React.MutableRefObject<any>; // Using any to avoid circular import or redefining DragState
  calculatedPathRef?: React.MutableRefObject<Point[]>;
  addDrawing: (drawing: MapDrawing) => void;
  liveDrawingPointsRef: React.MutableRefObject<Point[]>;
  // Modal callbacks for zone configuration
  openAudioZoneConfigModal?: (onSave: (config: { audioUrl: string; volume: number; radius: number; }) => void) => void;
  openTriggerZoneConfigModal?: (onSave: (handoutId: string) => void) => void;
}

export interface UseLayeredInteractionReturn {
  // Event handlers for canvas
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  handleMouseLeave: (e: React.MouseEvent) => void;
  handleWheel: (e: React.WheelEvent) => void;
  handleDoubleClick: (e: React.MouseEvent) => void;

  // Handler accessors
  getGridAlignHandler: () => GridAlignHandler | undefined;
  getTokenDragHandler: () => TokenDragHandler | undefined;
  getPanZoomHandler: () => PanZoomHandler | undefined;
  getFogOfWarHandler: () => FogOfWarHandler | undefined;
  getDrawWallHandler: () => DrawWallHandler | undefined;

  // Compatibility with old hook
  alignPointsRef: React.RefObject<Point[]>;
  confirm3PointCalibration: () => void;
  cancel3PointCalibration: () => void;
}

/**
 * useLayeredInteraction - React hook for modular interaction system.
 *
 * This hook replaces the monolithic useMapInteraction with a modular
 * handler-based system inspired by the Layer Engine.
 */
export const useLayeredInteraction = (
  props: UseLayeredInteractionProps
): UseLayeredInteractionReturn => {
  const orchestratorRef = useRef<InteractionOrchestrator | null>(null);
  const alignPointsRef = useRef<Point[]>([]);

  // Initialize orchestrator and handlers
  useEffect(() => {
    if (!props.canvasRef.current) return;

    const orchestrator = new InteractionOrchestrator(props.canvasRef.current);

    // Create callbacks bridge
    const callbacks: InteractionCallbacks = {
      setViewport: props.setViewport,
      moveToken: props.moveToken,
      moveTokens: props.moveTokens,
      selectToken: props.selectToken,
      clearSelection: props.clearSelection,
      updateFog: props.updateFog,
      setActiveTool: props.setActiveTool,
      setMovementPath: props.setMovementPath,
      addObstacles: props.addObstacles,
      updateObstacle: props.updateObstacle,
      setDrawingObstacle: props.setDrawingObstacle,
      setDrawingLightZone: props.setDrawingLightZone,
      addLightZones: props.addLightZones,
      setDrawingAudioZone: props.setDrawingAudioZone,
      addAudioZones: props.addAudioZones,
      setDrawingTriggerZone: props.setDrawingTriggerZone,
      addTriggerZones: props.addTriggerZones,
      removeTriggerZone: props.removeTriggerZone,
      setDraftPolyPoints: props.setDraftPolyPoints,
      updateToken: props.updateToken,
      emitTokenDrag: props.emitTokenDrag,
      emitCursorMove: props.emitCursorMove,
      onTokenContextMenu: props.onTokenContextMenu,
      onMapContextMenu: props.onMapContextMenu,
      onAttackZoneContextMenu: props.onAttackZoneContextMenu,
      onUpdateAttackZone: props.onUpdateAttackZone,
      onUpdatePreviewOrigin: props.onUpdatePreviewOrigin,
      onConfirmAttackZonePlacement: props.onConfirmAttackZonePlacement,
      onCancelAttackZonePlacement: props.onCancelAttackZonePlacement,
      setCursorClickState: () => { },
      setDragging: props.setDragging || (() => { }),
      removeObstacle: () => { },
      removeAudioZone: () => { },
      setHoveredTokenId: props.setHoveredTokenId,
      setHoveredObstacleId: props.setHoveredObstacleId,
      removeDrawing: () => { },
      addDrawing: props.addDrawing,
      updateDrawingState: (points) => {
        if (props.liveDrawingPointsRef) {
          props.liveDrawingPointsRef.current = points;
        }
      },
      // Modal callbacks for zone configuration
      openAudioZoneConfigModal: props.openAudioZoneConfigModal,
      openTriggerZoneConfigModal: props.openTriggerZoneConfigModal,
    };

    orchestrator.setCallbacks(callbacks);

    // Register all handlers (in priority order - highest first)
    orchestrator.addHandler(new GridAlignHandler());      // 800
    orchestrator.addHandler(new AttackZoneHandler());     // 700
    orchestrator.addHandler(new DrawWallHandler());       // 600
    orchestrator.addHandler(new MeasureRulerHandler());   // 600
    orchestrator.addHandler(new FogOfWarHandler());       // 600
    orchestrator.addHandler(new ZoneDrawHandler());       // 600
    orchestrator.addHandler(new BrushCanvasHandler());    // 600
    orchestrator.addHandler(new SmartWallHandler());      // 600
    orchestrator.addHandler(new EraserHandler());         // 600
    orchestrator.addHandler(new DoorToggleHandler());     // 550
    orchestrator.addHandler(new TokenDragHandler());      // 500
    orchestrator.addHandler(new ClickAnimationHandler()); // 200
    orchestrator.addHandler(new PanZoomHandler());        // 100
    orchestrator.addHandler(new CursorSyncHandler());     // 50

    // Wire click animations ref
    const clickHandler = orchestrator.getHandler<ClickAnimationHandler>('click-animation');
    if (clickHandler && props.clickAnimationsRef) {
      clickHandler.setAnimationsRef(props.clickAnimationsRef);
    }

    // Wire TokenDrag handler refs
    // This connects the handler's internal High-Freq state to the external Render Refs
    // preventing the need for React Renders during drag!
    const tokenDragHandler = orchestrator.getHandler<TokenDragHandler>('token-drag');
    if (tokenDragHandler && props.dragStateRef && props.calculatedPathRef) {
      tokenDragHandler.setRefs(props.dragStateRef, props.calculatedPathRef);
    }

    orchestratorRef.current = orchestrator;

    return () => {
      orchestrator.destroy();
      orchestratorRef.current = null;
    };
  }, [props.canvasRef.current]);

  // Sync context with props changes
  useEffect(() => {
    if (!orchestratorRef.current) return;

    orchestratorRef.current.updateContext({
      viewport: props.viewport,
      viewportRef: props.viewportRef,
      mouseWorldPosRef: props.mouseWorldPosRef,
      lastMousePos: props.lastMousePos,
      scene: props.scene,
      tokens: props.tokens,
      imageCache: {},
      isGM: props.isGM,
      gmViewMode: props.gmViewMode,
      currentUser: props.currentUser,
      permissions: props.permissions,
      activeTool: props.activeTool,
      selectedTokenIds: props.selectedTokenIds || [],
      remoteDrags: props.remoteDrags || {},
      remoteCursors: props.remoteCursors,
      cursorSettings: props.cursorSettings || null,
      attackZoneResults: props.attackZoneResults || [],
      isPlacingAttackZone: props.isPlacingAttackZone || false,
      campaignCharacters: props.campaignCharacters || [],
      campaign: props.campaign,
    });
  }, [
    props.viewport,
    props.scene,
    props.tokens,
    props.isGM,
    props.gmViewMode,
    props.currentUser,
    props.permissions,
    props.activeTool,
    props.selectedTokenIds,
    props.remoteDrags,
    props.remoteCursors,
    props.cursorSettings,
    props.attackZoneResults,
    props.isPlacingAttackZone,
    props.campaignCharacters,
  ]);

  // Event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    orchestratorRef.current?.handleMouseDown(e);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    orchestratorRef.current?.handleMouseMove(e);
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    orchestratorRef.current?.handleMouseUp(e);
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    orchestratorRef.current?.handleMouseLeave(e);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    orchestratorRef.current?.handleWheel(e);
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    orchestratorRef.current?.handleDoubleClick(e);
  }, []);

  // Handler accessors
  const getGridAlignHandler = useCallback(() => {
    return orchestratorRef.current?.getHandler<GridAlignHandler>('grid-align');
  }, []);

  const getTokenDragHandler = useCallback(() => {
    return orchestratorRef.current?.getHandler<TokenDragHandler>('token-drag');
  }, []);

  const getPanZoomHandler = useCallback(() => {
    return orchestratorRef.current?.getHandler<PanZoomHandler>('pan-zoom');
  }, []);

  const getFogOfWarHandler = useCallback(() => {
    return orchestratorRef.current?.getHandler<FogOfWarHandler>('fog-of-war');
  }, []);

  const getDrawWallHandler = useCallback(() => {
    return orchestratorRef.current?.getHandler<DrawWallHandler>('draw-wall');
  }, []);

  // Backward compatibility for PrecisionCursor
  const confirm3PointCalibration = useCallback(() => {
    getGridAlignHandler()?.confirm3PointCalibration();
  }, []);

  const cancel3PointCalibration = useCallback(() => {
    getGridAlignHandler()?.cancel3PointCalibration();
  }, []);

  // Keep alignPointsRef in sync
  useEffect(() => {
    const gridHandler = getGridAlignHandler();
    if (gridHandler) {
      const updateRef = () => {
        alignPointsRef.current = [...gridHandler.getAlignPoints()];
      };
      const interval = setInterval(updateRef, 100);
      return () => clearInterval(interval);
    }
  }, [getGridAlignHandler]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel,
    handleDoubleClick,
    getGridAlignHandler,
    getTokenDragHandler,
    getPanZoomHandler,
    getFogOfWarHandler,
    getDrawWallHandler,
    alignPointsRef,
    confirm3PointCalibration,
    cancel3PointCalibration,
  };
};
