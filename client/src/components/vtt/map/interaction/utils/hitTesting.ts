/**
 * VTT Interaction Engine - Hit Testing Utilities
 *
 * Functions for detecting what elements are at a given world position.
 */

import type { InteractionContext, AttackZoneConfig } from '../core/types';
import type { Token, Obstacle, AudioZone, TriggerZone, MapDrawing, Point } from '../../../../../types';
import { distanceToSegment, isPointInPolygon } from '../../../../../utils/geometry';

/**
 * Find a token at the given world position.
 * Prioritizes controllable tokens when multiple overlap.
 */
export const findTokenAt = (
  worldX: number,
  worldY: number,
  ctx: InteractionContext
): Token | null => {
  if (!ctx.scene) return null;
  const gridSize = ctx.scene.grid.size;

  // Filter tokens at position
  const tokensAtPos = ctx.tokens.filter(t =>
    worldX >= t.x * gridSize &&
    worldX < (t.x + t.size) * gridSize &&
    worldY >= t.y * gridSize &&
    worldY < (t.y + t.size) * gridSize
  );

  if (tokensAtPos.length === 0) return null;
  if (tokensAtPos.length === 1) return tokensAtPos[0];

  // Prioritize controllable tokens
  const userId = ctx.currentUser?.id || '';
  const controllable = tokensAtPos.filter(t =>
    ctx.isGM || t.ownerId === userId || t.controlledBy?.includes(userId)
  );

  // Return last (top layer) controllable or non-controllable
  if (controllable.length > 0) return controllable[controllable.length - 1];
  return tokensAtPos[tokensAtPos.length - 1];
};

/**
 * Find an obstacle (wall/door/window) at the given world position.
 */
export const findObstacleAt = (
  worldX: number,
  worldY: number,
  ctx: InteractionContext
): Obstacle | null => {
  if (!ctx.scene?.obstacles) return null;

  const clickRadius = 10 / ctx.zoom;
  const p = { x: worldX, y: worldY };

  return ctx.scene.obstacles.find(obs => {
    if (obs.type === 'wall') {
      if (!obs.points || obs.points.length < 2) return false;
      for (let i = 0; i < obs.points.length; i++) {
        if (obs.open && i === obs.points.length - 1) continue;
        const p1 = obs.points[i];
        const p2 = obs.points[(i + 1) % obs.points.length];
        if (!p1 || !p2) continue;
        if (distanceToSegment(p, p1, p2) < clickRadius) return true;
      }
      return false;
    } else {
      // Door/Window
      if (!obs.p1 || !obs.p2) return false;
      return distanceToSegment(p, obs.p1, obs.p2) < clickRadius;
    }
  }) || null;
};

/**
 * Find an audio zone at the given world position.
 */
export const findAudioZoneAt = (
  worldX: number,
  worldY: number,
  ctx: InteractionContext
): AudioZone | null => {
  if (!ctx.scene?.audioZones) return null;

  const p = { x: worldX, y: worldY };

  // Search from top to bottom
  for (let i = ctx.scene.audioZones.length - 1; i >= 0; i--) {
    const zone = ctx.scene.audioZones[i];

    if (zone.type === 'rect' && zone.rect) {
      const { x, y, w, h } = zone.rect;
      const x1 = Math.min(x, x + w);
      const x2 = Math.max(x, x + w);
      const y1 = Math.min(y, y + h);
      const y2 = Math.max(y, y + h);
      if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) return zone;
    } else if (zone.type === 'polygon' && zone.points) {
      if (isPointInPolygon(p, zone.points)) return zone;
    }
  }

  return null;
};

/**
 * Find a trigger zone at the given world position.
 */
export const findTriggerZoneAt = (
  worldX: number,
  worldY: number,
  ctx: InteractionContext
): TriggerZone | null => {
  if (!ctx.scene?.triggerZones) return null;

  const p = { x: worldX, y: worldY };

  for (let i = ctx.scene.triggerZones.length - 1; i >= 0; i--) {
    const zone = ctx.scene.triggerZones[i];

    if (zone.type === 'rect' && zone.rect) {
      const { x, y, w, h } = zone.rect;
      const x1 = Math.min(x, x + w);
      const x2 = Math.max(x, x + w);
      const y1 = Math.min(y, y + h);
      const y2 = Math.max(y, y + h);
      if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) return zone;
    } else if (zone.type === 'polygon' && zone.points) {
      if (isPointInPolygon(p, zone.points)) return zone;
    }
  }

  return null;
};

/**
 * Find a drawing at the given world position.
 */
export const findDrawingAt = (
  worldX: number,
  worldY: number,
  ctx: InteractionContext
): MapDrawing | null => {
  if (!ctx.scene?.drawings) return null;

  const clickRadius = 10 / ctx.zoom;
  const p = { x: worldX, y: worldY };

  for (let i = ctx.scene.drawings.length - 1; i >= 0; i--) {
    const drawing = ctx.scene.drawings[i];
    if (drawing.points.length < 2) continue;

    for (let j = 0; j < drawing.points.length - 1; j++) {
      const p1 = drawing.points[j];
      const p2 = drawing.points[j + 1];
      if (distanceToSegment(p, p1, p2) < Math.max(clickRadius, drawing.width / 2)) {
        return drawing;
      }
    }
  }

  return null;
};

/**
 * Find an attack zone at the given world position.
 */
export const findAttackZoneAt = (
  worldX: number,
  worldY: number,
  ctx: InteractionContext
): AttackZoneConfig | null => {
  if (!ctx.attackZoneResults || ctx.attackZoneResults.length === 0) return null;

  const tolerance = 20 / ctx.zoom;

  for (const zone of ctx.attackZoneResults) {
    const origin = zone.origin;
    const dist = Math.hypot(worldX - origin.x, worldY - origin.y);
    if (dist <= tolerance) {
      return zone;
    }
  }

  return null;
};

/**
 * Check if user can drag a specific token.
 */
export const canDragToken = (token: Token, ctx: InteractionContext): boolean => {
  const userId = ctx.currentUser?.id || '';

  // GM can move all
  if (ctx.isGM) return true;

  // Owner can move
  if (token.ownerId === userId) return true;

  // Controlled by user can move
  if (token.controlledBy?.includes(userId)) return true;

  return false;
};
