export const SubscriptionTier = {
  FREE: 'free',
  PRO: 'pro',
  PREMIUM: 'premium'
};

export const GameRole = {
  GM: 'gm',
  PLAYER: 'player',
  SPECTATOR: 'spectator'
};

export const TIER_CONFIGS = {
  [SubscriptionTier.FREE]: {
    maxPlayers: 4,
    maxStorageMB: 100,
    maxConcurrentGames: 1,
    features: new Set([])
  },
  [SubscriptionTier.PRO]: {
    maxPlayers: 8,
    maxStorageMB: 1000,
    maxConcurrentGames: 3,
    features: new Set(['dynamicLighting', 'customAssets'])
  },
  [SubscriptionTier.PREMIUM]: {
    maxPlayers: Infinity,
    maxStorageMB: 10000,
    maxConcurrentGames: Infinity,
    features: new Set(['dynamicLighting', 'customAssets', 'advancedFog', 'apiAccess', 'bulkImport'])
  }
};

export const ROLE_DEFAULTS = {
  [GameRole.GM]: {
    canModifyGame: true,
    canControlOwnTokens: true,
    canControlAnyToken: true,
    canViewHidden: true,
    canModifyPermissions: true
  },
  [GameRole.PLAYER]: {
    canModifyGame: false,
    canControlOwnTokens: true,
    canControlAnyToken: false,
    canViewHidden: false,
    canModifyPermissions: false
  },
  [GameRole.SPECTATOR]: {
    canModifyGame: false,
    canControlOwnTokens: false,
    canControlAnyToken: false,
    canViewHidden: false,
    canModifyPermissions: false
  }
};
