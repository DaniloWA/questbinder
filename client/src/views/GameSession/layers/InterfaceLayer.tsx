import React, { memo } from 'react';
import { useNavigation } from '../../../context/NavigationContext';
import { Button } from '../../../components/ui/Button';
import { Tooltip } from '../../../components/ui/Tooltip';
import { ChevronLeft, Wifi, WifiOff, Swords } from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';
import { useGameSession } from '../../../context/GameSessionContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { SpectateBanner } from '../../../components/vtt/SpectateBanner';
import { DrawingToolbar } from '../../../components/vtt/DrawingToolbar';
import { RulerToolbar } from '../../../components/vtt/RulerToolbar';
import { MapAlignerTool } from '../../../components/vtt/map/MapAlignerTool';
import { VTTToolbar } from '../../../components/vtt/VTTToolbar';
import { MobileVTTToolbar } from '../../../modules/vtt/map3d/ui/mobile/MobileVTTToolbar';
import { SceneNavigation } from '../../../components/vtt/SceneNavigation';
import { SmartDiceRoller } from '../../../components/vtt/SmartDiceRoller';
import { AudioPanel } from '../../../components/vtt/AudioPanel';
import { SFXPanel } from '../../../components/vtt/SFXPanel';
import { CompendiumWindow } from '../../../components/vtt/CompendiumWindow';
import { HandoutTray } from '../../../components/vtt/HandoutTray';
import { AttackZonePanel } from '../../../components/vtt/AttackZonePanel';
import { TokenLibrary } from '../../../components/vtt/TokenLibrary';
import { SharedHandoutViewer } from '../../../components/vtt/SharedHandoutViewer';
import { Sidebar } from '../../../components/vtt/Sidebar';
import { useTokenHandler } from '../handlers/useTokenHandler';
import { useMapHandler } from '../handlers/useMapHandler';
import { useZoneHandler } from '../handlers/useZoneHandler';
import { useHandoutHandler } from '../handlers/useHandoutHandler';

interface InterfaceLayerProps {
  session: ReturnType<typeof useGameSession>;
  tokenHandler: ReturnType<typeof useTokenHandler>;
  mapHandler: ReturnType<typeof useMapHandler>;
  zoneHandler: ReturnType<typeof useZoneHandler>;
  handoutHandler: ReturnType<typeof useHandoutHandler>;
  onStartCombat: () => void;
}

export const InterfaceLayer = memo(({ session, tokenHandler, mapHandler, zoneHandler, handoutHandler, onStartCombat }: InterfaceLayerProps) => {
  const { t } = useTranslation();
  const { navigateTo } = useNavigation();
  const { isGM } = useAccessControl();

  return (
    <>
      <SpectateBanner />

      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
        <div className="flex justify-between items-start w-full">
          {/* Header Left - Campaign Info */}
          <div className="pointer-events-auto flex items-center gap-3 bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-2 pr-6 shadow-xl hover:bg-zinc-950/90 transition-colors group">
            <Button variant="ghost" size="icon" onClick={() => navigateTo('campaign-dashboard', { id: session.campaign.id })} className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="font-bold text-sm text-zinc-100 leading-none group-hover:text-primary transition-colors">{session.campaign.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${session.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  {session.activeScene?.name || t('vtt.gameSession.loading.default')}
                  {session.isConnected ? <span className="text-green-600/80 ml-1 hidden sm:inline">{t('vtt.gameSession.status.live')}</span> : <span className="text-red-600/80 ml-1 hidden sm:inline">{t('vtt.gameSession.status.offline')}</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Combat Banner */}
          {session.combat?.isActive && (
            <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 top-6 bg-red-950/90 backdrop-blur-md border border-red-500/30 text-red-100 px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
              <Swords className="w-4 h-4 text-red-400 animate-pulse" />
              <div className="flex gap-4 text-sm font-bold font-fantasy tracking-wide">
                <span>{t('vtt.gameSession.combat.label')}</span>
                <span className="w-px h-4 bg-red-500/30"></span>
                <span>{t('vtt.gameSession.combat.round', { round: session.combat.round })}</span>
              </div>
            </div>
          )}

          {/* Header Right - Status & Toggles */}
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="flex gap-2 bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-xl">
              <Tooltip content={session.isConnected ? t('vtt.gameSession.status.connected') : t('vtt.gameSession.status.disconnected')}>
                <div className={`p-2.5 rounded-xl transition-all ${session.isConnected ? 'text-green-500' : 'text-red-500'}`}>
                  {session.isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
              </Tooltip>
              <div className="w-px h-6 bg-white/10 self-center mx-1"></div>
              <Tooltip content={t('vtt.gameSession.toolbar.groupCombat')}>
                <button onClick={session.toggleRightSidebar} className={`p-2.5 rounded-xl transition-all duration-200 ${session.ui.isRightSidebarOpen ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                  <Swords className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Center Bottom - Toolbars */}
        <div className="pointer-events-auto self-center mb-4 md:mb-6 flex flex-col items-center gap-4 w-full md:w-auto">
          <DrawingToolbar />
          <RulerToolbar />
          <MapAlignerTool />

          {/* Desktop Toolbar */}
          <div className="hidden md:block">
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
                tokenHandler.handleOpenTokenModal('new', { x: Math.floor((-session.viewport.x + window.innerWidth / 2) / session.viewport.zoom / gridSize), y: Math.floor((-session.viewport.y + window.innerHeight / 2) / session.viewport.zoom / gridSize) });
              }}
              onToggleLibrary={session.toggleLibrary}
              isLibraryOpen={session.ui.isLibraryOpen}
              onToggleDiceRoller={session.toggleDiceRoller}
              isDiceRollerOpen={session.ui.isDiceRollerOpen}
              onOpenSettings={() => mapHandler.setIsSettingsOpen(true)}
              onOpenCursorSettings={() => mapHandler.setIsCursorSettingsOpen(true)}
              onStartCombat={onStartCombat}
              onEndCombat={session.endCombat}
              onToggleViewMode={session.toggleGMViewMode}
              onToggleGhostWalls={() => session.setGmHideObstacles(!session.ui.gmHideObstacles)}
              onOpenPermissions={() => mapHandler.setIsPermissionsOpen(true)}
              isAudioPanelOpen={session.ui.isAudioPanelOpen}
              onToggleAudioPanel={session.toggleAudioPanel}
              isHandoutTrayOpen={handoutHandler.isHandoutTrayOpen}
              onToggleHandouts={() => handoutHandler.setIsHandoutTrayOpen(!handoutHandler.isHandoutTrayOpen)}
              onToggleCompendium={() => mapHandler.setIsCompendiumOpen(!mapHandler.isCompendiumOpen)}
              isCompendiumOpen={mapHandler.isCompendiumOpen}
              isAttackZonePanelOpen={zoneHandler.isAttackZonePanelOpen}
              onToggleAttackZones={() => zoneHandler.setIsAttackZonePanelOpen(!zoneHandler.isAttackZonePanelOpen)}
              onToggleSFXPanel={session.toggleSFXPanel}
              isSFXPanelOpen={session.ui.isSFXPanelOpen}
              onOpenViewSettings={() => mapHandler.setIsViewSettingsOpen(true)}
              onOpenDebugPanel={session.toggleDebugPanel}
            />
          </div>

          {/* Mobile Toolbar */}
          <div className="block md:hidden w-full">
            <MobileVTTToolbar
              activeTool={session.activeTool}
              isCombatActive={!!session.combat?.isActive}
              gmViewMode={session.gmViewMode}
              gmHideObstacles={session.ui.gmHideObstacles}
              players={session.players}
              previewPlayerId={session.previewPlayerId}
              isLibraryOpen={session.ui.isLibraryOpen}
              isDiceRollerOpen={session.ui.isDiceRollerOpen}
              isAudioPanelOpen={session.ui.isAudioPanelOpen}
              isHandoutTrayOpen={handoutHandler.isHandoutTrayOpen}
              isCompendiumOpen={mapHandler.isCompendiumOpen}
              isAttackZonePanelOpen={zoneHandler.isAttackZonePanelOpen}
              onSetPreviewPlayer={session.setPreviewPlayerId}
              onToolSelect={session.setActiveTool}
              onResetFog={() => session.updateFog('')}
              onAddToken={() => {
                const gridSize = session.activeScene?.grid.size || 70;
                tokenHandler.handleOpenTokenModal('new', { x: Math.floor((-session.viewport.x + window.innerWidth / 2) / session.viewport.zoom / gridSize), y: Math.floor((-session.viewport.y + window.innerHeight / 2) / session.viewport.zoom / gridSize) });
              }}
              onToggleLibrary={session.toggleLibrary}
              onToggleDiceRoller={session.toggleDiceRoller}
              onToggleAudioPanel={session.toggleAudioPanel}
              onToggleHandouts={() => handoutHandler.setIsHandoutTrayOpen(!handoutHandler.isHandoutTrayOpen)}
              onToggleCompendium={() => mapHandler.setIsCompendiumOpen(!mapHandler.isCompendiumOpen)}

              onToggleAttackZones={() => zoneHandler.setIsAttackZonePanelOpen(!zoneHandler.isAttackZonePanelOpen)}
              onToggleSFXPanel={session.toggleSFXPanel}
              isSFXPanelOpen={session.ui.isSFXPanelOpen}
              onOpenSettings={() => mapHandler.setIsSettingsOpen(true)}
              onStartCombat={onStartCombat}
              onEndCombat={session.endCombat}
              onToggleViewMode={session.toggleGMViewMode}
              onToggleGhostWalls={() => session.setGmHideObstacles(!session.ui.gmHideObstacles)}
              onOpenPermissions={() => mapHandler.setIsPermissionsOpen(true)}
              onOpenCursorSettings={() => mapHandler.setIsCursorSettingsOpen(true)}
              onOpenViewSettings={() => mapHandler.setIsViewSettingsOpen(true)}
              onOpenDebugPanel={session.toggleDebugPanel}
              isGameMaster={isGM}
              canAsGMOr={(perm) => session.permissionHelper.canAsGMOr(perm)}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-auto">
        <SceneNavigation />
      </div>

      {/* Panels & Windows */}
      <div className="pointer-events-auto">
        <SmartDiceRoller isOpen={session.ui.isDiceRollerOpen} onClose={session.toggleDiceRoller} />
      </div>

      <div className="pointer-events-auto">
        <AudioPanel isOpen={session.ui.isAudioPanelOpen} onClose={session.toggleAudioPanel} />
      </div>

      <div className="pointer-events-auto">
        <SFXPanel isOpen={session.ui.isSFXPanelOpen || false} onClose={session.toggleSFXPanel} />
      </div>

      <div className="pointer-events-auto">
        <CompendiumWindow isOpen={mapHandler.isCompendiumOpen} onClose={() => mapHandler.setIsCompendiumOpen(false)} />
      </div>

      <div className="pointer-events-auto">
        <HandoutTray isOpen={handoutHandler.isHandoutTrayOpen} onClose={() => handoutHandler.setIsHandoutTrayOpen(false)} handouts={session.handouts} onCreate={() => handoutHandler.setEditingHandout('new')} onEdit={(h) => handoutHandler.setEditingHandout(h)} onShare={(h) => handoutHandler.setSharingHandout(h)} onPreview={(h) => handoutHandler.setPreviewingHandout(h)} />
      </div>

      {/* Attack Zone Panel */}
      <div className="pointer-events-auto">
        <AttackZonePanel
          isOpen={zoneHandler.isAttackZonePanelOpen}
          onClose={() => zoneHandler.setIsAttackZonePanelOpen(false)}
          onSelectTemplate={(templateId) => {
            const centerX = Math.floor((-session.viewport.x + window.innerWidth / 2) / session.viewport.zoom);
            const centerY = Math.floor((-session.viewport.y + window.innerHeight / 2) / session.viewport.zoom);
            zoneHandler.attackZones.startPreviewFromTemplate(templateId, { x: centerX, y: centerY });
            zoneHandler.setIsAttackZonePanelOpen(false);
          }}
          onCreateCustom={() => {
            zoneHandler.setIsAttackZoneConfigOpen(true);
            zoneHandler.setIsAttackZonePanelOpen(false);
          }}
          activeZones={zoneHandler.attackZones.activeZones}
          onRemoveZone={zoneHandler.attackZones.removeZone}
          onToggleZoneVisibility={(zoneId) => {
            const zone = zoneHandler.attackZones.activeZones.find(z => z.id === zoneId);
            if (zone) {
              zoneHandler.attackZones.updateZone(zoneId, { isVisible: !zone.isVisible });
            }
          }}
          onDuplicateZone={(zoneId) => zoneHandler.handleDuplicateAttackZone(zoneId)}
          onEditZone={(zoneId) => zoneHandler.handleEditAttackZone(zoneId)}
        />
      </div>

      <SharedHandoutViewer />

      <div className={`absolute top-0 left-0 bottom-0 z-20 w-80 transform transition-transform duration-300 ease-out ${session.ui.isLibraryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <TokenLibrary templates={session.templates} onUseTemplate={tokenHandler.handleUseTemplate} onDeleteTemplate={session.deleteTemplate} onClose={session.toggleLibrary} />
      </div>

      <div className={`absolute top-0 right-0 bottom-0 z-20 w-80 md:w-96 transform transition-transform duration-300 ease-out ${session.ui.isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <Sidebar />
      </div>
    </>
  );
});
