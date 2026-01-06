import React, { useState } from 'react';
import { VTTToolbar } from '@/components/vtt/VTTToolbar';
import { useGameSession } from '@/context/GameSessionContext';
import { useUiStore } from '../../store/uiStore';

import { MobileVTTToolbar } from '@/modules/vtt/map3d/ui/mobile/MobileVTTToolbar';

export const VTTToolbarWrapper: React.FC = () => {
  const session = useGameSession();
  const { isUiVisible } = useUiStore();

  // Local UI State for 3D View (mimicking GameSessionView state)
  const [isHandoutTrayOpen, setIsHandoutTrayOpen] = useState(false);
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);
  const [isAttackZonePanelOpen, setIsAttackZonePanelOpen] = useState(false);

  if (!isUiVisible) return null;

  const sharedProps = {
    activeTool: session.activeTool,
    isCombatActive: !!session.combat?.isActive,
    gmViewMode: session.gmViewMode,
    gmHideObstacles: session.ui.gmHideObstacles,
    players: session.players,
    previewPlayerId: session.previewPlayerId,
    isLibraryOpen: session.ui.isLibraryOpen,
    isDiceRollerOpen: session.ui.isDiceRollerOpen,
    isAudioPanelOpen: session.ui.isAudioPanelOpen,

    // Local state
    isHandoutTrayOpen,
    isCompendiumOpen,
    isAttackZonePanelOpen,

    onSetPreviewPlayer: session.setPreviewPlayerId,
    onToolSelect: session.setActiveTool,
    onResetFog: () => session.updateFog(''),
    onAddToken: () => console.log("Add Token 3D Triggered"),
    onToggleLibrary: session.toggleLibrary,
    onToggleDiceRoller: session.toggleDiceRoller,
    onToggleAudioPanel: session.toggleAudioPanel,

    // Local toggles
    onToggleHandouts: () => setIsHandoutTrayOpen(prev => !prev),
    onToggleCompendium: () => setIsCompendiumOpen(prev => !prev),
    onToggleAttackZones: () => setIsAttackZonePanelOpen(prev => !prev),

    onOpenSettings: () => console.log('Open 3D Settings'),
    onStartCombat: () => session.startCombat(),
    onEndCombat: session.endCombat,
    onToggleViewMode: session.toggleGMViewMode,
    onToggleGhostWalls: () => session.setGmHideObstacles(!session.ui.gmHideObstacles),
    onOpenPermissions: () => console.log('Open Permissions'),
    onOpenCursorSettings: () => console.log('Open Cursor Settings'),
    onOpenViewSettings: () => console.log('Open View Settings'),
  };

  return (
    <>
      {/* Desktop Toolbar (Hidden on Mobile) */}
      <div className="hidden md:block">
        <VTTToolbar {...sharedProps} />
      </div>

      {/* Mobile Toolbar (Visible only on Mobile) */}
      <div className="block md:hidden w-full">
        <MobileVTTToolbar
          {...sharedProps}
          isGameMaster={session.permissionHelper.isGameMaster()}
          canAsGMOr={(perm) => session.permissionHelper.canAsGMOr(perm)}
        />
      </div>
    </>
  );
};
