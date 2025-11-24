
// types/models.ts

// --- ATTRIBUTES & SKILLS ---
export type AttributeName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' | 'cou';
export type SkillName = 'acrobatics' | 'animal_handling' | 'arcana' | 'athletics' | 'deception' | 'history' | 'insight' | 'intimidation' | 'investigation' | 'medicine' | 'nature' | 'perception' | 'performance' | 'persuasion' | 'religion' | 'sleight_of_hand' | 'stealth' | 'survival';

export interface Attributes {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  cou: number;
}

// --- CHARACTER & SHEET ---
export interface CharacterPersonality {
  traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
}

export interface Attack {
  id: string;
  name: string;
  atkBonus: string; // e.g. "+5"
  damage: string;   // e.g. "1d8+3"
  type: string;     // e.g. "Corte"
  range: string;
  properties: string;
  damageMod?: string;
  critDamage?: string;
  notes?: string;
  mastery?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  weight?: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime?: string;
  range?: string;
  components?: string;
  duration?: string;
  description?: string;
  prepared?: boolean;
}

export interface Feature {
  id: string;
  name: string;
  source: 'class' | 'race' | 'feat' | 'other';
  description: string;
  cost?: string;
  cooldown?: string;
}

export interface Currency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface CharacterAppearance {
  age: string;
  height: string;
  weight: string;
  eyes: string;
  skin: string;
  hair: string;
}

export interface SpellSlot {
  level: number;
  total: number;
  used: number;
}

export type CharacterSpeciesId = string;
export type CharacterClassId = string;
export type OriginId = string;
export type AlignmentId = string;

export type TokenShape = 'circle' | 'square' | 'hex' | 'topdown';
export type LightAnimationType = 'none' | 'torch' | 'pulse' | 'chroma';
export type TokenIdleAnimation = 'none' | 'breath' | 'float' | 'spin' | 'wobble';
export type TokenEffect = 'none' | 'ghostly' | 'burning' | 'frozen' | 'glitch' | 'outline';
export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'none';

export interface LightConfig {
  enabled: boolean;
  brightRadius: number;
  dimRadius: number;
  color: string;
  intensity: number;
  animation: LightAnimationType;
}

export interface CharacterTokenSettings {
  shape: TokenShape;
  size: number;
  scale: number;
  border: { color: string, width: number, style?: BorderStyle; };
  vision: { range: number, darkvision: number, color: string; };
  light: LightConfig;
  imgUrl: string;
  displayMode: 'image' | 'text';
  textDetails?: { text: string, backgroundColor: string, textColor: string; };
  tint?: string;
  idleAnimation?: TokenIdleAnimation;
  effect?: TokenEffect;
  // Advanced Positioning
  imageX?: number;
  imageY?: number;
  imageRotation?: number;
}

export interface CharacterChangeEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  changes: Record<string, { old: any, new: any; }>;
}

export interface Character {
  id: string;
  ownerId: string;
  campaignId?: string;
  name: string;
  species: string; // CharacterSpeciesId
  class: string;   // CharacterClassId
  level: number;
  origin: string;  // OriginId
  alignment: string; // AlignmentId
  experience: string;
  playerName?: string;
  attributes: Attributes;
  skills: SkillName[];
  personality: CharacterPersonality;
  appearance: CharacterAppearance;
  hpMax: number;
  hpCurrent: number;
  hpTemp: number;
  hitDiceTotal: string;
  hitDiceCurrent: number;
  deathSaves: { successes: number, failures: number; };
  exhaustion: number;
  heroicInspiration: boolean;
  armorClass: number;
  speed: number;
  movementDetails?: string;
  visionRange?: number;
  darkvisionRange?: number;
  initiative: number;
  profBonus: number;
  passivePerception: number;
  armorProficiencies?: string;
  languages?: string;
  toolProficiencies?: string;
  weaponProficiencies?: string;
  expertise?: SkillName[];
  attunementSlots?: { current: number, max: number; };
  activeEffects?: any[];

  attacks: Attack[];
  spellInfo: { class: string, ability: string, saveDc: number, atkBonus: number; };
  spellSlots: SpellSlot[];
  spells: Spell[];
  inventory: InventoryItem[];
  currency: Currency;
  treasure?: string;
  features: Feature[];
  alliesAndOrgs?: string;
  bio?: string;
  notes?: string;
  avatarUrl?: string;
  tokenSettings?: CharacterTokenSettings;
  gmNotes?: string;
  changeHistory?: CharacterChangeEntry[];
  createdAt: string;
}

// --- CAMPAIGN ---
export type GameSystem = 'dnd5e' | 'pf2e' | 'tormenta20' | 'call_of_cthulhu' | 'custom';
export type CampaignTone = 'heroic' | 'gritty' | 'dark' | 'mystery' | 'whimsical';

export interface Campaign {
  id: string;
  ownerId: string;
  name: string;
  system: GameSystem;
  description: string;
  coverUrl: string;
  theme: CampaignTone;
  status: 'planning' | 'active' | 'paused' | 'completed';
  schedule: { frequency: string, day: string, time: string; };
  players: { current: number, max: number, list: string[]; };
  lore: { worldName: string, hooks: string; };
  scenes: MapScene[];
  activeSceneId: string;
  audioSettings: { playlists: Playlist[], soundboard: SoundEffect[]; };
  permissions: SessionPermissions;
  createdAt: string;
}

// --- MAP & VTT ---
export interface Point { x: number; y: number; }

export interface GridOptions {
  size: number;
  color: string;
  alpha: number;
  cols: number;
  rows: number;
  unitsPerSquare: number;
}

export type ObstacleType = 'wall' | 'door' | 'window';

export interface BaseObstacle {
  id: string;
  type: ObstacleType;
  blocksVision: boolean;
  blocksMovement: boolean;
  hidden?: boolean;
}

export interface LineObstacle extends BaseObstacle {
  type: 'door' | 'window';
  p1: Point;
  p2: Point;
}

export interface PolygonObstacle extends BaseObstacle {
  type: 'wall';
  points: Point[];
  open?: boolean; // if true, not a closed loop
}

export type Obstacle = LineObstacle | PolygonObstacle;

export interface LightZone {
  id: string;
  type: 'rect' | 'polygon';
  rect?: { x: number, y: number, w: number, h: number; };
  points?: Point[];
  brightness: number; // 0 to 1
  color?: string;
  hidden?: boolean;
}

export interface AudioZone {
  id: string;
  type: 'rect' | 'polygon';
  rect?: { x: number, y: number, w: number, h: number; };
  points?: Point[];
  audioUrl: string;
  volume: number;
  radius: number; // Falloff distance
}

export interface TriggerZone {
  id: string;
  type: 'rect' | 'polygon';
  rect?: { x: number, y: number, w: number, h: number; };
  points?: Point[];
  handoutId: string;
}

export interface MapDrawing {
  id: string;
  userId: string;
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  isEraser?: boolean; // Conceptually
}

export type TokenType = 'pc' | 'npc' | 'object';
export type Condition = 'dead' | 'bloodied' | 'stunned' | 'shielded' | 'alert' | string;

// New: Mini-sheet for tokens
export interface TokenStats {
  ac: number;
  hpFormula?: string;
  speed: string; // "9m, voo 12m"
  attributes: Attributes;
  alignment?: string;
  type?: string; // "Humanoide", "Fera"
  cr?: string;
  senses?: string;
  languages?: string;
  notes?: string; // Simple text block for actions
}

export interface Token {
  id: string;
  type: TokenType;
  name: string;
  x: number;
  y: number;
  size: number;
  imgUrl: string;
  rotation?: number;
  isVisibleToPlayers: boolean;
  ownerId?: string;
  controlledBy?: string[];
  linkedId?: string; // Character ID
  bars?: {
    bar1?: { value: number, max: number, visible: boolean, color?: string; };
    bar2?: { value: number, max: number, visible: boolean, color?: string; };
  };
  conditions?: Condition[];
  visionRange?: number;
  darkvisionRange?: number;
  visionColor?: string;
  light?: LightConfig;

  // Visual Styling
  shape?: TokenShape;
  scale?: number; // Image scale inside frame
  border?: { color: string, width: number, style?: BorderStyle; };
  tint?: string;
  idleAnimation?: TokenIdleAnimation;
  effect?: TokenEffect;

  // Advanced Positioning
  imageX?: number; // Offset relative to size (-0.5 to 0.5)
  imageY?: number;
  imageRotation?: number; // Independent image rotation

  // Ad-hoc Stats (Mini Sheet)
  stats?: TokenStats;

  displayMode?: 'image' | 'text';
  textDetails?: { text: string, backgroundColor: string, textColor: string; };
  speed?: number;
}

export interface MapScene {
  id: string;
  name: string;
  imageUrl: string;
  grid: GridOptions;
  ambientLight: number;
  fogPath: string;
  obstacles: Obstacle[];
  lightZones: LightZone[];
  audioZones: AudioZone[];
  triggerZones: TriggerZone[];
  drawings: MapDrawing[];
  tokens: Token[];
  audioUrl?: string;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Ping {
  id: string;
  x: number;
  y: number;
  color: string;
  createdAt: number;
  userId?: string;
}

// --- COMBAT SYSTEM ---
export type CombatCondition =
  | 'prone' | 'stunned' | 'paralyzed' | 'unconscious' | 'dead'
  | 'poisoned' | 'blinded' | 'deafened' | 'frightened' | 'charmed'
  | 'invisible' | 'restrained' | 'grappled' | 'incapacitated'
  | 'petrified' | 'exhausted' | 'concentrating';

export interface CombatEffect {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  duration: {
    type: 'rounds' | 'turns' | 'minutes' | 'hours' | 'permanent';
    value: number;
    remaining: number;
  };
  source?: string; // Quem aplicou
  conditions?: CombatCondition[];
  modifiers?: {
    ac?: number;
    speed?: number;
    advantage?: string[]; // Skills/saves com vantagem
    disadvantage?: string[];
  };
}

export interface CombatAction {
  id: string;
  timestamp: number;
  round: number;
  turn: number;
  combatantId: string;
  combatantName: string;
  type: 'damage' | 'heal' | 'effect' | 'move' | 'condition' | 'other';
  description: string;
  value?: number;
  targetId?: string;
  targetName?: string;
}

export interface CombatSettings {
  autoRollInitiative: boolean;
  autoAdvanceTurn: boolean; // Avançar automaticamente após X segundos
  autoAdvanceDelay: number; // Segundos
  showInitiativeToPlayers: boolean;
  showEnemyHP: boolean;
  showEnemyAC: boolean;
  trackConcentration: boolean;
  autoRemoveDeadCombatants: boolean;
  enableTurnTimer: boolean;
  turnTimerDuration: number; // Segundos
  enableSuggestions: boolean; // Sugestões inteligentes
}

export interface Combatant {
  id: string; // Token ID
  name: string;
  initiative: number;
  initiativeBonus?: number; // Para re-roll
  hp?: number;
  maxHp?: number;
  ac?: number;
  imgUrl?: string;
  type: 'pc' | 'npc';

  // Novos campos
  effects: CombatEffect[];
  conditions: CombatCondition[];
  isConcentrating?: boolean;
  concentrationSpell?: string;

  // Ações disponíveis
  actions: {
    action: boolean;
    bonusAction: boolean;
    reaction: boolean;
    movement: number; // Restante em metros
  };
}

export interface CombatStats {
  totalDamageDealt: number;
  totalHealingDone: number;
  roundsElapsed: number;
  combatStartTime: number;
  combatDuration?: number; // Calculado ao finalizar
}

export interface CombatState {
  isActive: boolean;
  round: number;
  turnOrder: Combatant[];
  activeTurnIndex: number;

  // Novos campos
  settings: CombatSettings;
  history: CombatAction[];
  turnStartTime?: number; // Para timer
  surpriseRound: boolean;

  // Estatísticas
  stats: CombatStats;
}


export interface TokenTemplate extends Omit<Token, 'id' | 'x' | 'y'> {
  id: string;
}

// --- CHAT & LOGS ---
export type ChatMessageType = 'message' | 'roll' | 'system';
export type ChatMessageVisibility = 'public' | 'gm' | 'private';

export interface ChatLinkMetadata {
  type: 'item' | 'spell' | 'attack' | 'feature' | 'token' | 'position' | 'movement' | 'damage' | 'heal' | 'compendium';
  label: string;
  data?: any;
  id?: string;
  // Deep Linking Properties
  compendiumSlug?: string;
  compendiumCategory?: 'monsters' | 'spells' | 'magicitems' | 'sections';
  contentMarkdown?: string;
}

export interface ChatMessageReaction {
  type: 'like' | 'dislike';
  count: number;
  users: string[];
}

export interface ChatMessage {
  id: string;
  campaignId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: ChatMessageType;
  visibility: ChatMessageVisibility;
  timestamp: number;
  rollDetails?: RollResult;
  link?: ChatLinkMetadata;
  reactions?: Record<string, ChatMessageReaction>;
}

export interface SessionLogConfig {
  movement: 'public' | 'gm';
  combat: 'public' | 'gm';
  rolls: 'public' | 'gm';
  system: 'public' | 'gm';
}

// Token Hover Visibility Permissions
export interface TokenHoverPermissions {
  pc: {  // Other players' Heroes
    showName: boolean;
    showHP: boolean;
    showResource: boolean;
    showConditions: boolean;
    showStats: boolean;  // AC, Speed, PP
    showAttributes: boolean;  // Roll buttons
  };
  npc: {  // Creatures/Monsters
    showName: boolean;
    showHP: boolean;
    showResource: boolean;
    showConditions: boolean;
    showStats: boolean;
    showAttributes: boolean;
  };
  object: {  // Objects/Items
    showName: boolean;
    showConditions: boolean;
  };
}

export interface PermissionSet {
  // Interação Básica
  tokenMovement: boolean;
  doorControl: boolean;
  drawings: boolean;
  measure: boolean;
  pingMap: boolean;
  diceRolling: boolean;

  // Gestão de Tokens
  tokenCreate: boolean;
  tokenEdit: boolean;
  tokenDelete: boolean;

  // Ferramentas Avançadas
  fogReveal: boolean;

  // Novas Permissões (Total Control)
  compendiumBrowse: boolean; // Acesso ao Compêndio
  journalCreate: boolean;    // Criar Notas/Handouts
  sheetEdit: boolean;        // Editar Ficha de Personagem
  initiativeRoll: boolean;   // Jogadores rolam sua própria iniciativa
  drawingDelete: boolean;    // Apagar desenhos (próprios ou todos)
  drawingClear: boolean;     // Limpar todos os desenhos

  // Privacidade
  shareCursor: boolean;
  allowSpectate: boolean;

  // Token Hover Visibility
  tokenHover: TokenHoverPermissions;

  // Logs
  logConfig: SessionLogConfig;

  // Overrides por Usuário
  userOverrides: Record<string, Partial<PermissionSet>>;
}

export type SessionPermissions = PermissionSet;

// --- RULER & MEASUREMENT ---
export type MeasurementMetric = 'euclidean' | 'chebyshev' | 'manhattan';

export interface RulerSettings {
  snapToGrid: boolean;
  metric: MeasurementMetric;
}

// --- DICE ---
export type RollMode = 'normal' | 'advantage' | 'disadvantage';
export type RollVisibility = 'public' | 'gm' | 'total';

export interface RollResult {
  total: number;
  formula: string;
  breakdown: string;
  diceResults: number[];
  isCritical: boolean;
  isFumble: boolean;
  timestamp: number;
  label?: string;
  mode?: RollMode;
  visibility?: RollVisibility;
}

// --- AUDIO ---
export interface AudioTrack {
  name: string;
  url: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: AudioTrack[];
}

export interface SoundEffect {
  id: string;
  name: string;
  url: string;
}

// --- MISC ---
export type VTTTool = 'select' | 'pan' | 'measure-path' | 'fog-poly' | 'fog-rect' | 'draw-wall' | 'freehand-wall' | 'draw-door' | 'draw-window' | 'draw-light-rect' | 'draw-light-poly' | 'draw-audio-rect' | 'draw-audio-poly' | 'draw-trigger-rect' | 'draw-trigger-poly' | 'eraser' | 'eraser-audio' | 'eraser-trigger' | 'brush' | 'eraser-drawing';

export interface JournalEntry {
  id: string;
  campaignId: string;
  authorId: string;
  title: string;
  content: string;
  permissions: 'all' | 'players' | 'gm';
  createdAt: string;
  updatedAt: string;
}

export type HandoutType = 'text' | 'image' | 'video_link';
export type HandoutTheme = 'standard' | 'parchment' | 'terminal' | 'arcane';

export interface Handout {
  id: string;
  campaignId: string;
  name: string;
  type: HandoutType;
  content: string;
  theme?: HandoutTheme;
  sharedWith: string[];
  createdAt: string;
}

export interface TranslationEntry {
  key: string;
  translated: string;
  type: 'term' | 'description' | 'name';
}

export type LogVisibility = 'public' | 'gm';
