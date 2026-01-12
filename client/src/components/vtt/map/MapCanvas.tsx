import React, { useRef, useEffect, useMemo, useState } from 'react';
import { socketService } from '../../../services/socketService';
import { CursorClickPayload } from '../../../types/socket';
import { MapCanvasProps } from './types';
import { useMapState } from './hooks/useMapState';
import { useTokenLayer } from './hooks/useTokenLayer';
import { useVisionLayer } from './hooks/useVisionLayer';
import { useImageLoader } from './hooks/useImageLoader';
import { useMapInteraction } from './hooks/useMapInteraction';
import { useMapRenderer } from './hooks/useMapRenderer';
import { TokenHoverCard } from './TokenHoverCard';
import { CustomCursor } from '../CustomCursor';

export const MapCanvas: React.FC<MapCanvasProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightCanvasRef = useRef<HTMLCanvasElement>(null);

  // Track if mouse is over VTT area (to show/hide custom cursor)
  const [isMouseOverVTT, setIsMouseOverVTT] = useState(false);

  // PERFORMANCE: Ref for immediate viewport updates during pan/zoom
  // This avoids React re-renders during continuous mouse movement
  const viewportRef = useRef({ x: props.viewport.x, y: props.viewport.y, zoom: props.viewport.zoom });

  // Keep viewportRef in sync with props when not panning
  useEffect(() => {
    viewportRef.current = { x: props.viewport.x, y: props.viewport.y, zoom: props.viewport.zoom };
  }, [props.viewport.x, props.viewport.y, props.viewport.zoom]);

  // 1. State Management
  const mapState = useMapState();

  // Sync viewport ref to state when panning stops
  useEffect(() => {
    if (!mapState.isPanning) {
      // Sync ref back to React state on pan end (single re-render)
      const ref = viewportRef.current;
      if (ref.x !== props.viewport.x || ref.y !== props.viewport.y) {
        props.setViewport({ x: ref.x, y: ref.y });
      }
    }
  }, [mapState.isPanning]);

  // 2. Token Layer (Animations)
  const tokenLayer = useTokenLayer(props.tokens, mapState.dragState);

  // 3. Vision Layer (Filtering)
  const visionTokens = useVisionLayer(props.tokens, props.isGM, props.gmViewMode, props.previewPlayerId, props.currentUser);

  // 4. Image Loader
  const imageCache = useImageLoader(props.scene, props.tokens);

  // Shared Ref for Click Animations (Visual Feedback)
  const clickAnimationsRef = useRef<{ x: number, y: number, color: string, style?: 'ripple' | 'burst' | 'sparkle' | 'pulse' | 'vortex' | 'shard' | 'ring' | 'echo' | 'orb', startTime: number; }[]>([]);

  // Listen for Remote Clicks
  useEffect(() => {
    const handleRemoteClick = (payload: CursorClickPayload) => {
      if (payload.userId === props.currentUser?.id) return; // Already handled locally
      clickAnimationsRef.current.push({
        x: payload.x,
        y: payload.y,
        color: payload.color,
        style: payload.style,
        startTime: Date.now()
      });
    };

    socketService.on('cursor:click', handleRemoteClick);
    return () => {
      socketService.off('cursor:click', handleRemoteClick);
    };
  }, [props.currentUser?.id]);

  // 5. Map Interaction (Event Handlers)
  const interaction = useMapInteraction({
    ...props,
    canvasRef,
    ...mapState,
    ...tokenLayer,
    imageCache,

    clickAnimationsRef, // Pass Ref
    viewportRef, // PERFORMANCE: Pass ref for immediate panning
    mouseWorldPosRef: mapState.mouseWorldPosRef, // PERFORMANCE: Pass ref for immediate mouse position
  });

  // 6. Map Renderer (Canvas Loop)
  useMapRenderer({
    ...props,
    canvasRef,
    lightCanvasRef,
    ...mapState,
    ...tokenLayer,
    visionTokens,
    imageCache,
    clickAnimationsRef, // Pass Ref
    viewportRef, // PERFORMANCE: Use ref for rendering during pan
    mouseWorldPosRef: mapState.mouseWorldPosRef // PERFORMANCE: Use ref for immediate mouse position during drag
  });

  // Get cursor config from user's settings or GM overrides
  // Priority: GM cursorOverrides > user cursorSettings > defaults
  const cursorConfig = useMemo(() => {
    const userId = props.currentUser?.id || '';
    const overrides = props.permissions?.cursorOverrides?.[userId] || {};

    return {
      shapeId: overrides.shape || props.cursorSettings?.shape || 'default',
      color: overrides.color || props.cursorSettings?.color || '#fbbf24',
      // Trail settings
      trailEnabled: props.cursorSettings?.trailEnabled ?? false,
      trailAnimation: props.cursorSettings?.trailAnimation || 'line',
      trailColor: props.cursorSettings?.trailColor || props.cursorSettings?.color || '#fbbf24',
      trailLength: props.cursorSettings?.trailLength ?? 20,
      showMyTrail: props.cursorSettings?.showMyTrail ?? true,
    };
  }, [
    props.currentUser?.id,
    props.permissions?.cursorOverrides,
    props.cursorSettings?.shape,
    props.cursorSettings?.color,
    props.cursorSettings?.trailEnabled,
    props.cursorSettings?.trailAnimation,
    props.cursorSettings?.trailColor,
    props.cursorSettings?.trailLength,
    props.cursorSettings?.showMyTrail,
  ]);

  const { hoveredTokenId, dragState } = mapState;

  // Render TokenHoverCard with reactive key pattern (from old implementation)
  const renderHoverCard = () => {
    // Hide hover card when dragging to prevent mouse interference
    if (dragState.current.isDragging) return null;
    if (!hoveredTokenId || !props.scene) return null;

    // Find the LIVE token object to ensure we have the latest HP/Conditions from WebSocket
    const liveToken = props.tokens.find(t => t.id === hoveredTokenId);
    if (!liveToken) return null;

    // Find linked character
    const linkedCharacter = props.campaignCharacters?.find(c => c.id === liveToken.linkedId);

    // Calculate precise anchor point: Top Center of the Token in Screen Coordinates
    const gridSize = props.scene.grid.size;
    // World coordinates
    const tokenWorldX = (liveToken.x * gridSize) + (liveToken.size * gridSize / 2);
    const tokenWorldY = (liveToken.y * gridSize); // Top edge

    // Screen coordinates
    const screenX = (tokenWorldX * props.viewport.zoom) + props.viewport.x;
    const screenY = (tokenWorldY * props.viewport.zoom) + props.viewport.y;

    // Build a reactive key that includes frequently changing data
    // This ensures React re-renders when character stats change
    const reactiveKey = [
      hoveredTokenId,
      linkedCharacter?.hpCurrent,
      linkedCharacter?.hpMax,
      linkedCharacter?.manaCurrent,
      linkedCharacter?.manaMax,
      linkedCharacter?.name,
      linkedCharacter?.armorClass,
      linkedCharacter?.speed,
      liveToken.bars?.bar1?.value,
      liveToken.bars?.bar1?.max,
      liveToken.bars?.bar2?.value,
      liveToken.bars?.bar2?.max,
      liveToken.name,
      liveToken.conditions?.join(','),
      JSON.stringify(props.campaign?.permissions?.tokenHover)
    ].join('-');

    return (
      <TokenHoverCard
        key={reactiveKey}
        token={liveToken}
        character={linkedCharacter}
        position={{ x: screenX, y: screenY }}
        isGM={props.isGM && props.gmViewMode === 'gm'}
        currentUserId={props.currentUser?.id}
        permissions={props.campaign?.permissions?.tokenHover}
        onUpdate={props.updateToken}
        onCharacterUpdate={props.onCharacterUpdate}
        onOpenSheet={props.onOpenSheet}
        onRoll={props.onRollDice}
        onMouseEnter={() => {
          if (mapState.hoverCloseTimerRef.current) {
            clearTimeout(mapState.hoverCloseTimerRef.current);
            mapState.hoverCloseTimerRef.current = null;
          }
        }}
        onMouseLeave={() => {
          if (!mapState.hoverCloseTimerRef.current) {
            mapState.hoverCloseTimerRef.current = setTimeout(() => {
              mapState.setHoveredTokenId(null);
              mapState.hoverCloseTimerRef.current = null;
            }, 300);
          }
        }}
      />
    );
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black select-none"
      style={{ cursor: isMouseOverVTT ? 'none' : 'auto' }}
      onContextMenu={e => e.preventDefault()}
      onMouseEnter={() => setIsMouseOverVTT(true)}
      onMouseLeave={() => setIsMouseOverVTT(false)}
    >
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="absolute inset-0 block touch-none"
        onMouseDown={interaction.handleMouseDown}
        onMouseMove={interaction.handleMouseMove}
        onMouseUp={interaction.handleMouseUp}
        onMouseLeave={interaction.handleMouseLeave}
        onDoubleClick={interaction.handleDoubleLeftClick}
      />
      <canvas
        ref={lightCanvasRef}
        className="pointer-events-none hidden"
      />

      {/* Render Hover Card outside Canvas but inside Container */}
      {renderHoverCard()}

      {/* DOM-based Custom Cursor with Physics Animation - only when over VTT */}
      <CustomCursor
        shapeId={cursorConfig.shapeId}
        color={cursorConfig.color}
        enabled={isMouseOverVTT}
        trailEnabled={cursorConfig.trailEnabled && cursorConfig.showMyTrail}
        trailAnimation={cursorConfig.trailAnimation}
        trailColor={cursorConfig.trailColor}
        trailLength={cursorConfig.trailLength}
      />
    </div>
  );
};
