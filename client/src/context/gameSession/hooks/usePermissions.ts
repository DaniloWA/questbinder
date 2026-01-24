import React, { useMemo } from 'react';
import { GameSessionState, BooleanPermissionKey } from '../types';
import { socketService } from '../../../services/socketService';
import { campaignService } from '../../../services/campaignService';
import { SessionPermissions } from '../../../types';
import { SubscriptionTier, GameRole, PremiumFeatureKey } from '../../../types/acl';
import { PermissionHelper } from '../helpers/PermissionHelper';
import { DebugLogger } from '../../../utils/DebugLogger';

export const usePermissions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  user: any
) => {
  // Create PermissionHelper instance (memoized for performance)
  const permissionHelper = useMemo(
    () => new PermissionHelper(
      state.isGM,
      user?.id || null,
      state.permissions,
      user?.subscriptionTier || SubscriptionTier.FREE,
      user?.gameRole || GameRole.PLAYER
    ),
    [state.isGM, user?.id, state.permissions, user?.subscriptionTier, user?.gameRole]
  );

  // Backward compatibility: keep original checkPermission function
  const checkPermission = (perm: BooleanPermissionKey) => {
    return permissionHelper.can(perm);
  };

  const updatePermissions = (perms: Partial<SessionPermissions>) => {
    DebugLogger.log('sync', 'usePermissions', 'Update', 'UPDATE PERMISSIONS CALLED');
    DebugLogger.log('sync', 'usePermissions', 'Campaign', `Campaign ID: ${state.campaign?.id}`);
    DebugLogger.log('sync', 'usePermissions', 'NewPerms', 'New permissions', perms);

    const newPerms = { ...state.permissions, ...perms };
    DebugLogger.log('sync', 'usePermissions', 'Merge', 'Merged permissions', newPerms);

    setState(prev => ({ ...prev, permissions: newPerms }));
    DebugLogger.log('sync', 'usePermissions', 'State', '✅ Local state updated');

    DebugLogger.log('sync', 'usePermissions', 'Emit', 'Emitting campaign:update via WebSocket for permissions...');
    socketService.emit('campaign:update', {
      changes: { permissions: newPerms }
    });

    // Persist via API to ensure durability
    if (state.campaign?.id) {
      // Fire and forget (optimistic)
      campaignService.updatePermissions(state.campaign.id, newPerms)
        .catch(err => console.error('[CLIENT] Failed to persist permissions via API:', err));
    }

    DebugLogger.log('sync', 'usePermissions', 'Complete', '✅ WebSocket emit completed');
  };

  return {
    checkPermission,
    updatePermissions,
    permissionHelper, // Export the helper for advanced usage

    // Exposed AccessGuard API
    canFeature: (feature: PremiumFeatureKey) => permissionHelper.canFeature(feature),
    checkAccess: permissionHelper.checkAccess.bind(permissionHelper),
    tier: (user?.subscriptionTier || SubscriptionTier.FREE) as SubscriptionTier,
    role: (user?.gameRole || GameRole.PLAYER) as GameRole
  };
};
