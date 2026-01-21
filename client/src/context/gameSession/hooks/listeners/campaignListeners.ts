import { socketService } from '../../../../services/socketService';
import {
  CampaignUpdatePayload,
  HandoutUpdatePayload
} from '../../../../types';
import { notifySmartSync } from '../../syncHelpers';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for campaign-related events.
 * All handlers update React state AND notify SmartSync cache.
 */
export const registerCampaignListeners = ({
  state,
  setState,
  user,
  show
}: ListenerDeps): ListenerCleanup => {

  const handleCampaignUpdate = (payload: CampaignUpdatePayload) => {
    if (!payload.changes) return;

    // Handle side effects (Audio Notification)
    if (payload.changes.audioSettings) {
      if (!state.isGM) { // Checked against state instead of user props
        // Actually deps.user is User, deps.state.isGM. accessing state via deps.state might be cleaner if available, 
        // but previous code accessed previousState.isGM inside setState. 
        // We should use 'state.isGM' from props if available. 
        // Looking at lines 14-18: 'state' is available.

        if (!state.isGM) {
          show({
            type: 'info',
            message: '🎵 Mestre atualizou o painel de áudio',
            duration: 3000
          });
        }
      }
    }

    // Notify SmartSync cache (Bridge updates state)
    notifySmartSync({
      entityType: 'campaign',
      entityId: state.campaign?.id || 'current',
      changeType: 'update',
      data: payload.changes
    });
  };

  const handleHandoutUpdate = (payload: HandoutUpdatePayload) => {
    const currentUserId = user?.id || '';

    if (payload.operation === 'create' && payload.handout) {
      // Notify SmartSync
      notifySmartSync({
        entityType: 'handout',
        entityId: payload.handout.id,
        changeType: 'create',
        data: payload.handout
      });
      return;
    }

    if (payload.operation === 'update' && payload.handout) {
      // Notify SmartSync
      notifySmartSync({
        entityType: 'handout',
        entityId: payload.handout.id,
        changeType: 'update',
        data: payload.handout
      });

      // Calculate visibility changes for Toasts
      // We need access to previous state to know if it WAS shared.
      // This is tricky without setState updater.
      // However, we can check the CURRENT state before update.
      // `state.handouts` has the old state.

      const oldHandout = state.handouts.find(h => h.id === payload.handout!.id);
      const wasSharedWithUser = oldHandout?.sharedWith.includes(currentUserId);
      const isNowSharedWithUser = payload.handout.sharedWith.includes(currentUserId);

      if (!state.isGM && isNowSharedWithUser && !wasSharedWithUser) {
        show({
          type: 'info',
          message: `📜 Mestre compartilhou: ${payload.handout.name}`,
          duration: 4000
        });

        // Triggered Handout Logic - This MUST update state to open the popup
        // Bridge handles data update, but `triggeredHandoutId` is a UI state not in SmartSync.
        // We MUST keep setState for `triggeredHandoutId`.
        setState(prev => ({
          ...prev,
          triggeredHandoutId: payload.handout!.id
        }));
      }

      if (!state.isGM && !isNowSharedWithUser && wasSharedWithUser) {
        show({
          type: 'info',
          message: `🔒 Recurso "${payload.handout.name}" foi ocultado`,
          duration: 3000
        });

        // Close if open
        if (state.triggeredHandoutId === payload.handout.id) {
          setState(prev => ({
            ...prev,
            triggeredHandoutId: null
          }));
        }
      }
      return;
    }

    if (payload.operation === 'delete' && payload.handoutId) {
      // Notify SmartSync
      notifySmartSync({
        entityType: 'handout',
        entityId: payload.handoutId,
        changeType: 'delete',
        data: {}
      });
    }
  };

  const handlePermissionsUpdated = (payload: { permissions: any; }) => {
    setState(prev => {
      if (!prev.campaign) {
        console.warn('[WS] No campaign in state, cannot update permissions');
        return prev;
      }

      const updatedCampaign = {
        ...prev.campaign,
        permissions: { ...payload.permissions }
      };

      return {
        ...prev,
        campaign: updatedCampaign,
        permissions: payload.permissions
      };
    });

    // Notify SmartSync
    notifySmartSync({
      entityType: 'campaign',
      entityId: state.campaign?.id || 'current',
      changeType: 'update',
      data: { permissions: payload.permissions }
    });

    // Sync cursorOverrides to localStorage for current user
    const myOverride = payload.permissions?.cursorOverrides?.[user?.id];
    if (myOverride && Object.keys(myOverride).length > 0) {
      try {
        const stored = JSON.parse(localStorage.getItem('qb_cursor_settings') || '{}');
        const merged = { ...stored };

        if (myOverride.color !== undefined) merged.color = myOverride.color;
        if (myOverride.shape !== undefined) merged.shape = myOverride.shape;
        if (myOverride.name !== undefined) merged.name = myOverride.name;
        if (myOverride.clickAnimation !== undefined) merged.clickAnimation = myOverride.clickAnimation;
        if (myOverride.clickColorLeft !== undefined) merged.clickColorLeft = myOverride.clickColorLeft;
        if (myOverride.clickColorRight !== undefined) merged.clickColorRight = myOverride.clickColorRight;
        if (myOverride.trailEnabled !== undefined) merged.trailEnabled = myOverride.trailEnabled;
        if (myOverride.trailColor !== undefined) merged.trailColor = myOverride.trailColor;
        if (myOverride.trailAnimation !== undefined) merged.trailAnimation = myOverride.trailAnimation;
        if (myOverride.trailCustomImage !== undefined) merged.trailCustomImage = myOverride.trailCustomImage;
        if (myOverride.trailLength !== undefined) merged.trailLength = myOverride.trailLength;
        if (myOverride.trailThickness !== undefined) merged.trailThickness = myOverride.trailThickness;

        localStorage.setItem('qb_cursor_settings', JSON.stringify(merged));
      } catch (e) {
        console.warn('[Permissions] Failed to sync cursor overrides to localStorage:', e);
      }
    }
  };

  socketService.on('campaign:update', handleCampaignUpdate);
  socketService.on('handout:update', handleHandoutUpdate);
  socketService.on('campaign:permissionsUpdated', handlePermissionsUpdated);

  return () => {
    socketService.off('campaign:update', handleCampaignUpdate);
    socketService.off('handout:update', handleHandoutUpdate);
    socketService.off('campaign:permissionsUpdated', handlePermissionsUpdated);
  };
};
