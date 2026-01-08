import React from 'react';
import { MapScene, Token, Viewport, Ping, Obstacle, User, PolygonObstacle, LineObstacle, VTTTool, LightZone, SessionPermissions, AudioZone, TriggerZone, Character } from '../../../types';
import { TokenDragPayload, CursorMovePayload } from '../../../types/socket';

export interface MapCanvasProps {
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
  remoteViewports?: Record<string, { x: number, y: number, zoom: number, w: number, h: number; }>;
  permissions: SessionPermissions;
  campaign?: any;
  cursorSettings?: {
    color: string;
    name: string;
    shape?: string;
    clickAnimation?: 'ripple' | 'burst' | 'sparkle' | 'pulse' | 'vortex' | 'shard' | 'ring' | 'echo' | 'orb';
    clickColorLeft?: string;
    clickColorRight?: string;
  };
  wandSettings: any;

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

  campaignCharacters?: Character[];
  onRollDice?: (formula: string, label: string) => void;
  onCharacterUpdate?: (id: string, data: Partial<Character>) => void;

  attackZoneResults?: any[];
  previewZoneResult?: any | null;
  onAttackZoneContextMenu?: (e: React.MouseEvent, zoneId: string) => void;
  onUpdateAttackZone?: (zoneId: string, updates: any) => void;
  // Attack Zone Placement Mode
  isPlacingAttackZone?: boolean;
  onUpdatePreviewOrigin?: (origin: { x: number; y: number; }) => void;
  onConfirmAttackZonePlacement?: () => void;
  onCancelAttackZonePlacement?: () => void;
  // PERFORMANCE: Used to throttle render loop when modal is open
  isModalOpen?: boolean;
}

export interface DragState {
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
}
