import React from 'react';
import { GameSessionState, BooleanPermissionKey } from '../types';
import { socketService } from '../../../services/socketService';
import { SessionPermissions } from '../../../types';

export const usePermissions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  user: any
) => {
  const checkPermission = (perm: BooleanPermissionKey) => {
    if (state.isGM) return true;
    if (!user) return false;
    const override = state.permissions.userOverrides[user.id]?.[perm];
    return (override !== undefined ? override : state.permissions[perm]) as boolean;
  };

  const updatePermissions = (perms: Partial<SessionPermissions>) => {
    const newPerms = { ...state.permissions, ...perms };
    setState(prev => ({ ...prev, permissions: newPerms }));
    socketService.emit('session:permissions', { permissions: newPerms });
  };

  return {
    checkPermission,
    updatePermissions
  };
};
