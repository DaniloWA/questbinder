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
import { WorkerManager } from '../../../../../workers/core/WorkerManager';
import type { Token, Point } from '../../../../../types';
import { DebugLogger } from '../../../../../utils/DebugLogger';

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
  private pathRequestId = 0;
  private pathfindingTimer: number | null = null;

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
    // Always handle if currently dragging - this takes priority over everything
    if (this.dragState.isDragging) {
      return true;
    }

    // Check for token click/context/hover
    const token = findTokenAt(ctx.worldPos.x, ctx.worldPos.y, ctx);

    if (phase === 'down') {
      // Left click (0) -> Drag start check
      if (ctx.button === 0) {
        return token !== null && canDragToken(token, ctx);
      }
      // Right click (2) -> Context menu check
      if (ctx.button === 2) {
        const canContext = token !== null && (ctx.isGM || ctx.currentUser?.id === token.ownerId || token.controlledBy?.includes(ctx.currentUser?.id || ''));

        if (token && !canContext) {
          console.warn('[TokenDragHandler] Right-click rejected:', {
            tokenId: token.id,
            tokenOwner: token.ownerId,
            currentUserId: ctx.currentUser?.id,
            isGM: ctx.isGM,
            controlledBy: token.controlledBy
          });
        }

        return canContext;
      }
    }

    if (phase === 'move') {
      // When NOT dragging, just snoop for hover updates
      this.handleHover(ctx);
      return false;
    }

    return false;
  }

  onMouseDown(ctx: InteractionContext): HandlerResult {
    const token = findTokenAt(ctx.worldPos.x, ctx.worldPos.y, ctx);

    if (ctx.button === 0 || ctx.button === 2) {
      if (token) {
        DebugLogger.log('input', 'TokenDrag', 'HitTest', 'Token Found', {
          tokenId: token.id,
          owner: token.ownerId,
          canDrag: canDragToken(token, ctx),
          worldPos: ctx.worldPos
        });
      }
    }

    if (!token) return this.notHandled();

    // Right Click -> Context Menu
    if (ctx.button === 2) {
      this.callbacks?.onTokenContextMenu(
        { clientX: ctx.screenPos.x, clientY: ctx.screenPos.y } as React.MouseEvent,
        token.id
      );
      return this.handled();
    }

    // Left Click -> Drag Logic

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
    // If NOT dragging, we just handle hover logic (which is done in shouldHandle/handleHover for snooping)
    // But since we are here, it means we ARE dragging because of state check below
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

      // START ASYNC PATHFINDING
      const requestId = ++this.pathRequestId;

      // Initially show direct line while calculating (or keep previous if close?)
      // We'll set a direct line for responsiveness
      this.calculatedPath = [startPoint, endPoint];
      if (this.calculatedPathRef) this.calculatedPathRef.current = [...this.calculatedPath];

      // Debounce: 200ms
      if (this.pathfindingTimer) window.clearTimeout(this.pathfindingTimer);

      this.pathfindingTimer = window.setTimeout(() => {
        WorkerManager.getInstance().execute<Point[]>('pathfinding', 'findPath', {
          startGrid: startPoint,
          endGrid: endPoint,
          grid: ctx.scene!.grid,
          obstacles: ctx.scene!.obstacles
        }).then(path => {
          // Only apply if this is the latest request
          if (this.pathRequestId === requestId && this.dragState.isDragging) {
            this.calculatedPath = path;
            if (this.calculatedPathRef) this.calculatedPathRef.current = [...this.calculatedPath];

            // Re-emit with correct path
            this.callbacks?.emitTokenDrag?.(
              this.dragState.token!.id,
              this.dragState.lastCheckedGridX,
              this.dragState.lastCheckedGridY,
              this.calculatedPath
            );
          }
        }).catch(err => {
          console.error('[TokenDrag] Pathfinding error:', err);
        });
      }, 200);

      // Emit drag to remote clients (immediate feedback with direct line or partial)
      this.callbacks?.emitTokenDrag?.(
        this.dragState.token.id,
        newGridPos.x,
        newGridPos.y,
        this.calculatedPath
      );
    }

    // Always sync dragState (offset might change in future, but mainly to keep it alive)
    // Actually we only changed lastCheckedGridX/Y so dragState changed.
    if (this.dragStateRef) this.dragStateRef.current = { ...this.dragState };

    // Emit cursor move to keep remote clients synced (even if hidden)
    // This prevents the "replay animation" effect when the cursor reappears after drag.
    this.callbacks?.emitCursorMove?.(ctx.worldPos.x, ctx.worldPos.y);

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
    if (this.dragStateRef?.current?.draggedGroup?.length > 1) { // Access via Ref or State
      const group = this.dragState.draggedGroup;
      if (group.length > 1) {
        const dx = finalPos.x - token.x;
        const dy = finalPos.y - token.y;

        const groupMoves = group
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
    }

    // Reset state
    this.endDrag();
    return this.handled({ cursor: 'grab' });
  }

  onMouseLeave(_ctx: InteractionContext): HandlerResult {
    if (this.dragState.isDragging) {
      DebugLogger.log('input', 'TokenDrag', 'Cancel', 'MouseLeave - Drag Cancelled');
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

  private dragStateRef?: React.RefObject<DragState>;
  private calculatedPathRef?: React.RefObject<Point[]>;

  public setRefs(
    dragStateRef: React.RefObject<DragState>,
    calculatedPathRef: React.RefObject<Point[]>
  ) {
    this.dragStateRef = dragStateRef;
    this.calculatedPathRef = calculatedPathRef;
  }

  private startDrag(token: Token, ctx: InteractionContext): void {
    DebugLogger.log('input', 'TokenDrag', 'Start', 'Starting Drag', { id: token.id });
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
    this.callbacks?.setHoveredTokenId?.(null);

    // Sync to Refs
    if (this.dragStateRef) this.dragStateRef.current = { ...this.dragState };
    if (this.calculatedPathRef) this.calculatedPathRef.current = [...this.calculatedPath];
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
    if (this.pathfindingTimer) window.clearTimeout(this.pathfindingTimer);

    // Sync to Refs
    if (this.dragStateRef) this.dragStateRef.current = { ...this.dragState };
    if (this.calculatedPathRef) this.calculatedPathRef.current = [];
  }

  private handleHover(ctx: InteractionContext): void {
    if (this.dragState.isDragging) return;

    const token = findTokenAt(ctx.worldPos.x, ctx.worldPos.y, ctx);
    if (token) {
      this.callbacks?.setHoveredTokenId?.(token.id);
    } else {
      this.callbacks?.setHoveredTokenId?.(null);
    }
  }
}
