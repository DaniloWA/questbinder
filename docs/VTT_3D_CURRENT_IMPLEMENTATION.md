# VTT 3D Current Implementation Reference
> Developer documentation of existing 3D VTT features

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Entry Point & Canvas](#2-entry-point--canvas)
3. [Core Systems](#3-core-systems)
4. [Layers](#4-layers)
5. [Token System](#5-token-system)
6. [Interaction System](#6-interaction-system)
7. [State Management](#7-state-management)
8. [UI Components](#8-ui-components)
9. [Type Definitions](#9-type-definitions)
10. [Implementation Status](#10-implementation-status)

---

## 1. Architecture Overview

### Directory Structure
```
modules/vtt/map3d/
├── MapCanvas3D.tsx              # Entry point (43 lines)
├── core/
│   ├── Stage.tsx                # Main compositor (36 lines)
│   ├── camera/
│   │   ├── CameraRig.tsx        # OrthographicCamera + MapControls (41 lines)
│   │   └── hooks/
│   │       └── useCameraSync.ts # Viewport sync hook
│   ├── lighting/
│   │   ├── SceneLighting.tsx    # Ambient + directional lights (20 lines)
│   │   └── hooks/
│   │       └── useLightingPreset.ts
│   ├── providers/
│   │   ├── Map3DContext.tsx     # React context provider
│   │   └── MapStoreInitializer.tsx
│   └── optimization/            # (Empty - future LOD/instancing)
│
├── entities/
│   └── tokens/
│       ├── Token3D.tsx          # Main token component (68 lines)
│       ├── TokenManager.tsx     # Token iterator (24 lines)
│       ├── components/
│       │   ├── TokenVisuals.tsx    # Circle mesh + texture (47 lines)
│       │   ├── TokenRing.tsx       # Selection ring (28 lines)
│       │   ├── TokenLight.tsx      # PointLight emission (43 lines)
│       │   └── TokenOverlays.tsx   # HTML nameplate/HP bar (70 lines)
│       └── hooks/
│           ├── useTokenDrag.ts     # @use-gesture drag (51 lines)
│           ├── useTokenSelection.ts # Click selection (30 lines)
│           └── useTokenState.ts    # Position calculation (35 lines)
│
├── layers/
│   ├── base/
│   │   └── Layer.tsx            # Abstract base (placeholder)
│   ├── map/
│   │   ├── MapLayer.tsx         # Scene image plane (32 lines)
│   │   └── hooks/
│   │       └── useMapTexture.ts
│   ├── grid/
│   │   ├── GridLayer.tsx        # Shader-based grid (52 lines)
│   │   └── GridShader.ts        # GLSL vertex/fragment (32 lines)
│   └── effects/
│       └── EffectLayer.tsx      # Post-processing (commented out)
│
├── interaction/
│   ├── gestures/
│   │   └── GestureHandler.tsx   # Touch/mouse gestures
│   ├── raycasting/
│   │   ├── RaycastManager.tsx   # Raycaster setup (33 lines)
│   │   └── useRaycast.ts        # Raycast hook (16 lines)
│   └── selection/
│       ├── SelectionBox.tsx     # Box select visual (placeholder)
│       └── useBoxSelect.ts      # Box select logic (placeholder)
│
├── ui/
│   ├── overlay/
│   │   ├── MapOverlay.tsx       # 2D UI container (89 lines)
│   │   ├── VTTToolbarWrapper.tsx # Toolbar bridge (95 lines)
│   │   ├── ToolPanel.tsx        # Quick tools (50 lines)
│   │   └── RadialMenu.tsx       # (Placeholder)
│   ├── world/
│   │   ├── WorldUiManager.tsx   # Pings & cursors manager (22 lines)
│   │   ├── Ping3D.tsx           # 3D ping animation (38 lines)
│   │   └── RemoteCursor3D.tsx   # Remote cursor with nameplate (44 lines)
│   └── mobile/
│       ├── MobileControls.tsx   # (Placeholder)
│       └── MobileVTTToolbar.tsx # Mobile toolbar (450 lines)
│
├── store/
│   ├── mapStore.ts              # Map/grid state (57 lines)
│   ├── tokenStore.ts            # Token CRUD (47 lines)
│   ├── selectionStore.ts        # Selection state (34 lines)
│   └── uiStore.ts               # UI state (32 lines)
│
├── shared/
│   ├── constants/
│   │   ├── map.constants.ts
│   │   └── token.constants.ts
│   └── utils/
│       └── math/
│           └── coordinates.ts   # Grid/world conversion
│
└── types/
    ├── token.types.ts           # Token interface (48 lines)
    └── map.types.ts             # Map/Grid types (29 lines)
```

### Component Hierarchy
```
MapCanvas3D
└── Map3DProvider (Context)
    └── Canvas (R3F)
        └── Suspense
            └── Stage
                ├── CameraRig
                │   ├── OrthographicCamera
                │   └── MapControls
                ├── SceneLighting
                │   ├── ambientLight
                │   └── directionalLight
                ├── GestureHandler
                ├── RaycastManager
                ├── group "Layers"
                │   ├── MapLayer (planeGeometry + texture)
                │   └── GridLayer (shaderMaterial)
                ├── group "Entities"
                │   └── TokenManager
                │       └── Token3D (per token)
                │           ├── TokenVisuals
                │           ├── TokenRing
                │           ├── TokenLight
                │           └── TokenOverlays (Html)
                └── group "UI-World"
                    └── WorldUiManager
                        ├── Ping3D (per ping)
                        └── RemoteCursor3D (per cursor)
```

---

## 2. Entry Point & Canvas

### MapCanvas3D.tsx
```typescript
// Key configuration
<Canvas
  shadows
  orthographic
  dpr={[1, 2]}
  gl={{ antialias: true, alpha: true }}
>
```

**Features:**
- Leva debug GUI (top-right)
- Stats performance monitor
- Map3DProvider context wrapper
- Suspense for asset loading

---

## 3. Core Systems

### Stage.tsx
Central compositor that renders all scene components in order:
1. CameraRig (camera + controls)
2. SceneLighting (ambient + directional)
3. GestureHandler (input processing)
4. RaycastManager (hit detection)
5. Layers group (MapLayer, GridLayer)
6. Entities group (TokenManager)
7. UI-World group (WorldUiManager)

### CameraRig.tsx
```typescript
<OrthographicCamera
  makeDefault
  position={[viewport.x, 100, viewport.y]}
  zoom={viewport.zoom}
  near={0.1}
  far={1000}
/>
<MapControls
  enableRotate={false}
  screenSpacePanning={false}
  enableDamping={true}
  dampingFactor={0.1}
  minZoom={0.1}
  maxZoom={5.0}
/>
```

**Features:**
- Y-up coordinate system (XZ plane for map)
- Rotation disabled (top-down view)
- Damped panning for smooth feel
- useCameraSync hook for viewport state

### SceneLighting.tsx
- `ambientLight` intensity 0.6
- `directionalLight` from above with shadows

---

## 4. Layers

### MapLayer.tsx
- `planeGeometry` with scene dimensions
- `meshBasicMaterial` with scene image texture
- Positioned at Y=0 (ground plane)
- Rotated -90° on X-axis to lie flat

### GridLayer.tsx
```typescript
// Custom GLSL shader for grid lines
<shaderMaterial
  vertexShader={vertexShader}
  fragmentShader={fragmentShader}
  uniforms={{
    uSize: { value: grid.size },
    uColor: { value: new THREE.Color(grid.color) },
    uThickness: { value: 0.05 },
    uAlpha: { value: 0.5 }
  }}
  transparent={true}
/>
```

**Features:**
- Procedural grid via shader (no geometry)
- Click handler for deselection
- Visibility toggle via uiStore

---

## 5. Token System

### Token3D.tsx
Main token component using composition pattern:

```typescript
<animated.group
  position={animatedPos.to((x, y) => [x, 0.05, y])}
  rotation={[-Math.PI / 2, 0, rotation]}
  onClick={onClick}
  onContextMenu={handleContextMenu}
  {...bindDrag()}
>
  <TokenVisuals token={token} />
  <TokenRing token={token} visible={isSelected} />
  <TokenLight config={token.light} />
  <TokenOverlays token={token} />
</animated.group>
```

**Features:**
- `@react-spring/three` for smooth position animation
- `@use-gesture/react` for drag handling
- Composition of visual sub-components

### TokenVisuals.tsx
```typescript
<mesh castShadow receiveShadow>
  <circleGeometry args={[radius, 32]} />
  <meshStandardMaterial
    map={texture}
    color={token.color}
    side={DoubleSide}
    transparent
  />
</mesh>
```

### TokenRing.tsx
- Selection indicator (ring geometry)
- Controlled by `isSelected` state

### TokenLight.tsx
```typescript
<pointLight
  color={config.color}
  intensity={config.intensity}
  distance={config.dimRadius * gridSize * 2}
  decay={2}
  castShadow={config.castShadow}
  position={[0, 0, gridSize * 0.5]}
/>
```

### TokenOverlays.tsx
Uses `@react-three/drei` Html component for 2D overlays:
- Nameplate (token.name)
- HP Bar (bar1, optional)
- CSS transitions for smooth updates

### Token Hooks

| Hook | Purpose | Status |
|------|---------|--------|
| `useTokenState` | Calculate world position | ✅ Complete |
| `useTokenSelection` | Click selection logic | ✅ Complete |
| `useTokenDrag` | Drag + emit events | ⚠️ Partial |

**useTokenDrag Notes:**
- Basic structure implemented
- Missing full raycasting for accurate world position
- Movement path not yet implemented

---

## 6. Interaction System

### RaycastManager.tsx
- Sets up raycaster for hit detection
- Currently placeholder implementation

### GestureHandler.tsx
- Processes touch/mouse input
- Delegates to appropriate handlers

### Selection System
| Component | Status |
|-----------|--------|
| Click to select | ✅ Working |
| Click to deselect (grid) | ✅ Working |
| Multi-select (Shift+Click) | ✅ Working |
| Box selection | ❌ Placeholder |

---

## 7. State Management

### Four Zustand Stores

#### mapStore.ts
```typescript
interface MapStoreState {
  mapData: {
    id: string;
    imageUrl: string;
    width: number;
    height: number;
    grid: GridOptions;
  };
  viewport: ViewportState;

  setMapData: (data) => void;
  updateViewport: (updates) => void;
  setGridSize: (size) => void;
}
```

#### tokenStore.ts
```typescript
interface TokenStoreState {
  tokens: Record<string, Token>;

  addToken: (token) => void;
  removeToken: (id) => void;
  updateToken: (id, updates) => void;
  setTokens: (tokens[]) => void;
}
```

#### selectionStore.ts
```typescript
interface SelectionStoreState {
  selectedTokenIds: Set<string>;

  selectToken: (id, multi?) => void;
  deselectToken: (id) => void;
  clearSelection: () => void;
  startBoxSelection: () => void; // TODO
}
```

#### uiStore.ts
```typescript
interface UiStoreState {
  activeMode: 'select' | 'pan' | 'measure' | 'spell';
  isGridVisible: boolean;
  isUiVisible: boolean;
  contextMenu: { visible, x, y, tokenId };

  setMode: (mode) => void;
  toggleGrid: () => void;
  toggleUi: () => void;
  openContextMenu: (tokenId, x, y) => void;
  closeContextMenu: () => void;
}
```

### Integration with GameSessionContext
- Stores are local to 3D rendering
- GameSessionContext provides scene data + actions
- Bridge via `useGameSession()` in components

---

## 8. UI Components

### MapOverlay.tsx
2D overlay container with:
- VTTToolbarWrapper (bottom)
- ContextMenuWrapper (on right-click)
- Future: top menu, radial menu

### VTTToolbarWrapper.tsx
Bridges the 2D VTTToolbar to 3D context:
- Translates 2D tool IDs to 3D modes
- Manages permission checks
- Handles GM view toggle

### WorldUiManager.tsx
Manages world-space UI elements:
```typescript
{pings.map(ping => <Ping3D key={ping.id} ping={ping} />)}
{Object.entries(remoteCursors).map(([id, cursor]) =>
  <RemoteCursor3D key={id} cursor={cursor} />
)}
```

### Ping3D.tsx
- Expanding ring animation
- Fades out over 2 seconds
- Uses `useFrame` for animation

### RemoteCursor3D.tsx
- Billboard nameplate (Html)
- Cone geometry for pointer
- Spring animation for smooth movement

---

## 9. Type Definitions

### token.types.ts
```typescript
interface Token {
  id: string;
  name: string;
  imgUrl?: string;
  x: number;              // Grid X
  y: number;              // Grid Y
  z?: number;             // Elevation
  rotation?: number;      // Degrees
  size: number;           // Grid units
  displayMode?: 'image' | 'color' | 'text';
  color?: string;
  bars?: {
    bar1?: TokenBar;
    bar2?: TokenBar;
  };
  light?: TokenLight;
  isSelected?: boolean;   // Runtime
}

interface TokenBar {
  value: number;
  max: number;
  visible: boolean;
  color?: string;
}

interface TokenLight {
  enabled: boolean;
  color: string;
  intensity: number;
  distance?: number;
  decay?: number;
  castShadow?: boolean;
  brightRadius?: number;  // Grid units
  dimRadius?: number;     // Grid units
}
```

### map.types.ts
```typescript
interface GridOptions {
  size: number;
  color: string;
  cols: number;
  rows: number;
  unitsPerSquare?: number;
  enabled?: boolean;
}

interface MapData {
  imageUrl?: string;
  grid: GridOptions;
  width: number;
  height: number;
}

interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}
```

---

## 10. Implementation Status

### ✅ Complete
| Feature | Component |
|---------|-----------|
| Canvas setup | MapCanvas3D |
| Orthographic camera | CameraRig |
| Pan/Zoom controls | MapControls |
| Scene lighting | SceneLighting |
| Map image layer | MapLayer |
| Grid layer (shader) | GridLayer |
| Token rendering | Token3D, TokenVisuals |
| Token selection (single/multi) | useTokenSelection |
| Token selection ring | TokenRing |
| Token light emission | TokenLight |
| Token nameplate | TokenOverlays |
| Token HP bar (bar1) | TokenOverlays |
| Map click deselection | GridLayer |
| Token context menu | Token3D, MapOverlay |
| 3D Pings | Ping3D |
| Remote cursors | RemoteCursor3D |
| VTT Toolbar integration | VTTToolbarWrapper |
| Mobile toolbar | MobileVTTToolbar |
| Grid visibility toggle | uiStore |
| 4 Zustand stores | store/* |

### ⚠️ Partial / In Progress
| Feature | Status | Notes |
|---------|--------|-------|
| Token dragging | Basic | Missing accurate raycasting |
| Movement path ruler | Not started | Needs path visualization |
| Box selection | Placeholder | Components exist, logic TODO |
| HP bar 2 | Partial | Logic exists, not rendered |
| Post-processing effects | Commented | EffectLayer disabled |

### ❌ Not Implemented (From 2D)
| Feature | 2D Status |
|---------|-----------|
| Conditions (icons) | ✅ in 2D |
| Token auras | ✅ in 2D |
| Token idle animations | ✅ in 2D |
| Token visual effects | ✅ in 2D |
| Vision/Darkvision | ✅ in 2D |
| Fog of War | ✅ in 2D |
| Obstacles (walls/doors) | ✅ in 2D |
| Light zones | ✅ in 2D |
| Audio zones | ✅ in 2D |
| Trigger zones | ✅ in 2D |
| Drawings (brush) | ✅ in 2D |
| Attack zones (AOE) | ✅ in 2D |
| Measurement ruler | ✅ in 2D |
| Remote viewports | ✅ in 2D |
| Follow mode | ✅ in 2D |
| Combat tracker | ✅ in 2D |
| Chat panel | ✅ in 2D |
| Dice roller | ✅ in 2D |
| Compendium | ✅ in 2D |
| Scene navigation | ✅ in 2D |

---

## File Size Summary

| Category | Files | Total Lines |
|----------|-------|-------------|
| Core | 5 | ~180 |
| Entities/Tokens | 9 | ~400 |
| Layers | 4 | ~130 |
| Interaction | 5 | ~100 |
| UI | 9 | ~800 |
| Store | 4 | ~170 |
| Types | 2 | ~80 |
| **Total** | **38** | **~1,860** |

---

> **Cross-reference with VTT_2D_FEATURE_REFERENCE.md** for complete feature parity requirements.
