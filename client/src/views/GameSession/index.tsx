import React, { useEffect, useState } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { GameSessionProvider, useGameSession } from '../../context/GameSessionContext';
import { useModal } from '../../context/ModalContext';
import { AfkOverlay } from '../../components/game/AfkOverlay';
import { Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from '../../i18n/TranslationContext';
import { Button } from '../../components/ui/Button';
import { FollowModeIndicator } from '../../components/vtt/notifications/FollowModeIndicator';
import { PullViewNotification } from '../../components/vtt/notifications/PullViewNotification';
import { VttLoadingScreen } from '../../components/vtt/loading/VttLoadingScreen';

// Handlers
import { useTokenHandler } from './handlers/useTokenHandler';
import { useMapHandler } from './handlers/useMapHandler';
import { useZoneHandler } from './handlers/useZoneHandler';
import { useHandoutHandler } from './handlers/useHandoutHandler';

// Layers
import { MapLayer } from './layers/MapLayer';
import { InterfaceLayer } from './layers/InterfaceLayer';
import { ModalsLayer } from './layers/ModalsLayer';
import { ContextMenusLayer } from './layers/ContextMenusLayer';

const GameSessionUI: React.FC = () => {
  const { t } = useTranslation();
  const session = useGameSession();
  const { isOpen: isGlobalModalOpen } = useModal();


  // Initialize Handlers
  const tokenHandler = useTokenHandler();
  const mapHandler = useMapHandler();
  const zoneHandler = useZoneHandler();
  const handoutHandler = useHandoutHandler();

  // Initiative Roller State (Managed here or inside a handler? 
  // It affects "isAnyModalOpen" heavily, let's keep it here or inside mapHandler.
  // Original code had it in local state. Putting in UI for simplicity or mapHandler if we want strictness.
  // Let's keep it here for now as it doesn't clearly fit "map" or "token".
  // Initiative Roller State
  const [isInitiativeRollerOpen, setIsInitiativeRollerOpen] = useState(false);

  // VTT Ready State (Controlled by "Load Modules" screen)
  const [isVttReady, setIsVttReady] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // PERFORMANCE: Compute modal open state to throttle Canvas
  const isAnyModalOpen = isGlobalModalOpen
    || mapHandler.isSettingsOpen
    || mapHandler.isCursorSettingsOpen
    || mapHandler.isPermissionsOpen
    || handoutHandler.isHandoutTrayOpen
    || mapHandler.isCompendiumOpen
    || zoneHandler.isAttackZonePanelOpen
    || zoneHandler.isAttackZoneConfigOpen
    || mapHandler.isViewSettingsOpen
    || !!tokenHandler.viewingCharacterId
    || !!handoutHandler.editingHandout
    || !!handoutHandler.previewingHandout
    || !!handoutHandler.sharingHandout
    || !!zoneHandler.editingTriggerZoneId
    || !!zoneHandler.editingAudioZoneId
    || !!zoneHandler.editingAttackZoneId
    || isInitiativeRollerOpen;

  // Initial Data Loading (Before we even show the Load Modules screen)
  if (session.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
        {/* Basic fallback just in case data takes too long before we can even mount the Loader */}
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!session.campaign) {
    return <div className="min-h-screen bg-zinc-950 text-red-400 flex items-center justify-center">{t('vtt.gameSession.error.loadCampaign')}</div>;
  }

  return (
    <div className="h-screen w-screen bg-zinc-900 text-white overflow-hidden flex flex-col font-sans antialiased relative">
      {/* VTT Loading Screen Overlay */}
      {!isVttReady && (
        <VttLoadingScreen
          onReady={() => setIsVttReady(true)}
          tokens={session.activeScene?.tokens || []}
          characters={session.campaignCharacters || []}
          handouts={session.handouts || []}
        />
      )}

      {/* Reconnection Banner */}
      {!session.isConnected && isVttReady && (
        <div className="absolute top-0 left-0 right-0 z-[9999] bg-red-600/90 backdrop-blur text-white py-2 px-4 flex items-center justify-center gap-3 shadow-2xl animate-in slide-in-from-top-full duration-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-bold tracking-wide">{t('vtt.gameSession.connection.lost')}</span>
          <span className="text-xs opacity-80 hidden sm:inline">{t('vtt.gameSession.connection.lostSub')}</span>
        </div>
      )}

      {/* Global Notifications */}
      <PullViewNotification show={session.pullNotification} />
      <FollowModeIndicator />

      {/* 
        CRITICAL: We MUST render the MapLayer (and thus MapCanvas) even if !isVttReady 
        so that useImageLoader runs and actually loads the images! 
        The VttLoadingScreen sits on top z-index.
      */}
      <MapLayer
        session={session}
        tokenHandler={tokenHandler}
        mapHandler={mapHandler}
        zoneHandler={zoneHandler}
        isModalOpen={isAnyModalOpen}
        onMapLoaded={() => setIsMapLoaded(true)}
      />

      <ModalsLayer
        session={session}
        tokenHandler={tokenHandler}
        mapHandler={mapHandler}
        zoneHandler={zoneHandler}
        handoutHandler={handoutHandler}
        isInitiativeRollerOpen={isInitiativeRollerOpen}
        onCloseInitiativeRoller={() => setIsInitiativeRollerOpen(false)}
      />

      {/* Interface can be hidden until ready if desired, or shown behind loader */}
      {isVttReady && (
        <>
          <InterfaceLayer
            session={session}
            tokenHandler={tokenHandler}
            mapHandler={mapHandler}
            zoneHandler={zoneHandler}
            handoutHandler={handoutHandler}
            onStartCombat={() => setIsInitiativeRollerOpen(true)}
          />

          <ContextMenusLayer
            session={session}
            tokenHandler={tokenHandler}
            mapHandler={mapHandler}
            zoneHandler={zoneHandler}
          />
        </>
      )}
    </div>
  );
};

export const GameSessionView: React.FC = () => {
  const { params, navigateTo } = useNavigation();
  const campaignId = params?.id as string | undefined;

  useEffect(() => {
    if (!campaignId) {
      console.error('Nenhum campaignId encontrado na URL!');
      navigateTo('dashboard');
    }
  }, [campaignId, navigateTo]);

  if (!campaignId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-red-400 gap-4">
        <h1 className="text-3xl font-bold">Campanha não encontrada</h1>
        <Button onClick={() => navigateTo('dashboard')} size="lg">
          Voltar ao Painel
        </Button>
      </div>
    );
  }

  return (
    <GameSessionProvider campaignId={campaignId}>
      <AfkOverlay />
      <GameSessionUI />
    </GameSessionProvider>
  );
};
