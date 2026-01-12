
import React from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { useNotification } from '../../context/NotificationContext';
import { UserPlus, Wifi, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTranslation } from '../../i18n/TranslationContext';
import { AccessGate } from '../AccessGate';
import { GameRole } from '../../types/acl';

export const PartyList: React.FC = () => {
    const { players, campaignCharacters, invitePlayer } = useGameSession();
    const { show } = useNotification();
    const { t } = useTranslation();

    const handleInvite = () => {
        const link = invitePlayer();
        navigator.clipboard.writeText(link);
        show({ type: 'success', message: t('vtt.party.invite.success') });
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-zinc-900/50 h-full">
            {/* Invite Section */}
            <AccessGate requireRole={GameRole.GM} mode="hide">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center space-y-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm">{t('vtt.party.invite.title')}</h4>
                        <p className="text-xs text-zinc-500 mt-1">{t('vtt.party.invite.desc')}</p>
                    </div>
                    <Button size="sm" fullWidth variant="outline" onClick={handleInvite} className="text-xs border-dashed">
                        <Copy className="w-3 h-3 mr-2" /> {t('vtt.party.invite.copyButton')}
                    </Button>
                </div>
            </AccessGate>

            {/* Players List */}
            <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Wifi className="w-3 h-3 text-green-500" /> {t('vtt.party.onlineCount', { count: players.length })}
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
                                        <p className="text-[10px] text-zinc-500">{t('vtt.party.playerLabel')}</p>
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
};
