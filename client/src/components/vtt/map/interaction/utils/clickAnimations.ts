/**
 * VTT Interaction Engine - Click Animation Utilities
 */

import type { CursorSettings, ClickAnimationStyle } from '../core/types';
import type { Point } from '../../../../../types';

export interface ClickAnimation {
  x: number;
  y: number;
  color: string;
  style: ClickAnimationStyle;
  startTime: number;
}

/**
 * Create a click animation based on settings and overrides.
 */
export const createClickAnimation = (
  worldPos: Point,
  isLeftClick: boolean,
  cursorSettings: CursorSettings | null,
  overrides?: {
    clickColorLeft?: string;
    clickColorRight?: string;
    clickAnimation?: ClickAnimationStyle;
  }
): ClickAnimation => {
  const defaultColor = isLeftClick ? '#3b82f6' : '#f59e0b';

  const color = isLeftClick
    ? (overrides?.clickColorLeft || cursorSettings?.clickColorLeft || defaultColor)
    : (overrides?.clickColorRight || cursorSettings?.clickColorRight || defaultColor);

  const style = overrides?.clickAnimation || cursorSettings?.clickAnimation || 'ripple';

  return {
    x: worldPos.x,
    y: worldPos.y,
    color,
    style,
    startTime: Date.now(),
  };
};

/**
 * Clean up expired animations.
 */
export const cleanupExpiredAnimations = (
  animations: ClickAnimation[],
  maxAgeMs: number = 1000
): ClickAnimation[] => {
  const now = Date.now();
  return animations.filter(a => now - a.startTime < maxAgeMs);
};
