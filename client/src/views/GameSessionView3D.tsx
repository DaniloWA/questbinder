import React, { useEffect } from 'react';
import { GameSessionProvider, useGameSession } from '../context/GameSessionContext';
import { useNavigation } from '../context/NavigationContext';
import { MapCanvas3D } from '../components/vtt/map3d/MapCanvas3D';
import { Button } from '../components/ui/Button';
import { LoadingOverlay } from '../components/ui/Loading';
import { DebugPanelModal } from '../components/vtt/map/modals/DebugPanelModal';

export const GameSessionView3D: React.FC = () => {
  const { params, navigateTo } = useNavigation();
  const campaignId = params?.id as string | undefined;

  useEffect(() => {
    if (!campaignId) {
      navigateTo('dashboard');
    }
  }, [campaignId, navigateTo]);

  if (!campaignId) return <div>Loading...</div>;

  return (
    <GameSessionProvider campaignId={campaignId}>
      <GameSession3DUI />
    </GameSessionProvider>
  );
};

const GameSession3DUI: React.FC = () => {
  const session = useGameSession();
  const { navigateTo, params } = useNavigation();

  if (!session.activeScene) return <div className="text-white p-10">Loading Scene...</div>;

  return (
    <div className="w-screen h-screen flex flex-col bg-black">
      <div className="bg-zinc-900 border-b border-zinc-700 p-2 flex justify-between items-center z-10">
        <h1 className="text-white font-bold px-4">QuestBinder 3D POC</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateTo('game-session', params)}>
            Voltar para 2D
          </Button>
          {session.ui.isDebugPanelOpen && <DebugPanelModal onClose={session.toggleDebugPanel} />}
          <Button variant="secondary" size="sm" onClick={() => navigateTo('dashboard')}>
            Sair
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <MapCanvas3D
          scene={session.activeScene}
          tokens={session.activeScene.tokens}
          viewport={session.viewport}
          grid={session.activeScene.grid}
          setViewport={session.setViewport}
        />
      </div>
    </div>
  );
};
