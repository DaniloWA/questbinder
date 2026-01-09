import React from 'react';
import { User } from '../../../../types';
import { Lock, Check } from 'lucide-react';
import { useTranslation } from '../../../../i18n/TranslationContext';

interface TokenPermsTabProps {
  players: User[];
  controlledBy: string[];
  onControlledByChange: (ids: string[]) => void;
}

export const TokenPermsTab: React.FC<TokenPermsTabProps> = ({
  players,
  controlledBy,
  onControlledByChange,
}) => {
  const { t } = useTranslation();

  const togglePlayer = (playerId: string) => {
    const isControlled = controlledBy.includes(playerId);
    if (isControlled) {
      onControlledByChange(controlledBy.filter(id => id !== playerId));
    } else {
      onControlledByChange([...controlledBy, playerId]);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4" /> {t('vtt.tokens.editModal.permissions.title')}
        </h3>

        <div className="grid grid-cols-1 gap-2">
          {players.length === 0 && (
            <span className="text-xs text-zinc-600 italic">{t('vtt.tokens.editModal.permissions.noPlayers')}</span>
          )}

          {players.map(player => {
            const isControlled = controlledBy.includes(player.id);
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => togglePlayer(player.id)}
                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-all
                  ${isControlled
                    ? 'bg-primary/10 border-primary/50 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={player.avatarUrl}
                    className="w-6 h-6 rounded-full bg-zinc-800"
                    alt={player.name}
                  />
                  <span className="font-bold text-sm">{player.name}</span>
                </div>
                {isControlled && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
