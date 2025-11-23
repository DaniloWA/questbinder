import React from 'react';
import { GameSessionState, VTTTool } from '../types';

export const useUiActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  isCompendiumOpen: boolean,
  setIsCompendiumOpen: (val: boolean) => void
) => {
  const toggleGMViewMode = () => setState(prev => ({ ...prev, gmViewMode: prev.gmViewMode === 'gm' ? 'player' : 'gm' }));
  const setPreviewPlayerId = (id: string | 'all') => setState(prev => ({ ...prev, previewPlayerId: id }));
  const setGmHideObstacles = (val: boolean) => setState(prev => ({ ...prev, ui: { ...prev.ui, gmHideObstacles: val } }));
  const setDefaultObstacleHidden = (val: boolean) => setState(prev => ({ ...prev, ui: { ...prev.ui, defaultObstacleHidden: val } }));
  const toggleVisionRanges = () => setState(prev => ({ ...prev, ui: { ...prev.ui, showVisionRanges: !prev.ui.showVisionRanges } }));
  const toggleRightSidebar = () => setState(prev => ({ ...prev, ui: { ...prev.ui, isRightSidebarOpen: !prev.ui.isRightSidebarOpen } }));
  const toggleLibrary = () => setState(prev => ({ ...prev, ui: { ...prev.ui, isLibraryOpen: !prev.ui.isLibraryOpen } }));
  const toggleDiceRoller = () => setState(prev => ({ ...prev, ui: { ...prev.ui, isDiceRollerOpen: !prev.ui.isDiceRollerOpen } }));
  const toggleAudioPanel = () => setState(prev => ({ ...prev, ui: { ...prev.ui, isAudioPanelOpen: !prev.ui.isAudioPanelOpen } }));
  const toggleCompendium = () => setIsCompendiumOpen(!isCompendiumOpen);
  const invitePlayer = () => `http://localhost:5173/join/${campaignId}`;
  const setActiveTool = (tool: VTTTool) => setState(prev => ({ ...prev, activeTool: tool }));
  const setMovementPath = (p: { x: number, y: number; }[]) => setState(prev => ({ ...prev, movementPath: p }));
  const setDrawingObstacle = (o: any) => setState(prev => ({ ...prev, drawingObstacle: o }));
  const setDraftPolyPoints = (pts: { x: number, y: number; }[]) => setState(prev => ({ ...prev, draftPolyPoints: pts }));
  const setDrawingLightZone = (z: any) => setState(prev => ({ ...prev, drawingLightZone: z }));
  const setDrawingAudioZone = (z: any) => setState(prev => ({ ...prev, drawingAudioZone: z }));
  const setDrawingTriggerZone = (z: any) => setState(prev => ({ ...prev, drawingTriggerZone: z }));

  return {
    toggleGMViewMode,
    setPreviewPlayerId,
    setGmHideObstacles,
    setDefaultObstacleHidden,
    toggleVisionRanges,
    toggleRightSidebar,
    toggleLibrary,
    toggleDiceRoller,
    toggleAudioPanel,
    toggleCompendium,
    invitePlayer,
    setActiveTool,
    setMovementPath,
    setDrawingObstacle,
    setDraftPolyPoints,
    setDrawingLightZone,
    setDrawingAudioZone,
    setDrawingTriggerZone
  };
};
