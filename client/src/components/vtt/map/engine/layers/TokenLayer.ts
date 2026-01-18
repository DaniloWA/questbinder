/**
 * VTT Engine - Token Layer
 *
 * Renders all tokens on the map including animations, bars, conditions, and auras.
 * This is the most complex layer due to animation and visibility logic.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { Token, Character, Aura, Obstacle } from '../../../../../types';
import { drawToken, drawAuras, drawLabel, drawRuler } from '../../../../../utils/canvasRenderer';
import { isPositionVisible } from '../../hooks/renderers/visibilityHelpers';
import { calculateVisibilityPolygon } from '../../../../../utils/geometry';
import { COLORS } from '../../hooks/renderers';
import { adjustAlpha } from '../../utils';

/**
 * TokenLayer - Renders all tokens with full visual features.
 *
 * Features:
 * - Token images with shape clipping (circle, square, hex, topdown)
 * - Smooth movement animations
 * - HP/Resource bars
 * - Status condition indicators
 * - Auras around tokens
 * - Ghost mode for invisible/dragged tokens
 * - Selection highlighting
 * - Remote drag previews
 */
export class TokenLayer extends BaseLayer {
  // Animation tracking
  private animations: Map<string, {
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    startTime: number;
    duration: number;
  }> = new Map();

  constructor() {
    super('tokens', 'Tokens', {
      useCache: false, // Tokens are dynamic (animations)
      description: 'Map tokens with animations and status',
    });
  }

  computeStateHash(): string {
    return 'dynamic'; // Always re-render
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { scene, tokens, isGM, gmViewMode, currentUser, selectedTokenIds,
      imageCache, zoom, campaignCharacters, dragState: propDragState, dragStateRef, remoteDrags, players, visionPolygons } = context;
    if (!scene) return;

    // Use live ref if available
    const dragState = dragStateRef?.current || propDragState;

    const gridSize = scene.grid.size;
    const effectiveIsGM = isGM && gmViewMode === 'gm';
    const renderTime = context.time;

    // Sort tokens: non-controllable first, controllable on top
    const sortedTokens = [...tokens].sort((a, b) => {
      const aControllable = effectiveIsGM || this.isTokenOwner(a, currentUser?.id);
      const bControllable = effectiveIsGM || this.isTokenOwner(b, currentUser?.id);
      if (aControllable && !bControllable) return 1;
      if (!aControllable && bControllable) return -1;
      return 0;
    });

    ctx.save();

    // Render remote drags first (ghost tokens from other players)
    this.renderRemoteDrags(ctx, context, gridSize, effectiveIsGM);

    // Render each token
    for (const token of sortedTokens) {
      const isOwner = this.isTokenOwner(token, currentUser?.id);

      // Visibility check for players
      if (!effectiveIsGM && !token.isVisibleToPlayers && !isOwner) {
        continue;
      }

      // Check if being dragged locally
      const isBeingDragged = dragState.isDragging &&
        (dragState.token?.id === token.id || selectedTokenIds.includes(token.id));

      let renderAsGhost = isBeingDragged;
      if (!token.isVisibleToPlayers && (effectiveIsGM || isOwner)) {
        renderAsGhost = true;
      }

      // Get animated position
      const { x: animX, y: animY } = this.getAnimatedPosition(token, renderTime);

      // Legacy Visibility Check (Exact Logic)
      // If not GM and not Owner, check if position is visible in vision polygons or fog path
      // IMPORTANT: Only check if NOT dragging (dragged tokens might be visible ghost)
      if (!effectiveIsGM && !isOwner) {
        const animToken = { ...token, x: animX, y: animY };
        // Use the legacy helper
        if (!isPositionVisible(animToken, gridSize, visionPolygons || [], scene.fogPath, ctx)) {
          continue;
        }
      }

      // GM Vision Ranges (Restored Feature)
      if (effectiveIsGM && (context.ui.showVisionRanges || selectedTokenIds.includes(token.id))) {
        const cx = (animX + token.size / 2) * gridSize;
        const cy = (animY + token.size / 2) * gridSize;
        const unitsPerSquare = scene.grid.unitsPerSquare || 1.5;
        const unitScale = gridSize / unitsPerSquare;

        // Darkvision
        if ((token.darkvisionRange || 0) > 0) {
          const r = (token.darkvisionRange || 0) * unitScale;
          const poly = calculateVisibilityPolygon({ x: cx, y: cy }, scene.obstacles, r);
          if (poly.length > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(poly[0].x, poly[0].y);
            for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
            ctx.closePath();
            ctx.lineWidth = 2 / zoom;
            ctx.strokeStyle = COLORS.DEFAULT_DARKVISION;
            ctx.setLineDash([8 / zoom, 4 / zoom]);
            ctx.stroke();
            ctx.fillStyle = adjustAlpha(COLORS.DEFAULT_DARKVISION, 0.05);
            ctx.fill();
            drawLabel(ctx, `DV: ${token.darkvisionRange}m`, cx, cy + r + (20 / zoom), zoom, COLORS.DEFAULT_DARKVISION.replace(')', ', 0.8)'));
            ctx.restore();
          }
        }

        // Vision
        if ((token.visionRange || 0) > 0) {
          const r = (token.visionRange || 0) * unitScale;
          const poly = calculateVisibilityPolygon({ x: cx, y: cy }, scene.obstacles, r);
          if (poly.length > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(poly[0].x, poly[0].y);
            for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
            ctx.closePath();
            ctx.lineWidth = 2 / zoom;
            ctx.strokeStyle = COLORS.DEFAULT_VISION;
            ctx.setLineDash([]);
            ctx.stroke();
            ctx.fillStyle = adjustAlpha(COLORS.DEFAULT_VISION, 0.1);
            ctx.fill();
            drawLabel(ctx, `Vis: ${token.visionRange}m`, cx, cy - r - (10 / zoom), zoom, COLORS.DEFAULT_VISION.replace(')', ', 0.8)'));
            ctx.restore();
          }
        }
      }

      // Find linked character for HP bars
      const linkedCharacter = token.linkedId
        ? campaignCharacters.find(c => c.id === token.linkedId)
        : undefined;

      // Render auras first (under token)
      drawAuras(ctx, { ...token, x: animX, y: animY }, gridSize, zoom, effectiveIsGM);

      // Render token using legacy renderer
      drawToken(
        ctx,
        { ...token, x: animX, y: animY },
        gridSize,
        selectedTokenIds.includes(token.id),
        zoom,
        imageCache,
        renderAsGhost,
        linkedCharacter
      );
    }

    // Render local drag preview
    this.renderLocalDrag(ctx, context, gridSize);

    ctx.restore();
  }

  // =========================================================================
  // TOKEN OWNERSHIP
  // =========================================================================

  private isTokenOwner(token: Token, userId?: string | null): boolean {
    if (!userId) return false;
    if (token.ownerId === userId) return true;
    if (token.controlledBy?.includes(userId)) return true;
    return false;
  }

  // =========================================================================
  // ANIMATION SYSTEM
  // =========================================================================

  private getAnimatedPosition(token: Token, time: number): { x: number; y: number; } {
    const anim = this.animations.get(token.id);
    if (!anim) return { x: token.x, y: token.y };

    const progress = Math.min(1, (time - anim.startTime) / anim.duration);
    if (progress >= 1) {
      this.animations.delete(token.id);
      return { x: token.x, y: token.y };
    }

    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    return {
      x: anim.startX + (anim.targetX - anim.startX) * ease,
      y: anim.startY + (anim.targetY - anim.startY) * ease,
    };
  }

  /**
   * Trigger a movement animation for a token.
   */
  animateToken(tokenId: string, fromX: number, fromY: number, toX: number, toY: number, duration: number = 300): void {
    this.animations.set(tokenId, {
      startX: fromX,
      startY: fromY,
      targetX: toX,
      targetY: toY,
      startTime: Date.now(),
      duration,
    });
  }

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================

  private renderRemoteDrags(ctx: CanvasRenderingContext2D, context: RenderContext, gridSize: number, effectiveIsGM: boolean): void {
    const { remoteDrags, tokens, imageCache, zoom, players, visionPolygons, scene, currentUser } = context;

    for (const [uid, drag] of Object.entries(remoteDrags)) {
      const ghostToken = tokens.find(t => t.id === drag.tokenId);
      if (!ghostToken) continue;

      if (!effectiveIsGM) {
        const isOwner = this.isTokenOwner(ghostToken, currentUser?.id);
        if (!ghostToken.isVisibleToPlayers && !isOwner) continue;
        if (!isOwner) {
          // Check visibility of drag position
          if (!isPositionVisible(
            { x: drag.x, y: drag.y, size: ghostToken.size },
            gridSize,
            visionPolygons || [],
            scene?.fogPath,
            ctx
          )) continue;
        }
      }

      ctx.globalAlpha = 0.6;
      drawToken(
        ctx,
        { ...ghostToken, x: drag.x, y: drag.y },
        gridSize,
        false,
        zoom,
        imageCache,
        true
      );
      ctx.globalAlpha = 1.0;

      // Draw label
      const draggingUser = players?.find(u => u.id === uid);
      const labelText = draggingUser ? draggingUser.name : 'Unknown';
      const dragPosWorld = {
        x: (drag.x + ghostToken.size / 2) * gridSize,
        y: (drag.y + ghostToken.size / 2) * gridSize,
      };
      drawLabel(ctx, labelText, dragPosWorld.x, dragPosWorld.y - 40 / zoom, zoom, drag.color || '#fbbf24');
    }
  }

  private renderLocalDrag(ctx: CanvasRenderingContext2D, context: RenderContext, gridSize: number): void {
    const { dragState: propDragState, dragStateRef, tokens, imageCache, zoom, localCursorPos: propCursorPos, mouseWorldPosRef, calculatedPath: propPath, calculatedPathRef, scene, currentUser, rulerSettings, campaignCharacters } = context;

    // Use live ref if available
    const dragState = dragStateRef?.current || propDragState;
    if (!dragState.isDragging || !dragState.token) return;

    // Use live ref if available for smooth updates
    const localCursorPos = mouseWorldPosRef?.current || propCursorPos;
    const calculatedPath = calculatedPathRef?.current || propPath;

    // Draw the ruler from origin to current target
    const mainToken = dragState.token;

    // Render dragged tokens projection (Ghost at Snap)
    for (const groupItem of dragState.draggedGroup) {
      const token = tokens.find(t => t.id === groupItem.id);
      if (!token) continue;

      const smoothX = localCursorPos.x - groupItem.offsetX;
      const smoothY = localCursorPos.y - groupItem.offsetY;

      // Snap to grid for "Projection" (new location)
      const gridX = Math.round(smoothX / gridSize);
      const gridY = Math.round(smoothY / gridSize);

      // Draw Ghost at Grid Target
      ctx.globalAlpha = 0.6;
      drawToken(
        ctx,
        { ...token, x: gridX, y: gridY },
        gridSize,
        true,
        zoom,
        imageCache,
        false // Not 'ghost' mode style (outline), but full semi-transparent
      );
      ctx.globalAlpha = 1.0;

      // Draw Label
      const labelText = currentUser?.name || 'Me';
      const labelX = (gridX * gridSize) + (gridSize / 2);
      const labelY = (gridY * gridSize);
      // User requested "cor limite de movimentos" -> For now default gold, maybe logic later
      drawLabel(ctx, labelText, labelX, labelY - (20 / zoom), zoom, '#fbbf24');
    }

    // Find linked character for speed limit
    const linkedCharacter = dragState.token.linkedId
      ? campaignCharacters.find(c => c.id === dragState.token!.linkedId)
      : undefined;
    const maxDistance = linkedCharacter?.speed;

    // Draw Ruler (Last so it is on top)
    if (calculatedPath.length > 0) {
      const startPos = calculatedPath[0];
      // Convert path to world pixels for drawRuler
      const rulerPath = calculatedPath.map(p => ({
        x: (p.x * gridSize) + (gridSize / 2),
        y: (p.y * gridSize) + (gridSize / 2)
      }));
      // Remove last point as 'currentMousePos' for drawRuler should be separate if tracking mouse,
      // but here calculatedPath INCLUDES the target. 
      // drawRuler expects (path, currentPos).
      // Let's split it.
      const pathPoints = rulerPath.slice(0, -1);
      const currentPos = rulerPath[rulerPath.length - 1];

      if (pathPoints.length > 0 && currentPos) {
        drawRuler(
          ctx,
          pathPoints,
          currentPos,
          gridSize,
          scene.grid.unitsPerSquare || 1.5,
          zoom,
          '#fbbf24', // Color
          maxDistance, // Max distance
          rulerSettings?.metric || 'chebyshev'
        );
      }
    }
  }
}
