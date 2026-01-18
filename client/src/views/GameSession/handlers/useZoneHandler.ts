import { useState, useCallback } from 'react';
import { useGameSession } from '../../../context/GameSessionContext';
import { useAttackZones } from '../../../context/gameSession/hooks/useAttackZones'; // Adjust path if needed
import { useTranslation } from '../../../i18n/TranslationContext';
import { useNotification } from '../../../context/NotificationContext';

interface UseZoneHandlerReturn {
  attackZones: ReturnType<typeof useAttackZones>;
  isAttackZonePanelOpen: boolean;
  setIsAttackZonePanelOpen: (v: boolean) => void;
  isAttackZoneConfigOpen: boolean;
  setIsAttackZoneConfigOpen: (v: boolean) => void;
  editingTriggerZoneId: string | null;
  setEditingTriggerZoneId: (id: string | null) => void;
  editingAudioZoneId: string | null;
  setEditingAudioZoneId: (id: string | null) => void;
  editingAttackZoneId: string | null;
  setEditingAttackZoneId: (id: string | null) => void;
  attackZoneContextMenu: { x: number, y: number, zoneId: string; } | null;
  setAttackZoneContextMenu: (v: { x: number, y: number, zoneId: string; } | null) => void;

  handleEditTriggerZone: (triggerZoneId?: string) => void;
  handleDeleteTriggerZone: (triggerZoneId?: string) => void;
  handleEditAudioZone: (audioZoneId?: string) => void;
  handleDeleteAudioZone: (audioZoneId?: string) => void;
  handleAttackZoneContextMenu: (e: React.MouseEvent, zoneId: string) => void;
  handleEditAttackZone: (zoneId: string) => void;
  handleDuplicateAttackZone: (zoneId: string) => void;
  handleDeleteAttackZone: () => void;
}

export const useZoneHandler = (): UseZoneHandlerReturn => { // We'll pass mapContextMenu via arguments if needed, or manage it here
  const { t } = useTranslation();
  const { show } = useNotification();
  const session = useGameSession();

  // Local UI State
  const [isAttackZonePanelOpen, setIsAttackZonePanelOpen] = useState(false);
  const [isAttackZoneConfigOpen, setIsAttackZoneConfigOpen] = useState(false);

  // Edit State
  const [editingTriggerZoneId, setEditingTriggerZoneId] = useState<string | null>(null);
  const [editingAudioZoneId, setEditingAudioZoneId] = useState<string | null>(null);
  const [editingAttackZoneId, setEditingAttackZoneId] = useState<string | null>(null);

  // Context Menu
  const [attackZoneContextMenu, setAttackZoneContextMenu] = useState<{ x: number, y: number, zoneId: string; } | null>(null);

  // Attack Zones Hook Integration
  const attackZones = useAttackZones({
    tokens: session.activeScene?.tokens || [],
    obstacles: session.activeScene?.obstacles || [],
    grid: session.activeScene?.grid || { size: 60, color: '#ffffff', alpha: 0.3, cols: 50, rows: 50, unitsPerSquare: 5 },
    activeZones: session.attackZones,
    onAddZone: session.addAttackZone,
    onRemoveZone: session.removeAttackZone,
    onUpdateZone: session.updateAttackZone,
    onClearZones: session.clearAttackZones
  });

  // TRIGGER ZONES
  const handleEditTriggerZone = useCallback((triggerZoneId?: string) => {
    if (triggerZoneId) {
      setEditingTriggerZoneId(triggerZoneId);
    }
  }, []);

  const handleDeleteTriggerZone = useCallback((triggerZoneId?: string) => {
    if (triggerZoneId) {
      session.removeTriggerZone(triggerZoneId);
    }
  }, [session]);

  // AUDIO ZONES
  const handleEditAudioZone = useCallback((audioZoneId?: string) => {
    if (audioZoneId) {
      setEditingAudioZoneId(audioZoneId);
    }
  }, []);

  const handleDeleteAudioZone = useCallback((audioZoneId?: string) => {
    if (audioZoneId) {
      session.removeAudioZone(audioZoneId);
    }
  }, [session]);

  // ATTACK ZONES
  const handleAttackZoneContextMenu = useCallback((e: React.MouseEvent, zoneId: string) => {
    setAttackZoneContextMenu({ x: e.clientX, y: e.clientY, zoneId });
  }, []);

  const handleEditAttackZone = useCallback((zoneId: string) => {
    setEditingAttackZoneId(zoneId);
    setAttackZoneContextMenu(null);
  }, []);

  const handleDuplicateAttackZone = useCallback((zoneId: string) => {
    const centerX = Math.floor((-session.viewport.x + window.innerWidth / 2) / session.viewport.zoom);
    const centerY = Math.floor((-session.viewport.y + window.innerHeight / 2) / session.viewport.zoom);
    attackZones.duplicateZone(zoneId, { x: centerX, y: centerY });
    setAttackZoneContextMenu(null);
    show({ type: 'success', message: t('vtt.gameSession.notification.zoneDuplicated') });
  }, [session.viewport, attackZones, show, t]);

  const handleDeleteAttackZone = useCallback(() => {
    if (attackZoneContextMenu) {
      attackZones.removeZone(attackZoneContextMenu.zoneId);
      setAttackZoneContextMenu(null);
      show({ type: 'success', message: t('vtt.gameSession.notification.zoneRemoved') });
    }
  }, [attackZoneContextMenu, attackZones, show, t]);

  return {
    attackZones,
    isAttackZonePanelOpen, setIsAttackZonePanelOpen,
    isAttackZoneConfigOpen, setIsAttackZoneConfigOpen,
    editingTriggerZoneId, setEditingTriggerZoneId,
    editingAudioZoneId, setEditingAudioZoneId,
    editingAttackZoneId, setEditingAttackZoneId,
    attackZoneContextMenu, setAttackZoneContextMenu,

    handleEditTriggerZone,
    handleDeleteTriggerZone,
    handleEditAudioZone,
    handleDeleteAudioZone,
    handleAttackZoneContextMenu,
    handleEditAttackZone,
    handleDuplicateAttackZone,
    handleDeleteAttackZone
  };
};
