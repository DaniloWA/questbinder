import React, { useState } from 'react';
import { useGameSession } from '../../../context/GameSessionContext';
import { useModal } from '../../../context/ModalContext';
import {
  Eye, EyeOff, Users, Magnet, User as UserIcon, Settings,
  Monitor, ScanEye, Grid, ShieldAlert, Check, X
} from 'lucide-react';
import { User } from '../../../types';
import { Switch } from '../../ui/Switch'; // Assuming generic Switch exists, or standard input

export const ViewSettingsModal: React.FC = () => {
  const {
    players,
    permissions,
    updatePermissions,
    pullView,
    toggleFollowMode,
    followMode,
    viewport,
    toggleVisionRanges,
    ui,
    setGmHideObstacles
  } = useGameSession();
  // const { players, followMode, userOverrides } = state; // Removed invalid state usage
  const [activeTab, setActiveTab] = useState<'camera' | 'visibility' | 'settings'>('camera');

  // Helper to toggle follow for specific user
  const handleToggleFollowUser = (userId: string, currentActive: boolean) => {
    let newTargets: string[] = [];

    if (followMode.targets === 'all') {
      // If was all, now becomes all minus this one (or actually, we switch to explicit list)
      newTargets = players.map((p: User) => p.id).filter((id: string) => id !== userId);
    } else {
      // Already a list
      if (currentActive) {
        newTargets = followMode.targets.filter(id => id !== userId);
      } else {
        newTargets = [...followMode.targets, userId];
      }
    }

    // If empty, we can just deactivate? Or keep empty.
    // If length == all players, maybe switch to 'all'?
    const allPlayerIds = players.map((p: User) => p.id);
    const finalTargets = (newTargets.length === allPlayerIds.length) ? 'all' : newTargets;

    toggleFollowMode(true, finalTargets);
  };

  const isFollowing = (userId: string) => {
    if (!followMode.active) return false;
    if (followMode.targets === 'all') return true;
    return followMode.targets.includes(userId);
  };

  const toggleGhostWalls = () => {
    setGmHideObstacles(!ui.gmHideObstacles);
  };

  // Helper for visibility override
  const toggleUserViewportVisibility = (userId: string, field: 'showRemoteViewports' | 'shareViewport') => {
    const currentOverrides = permissions.userOverrides?.[userId] || {};
    const currentValue = currentOverrides[field] !== undefined
      ? currentOverrides[field]
      : permissions[field]; // Fallback to global default?

    // Actually we need to UPDATE userOverrides
    const newOverrides = {
      ...permissions.userOverrides,
      [userId]: {
        ...currentOverrides,
        [field]: !currentValue
      }
    };
    updatePermissions({ userOverrides: newOverrides });
  };

  return (
    <div className="flex flex-col h-[500px] w-[600px] bg-zinc-950 text-zinc-100 rounded-xl overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/50">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'camera' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          <Magnet className="w-4 h-4" /> Controle de Câmera
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          <Settings className="w-4 h-4" /> Geral
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

        {/* --- CAMERA TAB --- */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-white">Ações Globais</h3>
                <p className="text-xs text-zinc-500">Controle todos os jogadores de uma vez</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => pullView('all', viewport.x, viewport.y, viewport.zoom)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium flex gap-2 items-center transition-colors"
                >
                  <Users className="w-4 h-4" /> Puxar Todos
                </button>
                <button
                  onClick={() => toggleFollowMode(!followMode.active, 'all')}
                  className={`px-3 py-2 rounded-md text-xs font-medium flex gap-2 items-center transition-colors ${followMode.active && followMode.targets === 'all' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary hover:bg-primary/90 text-white'}`}
                >
                  <Magnet className="w-4 h-4" /> {followMode.active && followMode.targets === 'all' ? 'Parar de Seguir' : 'Seguir Todos'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_100px_100px] gap-4 px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                <span>Jogador</span>
                <span className="text-center">Puxar</span>
                <span className="text-center">Forçar Seguir</span>
              </div>

              {players.map((player: User) => {
                const following = isFollowing(player.id);
                return (
                  <div key={player.id} className="grid grid-cols-[1fr_100px_100px] gap-4 items-center bg-zinc-900/30 px-4 py-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: player.color }}></div>
                      <span className="font-medium text-sm">{player.name}</span>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={() => pullView(player.id, viewport.x, viewport.y, viewport.zoom)}
                        className="p-2 hover:bg-zinc-800 rounded-md group transition-colors flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white"
                        title="Puxar visão deste jogador"
                      >
                        <ScanEye className="w-4 h-4" />
                        <span className='hidden sm:inline'>Puxar</span>
                      </button>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggleFollowUser(player.id, following)}
                        className={`relative flex items-center justify-center w-full py-1.5 rounded-md text-xs font-medium transition-colors gap-1 ${following ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                      >
                        {following ? (
                          <>
                            <Magnet className="w-3 h-3" /> Seguindo
                          </>
                        ) : (
                          'Seguir'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="space-y-2">
            <div
              className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 cursor-pointer transition-colors border border-transparent hover:border-white/5"
              onClick={() => toggleGhostWalls()}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg transition-colors ${ui.gmHideObstacles ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                  <EyeOff className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-zinc-200">Paredes Fantasmas (GM)</p>
                  <p className="text-xs text-zinc-500">Ocultar paredes e obstáculos na visão do Mestre para melhor visualização.</p>
                </div>
              </div>
              <Switch checked={ui.gmHideObstacles} />
            </div>

            <div
              className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 cursor-pointer transition-colors border border-transparent hover:border-white/5"
              onClick={() => toggleVisionRanges()}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg transition-colors ${ui.showVisionRanges ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                  <ScanEye className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-zinc-200">Alcances de Visão</p>
                  <p className="text-xs text-zinc-500">Visualizar círculos de alcance de visão dos tokens.</p>
                </div>
              </div>
              <Switch checked={ui.showVisionRanges} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/30 border border-transparent">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-400">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-zinc-200">Opacidade do Grid</p>
                  <p className="text-xs text-zinc-500">Ajuste a intensidade das linhas da grade.</p>
                </div>
              </div>
              <div className="w-32">
                <input type="range" className="w-full accent-primary h-1 bg-zinc-700 rounded-full appearance-none" min="0" max="100" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/30">
        <p className="text-xs text-zinc-500">
          Para configurar visibilidade e permissões, use o menu <span className="text-primary font-bold">Permissões</span>.
        </p>
      </div>
    </div>
  );
};
