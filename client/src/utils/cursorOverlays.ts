/**
 * Cursor Overlays Module
 * 
 * Shared overlay rendering logic for both local (CustomCursor.tsx DOM) 
 * and remote (renderCursorOverlays.ts Canvas) cursors.
 */

import { getToolIcon } from '../constants/toolIcons';

// ============== TYPES ==============

export interface OverlayState {
  isContexting?: boolean;
  activeTool?: string;
  isChatting?: boolean;
  isAfk?: boolean;
}

export interface OverlayConfig {
  showToolActivity?: boolean;
  showStatusActivity?: boolean;
}

export interface OverlayElement {
  type: 'context' | 'tool' | 'status' | 'afk';
  icon: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center';
}

// ============== CONSTANTS ==============

/** Offset for overlay icons from cursor center (in pixels, before zoom) */
export const OVERLAY_OFFSET = 15;

/** AFK animation cycle duration in ms */
export const AFK_ANIMATION_CYCLE = 2000;

// ============== HELPERS ==============

/**
 * Determines which overlay elements should be shown based on state
 */
export const getActiveOverlays = (state: OverlayState): OverlayElement[] => {
  const overlays: OverlayElement[] = [];

  // Context Menu Indicator (priority: high)
  if (state.isContexting) {
    overlays.push({
      type: 'context',
      icon: '•••',
      position: 'top-right',
    });
  }

  // Status (Chat/Combat) - priority: medium
  if (state.isChatting) {
    overlays.push({
      type: 'status',
      icon: '💬',
      position: 'top-left',
    });
  } else if (state.activeTool === 'combat') {
    overlays.push({
      type: 'status',
      icon: '⚔️',
      position: 'top-left',
    });
  }

  // Active Tool (not select, pan, combat)
  if (state.activeTool &&
    state.activeTool !== 'select' &&
    state.activeTool !== 'pan' &&
    state.activeTool !== 'combat') {
    const toolIcon = getToolIcon(state.activeTool);
    if (toolIcon && toolIcon !== '🔧') {
      overlays.push({
        type: 'tool',
        icon: toolIcon,
        position: 'bottom-right',
      });
    }
  }

  // AFK
  if (state.isAfk) {
    overlays.push({
      type: 'afk',
      icon: 'Z',
      position: 'top-center',
    });
  }

  return overlays;
};

/**
 * Checks if tool icon should be rendered
 */
export const shouldShowToolIcon = (activeTool?: string): boolean => {
  return !!(
    activeTool &&
    activeTool !== 'select' &&
    activeTool !== 'pan' &&
    activeTool !== 'combat'
  );
};

/**
 * Gets the effective status icon (chat > combat priority)
 */
export const getStatusIcon = (isChatting?: boolean, activeTool?: string): string | null => {
  if (isChatting) return '💬';
  if (activeTool === 'combat') return '⚔️';
  return null;
};

// ============== CANVAS RENDERING ==============

/**
 * Renders cursor overlays to a canvas context.
 * Used by remote cursor rendering in useMapRenderer.
 */
export const renderOverlaysToCanvas = (
  ctx: CanvasRenderingContext2D,
  position: { x: number; y: number; },
  state: OverlayState,
  zoom: number
): void => {
  const offset = OVERLAY_OFFSET / zoom;

  // Context Menu Indicator
  if (state.isContexting) {
    ctx.save();
    ctx.translate(position.x + offset, position.y - offset);
    ctx.scale(1 / zoom, 1 / zoom);

    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;

    // White circle background
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.stroke();

    // Three dots
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-4, 0, 1.5, 0, Math.PI * 2);
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.arc(4, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Active Tool
  if (shouldShowToolIcon(state.activeTool)) {
    ctx.save();
    ctx.translate(position.x + offset, position.y + offset);
    ctx.scale(1 / zoom, 1 / zoom);

    const iconChar = getToolIcon(state.activeTool!);
    if (iconChar && iconChar !== '🔧') {
      ctx.font = '20px sans-serif';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 3;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconChar, 0, 0);
    } else if (state.activeTool === 'wand') {
      ctx.font = '20px sans-serif';
      ctx.fillText('✨', 0, 0);
    }
    ctx.restore();
  }

  // AFK Animation
  if (state.isAfk) {
    ctx.save();
    ctx.translate(position.x, position.y - 50 / zoom);
    ctx.scale(1 / zoom, 1 / zoom);

    const time = Date.now();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;

    // Floating Z's animation
    [0, 600, 1200].forEach((timeOffset, i) => {
      const age = (time + timeOffset) % AFK_ANIMATION_CYCLE;
      const progress = age / AFK_ANIMATION_CYCLE;
      const y = -progress * 30;
      const alpha = 1 - progress;
      const x = Math.sin(progress * Math.PI * 2) * 10;
      const sizeMultiplier = 1 - (i * 0.2);

      ctx.globalAlpha = alpha;
      ctx.font = `bold ${Math.max(16, 32 * sizeMultiplier)}px sans-serif`;
      ctx.fillText('Z', x, y);
    });
    ctx.restore();
  }

  // Status (Chat/Combat)
  const statusIcon = getStatusIcon(state.isChatting, state.activeTool);
  if (statusIcon) {
    ctx.save();
    ctx.translate(position.x - offset, position.y - offset);
    ctx.scale(1 / zoom, 1 / zoom);

    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 3;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(statusIcon, 0, 0);
    ctx.restore();
  }
};
