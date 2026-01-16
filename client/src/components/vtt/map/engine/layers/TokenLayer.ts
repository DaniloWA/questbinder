/**
 * VTT Engine - Token Layer
 *
 * Renders all tokens on the map including animations, bars, conditions, and auras.
 * This is the most complex layer due to animation and visibility logic.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { Token, Character, Aura } from '../../../../../types';

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
      imageCache, zoom, campaignCharacters, dragState, remoteDrags, players } = context;
    if (!scene) return;

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

      // Find linked character for HP bars
      const linkedCharacter = token.linkedId
        ? campaignCharacters.find(c => c.id === token.linkedId)
        : undefined;

      // Render auras first (under token)
      this.renderAuras(ctx, token, animX, animY, gridSize, zoom, effectiveIsGM);

      // Render token
      this.renderToken(ctx, {
        ...token,
        x: animX,
        y: animY,
      }, gridSize, selectedTokenIds.includes(token.id), zoom, imageCache, renderAsGhost, linkedCharacter);
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

  private renderToken(
    ctx: CanvasRenderingContext2D,
    token: Token,
    gridSize: number,
    isSelected: boolean,
    zoom: number,
    imageCache: Record<string, HTMLImageElement>,
    isGhost: boolean,
    linkedCharacter?: Character
  ): void {
    const px = token.x * gridSize;
    const py = token.y * gridSize;
    const sizePx = token.size * gridSize;
    const halfSize = sizePx / 2;
    const cx = px + halfSize;
    const cy = py + halfSize;
    const isTopDown = token.shape === 'topdown';

    ctx.save();
    ctx.translate(cx, cy);

    if (token.rotation) {
      ctx.rotate((token.rotation * Math.PI) / 180);
    }

    // Shape path
    ctx.beginPath();
    const shape = token.shape || 'circle';
    const padding = 4 / zoom;
    const drawSize = Math.max(0.1, halfSize - padding);

    if (!isTopDown) {
      if (shape === 'square') {
        ctx.rect(-drawSize, -drawSize, drawSize * 2, drawSize * 2);
      } else if (shape === 'hex') {
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const x = Math.cos(angle) * drawSize;
          const y = Math.sin(angle) * drawSize;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else {
        ctx.arc(0, 0, drawSize, 0, Math.PI * 2);
      }
    }

    // Draw image
    if (token.displayMode !== 'text') {
      const tokenImage = imageCache[token.imgUrl];
      if (tokenImage?.complete) {
        ctx.save();
        if (!isTopDown) ctx.clip();
        if (isGhost) {
          ctx.globalAlpha = 0.5;
          ctx.filter = 'grayscale(100%) brightness(150%)';
        }

        const offsetX = (token.imageX || 0) * sizePx;
        const offsetY = (token.imageY || 0) * sizePx;
        ctx.translate(offsetX, offsetY);

        if (token.imageRotation) {
          ctx.rotate((token.imageRotation * Math.PI) / 180);
        }

        const imgScale = token.scale || 1;
        const w = drawSize * 2 * imgScale;
        const h = drawSize * 2 * imgScale;
        ctx.drawImage(tokenImage, -w / 2, -h / 2, w, h);

        if (token.tint && !isTopDown) {
          ctx.fillStyle = token.tint;
          ctx.fill();
        }
        ctx.restore();
      } else if (!isTopDown) {
        ctx.fillStyle = '#333';
        ctx.fill();
      }
    } else if (token.textDetails) {
      ctx.fillStyle = token.textDetails.backgroundColor;
      if (isGhost) ctx.globalAlpha = 0.6;
      if (!isTopDown) ctx.fill();

      ctx.fillStyle = token.textDetails.textColor;
      const fontSize = drawSize * 0.8;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(token.textDetails.text || '?', 0, 0);
    }

    // Border
    if (!isTopDown) {
      const borderColor = isSelected ? '#22d3ee' : (token.border?.color || (token.ownerId ? '#3b82f6' : '#f43f5e'));
      const borderWidth = isSelected ? 4 : (token.border?.width || 3);
      ctx.strokeStyle = isGhost ? 'rgba(255, 255, 255, 0.3)' : borderColor;
      ctx.lineWidth = borderWidth / zoom;
      if (isGhost) ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.stroke();
    } else if (isSelected) {
      ctx.beginPath();
      ctx.ellipse(0, drawSize * 0.8, drawSize * 0.8, drawSize * 0.3, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();
    }

    ctx.restore();

    if (isGhost) return;

    // Conditions
    this.renderConditions(ctx, token, gridSize, zoom, padding);

    // Bars
    this.renderBars(ctx, token, gridSize, zoom, linkedCharacter);
  }

  private renderConditions(ctx: CanvasRenderingContext2D, token: Token, gridSize: number, zoom: number, padding: number): void {
    const conditions = new Set<string>(token.conditions || []);
    if (token.effects) {
      for (const effect of token.effects) {
        if (effect.conditions) {
          for (const c of effect.conditions) conditions.add(c);
        }
      }
    }
    if (conditions.size === 0) return;

    const uniqueConditions = Array.from(conditions);
    const dotSize = 6 / zoom;
    const gap = 2 / zoom;
    const totalWidth = (uniqueConditions.length * dotSize) + ((uniqueConditions.length - 1) * gap);
    const px = token.x * gridSize;
    const py = token.y * gridSize;
    const sizePx = token.size * gridSize;
    let startX = px + sizePx / 2 - totalWidth / 2 + dotSize / 2;

    const colorMap: Record<string, string> = {
      dead: '#ef4444', bloodied: '#dc2626', stunned: '#eab308',
      shielded: '#3b82f6', alert: '#f97316',
    };

    for (let i = 0; i < uniqueConditions.length; i++) {
      ctx.beginPath();
      ctx.arc(startX + i * (dotSize + gap), py + padding + dotSize, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = colorMap[uniqueConditions[i]] || '#ffffff';
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1 / zoom;
      ctx.stroke();
    }
  }

  private renderBars(ctx: CanvasRenderingContext2D, token: Token, gridSize: number, zoom: number, linkedCharacter?: Character): void {
    const bar1 = linkedCharacter
      ? { value: linkedCharacter.hpCurrent, max: linkedCharacter.hpMax, visible: true, color: '#ef4444' }
      : token.bars?.bar1;

    const bar2 = linkedCharacter
      ? { value: (linkedCharacter as any).manaCurrent || 0, max: (linkedCharacter as any).manaMax || 0, visible: true, color: '#3b82f6' }
      : token.bars?.bar2;

    if (!bar1 && !bar2) return;

    const px = token.x * gridSize;
    const py = token.y * gridSize;
    const sizePx = token.size * gridSize;
    const barHeight = 6 / zoom;
    const barWidth = sizePx * 0.8;
    const startX = px + sizePx / 2 - barWidth / 2;
    let currentY = py + sizePx - barHeight - (4 / zoom);

    const drawBar = (bar: any) => {
      if (!bar || !bar.visible || bar.max <= 0) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(startX, currentY, barWidth, barHeight);
      const fillPct = Math.max(0, Math.min(1, bar.value / bar.max));
      ctx.fillStyle = bar.color || '#ffffff';
      ctx.fillRect(startX, currentY, barWidth * fillPct, barHeight);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1 / zoom;
      ctx.strokeRect(startX, currentY, barWidth, barHeight);
      currentY -= (barHeight + 2 / zoom);
    };

    drawBar(bar2);
    drawBar(bar1);
  }

  private renderAuras(ctx: CanvasRenderingContext2D, token: Token, x: number, y: number, gridSize: number, zoom: number, isGM: boolean): void {
    if (!token.auras || token.auras.length === 0) return;

    const px = x * gridSize;
    const py = y * gridSize;
    const sizePx = token.size * gridSize;
    const cx = px + sizePx / 2;
    const cy = py + sizePx / 2;

    for (const aura of token.auras) {
      if (!aura.active) continue;
      if (aura.visible === false && !isGM) continue;

      const radiusInSquares = aura.radius / 1.5;
      const r = radiusInSquares * gridSize;

      ctx.save();
      ctx.translate(cx, cy);

      ctx.beginPath();
      if (aura.shape === 'square') {
        ctx.rect(-r, -r, r * 2, r * 2);
      } else {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
      }

      ctx.fillStyle = aura.color;
      ctx.globalAlpha = 0.15;
      ctx.fill();

      ctx.strokeStyle = aura.color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderRemoteDrags(ctx: CanvasRenderingContext2D, context: RenderContext, gridSize: number, effectiveIsGM: boolean): void {
    const { remoteDrags, tokens, imageCache, zoom, players } = context;

    for (const [uid, drag] of Object.entries(remoteDrags)) {
      const ghostToken = tokens.find(t => t.id === drag.tokenId);
      if (!ghostToken) continue;

      if (!effectiveIsGM && !ghostToken.isVisibleToPlayers) continue;

      ctx.globalAlpha = 0.6;
      this.renderToken(ctx, { ...ghostToken, x: drag.x, y: drag.y }, gridSize, false, zoom, imageCache, true);
      ctx.globalAlpha = 1.0;

      // Draw label
      const draggingUser = players?.find(u => u.id === uid);
      const labelText = draggingUser ? draggingUser.name : 'Unknown';
      const dragPosWorld = {
        x: (drag.x + ghostToken.size / 2) * gridSize,
        y: (drag.y + ghostToken.size / 2) * gridSize,
      };
      this.drawLabel(ctx, labelText, dragPosWorld.x, dragPosWorld.y - 40 / zoom, zoom, drag.color || '#fbbf24');
    }
  }

  private renderLocalDrag(ctx: CanvasRenderingContext2D, context: RenderContext, gridSize: number): void {
    const { dragState, tokens, imageCache, zoom, localCursorPos, calculatedPath, cursorSettings } = context;
    if (!dragState.isDragging || !dragState.token) return;

    const leader = dragState.token;

    for (const groupItem of dragState.draggedGroup) {
      const token = tokens.find(t => t.id === groupItem.id);
      if (!token) continue;

      const smoothX = localCursorPos.x - groupItem.offsetX;
      const smoothY = localCursorPos.y - groupItem.offsetY;

      this.renderToken(ctx, { ...token, x: smoothX / gridSize, y: smoothY / gridSize }, gridSize, true, zoom, imageCache, false);
    }
  }

  private drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, zoom: number, color: string): void {
    ctx.font = `bold ${14 / zoom}px sans-serif`;
    const metrics = ctx.measureText(text);
    const pad = 6 / zoom;
    const h = 20 / zoom;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - metrics.width / 2 - pad, y - h / 2 - pad, metrics.width + pad * 2, h + pad * 2, 4 / zoom);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }
}
