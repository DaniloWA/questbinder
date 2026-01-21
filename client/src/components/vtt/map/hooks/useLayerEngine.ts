/**
 * VTT Engine - useLayerEngine Hook
 *
 * React hook for integrating the modular layer engine with the VTT.
 * Handles orchestrator lifecycle and props-to-context synchronization.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { MapOrchestrator } from '../engine/core/MapOrchestrator';
import { RenderContext } from '../engine/core/types';
import { MapCanvasProps } from '../types';
import { Token } from '../../../../types';


// Import all layers
import {
  BackgroundLayer,
  GridLayer,
  FogLayer,
  DrawingsLayer,
  ObstaclesLayer,
  ZonesLayer,
  TokenLayer,
  VisionLayer,
  LightingLayer,
  CursorLayer,
  ToolOverlayLayer,
  DebugLayer,
} from '../engine/layers';
import { SFXLayer } from '../engine/sfx/SFXLayer';

/**
 * Extended props that includes data from other hooks.
 */
interface ExtendedProps extends MapCanvasProps {
  viewportRef?: React.RefObject<{ x: number; y: number; zoom: number; }>;
  remoteViewports?: Record<string, { x: number; y: number; zoom: number; w: number; h: number; }>;
  visionTokens?: Token[];
  imageCache?: Record<string, HTMLImageElement>;
  hoveredTokenId?: string | null;
  hoveredObstacleId?: string | null;
  mouseWorldPos?: { x: number; y: number; };
  mouseWorldPosRef?: React.RefObject<{ x: number; y: number; }>;
  dragState?: React.RefObject<any>;
  animationsRef?: React.RefObject<Map<string, any>>;
  calculatedPath?: { x: number; y: number; }[];
  calculatedPathRef?: React.RefObject<{ x: number; y: number; }[]>;
  liveDrawingPointsRef?: React.RefObject<{ x: number; y: number; }[]>;
  isDrawingRef?: React.RefObject<boolean>;
  currentFogRect?: { x: number; y: number; w: number; h: number; } | null;
  draggedAttackZone?: any | null;
  showDebug?: boolean;
  drawingSettings?: {
    color: string;
    width: number;
    opacity: number;
  };
}

/**
 * Hook options for customizing engine behavior.
 */
interface UseLayerEngineOptions {
  /** Enable debug logging */
  debug?: boolean;
  /** Custom layer order overrides */
  layerOrder?: Record<string, number>;
  /** Layers to disable by default */
  disabledLayers?: string[];
}

/**
 * Hook return type.
 */
interface UseLayerEngineResult {
  /** The orchestrator instance (null before init) */
  orchestrator: MapOrchestrator | null;
  /** Get current FPS */
  getFps: () => number;
  /** Toggle a layer */
  toggleLayer: (layerId: string, enabled: boolean) => void;
  /** Get layer states for debugging */
  getLayerStates: () => any[];
}

/**
 * React hook to integrate the modular layer engine.
 *
 * @param canvasRef Reference to the main canvas element
 * @param props Extended props including MapCanvasProps and hook data
 * @param options Engine configuration options
 */
export function useLayerEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  props: ExtendedProps,
  options: UseLayerEngineOptions = {}
): UseLayerEngineResult {
  const orchestratorRef = useRef<MapOrchestrator | null>(null);
  const [orchestratorInstance, setOrchestratorInstance] = useState<MapOrchestrator | null>(null);

  // Initialize orchestrator and layers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create orchestrator
    const orchestrator = new MapOrchestrator(canvas, {
      debug: options.debug,
    });

    // Define default layer order
    const defaultOrder: Record<string, number> = {
      background: 0,
      fog: 20,
      vision: 25,        // Vision clipping
      grid: 28,          // Grid (Always visible above fog/vision)
      drawings: 30,
      obstacles: 40,
      zones: 45,
      tokens: 60,
      lighting: 70,      // Dynamic lighting
      'tool-overlay': 80,
      sfx: 85,           // Weather effects above tools/overlays
      cursors: 100,
      debug: 999,
    };

    // Merge with custom order
    const layerOrder = { ...defaultOrder, ...options.layerOrder };

    // Register all core layers
    const layers = [
      new BackgroundLayer(),
      new GridLayer(),
      new FogLayer(),
      new VisionLayer(),
      new DrawingsLayer(),
      new ObstaclesLayer(),
      new ZonesLayer(),
      new TokenLayer(),
      new LightingLayer(),
      new ToolOverlayLayer(),
      new CursorLayer(),
      new SFXLayer(),
      new DebugLayer(),
    ];

    for (const layer of layers) {
      // Specifically check for debug flag in props for DebugLayer
      if (layer.id === 'debug' && !props.showDebug) {
        layer.enabled = false;
      } else if (options.disabledLayers?.includes(layer.id)) {
        layer.enabled = false;
      }
      orchestrator.addLayer(layer, layerOrder[layer.id] ?? 50);
    }

    // Start render loop
    orchestrator.start();
    orchestratorRef.current = orchestrator;
    setOrchestratorInstance(orchestrator);

    if (options.debug) {
      console.log('[useLayerEngine] Initialized with', layers.length, 'layers');
    }

    // Cleanup
    return () => {
      orchestrator.destroy();
      orchestratorRef.current = null;
      setOrchestratorInstance(null);
      if (options.debug) {
        console.log('[useLayerEngine] Destroyed');
      }
    };
  }, [canvasRef.current]); // Only re-init when canvas ref changes

  // Sync props to context
  useEffect(() => {
    const orchestrator = orchestratorRef.current;
    if (!orchestrator || !props.scene) return;

    const gridSize = props.scene.grid.size;
    let mapWidth = gridSize * props.scene.grid.cols;
    let mapHeight = gridSize * props.scene.grid.rows;

    // Fix: If image is loaded, respect its potential natural size if larger/different?
    // User report: "map isn't loading right when I zoom... always cut off... upload didn't update grid"
    // Usually we want the map size to match the image size if the grid hasn't been calibrated yet.
    if (props.scene.imageUrl && props.imageCache && props.imageCache[props.scene.imageUrl]) {
      const img = props.imageCache[props.scene.imageUrl];
      if (img.complete && img.naturalWidth > 0) {
        // If the grid seems "default" or significantly smaller than image, use image size
        // Or simply force map bounds to be at least image size to prevent clipping
        mapWidth = Math.max(mapWidth, img.naturalWidth);
        mapHeight = Math.max(mapHeight, img.naturalHeight);
      }
    }

    orchestrator.updateContext({
      viewport: props.viewport,
      viewportRef: props.viewportRef,
      zoom: props.viewport.zoom,
      mapWidth,
      mapHeight,
      scene: props.scene,
      tokens: props.tokens,
      imageCache: props.imageCache || {},
      isGM: props.isGM,
      gmViewMode: props.gmViewMode,
      currentUser: props.currentUser,
      permissions: props.permissions,
      players: props.players || [],
      activeTool: props.activeTool,
      selectedTokenIds: props.selectedTokenIds || [],
      remoteCursors: props.remoteCursors || {},
      remoteCursorsRef: props.remoteCursorsRef,
      remoteDrags: props.remoteDrags || {},
      localCursorPos: props.mouseWorldPos || { x: 0, y: 0 },
      mouseWorldPosRef: props.mouseWorldPosRef,
      cursorSettings: props.cursorSettings || null,
      rulerSettings: props.rulerSettings,
      dragStateRef: props.dragState,
      toolState: {
        movementPath: props.movementPath || [],
        draftPolyPoints: props.draftPolyPoints || [],
        drawingObstacle: props.drawingObstacle || null,
        drawingLightZone: props.drawingLightZone || null,
        drawingAudioZone: props.drawingAudioZone || null,
        drawingTriggerZone: props.drawingTriggerZone || null,
        currentFogRect: props.currentFogRect || null,
        draggedAttackZone: props.draggedAttackZone || null,
        mapAlignPoints: [],
        mapAlignDragging: false,
        mapAlignPreviewGrid: null,
      },
      drawingState: {
        livePoints: props.liveDrawingPointsRef?.current || [],
        isDrawing: props.isDrawingRef?.current || false,
        liveDrawingPointsRef: props.liveDrawingPointsRef,
        settings: props.drawingSettings,
      },
      attackZoneResults: props.attackZoneResults || [],
      previewZoneResult: props.previewZoneResult || null,
      pings: props.pings || [],
      campaignCharacters: props.campaignCharacters || [],
      remoteViewports: props.remoteViewports || {},
      hoveredTokenId: props.hoveredTokenId || null,
      hoveredObstacleId: props.hoveredObstacleId || null,
      calculatedPath: props.calculatedPath || [],
      calculatedPathRef: props.calculatedPathRef,
      visionTokens: props.visionTokens || [],
    } as Partial<RenderContext>);
  }, [
    props.scene,
    props.tokens,
    props.viewport,
    props.isGM,
    props.gmViewMode,
    props.activeTool,
    props.selectedTokenIds,
    props.remoteCursors,
    props.remoteDrags,
    props.pings,
    props.movementPath,
    props.draftPolyPoints,
    props.drawingObstacle,
    props.drawingLightZone,
    props.drawingAudioZone,
    props.drawingTriggerZone,
    props.attackZoneResults,
    props.previewZoneResult,
    props.campaignCharacters,
    props.remoteViewports,
    props.imageCache, // CRITICAL: Re-run when images load to update map dimensions
    props.viewportRef, // Safety: Ensure context has ref
    props.calculatedPath, // CRITICAL: Update context when drag path changes (Ruler)
    props.dragState, // CRITICAL: Update context when drag state changes
    props.players, // CRITICAL: Update context when players change (viewports)
    props.permissions, // CRITICAL: Update context when permissions change
    props.rulerSettings, // CRITICAL: Update context when ruler settings change
  ]);

  // Sync SFX state
  useEffect(() => {
    const orchestrator = orchestratorInstance;
    if (!orchestrator || !props.scene) return;

    // Get SFX layer
    const sfxLayer = orchestrator.getRegistry().getLayer('sfx') as SFXLayer | undefined;
    if (!sfxLayer) return;

    // Apply SFX Config
    if (props.scene.sfx) {
      sfxLayer.setConfig(props.scene.sfx);
    } else {
      sfxLayer.setConfig({});
    }
  }, [props.scene?.sfx, orchestratorInstance]); // Update when sfx or engine instance changes

  // API methods
  const getFps = useCallback(() => {
    return orchestratorRef.current?.getFps() || 0;
  }, []);

  const toggleLayer = useCallback((layerId: string, enabled: boolean) => {
    orchestratorRef.current?.getRegistry().setLayerEnabled(layerId, enabled);
  }, []);

  const getLayerStates = useCallback(() => {
    return orchestratorRef.current?.getLayerStates() || [];
  }, []);

  return {
    orchestrator: orchestratorRef.current,
    getFps,
    toggleLayer,
    getLayerStates,
  };
}
