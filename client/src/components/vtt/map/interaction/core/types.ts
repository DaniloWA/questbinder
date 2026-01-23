/**
 * VTT Interaction Engine - Core Types
 *
 * Shared type definitions for the modular interaction system.
 * Inspired by the Layer Engine architecture.
 */

import type {
  MapScene,
  Token,
  Viewport,
  VTTTool,
  Obstacle,
  LightZone,
  AudioZone,
  TriggerZone,
  MapDrawing,
  User,
  SessionPermissions,
  Character,
  Point,
} from '../../../../../types';
import type { CursorMovePayload, TokenDragPayload } from '../../../../../types/socket';

// ============================================================================
// EVENT TYPES
// ============================================================================

/** Mouse event phases */
export type EventPhase = 'down' | 'move' | 'up' | 'leave' | 'wheel' | 'dblclick';

/** Handler result - controls event propagation */
export interface HandlerResult {
  /** If true, stops event propagation to lower priority handlers */
  handled: boolean;
  /** Optional cursor style to apply */
  cursor?: string;
  /** If true, prevents browser default behavior */
  preventDefault?: boolean;
}

/** Default handler result (not handled) */
export const NOT_HANDLED: HandlerResult = { handled: false };

/** Handled result that stops propagation */
export const HANDLED: HandlerResult = { handled: true };

// ============================================================================
// INTERACTION CONTEXT
// ============================================================================

/**
 * Shared context passed to all handlers during event processing.
 * Contains all data needed to process the current interaction.
 */
export interface InteractionContext {
  // ===== Canvas & Viewport =====
  canvas: HTMLCanvasElement;
  viewport: Viewport;
  viewportRef: React.RefObject<Viewport>;
  zoom: number;

  // ===== Mouse Position =====
  /** Screen-space position (relative to canvas) */
  screenPos: Point;
  /** World-space position (applying viewport transform) */
  worldPos: Point;
  /** Ref for immediate world position access */
  mouseWorldPosRef: React.RefObject<Point>;
  /** Last mouse position (for delta calculations) */
  lastMousePos: React.RefObject<Point>;

  // ===== Scene & Tokens =====
  scene: MapScene | null;
  tokens: Token[];
  imageCache: Record<string, HTMLImageElement>;
  gridSize: number;

  // ===== User & Permissions =====
  isGM: boolean;
  gmViewMode: 'gm' | 'player';
  currentUser: User | null;
  permissions: SessionPermissions | null;

  // ===== Active State =====
  activeTool: VTTTool;
  selectedTokenIds: string[];

  // ===== Remote State =====
  remoteDrags: Record<string, TokenDragPayload>;
  remoteCursors: Record<string, CursorMovePayload>;

  // ===== Settings =====
  cursorSettings: CursorSettings | null;
  rulerSettings: RulerSettings;
  wandSettings: WandSettings;
  drawingSettings: DrawingSettings;

  // ===== Attack Zones =====
  attackZoneResults: AttackZoneConfig[];
  isPlacingAttackZone: boolean;

  // ===== Time =====
  time: number;
  deltaMs: number;

  // ===== Event Metadata =====
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;

  // ===== Campaign =====
  campaignCharacters: Character[];
  campaign: any;

  // ===== Meta =====
  setProcessing?: (isProcessing: boolean, message?: string) => void;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface CursorSettings {
  color: string;
  name: string;
  shape?: string;
  clickAnimation?: ClickAnimationStyle;
  clickColorLeft?: string;
  clickColorRight?: string;
  pingColor?: string;
  pingAnimation?: string;
  trailEnabled?: boolean;
  trailColor?: string;
  trailAnimation?: string;
  trailLength?: number;
  trailThickness?: number;
  trailCustomImage?: string;
  trailSize?: number;
  showOthersTrails?: boolean;
  showMyTrail?: boolean;
}

export interface RulerSettings {
  snapToGrid: boolean;
  metric: 'euclidean' | 'chebyshev' | 'manhattan';
}

export interface WandSettings {
  tolerance: number;
  resolution: number;
  simplification: number;
  smoothing: boolean;
  smoothingIterations: number;
}

export interface DrawingSettings {
  color: string;
  width: number;
  opacity: number;
}

export type ClickAnimationStyle =
  | 'ripple' | 'burst' | 'sparkle' | 'pulse'
  | 'vortex' | 'shard' | 'ring' | 'echo' | 'orb';

// ============================================================================
// ATTACK ZONE TYPES
// ============================================================================

export interface AttackZoneConfig {
  id: string;
  shape: 'cone' | 'sphere' | 'cylinder' | 'line' | 'cube';
  origin: Point;
  direction?: number;
  radius?: number;
  length?: number;
  width?: number;
  color?: string;
  opacity?: number;
}

// ============================================================================
// DRAWING STATE
// ============================================================================

export interface DrawingState {
  livePoints: Point[];
  isDrawing: boolean;
  liveDrawingPointsRef?: React.RefObject<Point[]>;
  settings: DrawingSettings;
}

// ============================================================================
// DRAG STATE
// ============================================================================

export interface DragState {
  isDragging: boolean;
  token: Token | null;
  draggedGroup: DraggedTokenInfo[];
  offset: Point;
  dragStartX: number;
  dragStartY: number;
  lastValidGridX: number;
  lastValidGridY: number;
  lastCheckedGridX: number;
  lastCheckedGridY: number;
}

// Add to Context
export interface InteractionContext {
  dragState?: DragState;
}

export interface DraggedTokenInfo {
  id: string;
  offsetX: number;
  offsetY: number;
  startGridX: number;
  startGridY: number;
}

export const createEmptyDragState = (): DragState => ({
  isDragging: false,
  token: null,
  draggedGroup: [],
  offset: { x: 0, y: 0 },
  dragStartX: 0,
  dragStartY: 0,
  lastValidGridX: 0,
  lastValidGridY: 0,
  lastCheckedGridX: -1,
  lastCheckedGridY: -1,
});

// ============================================================================
// HANDLER OPTIONS
// ============================================================================

export interface HandlerOptions {
  /** Unique handler ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Priority (higher = processed first, 0-1000) */
  priority: number;
  /** Tools this handler responds to ('*' for all) */
  tools: VTTTool[] | '*';
  /** Optional description */
  description?: string;
}

// ============================================================================
// PLUGIN SYSTEM
// ============================================================================

export interface HandlerPlugin {
  /** Unique plugin identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Semver version string */
  version: string;
  /** Factory function to create the handler */
  createHandler: () => import('./BaseHandler').BaseHandler;
  /** Default priority */
  defaultPriority: number;
  /** Whether enabled by default */
  defaultEnabled?: boolean;
  /** Plugin author */
  author?: string;
  /** Plugin description */
  description?: string;
}

// ============================================================================
// ORCHESTRATOR EVENTS
// ============================================================================

export type InteractionEvent =
  | { type: 'handler:added'; handlerId: string; }
  | { type: 'handler:removed'; handlerId: string; }
  | { type: 'handler:enabled'; handlerId: string; enabled: boolean; }
  | { type: 'tool:changed'; from: VTTTool; to: VTTTool; }
  | { type: 'context:updated'; keys: string[]; }
  | { type: 'drag:start'; tokenId: string; }
  | { type: 'drag:end'; tokenId: string; finalPos: Point; }
  | { type: 'click'; worldPos: Point; button: number; };

export type InteractionEventHandler = (event: InteractionEvent) => void;

// ============================================================================
// CALLBACK TYPES (provided by parent component)
// ============================================================================

export interface InteractionCallbacks {
  setViewport: (v: Partial<Viewport>) => void;
  moveToken: (tokenId: string, x: number, y: number) => void;
  moveTokens?: (moves: { id: string; x: number; y: number; }[]) => void;
  selectToken?: (id: string, multi: boolean) => void;
  clearSelection?: () => void;
  updateFog: (newPath: string) => void;
  setActiveTool: (tool: VTTTool) => void;
  setMovementPath: (path: Point[]) => void;
  addObstacles: (obstacles: any[]) => void;
  updateObstacle: (id: string, updates: Partial<Obstacle>) => void;
  setDrawingObstacle: (o: { type: Obstacle['type']; p1: Point; } | null) => void;
  setDrawingLightZone: (z: { type: 'polygon' | 'rect'; p1: Point; } | null) => void;
  addLightZones: (zones: Omit<LightZone, 'id'>[]) => void;
  setDrawingAudioZone: (z: { type: 'polygon' | 'rect'; p1: Point; } | null) => void;
  addAudioZones: (zones: Omit<AudioZone, 'id'>[]) => void;
  setDrawingTriggerZone: (z: { type: 'polygon' | 'rect'; p1: Point; } | null) => void;
  addTriggerZones: (zones: Omit<TriggerZone, 'id'>[]) => void;
  removeTriggerZone: (id: string) => void;
  setDraftPolyPoints: (points: Point[]) => void;
  updateToken: (id: string, data: Partial<Token>) => void;
  emitTokenDrag?: (tokenId: string, x: number, y: number, path: Point[]) => void;
  emitCursorMove: (x: number, y: number, forceImmediate?: boolean) => void;
  onTokenContextMenu: (e: React.MouseEvent, tokenId: string) => void;
  onMapContextMenu: (e: React.MouseEvent, worldX: number, worldY: number, obstacleId?: string, triggerZoneId?: string, audioZoneId?: string) => void;
  onAttackZoneContextMenu?: (e: React.MouseEvent, zoneId: string) => void;
  onUpdateAttackZone?: (zoneId: string, updates: any) => void;
  onUpdatePreviewOrigin?: (origin: Point) => void;
  onConfirmAttackZonePlacement?: () => void;
  onCancelAttackZonePlacement?: () => void;
  setCursorClickState: (pressing: boolean) => void;
  setDragging?: (dragging: boolean) => void;
  updateMapSettings?: (settings: any) => void;
  removeObstacle: (id: string) => void;
  removeAudioZone: (id: string) => void;
  addDrawing: (drawing: MapDrawing) => void;
  updateDrawingState?: (points: Point[]) => void;
  removeDrawing: (id: string) => void;
  setHoveredTokenId?: (id: string | null) => void;
  setHoveredObstacleId?: (id: string | null) => void;

  // Modal callbacks for zone configuration
  openAudioZoneConfigModal?: (onSave: (config: { audioUrl: string; volume: number; radius: number; }) => void) => void;
  openTriggerZoneConfigModal?: (onSave: (handoutId: string) => void) => void;

  // Token drag state
  setIsTokenDragging?: (isDragging: boolean) => void;

  // Processing state
  setProcessing?: (isProcessing: boolean, message?: string) => void;
}
