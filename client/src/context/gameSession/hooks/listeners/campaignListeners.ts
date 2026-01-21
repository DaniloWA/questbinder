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

    setState(previousState => {
      const updatedCampaign = { ...previousState.campaign!, ...payload.changes };
      const newState = { ...previousState, campaign: updatedCampaign };

      if (payload.changes.permissions) {
        newState.permissions = payload.changes.permissions;
      }

      if (payload.changes.audioSettings) {
        newState.audioSettings = payload.changes.audioSettings!;

        if (!previousState.isGM) {
          show({
            type: 'info',
            message: '🎵 Mestre atualizou o painel de áudio',
            duration: 3000
          });
        }
      }

      return newState;
    });

    // Notify SmartSync cache
    notifySmartSync({
      entityType: 'campaign',
      entityId: state.campaign?.id || 'current',
      changeType: 'update',
      data: payload.changes
    });
  };

  const handleHandoutUpdate = (payload: HandoutUpdatePayload) => {
    setState(previousState => {
      let updatedHandouts = [...previousState.handouts];
      const currentUserId = user?.id || '';

      if (payload.operation === 'create' && payload.handout) {
        const handoutExists = updatedHandouts.some(
          handout => handout.id === payload.handout!.id
        );

        if (!handoutExists) {
          updatedHandouts.push(payload.handout);
        }

        // Notify SmartSync
        notifySmartSync({
          entityType: 'handout',
          entityId: payload.handout.id,
          changeType: 'create',
          data: payload.handout
        });

        return { ...previousState, handouts: updatedHandouts };
      }

      if (payload.operation === 'update' && payload.handout) {
        const oldHandout = previousState.handouts.find(
          handout => handout.id === payload.handout!.id
        );

        updatedHandouts = updatedHandouts.map(handout =>
          handout.id === payload.handout!.id ? payload.handout! : handout
        );

        // Notify SmartSync
        notifySmartSync({
          entityType: 'handout',
          entityId: payload.handout.id,
          changeType: 'update',
          data: payload.handout
        });

        const wasSharedWithUser = oldHandout?.sharedWith.includes(currentUserId);
        const isNowSharedWithUser = payload.handout.sharedWith.includes(currentUserId);

        if (!previousState.isGM && isNowSharedWithUser && !wasSharedWithUser) {
          show({
            type: 'info',
            message: `📜 Mestre compartilhou: ${payload.handout.name}`,
            duration: 4000
          });

          return {
            ...previousState,
            handouts: updatedHandouts,
            triggeredHandoutId: payload.handout.id
          };
        }

        if (!previousState.isGM && !isNowSharedWithUser && wasSharedWithUser) {
          show({
            type: 'info',
            message: `🔒 Recurso "${payload.handout.name}" foi ocultado`,
            duration: 3000
          });

          const shouldCloseHandout = previousState.triggeredHandoutId === payload.handout.id;

          return {
            ...previousState,
            handouts: updatedHandouts,
            triggeredHandoutId: shouldCloseHandout ? null : previousState.triggeredHandoutId
          };
        }
      }

      if (payload.operation === 'delete' && payload.handoutId) {
        updatedHandouts = updatedHandouts.filter(
          handout => handout.id !== payload.handoutId
        );

        // Notify SmartSync
        notifySmartSync({
          entityType: 'handout',
          entityId: payload.handoutId,
          changeType: 'delete',
          data: {}
        });
      }

      return { ...previousState, handouts: updatedHandouts };
    });
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
