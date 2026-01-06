# VTT 2D Complete Feature Reference
> Developer documentation for 3D feature parity implementation

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Core Rendering System](#2-core-rendering-system)
3. [Token System](#3-token-system)
4. [Map Interactions](#4-map-interactions)
5. [Combat System](#5-combat-system)
6. [Permissions System](#6-permissions-system)
7. [Cursor & Ping System](#7-cursor--ping-system)
8. [Attack Zones](#8-attack-zones)
9. [Audio System](#9-audio-system)
10. [Handouts & Resources](#10-handouts--resources)
11. [Compendium](#11-compendium)
12. [GM Tools](#12-gm-tools)
13. [Character Sheet Integration](#13-character-sheet-integration)
14. [Scene Management](#14-scene-management)
15. [Chat & Communication](#15-chat--communication)
16. [Complete Type Reference](#16-complete-type-reference)
17. [WebSocket Events](#17-websocket-events)
18. [Implementation Priority Checklist](#18-implementation-priority-checklist)

---

## 1. Architecture Overview

### Directory Structure
```
components/vtt/
├── map/                        # Map rendering & interaction
│   ├── MapCanvas.tsx           # Main 2D canvas (197 lines)
│   ├── TokenHoverCard.tsx      # Token details on hover (250 lines)
│   └── hooks/                  # 10 specialized hooks
│       ├── useMapRenderer.ts   # Canvas draw loop (1179 lines)
│       ├── useMapInteraction.tsx # Event handlers (660 lines)
│       ├── useMapDrawing.ts    # Freehand brush (462 lines)
│       ├── useMapState.ts      # Local state
│       ├── useMapViewport.ts   # Pan/Zoom
│       ├── useMapTokens.ts     # Token layer logic
│       ├── useTokenLayer.ts    # Token animations
│       ├── useVisionLayer.ts   # GM/Player filtering
│       ├── useImageLoader.ts   # Asset caching
│       └── useLayerCache.ts    # Grid caching
│
├── VTTToolbar.tsx              # Tool selection (520 lines)
├── TokenContextMenu.tsx        # Right-click menu (214 lines)
├── TokenEditModal.tsx          # Token editor (745 lines)
├── TokenHoverCard.tsx          # Hover details (295 lines)
├── CombatTrackerEnhanced.tsx   # Combat UI (354 lines)
├── ChatPanel.tsx               # Chat & messaging (486 lines)
├── GameLog.tsx                 # Chat history with filters (622 lines)
├── DiceRoller.tsx              # Dice pool builder (364 lines)
├── SmartDiceRoller.tsx         # Formula-based roller (693 lines)
├── PermissionsModal.tsx        # Permission config (498 lines)
├── AttackZonePanel.tsx         # AOE templates (311 lines)
├── AttackZoneConfigModal.tsx   # Zone editor (600+ lines)
├── AudioPanel.tsx              # Audio manager (293 lines)
├── DrawingToolbar.tsx          # Brush settings (139 lines)
├── RulerToolbar.tsx            # Measurement settings (62 lines)
├── MapSettingsModal.tsx        # Scene config (348 lines)
├── CompendiumWindow.tsx        # Monster/Spell browser (855 lines)
├── HandoutTray.tsx             # Resource management (119 lines)
├── HandoutFormModal.tsx        # Handout editor (500+ lines)
├── SceneNavigation.tsx         # Multi-layer management (156 lines)
├── PartyList.tsx               # Player roster (142 lines)
├── CursorSettingsModal.tsx     # Cursor customization (400 lines)
├── CursorEditor.tsx            # Cursor editor component (780+ lines)
│
├── cursors/                    # Cursor components
│   └── CursorComponents.tsx    # 18 cursor SVGs (395 lines)
├── constants/
│   └── cursorShapes.ts         # Shape definitions (151 lines)
├── settings/
│   └── ViewSettingsModal.tsx   # View/Follow settings (233 lines)
├── notifications/
│   ├── FollowModeIndicator.tsx # Follow mode banner (60 lines)
│   └── PullViewNotification.tsx # Pull view toast (30 lines)
├── TokenSettings/
│   └── AuraSettingsPanel.tsx   # Aura configuration (482 lines)
├── CharacterSheet/             # 7 tab components
│   ├── SheetHeader.tsx
│   ├── SheetSidebar.tsx
│   ├── CombatTab.tsx
│   ├── SpellsTab.tsx
│   ├── InventoryTab.tsx
│   ├── FeaturesTab.tsx
│   └── BioTab.tsx
└── combat/
    ├── ActiveCombatantCard.tsx
    └── CombatantRow.tsx

context/gameSession/
├── types.ts                    # State & Context types (261 lines)
├── helpers.ts                  # Utility functions
├── constants.ts                # Default values
└── hooks/
    ├── useTokenActions.ts      # Token CRUD (373 lines)
    ├── useCombatActions.ts     # Combat management (18KB)
    ├── useAttackZoneActions.ts # AOE zones (67 lines)
    ├── useAuraSystem.ts        # Aura calculations (217 lines)
    ├── useCharacterActions.ts  # Character updates
    ├── useChatActions.ts       # Chat messaging
    ├── useDrawingActions.ts    # Freehand drawings
    ├── useSceneActions.ts      # Scene CRUD
    ├── useObstacleActions.ts   # Walls/Doors/Windows
    ├── useZoneActions.ts       # Light/Audio/Trigger zones
    ├── useHandoutActions.ts    # Handout management
    ├── useAudioActions.ts      # Audio playback
    ├── usePermissions.ts       # Permission checking
    ├── useMapInteraction.ts    # Viewport/Tool state
    ├── useUiActions.ts         # UI panel toggles
    └── listeners/              # 12 WebSocket listeners
        ├── tokenListeners.ts
        ├── combatListeners.ts
        ├── chatListeners.ts
        ├── sceneListeners.ts
        ├── playerListeners.ts
        ├── campaignListeners.ts
        ├── audioListeners.ts
        ├── drawingListeners.ts
        ├── characterListeners.ts
        └── attackZoneListeners.ts
```

### Component Count Summary
| Category | Count | Total Lines |
|----------|-------|-------------|
| Main Components | 36 | ~8,000 |
| Map Hooks | 10 | ~2,500 |
| Action Hooks | 19 | ~3,000 |
| WebSocket Listeners | 12 | ~800 |

---

## 2. Core Rendering System

### Rendering Layers (draw order)
1. **Background** - Scene image
2. **Grid** - Cached grid lines with optional coordinates
3. **Light Zones** - Brightness overlays
4. **Audio Zones** - Spatial audio indicators
5. **Trigger Zones** - Handout triggers
6. **Obstacles** - Walls (polygons), Doors, Windows (lines)
7. **Fog of War** - Vision masking via SVG path
8. **Drawings** - User brush strokes
9. **Attack Zones** - AOE templates with targeting
10. **Tokens** - With conditions, HP bars, auras
11. **Token Auras** - Circle/square area effects
12. **Selection Box** - Multi-select rectangle
13. **Movement Path** - Token drag ruler
14. **Remote Drags** - Other players' token movements
15. **Pings** - Click indicators with animations
16. **Remote Cursors** - Other players' mice with names
17. **Vision Ranges** - Debug visualization (optional)
18. **Grid Coordinates** - Debug labels (optional)

### Performance Optimizations
- `viewportRef` for immediate pan updates without re-render
- `mouseWorldPosRef` for cursor position during drag
- Off-screen grid caching via `useLayerCache`
- Image caching via `useImageLoader`
- Animation frame batching

---

## 3. Token System

### Token Data Model
```typescript
interface Token {
  // Core
  id: string;
  type: 'pc' | 'npc' | 'object';
  name: string;
  x: number;                      // Grid position
  y: number;
  size: number;                   // Grid squares
  imgUrl: string;
  rotation?: number;              // Degrees
  isVisibleToPlayers: boolean;
  ownerId?: string;
  controlledBy?: string[];
  linkedId?: string;              // Character sheet ID
  
  // Health & Status
  bars?: {
    bar1?: { value, max, visible, color };
    bar2?: { value, max, visible, color };
  };
  conditions?: Condition[];
  effects?: CombatEffect[];
  
  // Auras
  auras?: Aura[];
  ignoredAuras?: string[];        // User-dismissed
  
  // Vision & Light
  visionRange?: number;
  darkvisionRange?: number;
  visionColor?: string;
  light?: LightConfig;
  
  // Visual Styling
  shape?: 'circle' | 'square' | 'hex' | 'topdown';
  scale?: number;
  border?: { color, width, style };
  tint?: string;
  idleAnimation?: 'none' | 'breath' | 'float' | 'spin' | 'wobble';
  effect?: 'none' | 'ghostly' | 'burning' | 'frozen' | 'glitch' | 'outline';
  
  // Image Offset
  imageX?: number;                // -0.5 to 0.5
  imageY?: number;
  imageRotation?: number;
  
  // Mini-Sheet (NPC stats)
  stats?: TokenStats;
  speed?: number;
  disposition?: 'friendly' | 'neutral' | 'hostile';
  
  // Display Mode
  displayMode?: 'image' | 'text';
  textDetails?: { text, backgroundColor, textColor };
}
```

### Token Actions (80+)
```typescript
// Movement
moveToken(id, x, y)
moveTokens(updates[])              // Batch
emitTokenDrag(id, x, y, path)      // Real-time

// CRUD
addToken(token)
updateToken(id, changes)
removeToken(id)
moveTokenToScene(tokenId, sceneId)

// Selection
selectToken(id, multi)
clearSelection()
```

### Light Configuration
```typescript
interface LightConfig {
  enabled: boolean;
  brightRadius: number;           // Grid squares
  dimRadius: number;
  color: string;
  intensity: number;              // 0-1
  animation: 'none' | 'torch' | 'pulse' | 'chroma';
}
```

### Aura System
```typescript
interface Aura {
  id: string;
  name: string;
  radius: number;
  color: string;
  shape: 'circle' | 'square';
  effects: CombatEffect[];
  targets: 'all' | 'allies' | 'enemies' | 'self';
  active: boolean;
  visible?: boolean;              // GM-only
  includedTokenIds?: string[];    // Force include
  excludedTokenIds?: string[];    // Force exclude
  category?: 'offensive' | 'defensive' | 'support' | 'control';
}
```

**Auto-apply logic:**
- Effects applied when tokens enter aura radius
- Effects removed when tokens exit (via `sourceAuraId`)
- `disposition` field determines ally/enemy targeting
- Manual overrides via `includedTokenIds`/`excludedTokenIds`

### Conditions (17)
```typescript
type Condition =
  | 'dead' | 'bloodied' | 'stunned' | 'shielded' | 'alert'
  | 'prone' | 'paralyzed' | 'unconscious' | 'poisoned'
  | 'blinded' | 'deafened' | 'frightened' | 'charmed'
  | 'invisible' | 'restrained' | 'grappled' | 'concentrating';
```

---

## 4. Map Interactions

### Tools (21)
```typescript
type VTTTool =
  | 'select'            // Default selection/drag
  | 'pan'               // Map panning
  | 'measure-path'      // Distance ruler
  | 'fog-poly'          // Polygonal fog reveal
  | 'fog-rect'          // Rectangular fog reveal
  | 'draw-wall'         // Wall obstacles
  | 'freehand-wall'     // Continuous wall drawing
  | 'smart-wall'        // Auto-snapping walls
  | 'draw-door'         // Door obstacles
  | 'draw-window'       // Window obstacles
  | 'draw-light-rect'   // Light zone (rect)
  | 'draw-light-poly'   // Light zone (poly)
  | 'draw-audio-rect'   // Audio zone (rect)
  | 'draw-audio-poly'   // Audio zone (poly)
  | 'draw-trigger-rect' // Trigger zone (rect)
  | 'draw-trigger-poly' // Trigger zone (poly)
  | 'eraser'            // Obstacle eraser
  | 'eraser-audio'      // Audio zone eraser
  | 'eraser-trigger'    // Trigger zone eraser
  | 'brush'             // Freehand drawing
  | 'eraser-drawing';   // Drawing eraser
```

### Mouse Events
| Event | Actions |
|-------|---------|
| **Left Click** | Select token, clear selection, place zone point |
| **Right Click** | Context menu (token or map) |
| **Double Click** | Open token sheet, create token |
| **Drag (token)** | Move token(s), show ruler |
| **Drag (empty)** | Box selection or pan |
| **Wheel** | Zoom (centered on cursor) |
| **Move** | Cursor broadcast, hover detection |

### Measurement Ruler
```typescript
interface RulerSettings {
  snapToGrid: boolean;
  metric: 'euclidean' | 'chebyshev' | 'manhattan';
}
```
- **Euclidean:** Real distance (diagonal = √2)
- **Chebyshev:** D&D 5e style (diagonal = 1)
- **Manhattan:** Only orthogonal (no diagonals)

### Drawing System
```typescript
interface DrawingSettings {
  color: string;
  width: number;        // 1-20px
  opacity: number;      // 0.1-1.0
}

interface MapDrawing {
  id: string;
  userId: string;
  points: Point[];
  color, width, opacity;
}
```

Actions:
- `addDrawing(drawing)` - Real-time sync
- `removeDrawing(id)`
- `undoLastDrawing()` - Own strokes only
- `clearAllDrawings()` - GM permission required

### Obstacles
```typescript
type ObstacleType = 'wall' | 'door' | 'window';

interface LineObstacle {
  type: 'door' | 'window';
  p1, p2: Point;
  blocksVision, blocksMovement: boolean;
  hidden?: boolean;
}

interface PolygonObstacle {
  type: 'wall';
  points: Point[];
  open?: boolean;           // Not closed loop
  blocksVision, blocksMovement: boolean;
  hidden?: boolean;
}
```

---

## 5. Combat System

### Combat State
```typescript
interface CombatState {
  isActive: boolean;
  round: number;
  turnOrder: Combatant[];
  activeTurnIndex: number;
  settings: CombatSettings;
  history: CombatAction[];
  turnStartTime?: number;
  surpriseRound: boolean;
  stats: CombatStats;
}
```

### Combatant
```typescript
interface Combatant {
  id: string;                   // Token ID
  name: string;
  initiative: number;
  initiativeBonus?: number;
  hp?, maxHp?, ac?: number;
  imgUrl?: string;
  type: 'pc' | 'npc';
  effects: CombatEffect[];
  conditions: CombatCondition[];
  isConcentrating?: boolean;
  concentrationSpell?: string;
  actions: {
    action: boolean;
    bonusAction: boolean;
    reaction: boolean;
    movement: number;           // Remaining meters
  };
}
```

### Combat Settings
```typescript
interface CombatSettings {
  autoRollInitiative: boolean;
  autoAdvanceTurn: boolean;
  autoAdvanceDelay: number;     // Seconds
  showInitiativeToPlayers: boolean;
  showEnemyHP: boolean;
  showEnemyAC: boolean;
  trackConcentration: boolean;
  autoRemoveDeadCombatants: boolean;
  enableTurnTimer: boolean;
  turnTimerDuration: number;
  enableSuggestions: boolean;
}
```

### Combat Actions (20+)
```typescript
// Turn Management
startCombat(combatants?, settings?)
endCombat()
nextTurn()
previousTurn()
goToTurn(index)

// Combatant CRUD
addCombatant(combatant)
removeCombatant(id)
updateCombatant(id, data)
rerollInitiative(id?)
updateCombatSettings(settings)

// Damage/Healing
applyDamage(targetId, amount, source?)
applyHealing(targetId, amount, source?)

// Effects/Conditions
applyEffect(targetId, effect)
removeEffect(targetId, effectId)
addCondition(targetId, condition)
removeCondition(targetId, condition)

// Action Tracking
toggleAction(id, 'action'|'bonusAction'|'reaction')
resetActions(id)
checkConcentration(id, damage)

// Utility
getCombatStats()
exportCombatLog()
```

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Next turn |
| `Shift+Space` | Previous turn |
| `N` | Next turn |
| `P` | Previous turn |
| `C` | Toggle combat panel |
| `Escape` | Deselect |

---

## 6. Permissions System

### Permission Set (40+ toggles)
```typescript
interface PermissionSet {
  // Basic Interaction
  tokenMovement: boolean;
  doorControl: boolean;
  drawings: boolean;
  measure: boolean;
  pingMap: boolean;
  diceRolling: boolean;
  
  // Token Management
  tokenCreate: boolean;
  tokenEdit: boolean;
  tokenDelete: boolean;
  
  // Advanced Tools
  fogReveal: boolean;
  compendiumBrowse: boolean;
  bestiaryBrowse: boolean;
  journalCreate: boolean;
  sheetEdit: boolean;
  initiativeRoll: boolean;
  drawingDelete: boolean;
  drawingClear: boolean;
  
  // Attack Zones
  attackZoneCreate: boolean;
  attackZoneUse: boolean;
  
  // Cursor Customization
  cursorAllowColorChange: boolean;
  cursorAllowShapeChange: boolean;
  cursorAllowNameChange: boolean;
  cursorAllowAnimationChange: boolean;
  cursorAllowAnimationColorChange: boolean;
  
  // GM Cursor Overrides (per-player)
  cursorOverrides: Record<string, {
    color?, shape?, name?;
    clickAnimation?, clickColorLeft?, clickColorRight?;
  }>;
  
  // Chat
  chatGlobalAllowed: boolean;
  chatPrivateAllowed: boolean;
  
  // Privacy
  shareCursor: boolean;
  allowSpectate: boolean;
  
  // Token Hover Visibility
  tokenHover: TokenHoverPermissions;
  
  // Viewport Sharing
  showRemoteViewports: boolean;
  shareViewport: boolean;
  
  // Logs
  logConfig: SessionLogConfig;
  
  // Per-User Overrides
  userOverrides: Record<string, Partial<PermissionSet>>;
}
```

### Token Hover Permissions
```typescript
interface TokenHoverPermissions {
  enabled: boolean;
  pc: {
    showName, showHP, showResource,
    showConditions, showStats, showAttributes;
  };
  npc: { /* same */ };
  object: { showName, showConditions };
}
```

### Permission Helper Pattern
```typescript
// ALWAYS use PermissionHelper for checks
const { permissionHelper } = useGameSession();

permissionHelper.canMoveToken(tokenId);
permissionHelper.canAsGMOr('tokenCreate');
permissionHelper.isAllowed('drawings');
permissionHelper.isGameMaster();
```

---

## 7. Cursor & Ping System

### Cursor Shapes (18)
| ID | Label |
|----|-------|
| `default` | Seta Padrão |
| `hand` | Mão |
| `sword` | Espada |
| `target` | Alvo |
| `wand` | Varinha |
| `paw` | Pata |
| `skull` | Caveira |
| `gem` | Gema |
| `quill` | Pena |
| `eye` | Olho |
| `ghost` | Fantasma |
| `heart` | Coração |
| `shield` | Escudo |
| `potion` | Poção |
| `lightning` | Raio |
| `star` | Estrela |
| `axe` | Machado |
| `crown` | Coroa |

### Click Animations (9)
`'ripple' | 'burst' | 'sparkle' | 'pulse' | 'vortex' | 'shard' | 'ring' | 'echo' | 'orb'`

### Ping Animations (9)
`'radar' | 'beacon' | 'sonar' | 'pulse' | 'target' | 'ripple' | 'flare' | 'diamond' | 'cross'`

### Cursor Settings
```typescript
interface CursorSettings {
  color: string;
  name: string;
  shape?: string;
  clickAnimation?: ClickAnimationType;
  clickColorLeft?: string;
  clickColorRight?: string;
  pingColor?: string;
  pingAnimation?: PingAnimationType;
}
```

### Ping Data
```typescript
interface Ping {
  id: string;
  x, y: number;                 // World coordinates
  color: string;
  createdAt: number;            // Timestamp
  userId?, userName?: string;
  animationStyle?: PingAnimationType;
}
```

---

## 8. Attack Zones

### Zone Shapes
```typescript
type AttackZoneShape =
  | 'circle'      // Fireball
  | 'cone'        // Burning Hands
  | 'line'        // Lightning Bolt
  | 'square'      // Thunderwave
  | 'rectangle'   // Custom
  | 'polygon';    // Custom
```

### Propagation Modes
- **blocked:** Stops at walls (default)
- **penetrating:** Ignores walls
- **spreading:** Wraps around corners

### Zone Configuration
```typescript
interface AttackZoneConfig {
  id, name, description?;
  
  // Geometry
  shape: AttackZoneShape;
  radius?, length?, width?, angle?, direction?;
  points?: Point[];
  origin: Point;
  sourceTokenId?: string;
  
  // Behavior
  propagation: AttackZonePropagation;
  respectsVision: boolean;
  maxRange?: number;
  
  // Targeting
  targeting: 'all' | 'allies' | 'enemies' | 'objects' | 'custom';
  includeTokenIds?, excludeTokenIds?: string[];
  
  // Visual
  color, opacity, borderColor?, borderWidth?;
  showAffectedTokens?, affectedTokenColor?;
  
  // Metadata
  damageFormula?, damageType?, saveType?, saveDC?, effectIds?;
}
```

### Presets (5)
| Name | Shape | Size | Damage |
|------|-------|------|--------|
| Bola de Fogo | circle | 4 sq (20ft) | 8d6 fire |
| Cone de Frio | cone | 12 sq (60ft) | 8d8 cold |
| Raio | line | 20 sq (100ft) | 8d6 lightning |
| Mãos Flamejantes | cone | 3 sq (15ft) | 3d6 fire |
| Onda Trovejante | square | 3 sq (15ft) | 2d8 thunder |

---

## 9. Audio System

### Audio Settings
```typescript
interface AudioSettings {
  playlists: Playlist[];
  soundboard: SoundEffect[];
}

interface Playlist {
  id, name: string;
  tracks: AudioTrack[];
}

interface AudioTrack {
  name, url: string;
}

interface SoundEffect {
  id, name, url: string;
}
```

### Audio Zones (Spatial)
```typescript
interface AudioZone {
  id: string;
  type: 'rect' | 'polygon';
  rect?: { x, y, w, h };
  points?: Point[];
  audioUrl: string;
  volume: number;
  radius: number;               // Falloff distance
}
```

**Behavior:** Volume fades as tokens move away from zone center.

---

## 10. Handouts & Resources

### Handout Types
```typescript
type HandoutType = 'text' | 'image' | 'video_link';
type HandoutTheme = 'standard' | 'parchment' | 'terminal' | 'arcane';

interface Handout {
  id, campaignId, name: string;
  type: HandoutType;
  content: string;
  theme?: HandoutTheme;
  sharedWith: string[];
  createdAt: string;
}
```

### Trigger Zones
Handouts can be linked to map zones that auto-display when tokens enter:
```typescript
interface TriggerZone {
  id: string;
  type: 'rect' | 'polygon';
  rect?: { x, y, w, h };
  points?: Point[];
  handoutId: string;
}
```

### Handout Actions
```typescript
createHandout(data)
updateHandout(id, data)
deleteHandout(id)
shareHandout(id, playerIds[])
unshareHandout()
```

---

## 11. Compendium

### Categories
```typescript
type CompendiumCategory =
  | 'monsters'    // Bestiário
  | 'spells'      // Magias
  | 'magicitems'  // Itens Mágicos
  | 'sections';   // Regras/Seções
```

### Features
- **Search with filters** by level, school, type
- **Favorites** system with local storage
- **Translation** support for D&D content
- **Sharing** via chat with rich cards
- **Deep linking** to specific entries
- **Token creation** from monster data
- **Monster images** with fallback handling

### Monster Data Applied to Token
```typescript
// When creating token from monster:
applyMonsterStats(monster) {
  setStats({
    ac: monster.armor_class[0].value,
    speed: translateSpeed(monster.speed),
    attributes: parseAttributes(monster),
    cr: monster.challenge_rating,
    ...
  });
}
```

---

## 12. GM Tools

### Follow Mode
```typescript
interface FollowMode {
  active: boolean;
  targets: string[] | 'all';
}

// Actions
toggleFollowMode(active, targets?)
pullView(targetId, x, y, zoom)
```

**Behavior:**
- GM enables → Selected players' viewports sync to GM
- Indicator shows for both GM and affected players
- Players can't pan/zoom while following

### View Settings Modal
- **Ghost Walls:** Toggle obstacle visibility
- **Vision Ranges:** Debug token sight
- **Grid Coordinates:** Debug labels
- **Viewport Visibility:** Per-player toggle
- **Follow Target Selection:** Choose specific players

### Remote Viewports
```typescript
remoteViewports: Record<string, Viewport & { w, h }>;

// Visual: Colored rectangles showing what each player sees
```

---

## 13. Character Sheet Integration

### Sheet Tabs (7)
| Tab | Content |
|-----|---------|
| **Header** | Avatar, name, class, level |
| **Sidebar** | HP, AC, attributes, saves |
| **Combat** | Attacks, spell slots, actions |
| **Spells** | Spell list with preparation |
| **Inventory** | Items, currency, weight |
| **Features** | Class/race/feat abilities |
| **Bio** | Personality, backstory, appearance |

### Token Linking
- `token.linkedId` → `character.id`
- HP bar syncs with `character.hpCurrent/hpMax`
- Conditions sync
- Roll buttons use character bonuses

### Character Actions
```typescript
updateCharacter(id, data, immediate?)
toggleFieldPrivacy(characterId, fieldName)
// Character updates broadcast via WebSocket
```

---

## 14. Scene Management

### Scene Structure
```typescript
interface MapScene {
  id, name, imageUrl: string;
  grid: GridOptions;
  ambientLight: number;         // 0-1
  fogPath: string;              // SVG path
  obstacles: Obstacle[];
  lightZones: LightZone[];
  audioZones: AudioZone[];
  triggerZones: TriggerZone[];
  drawings: MapDrawing[];
  tokens: Token[];
  audioUrl?: string;            // Background music
}

interface GridOptions {
  size: number;                 // Pixels per cell
  color: string;
  alpha: number;
  cols, rows: number;
  unitsPerSquare: number;       // e.g., 1.5m
}
```

### Scene Actions
```typescript
switchScene(id)
addScene(name)
deleteScene(id)
updateSceneData(id, changes)
```

### Multi-Layer Support
- GM can create multiple scenes (floors/areas)
- Scene navigation panel shows thumbnails
- Token count per scene
- Switch broadcasts to all players

---

## 15. Chat & Communication

### Message Types
```typescript
interface ChatMessage {
  id, campaignId, senderId, senderName, content: string;
  type: 'message' | 'roll' | 'system';
  visibility: 'public' | 'gm' | 'private';
  timestamp: number;
  rollDetails?: RollResult;
  link?: ChatLinkMetadata;
  reactions?: Record<string, { type, count, users[] }>;
  
  // Character Voice
  characterId?, characterName?, characterAvatarUrl?: string;
  
  // Private Message
  recipientId?, recipientName?: string;
}
```

### Rich Links
```typescript
interface ChatLinkMetadata {
  type: 'item' | 'spell' | 'attack' | 'feature' | 'token' | 
        'position' | 'movement' | 'damage' | 'heal' | 'compendium';
  label: string;
  data?: any;
  id?: string;
  // Deep linking
  compendiumSlug?, compendiumCategory?, contentMarkdown?: string;
}
```

### Chat Features
- **Character Voice:** Send as character with avatar
- **Private Messages:** Whisper to specific player or GM
- **Reactions:** Like/dislike with user tracking
- **Rich Cards:** Expandable item/spell details
- **Roll Results:** Formatted with critical/fumble indicators
- **Deep Links:** Click to navigate to compendium entries

---

## 16. Complete Type Reference

### GameSessionState
```typescript
interface GameSessionState {
  // Core Data
  campaign: Campaign | null;
  scenes: MapScene[];
  activeSceneId: string;
  combat: CombatState | null;
  players: User[];
  campaignCharacters: Character[];
  chatMessages: ChatMessage[];
  handouts: Handout[];
  templates: TokenTemplate[];
  
  // Client View
  viewport: Viewport;
  isGM: boolean;
  gmViewMode: 'gm' | 'player';
  previewPlayerId: string | 'all';
  activeTool: VTTTool;
  
  // Selection & Tools
  selectedTokenIds: string[];
  movementPath: Point[];
  drawingObstacle, drawingLightZone, drawingAudioZone, drawingTriggerZone;
  draftPolyPoints: Point[];
  
  // Settings
  drawingSettings: DrawingSettings;
  rulerSettings: RulerSettings;
  cursorSettings: CursorSettings;
  permissions: SessionPermissions;
  audioSettings: AudioSettings;
  
  // Ephemeral (real-time)
  pings: Ping[];
  remoteDrags: Record<string, TokenDragPayload>;
  remoteCursors: Record<string, CursorMovePayload>;
  remoteViewports: Record<string, Viewport & { w, h }>;
  attackZones: AttackZoneConfig[];
  
  // State Flags
  isConnected, isLoading, pullNotification: boolean;
  followMode: { active, targets };
  activeAudioZoneUrl: string | null;
  triggeredHandoutId, lastTriggeredZoneId: string | null;
  
  // UI State
  ui: {
    isRightSidebarOpen, isLibraryOpen, isDiceRollerOpen, isAudioPanelOpen;
    gmHideObstacles, showVisionRanges, showGridCoordinates, defaultObstacleHidden;
  };
}
```

### GameSessionContextType (80+ actions)
All state properties plus:

```typescript
// See Section 3-15 for detailed action signatures
```

---

## 17. WebSocket Events

### Complete Event List
```typescript
interface SocketEventMap {
  // Room
  'room:join', 'room:sync'
  
  // Tokens
  'token:update', 'token:drag', 'token:add', 'token:remove'
  
  // Combat
  'combat:update', 'combat:start', 'combat:end', 'combat:next-turn'
  'combat:combatant:add', 'combat:combatant:update', 'combat:combatant:remove'
  
  // Communication
  'cursor:move', 'cursor:click', 'map:ping'
  'chat:message', 'chat:reaction', 'dice:roll'
  
  // GM Features
  'gm:pull_view', 'gm:force_view', 'gm:toggle_follow', 'gm:sync_view'
  'viewport:update', 'viewport:restore'
  
  // Scenes
  'scene:add', 'scene:update', 'scene:delete', 'scene:switch'
  
  // Campaign
  'campaign:update', 'campaign:permissionsUpdated'
  
  // Assets
  'handout:update', 'drawing:add', 'drawing:remove'
  'audio:play', 'audio:pause', 'audio:stop', 'audio:sfx'
  
  // Attack Zones
  'attackZone:add', 'attackZone:update', 'attackZone:remove', 'attackZone:clear'
  
  // Players
  'player:join', 'player:leave'
  
  // Characters
  'character:add', 'character:update', 'character:delete'
}
```

---

## 18. Implementation Priority Checklist

### Phase 1: Core Rendering ✅
- [x] Token positioning
- [x] Token selection
- [x] Token dragging
- [x] Grid layer
- [x] Map image

### Phase 2: Token Visuals
- [ ] HP bars (bar1, bar2)
- [ ] Condition icons
- [ ] Token borders/shapes
- [ ] Idle animations
- [ ] Visual effects (ghostly, burning, etc.)

### Phase 3: Token Features
- [ ] Auras (circle/square)
- [ ] Light emission
- [ ] Vision ranges
- [ ] Token rotation

### Phase 4: Interactions
- [x] Map click deselection
- [x] Token context menu
- [x] Pings
- [x] Remote cursors
- [ ] Measurement ruler
- [ ] Box selection
- [ ] Attack zones (AOE)

### Phase 5: Advanced
- [ ] Fog of War
- [ ] Obstacles (walls/doors)
- [ ] Light zones
- [ ] Audio zones (spatial audio)
- [ ] Trigger zones

### Phase 6: Combat UI
- [ ] Combat tracker integration
- [ ] Turn indicators
- [ ] Concentration tracking

### Phase 7: Polish
- [ ] Drawing system
- [ ] Remote viewports
- [ ] Follow mode sync
- [ ] Token animations

---

> **This document is the authoritative source of truth for VTT 2D features.** Each 3D implementation should reference the corresponding 2D component for exact behavior specifications.
