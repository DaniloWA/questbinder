import { socketService } from '../../../../services/socketService';
import {
  CampaignUpdatePayload,
  HandoutUpdatePayload
} from '../../../../types';
import { ListenerDeps, ListenerCleanup } from './types';


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

        return { ...previousState, handouts: updatedHandouts };
      }

      if (payload.operation === 'update' && payload.handout) {
        const oldHandout = previousState.handouts.find(
          handout => handout.id === payload.handout!.id
        );

        updatedHandouts = updatedHandouts.map(handout =>
          handout.id === payload.handout!.id ? payload.handout! : handout
        );

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
