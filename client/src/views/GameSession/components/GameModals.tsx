import React from 'react';
import { useGameSession } from '../../../context/GameSessionContext';
import { useModal } from '../../../context/ModalContext';
import { Token, Handout, AudioZone, TriggerZone } from '../../../types';
import { TokenEditModal } from '../../../components/vtt/TokenEditModal';
import { MapSettingsModal } from '../../../components/vtt/MapSettingsModal';
import { PermissionsModal } from '../../../components/vtt/PermissionsModal';
import { HandoutFormModal } from '../../../components/vtt/HandoutFormModal';
import { HandoutPreviewModal } from '../../../components/vtt/HandoutPreviewModal';
import { HandoutShareModal } from '../../../components/vtt/HandoutShareModal';
import { TriggerZoneConfigModalContent, AudioZoneEditModalContent } from '../../../components/vtt/map/modals';
import { AttackZoneConfigModal } from '../../../components/vtt/AttackZoneConfigModal';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

interface GameModalsProps {
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  isPermissionsOpen: boolean;
  onClosePermissions: () => void;
  editingHandout: Handout | 'new' | null;
  onCloseEditingHandout: () => void;
  onSaveHandout: (data: Omit<Handout, 'id' | 'createdAt' | 'campaignId' | 'sharedWith'>) => Promise<void>;
  previewingHandout: Handout | null;
  onClosePreviewingHandout: () => void;
  onEditHandout: (h: Handout) => void;
  onShareHandout: (h: Handout) => void;
  sharingHandout: Handout | null;
  onCloseSharingHandout: () => void;
  editingTriggerZoneId: string | null;
  onCloseEditingTriggerZone: () => void;
  editingAudioZoneId: string | null;
  onCloseEditingAudioZone: () => void;
  editingAttackZoneId: string | null;
  onCloseEditingAttackZone: () => void;
  isAttackZoneConfigOpen: boolean;
  onCloseAttackZoneConfig: () => void;
  onSaveAttackZoneConfig: (config: any) => void;
  attackZones: any; // Type this properly if possible
}

export const GameModals: React.FC<GameModalsProps> = ({
  isSettingsOpen, onCloseSettings,
  isPermissionsOpen, onClosePermissions,
  editingHandout, onCloseEditingHandout, onSaveHandout,
  previewingHandout, onClosePreviewingHandout, onEditHandout, onShareHandout,
  sharingHandout, onCloseSharingHandout,
  editingTriggerZoneId, onCloseEditingTriggerZone,
  editingAudioZoneId, onCloseEditingAudioZone,
  editingAttackZoneId, onCloseEditingAttackZone,
  isAttackZoneConfigOpen, onCloseAttackZoneConfig, onSaveAttackZoneConfig,
  attackZones
}) => {
  const session = useGameSession();
  const { closeModal } = useModal();

  const editingTriggerZone = editingTriggerZoneId ? session.activeScene?.triggerZones?.find(z => z.id === editingTriggerZoneId) : null;
  const editingAudioZone = editingAudioZoneId ? session.activeScene?.audioZones?.find(z => z.id === editingAudioZoneId) : null;

  return (
    <>
      <PermissionsModal isOpen={isPermissionsOpen} onClose={onClosePermissions} permissions={session.permissions} onUpdate={session.updatePermissions} campaign={session.campaign} players={session.players} />

      {isSettingsOpen && session.activeScene && (
        <MapSettingsModal
          scene={session.activeScene}
          onClose={onCloseSettings}
          onSave={session.updateMapSettings}
          audioSettings={session.audioSettings}
          bulkUpdateObstacles={session.bulkUpdateObstacles}
          defaultObstacleHidden={session.ui.defaultObstacleHidden}
          onToggleDefaultObstacleHidden={() => session.setGmHideObstacles(!session.ui.defaultObstacleHidden)}
        />
      )}

      {!!editingHandout && <Modal isOpen={!!editingHandout} onClose={onCloseEditingHandout} title={editingHandout === 'new' ? 'Novo Recurso' : 'Editar Recurso'} size="xl"><HandoutFormModal handout={editingHandout === 'new' ? undefined : editingHandout} onSave={onSaveHandout} onClose={onCloseEditingHandout} /></Modal>}
      {previewingHandout && <HandoutPreviewModal handout={previewingHandout} onClose={onClosePreviewingHandout} onEdit={onEditHandout} onShare={onShareHandout} />}
      {sharingHandout && <HandoutShareModal handout={sharingHandout} onClose={onCloseSharingHandout} />}

      {/* Trigger Zone Edit Modal */}
      {!!editingTriggerZone && (
        <Modal isOpen={!!editingTriggerZone} onClose={onCloseEditingTriggerZone} title="Editar Gatilho" size="sm">
          <TriggerZoneConfigModalContent
            handouts={session.handouts}
            onSave={(handoutId) => {
              if (editingTriggerZoneId) {
                session.updateTriggerZone(editingTriggerZoneId, { handoutId });
              }
              onCloseEditingTriggerZone();
            }}
            onClose={onCloseEditingTriggerZone}
            initialHandoutId={editingTriggerZone.handoutId}
          />
        </Modal>
      )}

      {/* Audio Zone Edit Modal */}
      {!!editingAudioZone && (
        <Modal isOpen={!!editingAudioZone} onClose={onCloseEditingAudioZone} title="Editar Zona de Áudio" size="lg">
          <AudioZoneEditModalContent
            zone={editingAudioZone}
            audioSettings={session.audioSettings}
            onSave={(updates) => {
              if (editingAudioZoneId) {
                session.updateAudioZone(editingAudioZoneId, updates);
              }
              onCloseEditingAudioZone();
            }}
            onClose={onCloseEditingAudioZone}
          />
        </Modal>
      )}

      {/* Attack Zone Edit Modal */}
      {editingAttackZoneId && (() => {
        const zone = attackZones.activeZones.find((z: any) => z.id === editingAttackZoneId);
        return zone ? (
          <AttackZoneConfigModal
            isOpen={!!editingAttackZoneId}
            onClose={onCloseEditingAttackZone}
            onSave={(updates) => {
              attackZones.updateZone(editingAttackZoneId, updates);
              onCloseEditingAttackZone();
              // show({ type: 'success', message: 'Zona atualizada!' }); // Needs show prop or context
            }}
            initialConfig={zone}
            title="Editar Zona de Ataque"
          />
        ) : null;
      })()}

      {/* Attack Zone Config Modal (New) */}
      {isAttackZoneConfigOpen && (
        <AttackZoneConfigModal
          isOpen={isAttackZoneConfigOpen}
          onClose={onCloseAttackZoneConfig}
          onSave={onSaveAttackZoneConfig}
          title="Criar Zona de Ataque Customizada"
        />
      )}
    </>
  );
};
