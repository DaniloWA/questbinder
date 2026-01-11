import React, { useMemo } from 'react';
import { useTranslation } from '../../../i18n/TranslationContext';
import { useGameSession } from '../../../context/GameSessionContext';
import { Eye, Radio } from 'lucide-react';
import { User } from '../../../types';

export const FollowModeIndicator: React.FC = () => {
  const { t } = useTranslation();
  const { followMode, players, user, permissionHelper } = useGameSession();
  const isGM = permissionHelper.isGameMaster();

  // Check if player is currently following
  const isFollowing = !isGM && followMode.active && (
    followMode.targets === 'all' || (!!user?.id && Array.isArray(followMode.targets) && followMode.targets.includes(user.id))
  );

  // Check if GM is broadcasting
  const isBroadcasting = isGM && followMode.active;

  const broadcastingInfo = useMemo(() => {
    if (!isBroadcasting) return '';
    if (followMode.targets === 'all') return t('vtt.notifications.followMode.toAll');

    const targetIds = followMode.targets as string[];
    if (targetIds.length === 0) return t('vtt.notifications.followMode.noTarget'); // Should not happen often

    const names = targetIds.map(id => players.find((p: User) => p.id === id)?.name || 'Unknown');

    if (names.length <= 3) return `${t('vtt.notifications.followMode.toPrefix')} ${names.join(', ')}`;
    return t('vtt.notifications.followMode.toPlayers', { count: names.length });
  }, [isBroadcasting, followMode, players, t]);

  if (!isFollowing && !isBroadcasting) return null;

  return (
    <div className={`
            fixed top-4 left-1/2 -translate-x-1/2 z-50 
            px-4 py-2 rounded-full backdrop-blur-md shadow-lg border
            flex items-center gap-2 font-medium text-sm
            animate-in fade-in slide-in-from-top-4 duration-300
            ${isFollowing
        ? 'bg-blue-500/80 border-blue-400 text-white shadow-blue-500/20'
        : 'bg-red-500/80 border-red-400 text-white shadow-red-500/20'
      }
        `}>
      {isFollowing && (
        <>
          <Eye className="w-4 h-4 animate-pulse" />
          <span>{t('vtt.notifications.followMode.followingGM')}</span>
        </>
      )}

      {isBroadcasting && (
        <>
          <Radio className="w-4 h-4 animate-pulse" />
          <span>{t('vtt.notifications.followMode.broadcasting')}: <span className="opacity-90 font-normal">{broadcastingInfo}</span></span>
        </>
      )}
    </div>
  );
};
