import { useGameSession } from '../context/GameSessionContext';
import { SubscriptionTier, GameRole, PremiumFeatureKey } from '../types/acl';
import { BooleanPermissionKey } from '../context/gameSession/types';

/**
 * High-level access control hook combining game and SaaS layers
 * Useful for complex authorization scenarios
 */
export function useAccessControl() {
  const { permissionHelper, user, checkPermission, updatePermissions } = useGameSession();

  // Derived values from Context
  const tier = user?.subscriptionTier || SubscriptionTier.FREE;
  const role = user?.gameRole || GameRole.PLAYER;

  return {
    // Pass through methods
    checkPermission,
    updatePermissions,
    permissionHelper,

    // Expose State
    tier,
    role,

    // Convenience methods
    isGM: permissionHelper.isGameMaster(),
    isPremium: tier === SubscriptionTier.PREMIUM,
    isProOrBetter: tier === SubscriptionTier.PRO || tier === SubscriptionTier.PREMIUM,

    // Composite checks with better DX
    canUseFeature: (feature: PremiumFeatureKey) => permissionHelper.canFeature(feature),
    checkAccess: permissionHelper.checkAccess.bind(permissionHelper),

    // Logging/analytics wrapper
    checkAndLog: (requirements: {
      permission?: BooleanPermissionKey;
      feature?: PremiumFeatureKey;
      role?: GameRole;
    }) => {
      const result = permissionHelper.checkAccess(requirements);
      if (!result.allowed) {
        // Optional: Send analytics event
        console.warn('[AccessControl] Blocked:', result.reason);
      }
      return result;
    }
  };
}
