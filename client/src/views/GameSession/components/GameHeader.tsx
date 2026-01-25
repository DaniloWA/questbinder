import React from 'react';
import { ChevronLeft, Wifi, WifiOff, Swords } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Tooltip } from '../../../components/ui/Tooltip';
import { useNavigation } from '../../../context/NavigationContext';
import { useGameSession } from '../../../context/GameSessionContext';

export const GameHeader: React.FC = () => {
  const { navigateTo } = useNavigation();
  const session = useGameSession();

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      <div className="flex justify-between items-start w-full">
        <div className="pointer-events-auto flex items-center gap-3 bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-2 pr-6 shadow-xl hover:bg-zinc-950/90 transition-colors group">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo('campaign-dashboard', { id: session.campaign.id })}
            className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10"
            title="Voltar para a Sala de Entrada"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm text-zinc-100 leading-none group-hover:text-primary transition-colors">{session.campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${session.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                {session.activeScene?.name || 'Carregando...'}
                {session.isConnected ? <span className="text-green-600/80 ml-1 hidden sm:inline">LIVE</span> : <span className="text-red-600/80 ml-1 hidden sm:inline">OFFLINE</span>}
              </span>
            </div>
          </div>
        </div>

        {session.combat?.isActive && (
          <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 top-6 bg-red-950/90 backdrop-blur-md border border-red-500/30 text-red-100 px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
            <Swords className="w-4 h-4 text-red-400 animate-pulse" />
            <div className="flex gap-4 text-sm font-bold font-fantasy tracking-wide">
              <span>COMBATE</span>
              <span className="w-px h-4 bg-red-500/30"></span>
              <span>RODADA {session.combat.round}</span>
            </div>
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-3">
          <div className="flex gap-2 bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-xl">
            <Tooltip content={session.isConnected ? 'Conectado ao Servidor' : 'Desconectado'}>
              <div className={`p-2.5 rounded-xl transition-all ${session.isConnected ? 'text-green-500' : 'text-red-500'}`}>
                {session.isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
            </Tooltip>
            <div className="w-px h-6 bg-white/10 self-center mx-1"></div>
            <Tooltip content="Grupo & Combate">
              <button onClick={session.toggleRightSidebar} className={`p-2.5 rounded-xl transition-all duration-200 ${session.ui.isRightSidebarOpen ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                <Swords className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
