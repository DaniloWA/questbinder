import { socketService } from '../../../../services/socketService';
import {
  CampaignUpdatePayload,
  HandoutUpdatePayload
} from '../../../../types';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for campaign-related events
 * - campaign:update
 * - campaign:permissionsUpdated
 * - handout:update
 */
export const registerCampaignListeners = ({
  state,
  setState,
  user,
  show
}: ListenerDeps): ListenerCleanup => {

  // Handler: campaign:update
  const handleCampaignUpdate = (payload: CampaignUpdatePayload) => {
    console.log('[WS] Campaign update received:', payload);

    if (!payload.changes) return;

    setState(previousState => {
      const updatedCampaign = { ...previousState.campaign!, ...payload.changes };
      const newState = { ...previousState, campaign: updatedCampaign };

      if (payload.changes.permissions) {
        newState.permissions = payload.changes.permissions;
      }

      if (payload.changes.audioSettings) {
        console.log('[WS] Audio settings synced:', payload.changes.audioSettings);
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

  // Handler: handout:update
  const handleHandoutUpdate = (payload: HandoutUpdatePayload) => {
    console.log('[WS] Handout update received:', payload);

    setState(previousState => {
      let updatedHandouts = [...previousState.handouts];
      const currentUserId = user?.id || '';

      // Operação: Criar
      if (payload.operation === 'create' && payload.handout) {
        const handoutExists = updatedHandouts.some(
          handout => handout.id === payload.handout!.id
        );

        if (!handoutExists) {
          updatedHandouts.push(payload.handout);
          console.log('[WS] Handout created:', payload.handout.name);
        }

        return { ...previousState, handouts: updatedHandouts };
      }

      // Operação: Atualizar
      if (payload.operation === 'update' && payload.handout) {
        const oldHandout = previousState.handouts.find(
          handout => handout.id === payload.handout!.id
        );

        updatedHandouts = updatedHandouts.map(handout =>
          handout.id === payload.handout!.id ? payload.handout! : handout
        );

        const wasSharedWithUser = oldHandout?.sharedWith.includes(currentUserId);
        const isNowSharedWithUser = payload.handout.sharedWith.includes(currentUserId);

        // Handout compartilhado com o jogador
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

        // Handout ocultado do jogador
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

      // Operação: Deletar
      if (payload.operation === 'delete' && payload.handoutId) {
        updatedHandouts = updatedHandouts.filter(
          handout => handout.id !== payload.handoutId
        );
      }

      return { ...previousState, handouts: updatedHandouts };
    });
  };

  // Handler: campaign:permissionsUpdated (consolidado)
  const handlePermissionsUpdated = (payload: { permissions: any; }) => {
    console.log('[WS] ✅ Received campaign:permissionsUpdated event');
    console.log('[WS] Campaign permissions updated:', payload);
    console.log('[WS] Applying permissions update in real-time...');

    setState(prev => {
      if (!prev.campaign) return prev;

      // Create a NEW campaign object to ensure React detects the change
      const updatedCampaign = {
        ...prev.campaign,
        permissions: { ...payload.permissions }
      };

      console.log('[WS] Updated campaign permissions:', updatedCampaign.permissions);

      // Update both campaign.permissions AND state.permissions for full compatibility
      return {
        ...prev,
        campaign: updatedCampaign,
        permissions: payload.permissions
      };
    });
  };

  // Register listeners
  socketService.on('campaign:update', handleCampaignUpdate);
  socketService.on('handout:update', handleHandoutUpdate);
  socketService.on('campaign:permissionsUpdated', handlePermissionsUpdated);

  // Return cleanup function
  return () => {
    socketService.off('campaign:update', handleCampaignUpdate);
    socketService.off('handout:update', handleHandoutUpdate);
    socketService.off('campaign:permissionsUpdated', handlePermissionsUpdated);
  };
};
