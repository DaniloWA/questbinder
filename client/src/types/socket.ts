
import { Token, CombatState, RollResult, ChatMessage, SessionPermissions, MapScene, Campaign, Handout, MapDrawing, Character } from './models';

export type SocketEventType =
  | 'room:join'
  | 'room:sync'
  | 'token:update'
  | 'token:drag'
  | 'token:add'
  | 'token:remove'
  | 'combat:update'
  | 'combat:start'
  | 'combat:end'
  | 'combat:next-turn'
  | 'combat:combatant:add'
  | 'combat:combatant:update'
  | 'combat:combatant:remove'
  | 'combat:action'
  | 'dice:roll'
  | 'map:ping'
  | 'chat:message'
  | 'chat:reaction'
  | 'session:permissions'
  | 'scene:add'
  | 'scene:update'
  | 'scene:delete'
  | 'scene:switch'
  | 'campaign:update'
  | 'campaign:permissionsUpdated'
  | 'cursor:move'
  | 'handout:update'
  | 'drawing:add'
  | 'drawing:remove'
  | 'audio:play'
  | 'audio:pause'
  | 'audio:stop'
  | 'audio:sfx'
  | 'viewport:update'
  | 'gm:pull_view'
  | 'gm:force_view'
  | 'connect'
  | 'disconnect';

// --- PAYLOADS ---

export interface RoomJoinPayload {
  campaignId: string;
  userId: string;
}

export interface RoomSyncPayload {
  scene: MapScene;
  combat: CombatState | null;
  activeSceneId: string;
}

export interface TokenUpdatePayload {
  sceneId: string;
  id: string;
  changes: Partial<Token>;
}

export interface ViewportUpdatePayload {
  x: number;
  y: number;
  zoom: number;
  w: number;
  h: number;
  userId?: string;
}

export interface GMPullViewPayload {
  targetId: string | 'all';
  x?: number; // Legacy Pan X
  y?: number; // Legacy Pan Y
  centerX?: number;
  centerY?: number;
  zoom: number;
}

export interface GMForceViewPayload {
  x?: number;
  y?: number;
  centerX?: number;
  centerY?: number;
  zoom: number;
  targets?: string[];
}

export interface GMToggleFollowPayload {
  active: boolean;
  targets: string[] | 'all';
}

export interface GMFollowModeChangePayload {
  active: boolean;
  targets: string[] | 'all';
}

export interface GMSyncViewPayload {
  x: number;
  y: number;
  zoom: number;
  w: number;
  h: number;
  centerX?: number;
  centerY?: number;
}

export interface GMViewportSyncPayload {
  x: number;
  y: number;
  zoom: number;
  w: number;
  h: number;
  centerX?: number;
  centerY?: number;
}

export interface ViewportRestorePayload {
  x: number;
  y: number;
  zoom: number;
  sceneId?: string;
}

export interface TokenDragPayload {
  userId: string;
  tokenId: string;
  x: number; // World Grid Coordinates
  y: number;
  path: { x: number, y: number; }[]; // Pathfinding history for ruler
  color?: string; // User color
}

export interface CursorMovePayload {
  userId: string;
  userName: string;
  userColor: string;
  userShape?: string;
  x: number; // World coordinates (not grid)
  y: number;
}

export interface TokenAddPayload {
  sceneId: string;
  token: Token;
}

export interface TokenRemovePayload {
  sceneId: string;
  id: string;
}

export interface SceneAddPayload {
  scene: MapScene;
}

export interface SceneUpdatePayload {
  id: string;
  changes: Partial<MapScene>;
}

export interface SceneDeletePayload {
  id: string;
}

export interface SceneSwitchPayload {
  id: string;
}

export interface CampaignUpdatePayload {
  changes: Partial<Campaign>;
}

export interface CampaignPermissionsUpdatedPayload {
  permissions: any; // Full permissions object including tokenHover
}

export interface CampaignUpdatePermissionsPayload {
  campaignId: string;
  permissions: any;
}

export interface CombatUpdatePayload {
  combat: CombatState | null;
}

export interface CombatStartPayload {
  combat: CombatState;
}

export interface CombatEndPayload {
  stats: any; // CombatStats
}

export interface CombatNextTurnPayload {
  combat: CombatState;
}

export interface CombatCombatantAddPayload {
  combatant: any; // Combatant
}

export interface CombatCombatantUpdatePayload {
  id: string;
  updates: any; // Partial<Combatant>
}

export interface CombatCombatantRemovePayload {
  id: string;
}

export interface CombatActionPayload {
  action: any; // CombatAction
}

export interface DiceRollPayload {
  result: RollResult;
  user: { id: string; name: string; color: string; };
}

export interface MapPingPayload {
  x: number;
  y: number;
  color: string;
  userId: string;
  userName: string;
  animationStyle?: 'radar' | 'beacon' | 'sonar' | 'pulse' | 'target' | 'ripple' | 'flare' | 'diamond' | 'cross';
}

export interface ChatMessagePayload {
  message: ChatMessage;
}

export interface ChatReactionPayload {
  messageId: string;
  reaction: any; // Record<string, ChatMessageReaction>;
  userId?: string;
  reactionType?: 'like' | 'dislike';
}

export interface SessionPermissionsPayload {
  permissions: SessionPermissions;
}

export interface HandoutUpdatePayload {
  operation: 'create' | 'update' | 'delete';
  handout?: Handout;
  handoutId?: string;
}

export interface DrawingAddPayload {
  sceneId: string;
  drawing: MapDrawing;
}

export interface DrawingRemovePayload {
  sceneId: string;
  id: string;
}

export interface AudioPlayPayload {
  url: string;
  loop?: boolean;
  volume?: number;
}

export interface AudioPausePayload {
  // Empty - just pause current track
}

export interface AudioStopPayload {
  // Empty - stop all audio
}

export interface AudioSfxPayload {
  url: string;
  action: 'start' | 'stop';
}

export interface CursorClickPayload {
  userId: string;
  x: number;
  y: number;
  color: string;
  style?: 'ripple' | 'burst' | 'sparkle' | 'pulse' | 'vortex' | 'shard' | 'ring' | 'echo' | 'orb';
}

// --- EVENT MAP (Strict Typing) ---

export interface SocketEventMap {
  'room:join': RoomJoinPayload;
  'room:sync': RoomSyncPayload;
  'token:update': TokenUpdatePayload;
  'token:drag': TokenDragPayload;
  'token:add': TokenAddPayload;
  'token:remove': TokenRemovePayload;
  'combat:update': CombatUpdatePayload;
  'combat:start': CombatStartPayload;
  'combat:end': CombatEndPayload;
  'combat:next-turn': CombatNextTurnPayload;
  'combat:combatant:add': CombatCombatantAddPayload;
  'combat:combatant:update': CombatCombatantUpdatePayload;
  'combat:combatant:remove': CombatCombatantRemovePayload;
  'combat:action': CombatActionPayload;
  'dice:roll': DiceRollPayload;
  'map:ping': MapPingPayload;
  'chat:message': ChatMessagePayload;
  'chat:reaction': ChatReactionPayload;
  'session:permissions': SessionPermissionsPayload;
  'scene:add': SceneAddPayload;
  'scene:update': SceneUpdatePayload;
  'scene:delete': SceneDeletePayload;
  'scene:switch': SceneSwitchPayload;
  'campaign:update': CampaignUpdatePayload;
  'campaign:updatePermissions': CampaignUpdatePermissionsPayload;
  'campaign:permissionsUpdated': CampaignPermissionsUpdatedPayload;
  'cursor:move': CursorMovePayload;
  'cursor:click': CursorClickPayload;
  'viewport:update': ViewportUpdatePayload;
  'gm:pull_view': GMPullViewPayload;
  'gm:force_view': GMForceViewPayload;
  'gm:toggle_follow': GMToggleFollowPayload;
  'gm:follow_mode_change': GMFollowModeChangePayload;
  'gm:sync_view': GMSyncViewPayload;
  'gm:viewport_sync': GMViewportSyncPayload;
  'handout:update': HandoutUpdatePayload;
  'drawing:add': DrawingAddPayload;
  'drawing:remove': DrawingRemovePayload;
  'audio:play': AudioPlayPayload;
  'audio:pause': void;
  'audio:stop': void;
  'audio:sfx': AudioSfxPayload;
  'character:add': Character;
  'character:update': { characterId: string; updates: Partial<Character>; updatedBy?: string; };
  'character:delete': { id: string; };
  'player:join': { user: { id: string; name: string; color: string; avatar?: string; role: 'gm' | 'player'; }; };
  'player:leave': { userId: string; userName?: string; };
  'viewport:restore': ViewportRestorePayload;
  'connect': void;
  'disconnect': void;
  'error': { message: string; };
  'chat_message:update': ChatMessage;
}

export interface SocketEvent<K extends keyof SocketEventMap> {
  type: K;
  payload: SocketEventMap[K];
  timestamp: number;
  senderId: string;
}
