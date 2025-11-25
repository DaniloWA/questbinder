import React, { useMemo } from 'react';
import { GameSessionState, BooleanPermissionKey } from '../types';
import { socketService } from '../../../services/socketService';
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
    const newPerms = { ...state.permissions, ...perms };
    setState(prev => ({ ...prev, permissions: newPerms }));
    socketService.emit('campaign:updatePermissions', {
      campaignId: state.campaign?.id,
      permissions: newPerms
    });
  };

  return {
    checkPermission,
    updatePermissions,
    permissionHelper // Export the helper for advanced usage
  };
};
