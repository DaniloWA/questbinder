import React from 'react';
import { Eye, X } from 'lucide-react';
import { useTranslation } from '../../i18n/TranslationContext';
import { useGameSession } from '../../context/GameSessionContext';
import { Button } from '../ui/Button';

export const SpectateBanner: React.FC = () => {
    const { t } = useTranslation();
    const { isGM, gmViewMode, previewPlayerId, players, toggleGMViewMode } = useGameSession();

    if (!isGM || gmViewMode !== 'player') {
        return null;
    }

    const playerName = players.find(p => p.id === previewPlayerId)?.name || t('vtt.spectate.banner.allPlayers.text');

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-purple-900/90 backdrop-blur-md border border-purple-500/50 text-purple-100 px-4 py-2 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
            <Eye className="w-5 h-5 text-purple-300" />
            <div className="text-sm font-bold">
                <span className="opacity-70">{t('vtt.spectate.banner.viewingAs.text')}</span> {playerName}
            </div>
            <Button
                size="sm"
                variant="ghost"
                onClick={toggleGMViewMode}
                className="text-purple-300 hover:text-white hover:bg-white/10 rounded-full h-auto px-3 py-1 text-xs"
            >
                <X className="w-3 h-3 mr-1" /> {t('vtt.spectate.banner.returnToGM.button')}
            </Button>
        </div>
    );
};
