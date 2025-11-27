import React, { useRef } from 'react';
import { MapCanvasProps } from './types';
import { useMapState } from './hooks/useMapState';
import { useTokenLayer } from './hooks/useTokenLayer';
import { useVisionLayer } from './hooks/useVisionLayer';
import { useImageLoader } from './hooks/useImageLoader';
import { useMapInteraction } from './hooks/useMapInteraction';
import { useMapRenderer } from './hooks/useMapRenderer';
import { TokenHoverCard } from './TokenHoverCard';

export const MapCanvas: React.FC<MapCanvasProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightCanvasRef = useRef<HTMLCanvasElement>(null);

  // 1. State Management
  const mapState = useMapState();

  // 2. Token Layer (Animations)
  const tokenLayer = useTokenLayer(props.tokens, mapState.dragState);

  // 3. Vision Layer (Filtering)
  const visionTokens = useVisionLayer(props.tokens, props.isGM, props.gmViewMode, props.previewPlayerId, props.currentUser);

  // 4. Image Loader
  const imageCache = useImageLoader(props.scene, props.tokens);

  // 5. Map Interaction (Event Handlers)
  const interaction = useMapInteraction({
    ...props,
    canvasRef,
    ...mapState,
    ...tokenLayer, // calculatedPath is in mapState, animatingTokens in tokenLayer
    imageCache,
    visionTokens // passed if needed, though interaction mostly uses raw tokens
  });

  // 6. Map Renderer (Canvas Loop)
  useMapRenderer({
    ...props,
    canvasRef,
    lightCanvasRef,
    ...mapState,
    ...tokenLayer,
    visionTokens,
    imageCache
  });

  const { hoveredTokenId } = mapState;

  // Render TokenHoverCard with reactive key pattern (from old implementation)
  const renderHoverCard = () => {
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
    <div className="relative w-full h-full overflow-hidden bg-black select-none" onContextMenu={e => e.preventDefault()}>
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
    </div>
  );
};
