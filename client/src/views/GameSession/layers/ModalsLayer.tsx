import React, { Suspense, lazy } from 'react';
import { useTranslation } from '../../../i18n/TranslationContext';
import { useGameSession } from '../../../context/GameSessionContext';
import { useAuth } from '../../../context/AuthContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { Modal } from '../../../components/ui/Modal';
import { Loader2 } from 'lucide-react';

// Lazy Load Heavy Modals
const PermissionsModal = lazy(() => import('../../../components/vtt/PermissionsModal').then(m => ({ default: m.PermissionsModal })));
const CharacterSheetViewer = lazy(() => import('../../../components/vtt/CharacterSheetViewer').then(m => ({ default: m.CharacterSheetViewer })));
const MapSettingsModal = lazy(() => import('../../../components/vtt/MapSettingsModal').then(m => ({ default: m.MapSettingsModal })));
const HandoutFormModal = lazy(() => import('../../../components/vtt/HandoutFormModal').then(m => ({ default: m.HandoutFormModal })));
const HandoutPreviewModal = lazy(() => import('../../../components/vtt/HandoutPreviewModal').then(m => ({ default: m.HandoutPreviewModal })));
const HandoutShareModal = lazy(() => import('../../../components/vtt/HandoutShareModal').then(m => ({ default: m.HandoutShareModal })));
const CursorSettingsModal = lazy(() => import('../../../components/vtt/CursorSettingsModal').then(m => ({ default: m.CursorSettingsModal })));
const AttackZoneConfigModal = lazy(() => import('../../../components/vtt/AttackZoneConfigModal').then(m => ({ default: m.AttackZoneConfigModal })));
const ViewSettingsModal = lazy(() => import('../../../components/vtt/settings/ViewSettingsModal').then(m => ({ default: m.ViewSettingsModal })));

// Non-lazy (Lightweight or sub-components already loaded)
import { TriggerZoneConfigModalContent, AudioZoneEditModalContent } from '../../../components/vtt/map/modals';
import { CombatInitiativeRoller } from '../../../components/vtt/CombatInitiativeRoller';

import { useTokenHandler } from '../handlers/useTokenHandler';
import { useMapHandler } from '../handlers/useMapHandler';
import { useZoneHandler } from '../handlers/useZoneHandler';
import { useHandoutHandler } from '../handlers/useHandoutHandler';

interface ModalsLayerProps {
  session: ReturnType<typeof useGameSession>;
  tokenHandler: ReturnType<typeof useTokenHandler>;
  mapHandler: ReturnType<typeof useMapHandler>;
  zoneHandler: ReturnType<typeof useZoneHandler>;
  handoutHandler: ReturnType<typeof useHandoutHandler>;
  isInitiativeRollerOpen: boolean;
  onCloseInitiativeRoller: () => void;
}

export const ModalsLayer = ({ session, tokenHandler, mapHandler, zoneHandler, handoutHandler, isInitiativeRollerOpen, onCloseInitiativeRoller }: ModalsLayerProps) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { isGM } = useAccessControl();

  const viewingCharacter = session.campaignCharacters.find(c => c.id === tokenHandler.viewingCharacterId) || null;
  const editingTriggerZone = zoneHandler.editingTriggerZoneId ? session.activeScene?.triggerZones?.find(z => z.id === zoneHandler.editingTriggerZoneId) : null;
  const editingAudioZone = zoneHandler.editingAudioZoneId ? session.activeScene?.audioZones?.find(z => z.id === zoneHandler.editingAudioZoneId) : null;
  const editingAttackZone = zoneHandler.editingAttackZoneId ? zoneHandler.attackZones.activeZones.find(z => z.id === zoneHandler.editingAttackZoneId) : null;

  return (
    <Suspense fallback={null}>
      <PermissionsModal isOpen={mapHandler.isPermissionsOpen} onClose={() => mapHandler.setIsPermissionsOpen(false)} permissions={session.permissions} onUpdate={session.updatePermissions} campaign={session.campaign} players={session.players} />

      {viewingCharacter && (
        <Modal isOpen={!!viewingCharacter} onClose={() => tokenHandler.setViewingCharacterId(null)} size="xl" hideCloseButton>
          <div className="h-[80vh]">
            <CharacterSheetViewer
              character={viewingCharacter}
              isGM={isGM}
              currentUserId={currentUser?.id}
              onClose={() => tokenHandler.setViewingCharacterId(null)}
              onUpdate={(updates) => session.updateCharacter(viewingCharacter.id, updates, true)}
              onRoll={(label, formula) => session.rollDice(label, formula)}
              onShare={(type, data) => session.sendChatMessage(`Compartilhou ${data.name || 'algo'}`, 'message', undefined, { type, label: data.name, data, id: data.id })}
            />
          </div>
        </Modal>
      )}

      {mapHandler.isSettingsOpen && session.activeScene && (
        <MapSettingsModal
          scene={session.activeScene}
          onClose={() => mapHandler.setIsSettingsOpen(false)}
          onSave={session.updateMapSettings}
          audioSettings={session.audioSettings}
          bulkUpdateObstacles={session.bulkUpdateObstacles}
          defaultObstacleHidden={session.ui.defaultObstacleHidden}
          onToggleDefaultObstacleHidden={() => session.setGmHideObstacles(!session.ui.defaultObstacleHidden)}
        />
      )}

      {!!handoutHandler.editingHandout && (
        <Modal isOpen={!!handoutHandler.editingHandout} onClose={() => handoutHandler.setEditingHandout(null)} title={handoutHandler.editingHandout === 'new' ? t('vtt.gameSession.modal.handout.new') : t('vtt.gameSession.modal.handout.edit')} size="xl">
          <HandoutFormModal handout={handoutHandler.editingHandout === 'new' ? undefined : handoutHandler.editingHandout} onSave={handoutHandler.handleSaveHandout} onClose={() => handoutHandler.setEditingHandout(null)} />
        </Modal>
      )}
      {handoutHandler.previewingHandout && <HandoutPreviewModal handout={handoutHandler.previewingHandout} onClose={() => handoutHandler.setPreviewingHandout(null)} onEdit={(h) => { handoutHandler.setPreviewingHandout(null); handoutHandler.setEditingHandout(h); }} onShare={(h) => { handoutHandler.setPreviewingHandout(null); handoutHandler.setSharingHandout(h); }} />}
      {handoutHandler.sharingHandout && <HandoutShareModal handout={handoutHandler.sharingHandout} onClose={() => handoutHandler.setSharingHandout(null)} />}

      {/* Trigger Zone Edit Modal */}
      {!!editingTriggerZone && (
        <Modal isOpen={!!editingTriggerZone} onClose={() => zoneHandler.setEditingTriggerZoneId(null)} title={t('vtt.gameSession.modal.triggerZone.edit')} size="sm">
          <TriggerZoneConfigModalContent
            handouts={session.handouts}
            onSave={(handoutId) => {
              if (zoneHandler.editingTriggerZoneId) {
                session.updateTriggerZone(zoneHandler.editingTriggerZoneId, { handoutId });
              }
              zoneHandler.setEditingTriggerZoneId(null);
            }}
            onClose={() => zoneHandler.setEditingTriggerZoneId(null)}
            initialHandoutId={editingTriggerZone.handoutId}
          />
        </Modal>
      )}

      {/* Audio Zone Edit Modal */}
      {!!editingAudioZone && (
        <Modal isOpen={!!editingAudioZone} onClose={() => zoneHandler.setEditingAudioZoneId(null)} title={t('vtt.gameSession.modal.audioZone.edit')} size="lg">
          <AudioZoneEditModalContent
            zone={editingAudioZone}
            audioSettings={session.audioSettings}
            onSave={(updates) => {
              if (zoneHandler.editingAudioZoneId) {
                session.updateAudioZone(zoneHandler.editingAudioZoneId, updates);
              }
              zoneHandler.setEditingAudioZoneId(null);
            }}
            onClose={() => zoneHandler.setEditingAudioZoneId(null)}
          />
        </Modal>
      )}

      {/* Attack Zone Config Modal */}
      {zoneHandler.isAttackZoneConfigOpen && (
        <AttackZoneConfigModal
          isOpen={zoneHandler.isAttackZoneConfigOpen}
          onClose={() => zoneHandler.setIsAttackZoneConfigOpen(false)}
          onSave={(config) => {
            const centerX = Math.floor((-session.viewport.x + window.innerWidth / 2) / session.viewport.zoom);
            const centerY = Math.floor((-session.viewport.y + window.innerHeight / 2) / session.viewport.zoom);
            const zone = zoneHandler.attackZones.createCustomZone({
              ...config,
              origin: { x: centerX, y: centerY },
            });
            zoneHandler.attackZones.addZone(zone);
            zoneHandler.setIsAttackZoneConfigOpen(false);
          }}
          title={t('vtt.gameSession.modal.attackZone.createCustom')}
        />
      )}

      {/* Attack Zone Edit Modal */}
      {editingAttackZone && (
        <AttackZoneConfigModal
          isOpen={!!editingAttackZone}
          onClose={() => zoneHandler.setEditingAttackZoneId(null)}
          onSave={(updates) => {
            if (zoneHandler.editingAttackZoneId) {
              zoneHandler.attackZones.updateZone(zoneHandler.editingAttackZoneId, updates);
              zoneHandler.setEditingAttackZoneId(null);
            }
          }}
          initialConfig={editingAttackZone}
          title={t('vtt.gameSession.modal.attackZone.edit')}
        />
      )}

      <CombatInitiativeRoller
        isOpen={isInitiativeRollerOpen}
        onClose={onCloseInitiativeRoller}
      />

      {mapHandler.isCursorSettingsOpen && (
        <Suspense fallback={null}>
          <CursorSettingsModal isOpen={mapHandler.isCursorSettingsOpen} onClose={() => mapHandler.setIsCursorSettingsOpen(false)} />
        </Suspense>
      )}

      {mapHandler.isViewSettingsOpen && (
        <Modal
          isOpen={mapHandler.isViewSettingsOpen}
          onClose={() => mapHandler.setIsViewSettingsOpen(false)}
          title={t('vtt.settings.view.title')}
          size="lg"
          transparent
        >
          <ViewSettingsModal />
        </Modal>
      )}
    </Suspense>
  );
};
