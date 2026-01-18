/**
 * VTT Interaction Engine - Token Drag Handler
 *
 * Handles token selection, dragging, and multi-token group moves.
 * Includes A* pathfinding and remote sync.
 */

import { BaseHandler } from '../core/BaseHandler';
import type {
  EventPhase,
  HandlerResult,
  InteractionContext,
  DragState,
  DraggedTokenInfo,
  createEmptyDragState,
} from '../core/types';
import { findTokenAt, canDragToken } from '../utils/hitTesting';
import { roundToGrid } from '../utils/coordConversion';
import { findPath } from '../../../../../utils/pathfinding';
import type { Token, Point } from '../../../../../types';

/**
 * TokenDragHandler - Token selection and movement.
 *
 * Priority: 500 (medium-high - takes precedence over pan)
 * Tools: select
 */
export class TokenDragHandler extends BaseHandler {
  private dragState: DragState = {
    isDragging: false,
    token: null,
    draggedGroup: [],
    offset: { x: 0, y: 0 },
    dragStartX: 0,
    dragStartY: 0,
    lastValidGridX: 0,
    lastValidGridY: 0,
    lastCheckedGridX: -1,
    lastCheckedGridY: -1,
  };

  private calculatedPath: Point[] = [];

  constructor() {
    super({
      id: 'token-drag',
      name: 'Token Drag',
      priority: 500,
      tools: ['select'],
      description: 'Token selection, dragging with pathfinding',
    });
  }

  shouldHandle(phase: EventPhase, ctx: InteractionContext): boolean {
    // Always handle if currently dragging
    if (this.dragState.isDragging) return true;

    // Check for token click on mouse down
    if (phase === 'down' && ctx.button === 0) {
      const token = findTokenAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
      return token !== null && canDragToken(token, ctx);
    }

    return false;
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    const token = findTokenAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
    if (!token) return this.notHandled();

    // Handle selection
    const alreadySelected = ctx.selectedTokenIds.includes(token.id);
    if (ctx.shiftKey) {
      // Multi-select toggle
      this.callbacks?.selectToken?.(token.id, true);
    } else if (!alreadySelected) {
      // Single select
      this.callbacks?.clearSelection?.();
      this.callbacks?.selectToken?.(token.id, false);
    }

    // Start dragging
    this.startDrag(token, ctx);
    return this.handled({ cursor: 'grabbing' });
  }

  onMouseMove(ctx: InteractionContext): HandlerResult {
    if (!this.dragState.isDragging || !this.dragState.token) {
      return this.notHandled();
    }

    const gridSize = ctx.gridSize;
    const newGridPos = roundToGrid(
      {
        x: ctx.worldPos.x - this.dragState.offset.x,
        y: ctx.worldPos.y - this.dragState.offset.y,
      },
      gridSize
    );

    // Only recalculate path if grid position changed
    if (
      newGridPos.x !== this.dragState.lastCheckedGridX ||
      newGridPos.y !== this.dragState.lastCheckedGridY
    ) {
      this.dragState.lastCheckedGridX = newGridPos.x;
      this.dragState.lastCheckedGridY = newGridPos.y;

      const startPoint = {
        x: this.dragState.token.x,
        y: this.dragState.token.y,
      };
      const endPoint = newGridPos;

      // A* pathfinding
      this.calculatedPath = findPath(
        startPoint,
        endPoint,
        ctx.scene!.grid,
        ctx.scene!.obstacles
      );

      // Emit drag to remote clients
      this.callbacks?.emitTokenDrag?.(
        this.dragState.token.id,
        newGridPos.x,
        newGridPos.y,
        this.calculatedPath
      );
    }

    return this.handled({ cursor: 'grabbing' });
  }

  onMouseUp(ctx: InteractionContext): HandlerResult {
    if (!this.dragState.isDragging || !this.dragState.token) {
      return this.notHandled();
    }

    const token = this.dragState.token;
    const path = this.calculatedPath;

    // Get final position from path
    const finalPos = path.length > 0
      ? path[path.length - 1]
      : { x: token.x, y: token.y };

    // Move the main token
    this.callbacks?.moveToken(token.id, finalPos.x, finalPos.y);

    // Move group tokens if multi-selected
    if (this.dragState.draggedGroup.length > 1) {
      const dx = finalPos.x - token.x;
      const dy = finalPos.y - token.y;

      const groupMoves = this.dragState.draggedGroup
        .filter(g => g.id !== token.id)
        .map(g => ({
          id: g.id,
          x: g.startGridX + dx,
          y: g.startGridY + dy,
        }));

      if (groupMoves.length > 0) {
        this.callbacks?.moveTokens?.(groupMoves);
      }
    }

    // Reset state
    this.endDrag();
    return this.handled({ cursor: 'grab' });
  }

  onMouseLeave(_ctx: InteractionContext): HandlerResult {
    if (this.dragState.isDragging) {
      // Cancel drag on leave
      this.endDrag();
      return this.handled();
    }
    return this.notHandled();
  }

  // Public accessors for external use (e.g., rendering)
  getDragState(): Readonly<DragState> {
    return this.dragState;
  }

  getCalculatedPath(): Readonly<Point[]> {
    return this.calculatedPath;
  }

  isDragging(): boolean {
    return this.dragState.isDragging;
  }

  // Private methods
  private startDrag(token: Token, ctx: InteractionContext): void {
    const gridSize = ctx.gridSize;

    this.dragState = {
      isDragging: true,
      token,
      draggedGroup: [],
      offset: {
        x: ctx.worldPos.x - token.x * gridSize,
        y: ctx.worldPos.y - token.y * gridSize,
      },
      dragStartX: ctx.screenPos.x,
      dragStartY: ctx.screenPos.y,
      lastValidGridX: token.x,
      lastValidGridY: token.y,
      lastCheckedGridX: token.x,
      lastCheckedGridY: token.y,
    };

    // Build group if multi-selected
    if (ctx.selectedTokenIds.includes(token.id) && ctx.selectedTokenIds.length > 1) {
      const groupTokens = ctx.tokens.filter(t =>
        ctx.selectedTokenIds.includes(t.id)
      );

      this.dragState.draggedGroup = groupTokens.map(t => ({
        id: t.id,
        offsetX: ctx.worldPos.x - t.x * gridSize,
        offsetY: ctx.worldPos.y - t.y * gridSize,
        startGridX: t.x,
        startGridY: t.y,
      }));
    } else {
      this.dragState.draggedGroup = [{
        id: token.id,
        offsetX: this.dragState.offset.x,
        offsetY: this.dragState.offset.y,
        startGridX: token.x,
        startGridY: token.y,
      }];
    }

    this.calculatedPath = [{ x: token.x, y: token.y }];

    // Notify for UI state
    this.callbacks?.setDragging?.(true);
  }

  private endDrag(): void {
    this.dragState = {
      isDragging: false,
      token: null,
      draggedGroup: [],
      offset: { x: 0, y: 0 },
      dragStartX: 0,
      dragStartY: 0,
      lastValidGridX: 0,
      lastValidGridY: 0,
      lastCheckedGridX: -1,
      lastCheckedGridY: -1,
    };
    this.calculatedPath = [];
    this.callbacks?.setDragging?.(false);
  }
}
