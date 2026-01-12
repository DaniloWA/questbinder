// Re-export removed to prevent circular dependency with context/gameSession/types

// === SaaS Layer: Subscription Tiers ===

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium'
}

export type PremiumFeatureKey =
  | 'dynamicLighting'
  | 'customAssets'
  | 'advancedFog'
  | 'apiAccess'
  | 'bulkImport'
  | 'attackZones'
  | 'audioStorage';

export interface TierLimits {
  maxPlayers: number;
  maxStorageMB: number;
  maxConcurrentGames: number;
  features: Set<PremiumFeatureKey>;
}

export const TIER_CONFIGS: Record<SubscriptionTier, TierLimits> = {
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
    features: new Set(['dynamicLighting', 'customAssets', 'advancedFog', 'apiAccess', 'bulkImport', 'attackZones'])
  }
};

// === Game Layer: Roles & Capabilities ===

export enum GameRole {
  GM = 'gm',
  PLAYER = 'player',
  SPECTATOR = 'spectator'
}

export interface RoleCapabilities {
  canModifyGame: boolean;
  canControlOwnTokens: boolean;
  canControlAnyToken: boolean;
  canViewHidden: boolean;
  canModifyPermissions: boolean;
}

export const ROLE_DEFAULTS: Record<GameRole, RoleCapabilities> = {
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
