import { Token, Point, TokenAnimation } from './types';
import { easeOutCubic } from '../../utils';

// Ownership Logic
export const isTokenOwner = (token: Token, userId?: string): boolean => {
  if (!userId) return false;
  return token.ownerId === userId || (token.controlledBy?.includes(userId) ?? false);
};

// Animation Interpolation
export const getAnimatedPosition = (
  token: Token,
  anim: TokenAnimation | undefined,
  renderTime: number
): { x: number; y: number; } => {
  if (!anim) return { x: token.x, y: token.y };

  const progress = Math.min(1, (renderTime - anim.startTime) / anim.duration);
  const ease = easeOutCubic(progress);

  return {
    x: anim.startX + (anim.targetX - anim.startX) * ease,
    y: anim.startY + (anim.targetY - anim.startY) * ease
  };
};

// World Position Calculation
export const getTokenWorldPos = (
  token: { x: number; y: number; size: number; },
  gridSize: number
): Point => ({
  x: (token.x + token.size / 2) * gridSize,
  y: (token.y + token.size / 2) * gridSize,
});

// Bounding Box Points (for visibility checks)
export const getTokenBoundsPoints = (
  x: number,
  y: number,
  size: number,
  gridSize: number
): Point[] => {
  const gx = x * gridSize;
  const gy = y * gridSize;
  const gSize = size * gridSize;

  return [
    { x: gx + gSize / 2, y: gy + gSize / 2 }, // Center
    { x: gx, y: gy },                         // Top-left
    { x: gx + gSize, y: gy },                 // Top-right
    { x: gx + gSize, y: gy + gSize },         // Bottom-right
    { x: gx, y: gy + gSize }                  // Bottom-left
  ];
};
