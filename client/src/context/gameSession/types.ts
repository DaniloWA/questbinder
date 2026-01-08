import {
  Campaign, MapScene, Token, Viewport, CombatState, ChatMessage,
  SessionPermissions, User, Character, TokenTemplate, Handout,
  ChatLinkMetadata, RollResult, Ping, Obstacle, LightZone, AudioZone,
  Playlist, SoundEffect, CompendiumCategory, TriggerZone, VTTTool, MapDrawing, RulerSettings
} from '../../types';
import { AttackZoneConfig } from '../../types/attackZone';
import {
  TokenDragPayload, CursorMovePayload
} from '../../types/socket';
import { PermissionHelper } from './helpers/PermissionHelper';

export type BooleanPermissionKey = Exclude<keyof SessionPermissions, 'tokenHover' | 'logConfig' | 'userOverrides'>;

export interface DrawingSettings {
  color: string;
  width: number;
  opacity: number;
}

export interface WandSettings {
  tolerance: number;   // 0-255
  resolution: number;  // Max dimension for processing
  simplification: number; // RDP Epsilon
}

export interface GameSessionState {
  campaign: Campaign | null;
  scenes: MapScene[];
  activeSceneId: string;
  combat: CombatState | null;
  players: User[];
  campaignCharacters: Character[];
  chatMessages: ChatMessage[];
  handouts: Handout[];
  templates: TokenTemplate[];

  // Client View State
  viewport: Viewport;
  isGM: boolean;
  gmViewMode: 'gm' | 'player';
  previewPlayerId: string | 'all'; // For GM to see as player
  activeTool: VTTTool;

  // Tools & Selection
  selectedTokenIds: string[];
  movementPath: { x: number, y: number; }[];
  drawingObstacle: { type: Obstacle['type'], p1: { x: number, y: number; }; } | null;
  drawingLightZone: { type: 'polygon' | 'rect', p1: { x: number, y: number; }; } | null;
  drawingAudioZone: { type: 'polygon' | 'rect', p1: { x: number, y: number; }; } | null;
  drawingTriggerZone: { type: 'polygon' | 'rect', p1: { x: number, y: number; }, handoutId?: string; } | null;
  draftPolyPoints: { x: number, y: number; }[];

  // Drawing Settings
  drawingSettings: DrawingSettings;

  // Ruler Settings
  rulerSettings: RulerSettings;

  // Wand Settings
  wandSettings: WandSettings;

  // Ephemeral
  pings: Ping[];
  remoteDrags: Record<string, TokenDragPayload>;
  remoteCursors: Record<string, CursorMovePayload>;
  remoteViewports: Record<string, Viewport & { w: number, h: number; }>;
  isConnected: boolean;
  isLoading: boolean;

  // Settings
  cursorSettings: {
    color: string;
    name: string;
    shape?: string;
    clickAnimation?: 'ripple' | 'burst' | 'sparkle' | 'pulse' | 'vortex' | 'shard' | 'ring' | 'echo' | 'orb';
    clickColorLeft?: string;
    clickColorRight?: string;
    // Ping settings
    pingColor?: string;
    pingAnimation?: 'radar' | 'beacon' | 'sonar' | 'pulse' | 'target' | 'ripple' | 'flare' | 'diamond' | 'cross';
  };
  permissions: SessionPermissions;
  audioSettings: { playlists: Playlist[], soundboard: SoundEffect[]; };

  // Audio State
  activeAudioZoneUrl: string | null;

  // Trigger State
  triggeredHandoutId: string | null;
  lastTriggeredZoneId: string | null;

  pullNotification: boolean;
  followMode: {
    active: boolean;
    targets: string[] | 'all';
  };

  // UI State
  ui: {
    isRightSidebarOpen: boolean;
    isLibraryOpen: boolean;
    isDiceRollerOpen: boolean;
    isAudioPanelOpen: boolean;
    gmHideObstacles: boolean;
    showVisionRanges: boolean;
    showGridCoordinates: boolean; // Debug mode for grid coordinates
    defaultObstacleHidden: boolean;
  };

  // Attack Zones (ephemeral, synced via WebSocket)
  attackZones: AttackZoneConfig[];

  compendiumTarget?: { slug: string, category: CompendiumCategory; };
}

export interface GameSessionContextType extends GameSessionState {
  user: User | null;
  // Actions
  setViewport: (v: Partial<Viewport>) => void;
  switchScene: (id: string) => void;
  addScene: (name: string) => void;
  deleteScene: (id: string) => void;
  updateSceneData: (id: string, data: Partial<MapScene>) => void;

  moveToken: (id: string, x: number, y: number) => void;
  moveTokens: (updates: { id: string, x: number, y: number; }[]) => void;
  updateToken: (id: string, data: Partial<Token>) => void;
  addToken: (token: Partial<Token>) => void;
  removeToken: (id: string) => void;
  moveTokenToScene: (tokenId: string, sceneId: string) => void;
  selectToken: (id: string, multi: boolean) => void;
  clearSelection: () => void;

  addObstacles: (obstacles: any[]) => void;
  updateObstacle: (id: string, data: Partial<Obstacle>) => void;
  removeObstacle: (id: string) => void;
  undoLastObstacle: () => void;
  clearAllObstacles: () => void;
  bulkUpdateObstacles: (data: Partial<Obstacle>) => void;

  updateFog: (path: string) => void;
  addPing: (x: number, y: number) => void;

  // Combat Management
  startCombat: (combatants?: any[], settings?: any) => void;
  endCombat: () => void;
  nextTurn: () => void;
  previousTurn: () => void;
  goToTurn: (index: number) => void;

  // Combatant Management
  addCombatant: (combatant: any) => void;
  removeCombatant: (id: string) => void;
  updateCombatant: (id: string, data: any) => void;
  rerollInitiative: (id?: string) => void;
  updateCombatSettings: (settings: any) => void;

  // Combat Actions
  applyDamage: (targetId: string, amount: number, source?: string) => void;
  applyHealing: (targetId: string, amount: number, source?: string) => void;
  applyEffect: (targetId: string, effect: any) => void;
  removeEffect: (targetId: string, effectId: string) => void;
  addCondition: (targetId: string, condition: any) => void;
  removeCondition: (targetId: string, condition: any) => void;

  // Combat Automation
  toggleAction: (combatantId: string, action: 'action' | 'bonusAction' | 'reaction') => void;
  resetActions: (combatantId: string) => void;
  checkConcentration: (combatantId: string, damage: number) => boolean;

  // Combat Utility
  getCombatStats: () => any;
  exportCombatLog: () => string;

  sendChatMessage: (content: string, type?: 'message' | 'roll' | 'system', rollDetails?: any, link?: ChatLinkMetadata, options?: { characterId?: string; characterName?: string; characterAvatarUrl?: string; recipientId?: string; recipientName?: string; }) => void;
  toggleChatReaction: (msg: ChatMessage, type: 'like' | 'dislike') => void;
  handleChatLinkClick: (link: ChatLinkMetadata) => void;

  rollDice: (label: string, formula: string) => void;
  broadcastRoll: (result: RollResult) => void;

  updateCharacter: (id: string, data: Partial<Character>, immediate?: boolean) => void;
  toggleFieldPrivacy: (characterId: string, fieldName: string) => Promise<void>;

  createHandout: (data: any) => Promise<void>;
  updateHandout: (id: string, data: any) => Promise<void>;
  deleteHandout: (id: string) => Promise<void>;
  shareHandout: (id: string, playerIds: string[]) => void;
  unshareHandout: () => void;
  sharedHandout: Handout | null;
  activeHandout: Handout | null;

  saveTemplate: (data: any) => void;
  deleteTemplate: (id: string) => void;

  updateAudioSettings: (settings: { playlists: Playlist[], soundboard: SoundEffect[]; }) => void;
  updateAudioZone: (id: string, data: Partial<AudioZone>) => void;
  removeAudioZone: (id: string) => void;

  addLightToken: (x: number, y: number) => void;
  addLightZones: (zones: any[]) => void;
  addAudioZones: (zones: any[]) => void;
  addTriggerZones: (zones: Omit<TriggerZone, 'id'>[]) => void;
  updateTriggerZone: (id: string, data: Partial<TriggerZone>) => void;
  removeTriggerZone: (id: string) => void;
  closeTriggeredHandout: () => void;

  addDrawing: (drawing: MapDrawing) => void;
  removeDrawing: (id: string) => void;
  undoLastDrawing: () => void;
  clearAllDrawings: () => void;
  setDrawingSettings: (settings: DrawingSettings) => void;

  setRulerSettings: (settings: RulerSettings) => void;
  setWandSettings: (settings: WandSettings) => void;

  checkPermission: (perm: BooleanPermissionKey) => boolean;
  updatePermissions: (perms: Partial<SessionPermissions>) => void;
  permissionHelper: PermissionHelper; // Global permission helper instance
  updateMapSettings: (settings: Partial<MapScene>) => void;
  setCursorSettings: (settings: {
    color: string;
    name: string;
    shape?: string;
    clickAnimation?: 'ripple' | 'burst' | 'sparkle' | 'pulse' | 'vortex' | 'shard' | 'ring' | 'echo' | 'orb';
    clickColorLeft?: string;
    clickColorRight?: string;
    pingColor?: string;
    pingAnimation?: 'radar' | 'beacon' | 'sonar' | 'pulse' | 'target' | 'ripple' | 'flare' | 'diamond' | 'cross';
  }) => void;

  toggleGMViewMode: () => void;
  setPreviewPlayerId: (id: string | 'all') => void;
  setGmHideObstacles: (val: boolean) => void;
  setDefaultObstacleHidden: (val: boolean) => void;
  toggleVisionRanges: () => void;
  toggleGridCoordinates: () => void;

  toggleRightSidebar: () => void;
  toggleLibrary: () => void;
  toggleDiceRoller: () => void;
  toggleAudioPanel: () => void;
  toggleCompendium: () => void;
  isCompendiumOpen: boolean;

  invitePlayer: () => string;

  setActiveTool: (tool: VTTTool) => void;
  setMovementPath: (path: { x: number, y: number; }[]) => void;
  setDrawingObstacle: (o: any) => void;
  setDraftPolyPoints: (pts: { x: number, y: number; }[]) => void;
  setDrawingLightZone: (z: any) => void;
  setDrawingAudioZone: (z: any) => void;
  setDrawingTriggerZone: (z: any) => void;

  emitTokenDrag: (id: string, x: number, y: number, path: { x: number, y: number; }[]) => void;
  emitCursorMove: (x: number, y: number) => void;
  pullView: (targetId: string | 'all', x: number, y: number, zoom: number) => void;
  toggleFollowMode: (active: boolean, targets?: string[] | 'all') => void;

  // Attack Zones (synced via WebSocket)
  addAttackZone: (zone: AttackZoneConfig) => void;
  updateAttackZone: (zoneId: string, updates: Partial<AttackZoneConfig>) => void;
  removeAttackZone: (zoneId: string) => void;
  clearAttackZones: () => void;

  activeScene: MapScene | null;
  pullNotification: boolean;
  setPullNotification: (show: boolean) => void;
  isFollowingGM: boolean;
}
