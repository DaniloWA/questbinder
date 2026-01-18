/**
 * VTT Interaction Engine - Attack Zone Handler
 *
 * Handles placement, dragging, and rotation of attack zones.
 */

import { BaseHandler } from '../core/BaseHandler';
import type { EventPhase, HandlerResult, InteractionContext, AttackZoneConfig } from '../core/types';
import { findAttackZoneAt } from '../utils/hitTesting';
import type { Point } from '../../../../../types';

interface DraggedAttackZone {
  id: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  rotating: boolean;
}

/**
 * AttackZoneHandler - Attack zone placement and manipulation.
 *
 * Priority: 700 (higher than token drag)
 * Tools: select (when isPlacingAttackZone)
 */
export class AttackZoneHandler extends BaseHandler {
  private draggedZone: DraggedAttackZone | null = null;

  constructor() {
    super({
      id: 'attack-zone',
      name: 'Attack Zone',
      priority: 700,
      tools: ['select'],
      description: 'Place and manipulate attack zones',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    // Handle placement mode
    if (ctx.isPlacingAttackZone) return true;

    // Handle ongoing drag
    if (this.draggedZone) return true;

    // Check for zone click when GM
    if (phase === 'down' && ctx.isGM && ctx.activeTool === 'select') {
      const zone = findAttackZoneAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
      return zone !== null;
    }

    return false;
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    // Placement mode
    if (ctx.isPlacingAttackZone) {
      if (ctx.button === 0) {
        // Confirm placement
        this.callbacks?.onConfirmAttackZonePlacement?.();
        return this.handled();
      }
      if (ctx.button === 2) {
        // Cancel placement
        this.callbacks?.onCancelAttackZonePlacement?.();
        return this.handled();
      }
      return this.notHandled();
    }

    // Check for zone click
    if (ctx.button === 0 && ctx.isGM) {
      const zone = findAttackZoneAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
      if (zone) {
        // Start dragging (shift = rotate)
        this.draggedZone = {
          id: zone.id,
          startX: ctx.worldPos.x,
          startY: ctx.worldPos.y,
          originX: zone.origin.x,
          originY: zone.origin.y,
          rotating: ctx.shiftKey,
        };
        return this.handled({ cursor: ctx.shiftKey ? 'ew-resize' : 'move' });
      }
    }

    // Right click context menu
    if (ctx.button === 2 && ctx.isGM) {
      const zone = findAttackZoneAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
      if (zone) {
        this.callbacks?.onAttackZoneContextMenu?.(
          { clientX: ctx.screenPos.x, clientY: ctx.screenPos.y } as React.MouseEvent,
          zone.id
        );
        return this.handled();
      }
    }

    return this.notHandled();
  }

  onMouseMove(ctx: InteractionContext): HandlerResult {
    // Update preview position in placement mode
    if (ctx.isPlacingAttackZone) {
      this.callbacks?.onUpdatePreviewOrigin?.({ ...ctx.worldPos });
      return this.handled({ cursor: 'crosshair' });
    }

    // Handle dragging
    if (this.draggedZone) {
      if (this.draggedZone.rotating) {
        // Calculate rotation angle
        const dx = ctx.worldPos.x - this.draggedZone.originX;
        const dy = ctx.worldPos.y - this.draggedZone.originY;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        this.callbacks?.onUpdateAttackZone?.(this.draggedZone.id, { direction: angle });
        return this.handled({ cursor: 'ew-resize' });
      } else {
        // Calculate new position
        const dx = ctx.worldPos.x - this.draggedZone.startX;
        const dy = ctx.worldPos.y - this.draggedZone.startY;

        this.callbacks?.onUpdateAttackZone?.(this.draggedZone.id, {
          origin: {
            x: this.draggedZone.originX + dx,
            y: this.draggedZone.originY + dy,
          },
        });
        return this.handled({ cursor: 'move' });
      }
    }

    return this.notHandled();
  }

  onMouseUp(_ctx: InteractionContext): HandlerResult {
    if (this.draggedZone) {
      this.draggedZone = null;
      return this.handled();
    }
    return this.notHandled();
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  getDraggedZone(): Readonly<DraggedAttackZone | null> {
    return this.draggedZone;
  }

  isManipulating(): boolean {
    return this.draggedZone !== null;
  }
}
