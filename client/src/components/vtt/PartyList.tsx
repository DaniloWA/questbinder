
import React, { useState } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { useNotification } from '../../context/NotificationContext';
import { CombatTrackerEnhanced } from './CombatTrackerEnhanced';
import { GameLog, ChatViewMode } from './GameLog';
import { Users, Activity, Swords, X, Copy, UserPlus, Wifi, ArrowLeftFromLine } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

export const PartyList: React.FC = () => {
    const { players, campaignCharacters, toggleRightSidebar, invitePlayer, chatMessages } = useGameSession();
    const { show } = useNotification();
    const [activeTab, setActiveTab] = useState<'combat' | 'chat' | 'party'>('chat');
    const [chatMode, setChatMode] = useState<ChatViewMode>('sidebar');

    const handleInvite = () => {
        const link = invitePlayer();
        navigator.clipboard.writeText(link);
        show({ type: 'success', message: 'Link copiado!' });
    };

    const renderPartyTab = () => (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-zinc-900/50">
            {/* Invite Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center space-y-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                    <UserPlus className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-white text-sm">Convidar Jogadores</h4>
                    <p className="text-xs text-zinc-500 mt-1">Envie o link para seus amigos.</p>
                </div>
                <Button size="sm" fullWidth variant="outline" onClick={handleInvite} className="text-xs border-dashed">
                    <Copy className="w-3 h-3 mr-2" /> Copiar Link
                </Button>
            </div>

            {/* Players List */}
            <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Wifi className="w-3 h-3 text-green-500" /> Online ({players.length})
                </h3>
                <div className="space-y-3">
                    {players.map(player => {
                        const myChars = campaignCharacters.filter(c => c.ownerId === player.id);
                        return (
                            <div key={player.id} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-3">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="relative">
                                        <img src={player.avatarUrl} className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700" alt={player.name} />
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{player.name}</p>
                                        <p className="text-[10px] text-zinc-500">Jogador</p>
                                    </div>
                                </div>
                                {myChars.length > 0 && (
                                    <div className="space-y-1 pl-11">
                                        {myChars.map(char => (
                                            <div key={char.id} className="flex items-center justify-between text-xs bg-zinc-950/50 p-1.5 rounded border border-white/5">
                                                <span className="font-medium text-zinc-300 truncate max-w-[100px]">{char.name}</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-green-500 font-mono">{char.hpCurrent}</span>
                                                    <span className="text-zinc-600">/</span>
                                                    <span className="text-zinc-500 font-mono">{char.hpMax}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-zinc-950/95 backdrop-blur-md border-l border-white/10 shadow-2xl w-full">
            {/* Header Tabs */}
            <div className="flex items-center justify-between p-2 border-b border-white/10 bg-zinc-900/80 shrink-0">
                <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-white/5">
                    <Tooltip content="Log & Chat">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`p-2 rounded-md transition-all relative ${activeTab === 'chat' ? 'bg-zinc-800 text-primary shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Activity className="w-4 h-4" />
                            {chatMessages.length > 0 && activeTab !== 'chat' && (
                                <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-zinc-900"></div>
                            )}
                        </button>
                    </Tooltip>
                    <Tooltip content="Combate">
                        <button
                            onClick={() => setActiveTab('combat')}
                            className={`p-2 rounded-md transition-all ${activeTab === 'combat' ? 'bg-zinc-800 text-red-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Swords className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Grupo">
                        <button
                            onClick={() => setActiveTab('party')}
                            className={`p-2 rounded-md transition-all ${activeTab === 'party' ? 'bg-zinc-800 text-green-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Users className="w-4 h-4" />
                        </button>
                    </Tooltip>
                </div>
                <button onClick={toggleRightSidebar} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
                {/* Chat Logic */}
                <div className={`h-full w-full ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
                    <GameLog onModeChange={setChatMode} />
                    {chatMode !== 'sidebar' && activeTab === 'chat' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur text-center p-6 z-0">
                            <Activity className="w-12 h-12 text-zinc-600 mb-4 opacity-50" />
                            <h3 className="text-zinc-300 font-bold mb-1">Histórico Destacado</h3>
                            <p className="text-xs text-zinc-500 mb-6">O log está em uma janela flutuante.</p>
                            <div className="text-[10px] text-zinc-600 bg-black/20 px-3 py-1.5 rounded border border-white/5">
                                Use <ArrowLeftFromLine className="w-3 h-3 inline mx-1" /> para acoplar.
                            </div>
                        </div>
                    )}
                </div>

                {activeTab === 'combat' && <CombatTrackerEnhanced />}
                {activeTab === 'party' && renderPartyTab()}
            </div>
        </div>
    );
};
