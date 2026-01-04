import React from 'react';
import { DrawingToolbar } from '../../../components/vtt/DrawingToolbar';
import { RulerToolbar } from '../../../components/vtt/RulerToolbar';
import { VTTToolbar } from '../../../components/vtt/VTTToolbar';
import { useGameSession } from '../../../context/GameSessionContext';
import { useAuth } from '../../../context/AuthContext';
import { Token } from '../../../types';

interface GameToolbarProps {
  onOpenTokenModal: (token: Token | 'new', initialPosition?: { x: number, y: number; }) => void;
  onOpenSettings: () => void;
  onOpenPermissions: () => void;
  onStartCombat: () => void;
  isHandoutTrayOpen: boolean;
  onToggleHandouts: () => void;
  isCompendiumOpen: boolean;
  onToggleCompendium: () => void;
  isAttackZonePanelOpen: boolean;
  onToggleAttackZones: () => void;
}

export const GameToolbar: React.FC<GameToolbarProps> = ({
  onOpenTokenModal,
  onOpenSettings,
  onOpenPermissions,
  onStartCombat,
  isHandoutTrayOpen,
  onToggleHandouts,
  isCompendiumOpen,
  onToggleCompendium,
  isAttackZonePanelOpen,
  onToggleAttackZones
}) => {
  const session = useGameSession();
  const { user: currentUser } = useAuth();

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end p-4 sm:p-6">
      <div className="pointer-events-auto self-center mb-4 md:mb-6 flex flex-col items-center gap-4">
        {/* Render Drawing Toolbar if active */}
        <DrawingToolbar />
        {/* Render Ruler Toolbar if active */}
        <RulerToolbar />

        <VTTToolbar
          activeTool={session.activeTool}
          isCombatActive={!!session.combat?.isActive}
          gmViewMode={session.gmViewMode}
          gmHideObstacles={session.ui.gmHideObstacles}
          players={session.players}
          previewPlayerId={session.previewPlayerId}
          onSetPreviewPlayer={session.setPreviewPlayerId}
          onToolSelect={session.setActiveTool}
          onResetFog={() => session.updateFog('')}
          onAddToken={() => {
            const gridSize = session.activeScene?.grid.size || 70;
            onOpenTokenModal('new', { x: Math.floor((-session.viewport.x + window.innerWidth / 2) / session.viewport.zoom / gridSize), y: Math.floor((-session.viewport.y + window.innerHeight / 2) / session.viewport.zoom / gridSize) });
          }}
          onToggleLibrary={session.toggleLibrary}
          isLibraryOpen={session.ui.isLibraryOpen}
          onToggleDiceRoller={session.toggleDiceRoller}
          isDiceRollerOpen={session.ui.isDiceRollerOpen}
          onOpenSettings={onOpenSettings}
          onStartCombat={onStartCombat}
          onEndCombat={session.endCombat}
          onToggleViewMode={session.toggleGMViewMode}
          onToggleGhostWalls={() => session.setGmHideObstacles(!session.ui.gmHideObstacles)}
          onOpenPermissions={onOpenPermissions}
          isAudioPanelOpen={session.ui.isAudioPanelOpen}
          onToggleAudioPanel={session.toggleAudioPanel}
          isHandoutTrayOpen={isHandoutTrayOpen}
          onToggleHandouts={onToggleHandouts}
          onToggleCompendium={onToggleCompendium}
          isCompendiumOpen={isCompendiumOpen}
          isAttackZonePanelOpen={isAttackZonePanelOpen}
          onToggleAttackZones={onToggleAttackZones}
        />
      </div>
    </div>
  );
};
