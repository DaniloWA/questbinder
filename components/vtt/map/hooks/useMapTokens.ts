import React, { useCallback } from 'react';
import { Token, MapScene as Scene } from '../../../../types';
import { DragState } from '../types';
import { findPath } from '../../../../utils/pathfinding';

interface UseMapTokensProps {
  scene: Scene | null;
  tokens: Token[];
  viewport: { zoom: number; };
  dragState: React.MutableRefObject<DragState>;
  selectedTokenIds: string[];
  currentUser: any;
  isGM: boolean;
  permissionHelper: any;
  moveToken: (id: string, x: number, y: number) => void;
  moveTokens: (updates: { id: string, x: number, y: number; }[]) => void;
  selectToken: (id: string, multi: boolean) => void;
  clearSelection: () => void;
  setHoveredTokenId: (id: string | null) => void;
  setCalculatedPath: (path: { x: number, y: number; }[]) => void;
  emitTokenDrag: (id: string, x: number, y: number, path: { x: number, y: number; }[]) => void;
}

export const useMapTokens = ({
  scene,
  tokens,
  viewport,
  dragState,
  selectedTokenIds,
  currentUser,
  isGM,
  permissionHelper,
  moveToken,
  moveTokens,
  selectToken,
  clearSelection,
  setHoveredTokenId,
  setCalculatedPath,
  emitTokenDrag
}: UseMapTokensProps) => {

  const findTokenAt = useCallback((worldX: number, worldY: number) => {
    if (!scene) return null;
    const gridSize = scene.grid.size;
    return [...tokens].reverse().find(t =>
      worldX >= t.x * gridSize && worldX < (t.x + t.size) * gridSize &&
      worldY >= t.y * gridSize && worldY < (t.y + t.size) * gridSize
    );
  }, [scene, tokens]);

  const handleTokenDragStart = useCallback((e: React.MouseEvent, token: Token, worldPos: { x: number, y: number; }, screenPos: { x: number, y: number; }) => {
    const alreadySelected = selectedTokenIds?.includes(token.id);

    if (e.shiftKey) {
      if (selectToken) selectToken(token.id, true);
    } else if (!alreadySelected && selectToken && clearSelection) {
      clearSelection();
      selectToken(token.id, false);
    }

    const isController = token.controlledBy?.includes(currentUser?.id || '');
    if (isGM || isController) {
      if (!permissionHelper.canMoveToken(token)) {
        console.warn('[MapCanvas] Token movement denied');
        return;
      }

      dragState.current.isDragging = true;
      dragState.current.token = token;
      dragState.current.dragStartX = screenPos.x;
      dragState.current.dragStartY = screenPos.y;

      const gridSize = scene?.grid.size || 70;
      dragState.current.offset = { x: worldPos.x - token.x * gridSize, y: worldPos.y - token.y * gridSize };
      dragState.current.lastValidGridX = token.x;
      dragState.current.lastValidGridY = token.y;
      dragState.current.lastCheckedGridX = token.x;
      dragState.current.lastCheckedGridY = token.y;

      setCalculatedPath([{ x: token.x, y: token.y }]);

      let tokensToDrag = [token];
      if (selectedTokenIds && selectedTokenIds.includes(token.id) && selectedTokenIds.length > 1) {
        tokensToDrag = tokens.filter(t => selectedTokenIds.includes(t.id));
      }

      dragState.current.draggedGroup = tokensToDrag.map(t => ({
        id: t.id,
        offsetX: worldPos.x - t.x * gridSize,
        offsetY: worldPos.y - t.y * gridSize,
        startGridX: t.x,
        startGridY: t.y
      }));
    }
  }, [selectedTokenIds, selectToken, clearSelection, currentUser, isGM, permissionHelper, scene, tokens, dragState, setCalculatedPath]);

  const handleTokenDragMove = useCallback((worldPos: { x: number, y: number; }) => {
    if (!dragState.current.isDragging || !dragState.current.token) return;

    const gridSize = scene?.grid.size || 70;
    const newGridX = Math.round((worldPos.x - dragState.current.offset.x) / gridSize);
    const newGridY = Math.round((worldPos.y - dragState.current.offset.y) / gridSize);

    if (newGridX !== dragState.current.lastCheckedGridX || newGridY !== dragState.current.lastCheckedGridY) {
      dragState.current.lastCheckedGridX = newGridX;
      dragState.current.lastCheckedGridY = newGridY;

      const startPoint = { x: dragState.current.token.x, y: dragState.current.token.y };
      const endPoint = { x: newGridX, y: newGridY };

      const path = findPath(startPoint, endPoint, scene!.grid, scene!.obstacles);
      setCalculatedPath(path);

      if (emitTokenDrag) {
        emitTokenDrag(dragState.current.token.id, newGridX, newGridY, path);
      }
    }
  }, [dragState, scene, setCalculatedPath, emitTokenDrag]);

  const handleTokenDragEnd = useCallback((calculatedPath: { x: number, y: number; }[]) => {
    if (!dragState.current.isDragging || !dragState.current.token) return;

    const token = dragState.current.token;
    const path = calculatedPath || [];
    const finalPos = path.length > 0 ? path[path.length - 1] : { x: token.x, y: token.y };

    moveToken(token.id, finalPos.x, finalPos.y);

    if (dragState.current.draggedGroup.length > 0) {
      const dx = finalPos.x - token.x;
      const dy = finalPos.y - token.y;
      const groupMoves = dragState.current.draggedGroup
        .filter(g => g.id !== token.id)
        .map(g => ({ id: g.id, x: g.startGridX + dx, y: g.startGridY + dy }));

      if (groupMoves.length > 0 && moveTokens) {
        moveTokens(groupMoves);
      }
    }

    dragState.current.isDragging = false;
    dragState.current.token = null;
    setCalculatedPath([]);
  }, [dragState, moveToken, moveTokens, setCalculatedPath]);

  return {
    findTokenAt,
    handleTokenDragStart,
    handleTokenDragMove,
    handleTokenDragEnd
  };
};
