/**
 * VTT Engine - Core Types
 *
 * Shared type definitions for the modular layer rendering engine.
 */

import {
  MapScene,
  Token,
  Viewport,
  VTTTool,
  Obstacle,
  LightZone,
  AudioZone,
  TriggerZone,
  MapDrawing,
  Ping,
  Character,
  SessionPermissions,
  User,
} from '../../../../../types';
import { CursorMovePayload, TokenDragPayload } from '../../../../../types/socket';

// ============================================================================
// RENDER CONTEXT
// ============================================================================

/**
 * Shared context passed to all layers during rendering.
 * Contains all data needed to render the current frame.
 */
export interface RenderContext {
  // Canvas
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  // Viewport & Transform
  viewport: Viewport;
  zoom: number;
  mapWidth: number;
  mapHeight: number;

  // Time
  time: number;
  deltaMs: number;

  // Scene Data
  scene: MapScene | null;
  tokens: Token[];
  imageCache: Record<string, HTMLImageElement>;

  // User & Permissions
  isGM: boolean;
  gmViewMode: 'gm' | 'player';
  currentUser: User | null;
  permissions: SessionPermissions | null;
  players: User[];

  // Selection & Tools
  activeTool: VTTTool;
  selectedTokenIds: string[];

  // Cursors & Remote State
  remoteCursors: Record<string, CursorMovePayload>;
  remoteCursorsRef?: React.MutableRefObject<Record<string, CursorMovePayload>>;
  remoteDrags: Record<string, TokenDragPayload>;
  localCursorPos: { x: number; y: number; };

  // Cursor Settings
  cursorSettings: {
    color: string;
    shape?: string;
    trailEnabled?: boolean;
    trailColor?: string;
    trailAnimation?: string;
    trailLength?: number;
    trailThickness?: number;
    showOthersTrails?: boolean;
    showMyTrail?: boolean;
    explosionOnCollision?: boolean;
  } | null;

  // UI Flags
  ui: {
    showGridCoordinates: boolean;
    showVisionRanges: boolean;
    gmHideObstacles: boolean;
  };

  // Drawing State
  drawingState: {
    livePoints: { x: number; y: number; }[];
    isDrawing: boolean;
    settings: {
      color: string;
      width: number;
      opacity: number;
    };
  };

  // Tool-specific State
  toolState: {
    movementPath: { x: number; y: number; }[];
    draftPolyPoints: { x: number; y: number; }[];
    drawingObstacle: { type: Obstacle['type']; p1: { x: number; y: number; }; } | null;
    drawingLightZone: { type: 'polygon' | 'rect'; p1: { x: number; y: number; }; } | null;
    drawingAudioZone: { type: 'polygon' | 'rect'; p1: { x: number; y: number; }; } | null;
    drawingTriggerZone: { type: 'polygon' | 'rect'; p1: { x: number; y: number; }; } | null;
    currentFogRect: { x: number; y: number; w: number; h: number; } | null;
    draggedAttackZone: { id: string; startX: number; startY: number; originX: number; originY: number; rotating?: boolean; } | null;
    // Map Alignment Tools
    mapAlignPoints: { x: number; y: number; }[]; // For 3-point calibration
    mapAlignDragging: boolean;
    mapAlignPreviewGrid: { size: number; offsetX: number; offsetY: number; } | null;
  };

  // Attack Zones
  attackZoneResults: AttackZoneResult[];
  previewZoneResult: AttackZoneResult | null;

  // Pings
  pings: Ping[];

  // Click Animations
  clickAnimations: { x: number; y: number; color: string; style?: string; startTime: number; }[];

  // Campaign Characters (for token linking)
  campaignCharacters: Character[];

  // Remote Viewports
  remoteViewports: Record<string, { x: number; y: number; zoom: number; w: number; h: number; userId?: string; color?: string; }>;

  // Ruler Settings
  rulerSettings: {
    snapToGrid: boolean;
    metric: 'euclidean' | 'chebyshev' | 'manhattan';
  };

  // Drag State
  dragState: {
    isDragging: boolean;
    token: Token | null;
    draggedGroup: { id: string; offsetX: number; offsetY: number; startGridX: number; startGridY: number; }[];
    offset: { x: number; y: number; };
  };

  // Hover State
  hoveredTokenId: string | null;
  hoveredObstacleId: string | null;

  // Calculated Path (for movement preview)
  calculatedPath: { x: number; y: number; }[];

  // Vision Tokens (filtered for current user)
  visionTokens: Token[];
}

// Attack Zone Result Type
export interface AttackZoneResult {
  id: string;
  shape: 'cone' | 'sphere' | 'cylinder' | 'line' | 'cube';
  x: number;
  y: number;
  radius?: number;
  length?: number;
  width?: number;
  angle?: number;
  color: string;
  opacity?: number;
}

// ============================================================================
// LAYER SYSTEM
// ============================================================================

/**
 * Options for creating a layer.
 */
export interface LayerOptions {
  /** Use an offscreen canvas for caching */
  useCache?: boolean;
  /** Initial opacity (0-1) */
  opacity?: number;
  /** Blend mode for compositing */
  blendMode?: GlobalCompositeOperation;
  /** Human-readable description */
  description?: string;
}

/**
 * Configuration for registering a layer with the orchestrator.
 */
export interface LayerConfig {
  id: string;
  order: number;
  enabled?: boolean;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

/**
 * Plugin manifest for external layer registration.
 */
export interface LayerPlugin {
  /** Unique plugin identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Semver version string */
  version: string;
  /** Layer class constructor */
  createLayer: () => import('./BaseLayer.ts').BaseLayer;
  /** Default z-order */
  defaultOrder: number;
  /** Whether enabled by default */
  defaultEnabled?: boolean;
  /** Plugin author */
  author?: string;
  /** Plugin description */
  description?: string;
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================

/**
 * Orchestrator configuration options.
 */
export interface OrchestratorOptions {
  /** Target FPS (default: 60) */
  targetFps?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Background color */
  backgroundColor?: string;
}

/**
 * Layer state for debugging/inspection.
 */
export interface LayerState {
  id: string;
  name: string;
  order: number;
  enabled: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  cacheHash: string | null;
  lastRenderTime: number;
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Events emitted by the orchestrator.
 */
export type OrchestratorEvent =
  | { type: 'layer:added'; layerId: string; }
  | { type: 'layer:removed'; layerId: string; }
  | { type: 'layer:enabled'; layerId: string; enabled: boolean; }
  | { type: 'render:start'; }
  | { type: 'render:complete'; frameTime: number; }
  | { type: 'context:updated'; keys: string[]; };

export type OrchestratorEventHandler = (event: OrchestratorEvent) => void;
