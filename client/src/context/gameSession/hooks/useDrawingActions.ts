import React from 'react';
import { GameSessionState, BooleanPermissionKey, DrawingSettings } from '../types';
import { campaignService } from '../../../services/campaignService';
import { socketService } from '../../../services/socketService';
import { smartSync } from '../../../services/sync';
import { MapDrawing } from '../../../types';
import { ActionHandlers, StateHelpers } from '../helpers';

export const useDrawingActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  user: any,
  permissionHelper?: any // REGRA MILENAR
) => {
  const addDrawing = (drawing: MapDrawing) => {
    const newDrawing = { ...drawing, ...state.drawingSettings };

    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      user,
      permissionHelper, // REGRA MILENAR
      requiredPermission: 'drawings',

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.addItemToSceneList(
          prev.scenes,
          prev.activeSceneId,
          'drawings',
          newDrawing
        );
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        smartSync.apply('drawing', newDrawing.id, 'create', newDrawing, state.activeSceneId);
      }
    });
  };

  const removeDrawing = (id: string) => {
    const scene = state.scenes.find(s => s.id === state.activeSceneId);
    const drawing = scene?.drawings.find(d => d.id === id);
    const isOwner = drawing?.userId === user?.id;

    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      user,
      permissionHelper, // REGRA MILENAR
      // Custom permission: GM OR Owner OR drawingDelete permission
      validate: () => {
        return permissionHelper ? permissionHelper.canDeleteDrawing(drawing?.userId) : false;
      },

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.removeItemFromSceneList(
          prev.scenes,
          prev.activeSceneId,
          'drawings',
          id
        );
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        smartSync.apply('drawing', id, 'delete', {}, state.activeSceneId);
      }
    });
  };

  const undoLastDrawing = () => {
    const activeScene = state.scenes.find(s => s.id === state.activeSceneId);
    if (!activeScene || !activeScene.drawings || !user) return;

    const myDrawings = activeScene.drawings.filter(d => d.userId === user.id);
    if (myDrawings.length > 0) {
      const lastDrawing = myDrawings[myDrawings.length - 1];
      removeDrawing(lastDrawing.id);
    }
  };

  const clearAllDrawings = () => {
    ActionHandlers.handleOptimisticAction({
      state,
      setState,
      campaignId,
      user,
      permissionHelper, // REGRA MILENAR
      requiredPermission: 'drawingClear', // Changed from isGMOnly to specific permission

      optimisticUpdate: (prev) => {
        const updatedScenes = StateHelpers.updateSceneInList(
          prev.scenes,
          prev.activeSceneId,
          { drawings: [] }
        );
        return { ...prev, scenes: updatedScenes };
      },

      socketEmit: () => {
        smartSync.apply('scene', state.activeSceneId, 'update', { drawings: [] });
      }
    });
  };

  const setDrawingSettings = (settings: DrawingSettings) => {
    setState(prev => ({ ...prev, drawingSettings: settings }));
  };

  return {
    addDrawing,
    removeDrawing,
    undoLastDrawing,
    clearAllDrawings,
    setDrawingSettings
  };
};
