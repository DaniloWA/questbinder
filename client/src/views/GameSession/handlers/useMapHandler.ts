import { useState, useCallback } from 'react';
import { useGameSession } from '../../../context/GameSessionContext';
import { useAccessControl } from '../../../hooks/useAccessControl';

interface UseMapHandlerReturn {
  mapContextMenu: { x: number, y: number, worldX: number, worldY: number, obstacleId?: string, triggerZoneId?: string, audioZoneId?: string; } | null;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (v: boolean) => void;
  isCursorSettingsOpen: boolean;
  setIsCursorSettingsOpen: (v: boolean) => void;
  isPermissionsOpen: boolean;
  setIsPermissionsOpen: (v: boolean) => void;
  isCompendiumOpen: boolean;
  setIsCompendiumOpen: (v: boolean) => void;
  isViewSettingsOpen: boolean;
  setIsViewSettingsOpen: (v: boolean) => void;
  handleMapContextMenu: (e: React.MouseEvent, worldX: number, worldY: number, obstacleId?: string, triggerZoneId?: string, audioZoneId?: string) => void;
  closeMapContextMenu: () => void;
  handleToggleObstacleVisibility: () => void;
  handleDeleteObstacle: () => void;
}

export const useMapHandler = (): UseMapHandlerReturn => {
  const session = useGameSession();
  const { isGM } = useAccessControl();

  // UI Toggles managed locally to avoid global session pollution
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCursorSettingsOpen, setIsCursorSettingsOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);
  const [isViewSettingsOpen, setIsViewSettingsOpen] = useState(false);

  // Context Menu State
  const [mapContextMenu, setMapContextMenu] = useState<{ x: number, y: number, worldX: number, worldY: number, obstacleId?: string, triggerZoneId?: string, audioZoneId?: string; } | null>(null);

  const handleMapContextMenu = useCallback((e: React.MouseEvent, worldX: number, worldY: number, obstacleId?: string, triggerZoneId?: string, audioZoneId?: string) => {
    // We might want to close other menus here too
    setMapContextMenu({ x: e.clientX, y: e.clientY, worldX, worldY, obstacleId, triggerZoneId, audioZoneId });
    session.setCursorContextState(true);
  }, [session]);

  const closeMapContextMenu = useCallback(() => {
    setMapContextMenu(null);
    session.setCursorContextState(false);
  }, [session]);

  const handleToggleObstacleVisibility = useCallback(() => {
    if (mapContextMenu?.obstacleId) {
      const obs = session.activeScene?.obstacles.find(o => o.id === mapContextMenu.obstacleId);
      if (obs) {
        session.updateObstacle(obs.id, { hidden: !obs.hidden });
      }
    }
    closeMapContextMenu();
  }, [mapContextMenu, session, closeMapContextMenu]);

  const handleDeleteObstacle = useCallback(() => {
    if (mapContextMenu?.obstacleId && session.activeScene) {
      session.removeObstacle(mapContextMenu.obstacleId);
    }
    closeMapContextMenu();
  }, [mapContextMenu, session, closeMapContextMenu]);

  return {
    // State
    mapContextMenu,
    isSettingsOpen, setIsSettingsOpen,
    isCursorSettingsOpen, setIsCursorSettingsOpen,
    isPermissionsOpen, setIsPermissionsOpen,
    isCompendiumOpen, setIsCompendiumOpen,
    isViewSettingsOpen, setIsViewSettingsOpen,

    // Actions
    handleMapContextMenu,
    closeMapContextMenu,
    handleToggleObstacleVisibility,
    handleDeleteObstacle
  };
};
