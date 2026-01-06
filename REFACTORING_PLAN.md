# Modular Refactoring Plan: Map3D

## Goal Description
Transform the current monolithic 3D map architecture into a highly modular, scalable, and DRY (Don't Repeat Yourself) system. The new architecture will strictly separate concerns into Presentation, Business Logic, and Data layers, utilizing Dependency Injection via Contexts and strictly typed props.

## User Review Required
> [!IMPORTANT]
> This refactoring involves moving files to a new directory structure `client/src/modules/vtt/map3d/`. Existing imports will need to be updated.

## Architectural Principles
1.  **Layered Architecture**: Presentation (UI/3D) → Business Logic (Hooks/State) → Data (Utils/Math).
2.  **DRY via Abstractions**:
    *   **Utils**: Pure, reusable functions.
    *   **Hooks**: Shared business logic.
    *   **Components**: Strictly composition and rendering.
3.  **Dependency Injection**: Dependencies provided via Contexts; components receive typed props; zero direct coupling.

## Directory Structure
```text
client/src/
├── modules/
│   └── vtt/
│       ├── map3d/                    # Main Module
│       │   ├── index.ts              # Public API
│       │   ├── MapCanvas3D.tsx       # Root (Canvas provider only)
│       │   ├── core/                 # Core System (Providers, Camera, Stage)
│       │   ├── layers/               # Renderable Layers (Map, Grid, Effects)
│       │   ├── entities/             # 3D Entities (Tokens, Props)
│       │   ├── interaction/          # Interaction System (Raycasting, Gestures)
│       │   ├── ui/                   # Hybrid UI (Overlay, World-space)
│       │   ├── types/                # TypeScript Definitions
│       │   ├── shared/               # Shared VTT Logic (Utils, Hooks, Constants)
│       │   └── store/                # Global State (Zustand)
└── lib/                              # Global Libraries (Three.js wrappers, etc.)
```

## Execution Plan

### Fase 1: Fundação
Focus: Structure, Utilities, Stores, and Types.
**Technologies**: `TypeScript` (Strict Typing), `Zustand` (State Management), `Three.js` (Math Classes - Vector3, Matrix4), `Vite` (Build/Aliases).
*   [ ] **Directory Setup**: Create the full folder hierarchy.
*   [ ] **Shared Utils**: Implement `math/coordinates.ts`, `geometry.ts`, `vector.ts` (grid<->world conversions).
*   [ ] **Constants**: Define `map.constants.ts` and `token.constants.ts`.
*   [ ] **Stores**: Initialize `mapStore`, `tokenStore`, `selectionStore`, `uiStore`.
*   [ ] **Types**: Define core interfaces in `types/`.

### Fase 2: Core components
Focus: The main stage and rendering context.
**Technologies**: `@react-three/fiber` (Core Renderer), `@react-three/drei` (CameraRig, Stats), `React Context` (Dependency Injection), `Leva` (Debug GUI).
*   [ ] **Camera**: Extract `CameraRig`, `CameraController`, and sync hooks.
*   [ ] **Lighting**: Create `SceneLighting` and preset hooks.
*   [ ] **Providers**: Implement `Map3DContext`, `InteractionContext`.
*   [ ] **Stage**: specialized compositor component.

### Fase 3: Layers
Focus: The environment graphics.
**Technologies**: `Three.js` (ShaderMaterial, GLSL), `@react-three/postprocessing` (EffectComposer, Bloom, Outline), `Custom Shaders`.
*   [ ] **MapLayer**: Refactor to use `useMapTexture`.
*   [ ] **GridLayer**: Implement custom shader grid.
*   [ ] **Effects**: Add `EffectLayer` with bloom/outline helpers.
*   [ ] **Base Layer**: Abstract base class/component for layers.

### Fase 4: Entities (Tokens)
Focus: The interactive game pieces.
**Technologies**: `@react-three/drei` (Html for UI, Instances, Detailed for LOD), `React Spring`/`Framer Motion` (Interpolation).
*   [ ] **Hooks**: `useTokenDrag`, `useTokenSelection`, `useTokenState`.
*   [ ] **Visuals**: Split into `TokenVisuals`, `TokenRing`, `TokenLight`.
*   [ ] **UI**: `TokenOverlays` (HP bars, names) using `drei/Html`.
*   [ ] **Manager**: `TokenManager` handling instancing and list management.

### Fase 5: Interaction
Focus: Input handling.
**Technologies**: `three-mesh-bvh` (Accelerated Raycasting), `@use-gesture/react` (Drag/Pinch/Wheel), `RxJS` (Optional for complex Event Streams).
*   [ ] **Raycasting**: `RaycastManager` with BVH integration.
*   [ ] **Gestures**: `GestureHandler` for pan/zoom/rotate.
*   [ ] **Selection**: Box selection logic.

### Fase 6: UI
Focus: The user interface overlay.
**Technologies**: `Radix UI` (Headless Primitives), `Framer Motion` (Animations), `Vaul` (Mobile Drawers), `TailwindCSS` (Styling).
*   [ ] **Overlays**: 2D `MapOverlay`, `ToolPanel`.
*   [ ] **Menus**: `RadialMenu`, `ActionDrawer`.
*   [ ] **Mobile**: Specific controls for touch.

### Fase 7: Optimization
Focus: Performance.
**Technologies**: `gltf-pipeline` (Compression tools), `KTX2/Draco` (Loaders), `Spector.js` (Profiling).
*   [ ] **LOD**: Level of Detail system.
*   [ ] **Compression**: KTX2/Draco loaders.
*   [ ] **Rendering**: `frameloop="demand"`.

## Verification Plan
*   **Compile Check**: Ensure no circular dependencies or type errors.
*   **Grid Alignment**: Verify 100% accurate conversion between grid and world coordinates.
*   **Performance**: Targeting 60 FPS.
