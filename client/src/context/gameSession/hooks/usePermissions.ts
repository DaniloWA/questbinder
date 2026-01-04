import React, { useMemo } from 'react';
import { GameSessionState, BooleanPermissionKey } from '../types';
import { socketService } from '../../../services/socketService';
import { campaignService } from '../../../services/campaignService';
import { SessionPermissions } from '../../../types';
import { PermissionHelper } from '../helpers/PermissionHelper';

export const usePermissions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  user: any
) => {
  // Create PermissionHelper instance (memoized for performance)
  const permissionHelper = useMemo(
    () => new PermissionHelper(state.isGM, user?.id || null, state.permissions),
    [state.isGM, user?.id, state.permissions]
  );

  // Backward compatibility: keep original checkPermission function
  const checkPermission = (perm: BooleanPermissionKey) => {
    return permissionHelper.can(perm);
  };

  const updatePermissions = (perms: Partial<SessionPermissions>) => {
    console.log('[CLIENT] ========== UPDATE PERMISSIONS CALLED ==========');
    console.log('[CLIENT] Campaign ID:', state.campaign?.id);
    console.log('[CLIENT] New permissions:', JSON.stringify(perms, null, 2));

    const newPerms = { ...state.permissions, ...perms };
    console.log('[CLIENT] Merged permissions:', JSON.stringify(newPerms, null, 2));

    setState(prev => ({ ...prev, permissions: newPerms }));
    console.log('[CLIENT] ✅ Local state updated');

    console.log('[CLIENT] Emitting campaign:update via WebSocket for permissions...');
    socketService.emit('campaign:update', {
      changes: { permissions: newPerms }
    });

    // Persist via API to ensure durability
    if (state.campaign?.id) {
      // Fire and forget (optimistic)
      campaignService.updatePermissions(state.campaign.id, newPerms)
        .catch(err => console.error('[CLIENT] Failed to persist permissions via API:', err));
    }

    console.log('[CLIENT] ✅ WebSocket emit completed');
  };

  return {
    checkPermission,
    updatePermissions,
    permissionHelper // Export the helper for advanced usage
  };
};
