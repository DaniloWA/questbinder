import { useMemo } from 'react';
import { User, Token } from '../../../../types';

export const useVisionLayer = (
  tokens: Token[],
  isGM: boolean,
  gmViewMode: 'gm' | 'player',
  previewPlayerId: string | 'all' | undefined,
  currentUser: User | null
) => {
  const visionTokens = useMemo(() => {
    if (isGM && gmViewMode === 'player') {
      if (previewPlayerId === 'all') {
        return tokens.filter(t => t.type === 'pc');
      } else {
        return tokens.filter(t => t.ownerId === previewPlayerId || t.controlledBy?.includes(previewPlayerId || ''));
      }
    } else if (!isGM) {
      return tokens.filter(t => t.ownerId === currentUser?.id || t.controlledBy?.includes(currentUser?.id || ''));
    }
    return [];
  }, [tokens, isGM, gmViewMode, previewPlayerId, currentUser]);

  return visionTokens;
};
