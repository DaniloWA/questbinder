import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../../i18n/TranslationContext';
import { useGameSession } from '../../context/GameSessionContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { RefreshCw, User as UserIcon, Crown, ChevronDown } from 'lucide-react';
import { CursorEditor, CursorEditorValues } from './CursorEditor';
import { useAccessControl } from '../../hooks/useAccessControl';
import { getCursorShape } from './constants/cursorShapes';

interface CursorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CursorSettingsModal: React.FC<CursorSettingsModalProps> = ({ isOpen, onClose }) => {
  const { cursorSettings, setCursorSettings, permissions, players, updatePermissions, campaign } = useGameSession();
  const { isGM } = useAccessControl();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Self-editing values
  const [selfValues, setSelfValues] = useState<CursorEditorValues>({
    shapeId: 'default',
    color: '#fbbf24',
    name: '',
    clickAnimation: 'ripple',
    clickColorLeft: '#3b82f6',
    clickColorRight: '#f59e0b',
    pingColor: '#fbbf24',
    pingAnimation: 'radar',
    // Trail
    trailEnabled: false,
    trailSize: 4,
    trailColor: '#fbbf24',
    trailAnimation: 'line',
    trailLength: 20,
    // Options
    showOthersTrails: true,
    showMyTrail: true,
    useAppCursor: true,
    explosionOnCollision: true,
    showToolActivity: true,
    showStatusActivity: true,
  });

  // GM player management
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<CursorEditorValues>>>({});

  // Filter players: exclude campaign owner (GM)
  const nonGMPlayers = useMemo(() =>
    players.filter(p => p.id !== campaign?.ownerId),
    [players, campaign?.ownerId]
  );

  // Get current override for selected player
  const currentOverride = selectedPlayerId ? (localOverrides[selectedPlayerId] || {}) : {};
  const selectedPlayer = selectedPlayerId ? nonGMPlayers.find(p => p.id === selectedPlayerId) : null;
  const existingOverride = selectedPlayerId ? (permissions?.cursorOverrides?.[selectedPlayerId] || {}) : {};

  // Check permissions for self - Server uses 'shape' not 'shapeId'
  type ServerOverride = {
    shape?: string; color?: string; name?: string; clickAnimation?: string; clickColorLeft?: string; clickColorRight?: string; pingColor?: string; pingAnimation?: string;
    trailEnabled?: boolean; trailSize?: number; trailColor?: string; trailAnimation?: string; trailLength?: number;
    showOthersTrails?: boolean; showMyTrail?: boolean; useAppCursor?: boolean; explosionOnCollision?: boolean;
  };
  const myOverride = (permissions?.cursorOverrides?.[user?.id || ''] || {}) as ServerOverride;
  const canChangeColor = isGM || (permissions?.cursorAllowColorChange ?? true);
  const canChangeShape = isGM || (permissions?.cursorAllowShapeChange ?? true);
  const canChangeName = isGM || (permissions?.cursorAllowNameChange ?? true);
  const canChangeAnimation = isGM || (permissions?.cursorAllowAnimationChange ?? true);
  const canChangeAnimationColor = isGM || (permissions?.cursorAllowAnimationColorChange ?? true);
  const canChangeTrail = isGM || (permissions?.cursorAllowTrailChange ?? true);

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelfValues({
        shapeId: cursorSettings?.shape || 'default',
        color: cursorSettings?.color || '#fbbf24',
        name: cursorSettings?.name || user?.name || '',
        clickAnimation: cursorSettings?.clickAnimation || 'ripple',
        clickColorLeft: cursorSettings?.clickColorLeft || '#3b82f6',
        clickColorRight: cursorSettings?.clickColorRight || '#f59e0b',
        pingColor: cursorSettings?.pingColor || '#fbbf24',
        pingAnimation: cursorSettings?.pingAnimation || 'radar',
        trailEnabled: cursorSettings?.trailEnabled ?? false,
        trailSize: cursorSettings?.trailSize ?? 4,
        trailColor: cursorSettings?.trailColor || '#fbbf24',
        trailAnimation: cursorSettings?.trailAnimation || 'line',
        trailLength: cursorSettings?.trailLength ?? 20,
        showOthersTrails: cursorSettings?.showOthersTrails ?? true,
        showMyTrail: cursorSettings?.showMyTrail ?? true,
        useAppCursor: cursorSettings?.useAppCursor ?? true,
        explosionOnCollision: cursorSettings?.explosionOnCollision ?? true,
        showToolActivity: cursorSettings?.showToolActivity ?? true,
        showStatusActivity: cursorSettings?.showStatusActivity ?? true,
      });

      // Copy existing overrides to local state
      if (permissions?.cursorOverrides) {
        setLocalOverrides({ ...permissions.cursorOverrides } as Record<string, Partial<CursorEditorValues>>);
      }
      setSelectedPlayerId(null);
    }
  }, [isOpen, cursorSettings, user?.name, permissions?.cursorOverrides]);

  // Self values changed - live update
  const handleSelfChange = useCallback((field: keyof CursorEditorValues, value: string) => {
    setSelfValues(prev => ({ ...prev, [field]: value }));

    // Live update cursor settings
    const updates: any = { ...selfValues, [field]: value };
    setCursorSettings({
      shape: updates.shapeId,
      color: updates.color,
      name: updates.name,
      clickAnimation: updates.clickAnimation,
      clickColorLeft: updates.clickColorLeft,
      clickColorRight: updates.clickColorRight,
      pingColor: updates.pingColor,
      pingAnimation: updates.pingAnimation,
      trailEnabled: updates.trailEnabled === 'true' || updates.trailEnabled === true,
      trailSize: Number(updates.trailSize),
      trailColor: updates.trailColor,
      trailAnimation: updates.trailAnimation,
      trailLength: Number(updates.trailLength),
      showOthersTrails: updates.showOthersTrails === 'true' || updates.showOthersTrails === true,
      showMyTrail: updates.showMyTrail === 'true' || updates.showMyTrail === true,
      useAppCursor: updates.useAppCursor === 'true' || updates.useAppCursor === true,
      explosionOnCollision: updates.explosionOnCollision === 'true' || updates.explosionOnCollision === true,
      showToolActivity: updates.showToolActivity === 'true' || updates.showToolActivity === true,
      showStatusActivity: updates.showStatusActivity === 'true' || updates.showStatusActivity === true,
    });
  }, [selfValues, setCursorSettings]);

  // GM override changed
  const handleOverrideChange = useCallback((field: keyof CursorEditorValues, value: string) => {
    if (!selectedPlayerId) return;

    setLocalOverrides(prev => ({
      ...prev,
      [selectedPlayerId]: {
        ...prev[selectedPlayerId],
        [field]: value,
      }
    }));
  }, [selectedPlayerId]);

  // Clear override for selected player
  const clearOverride = useCallback(() => {
    if (!selectedPlayerId) return;
    setLocalOverrides(prev => {
      const copy = { ...prev };
      delete copy[selectedPlayerId];
      return copy;
    });
  }, [selectedPlayerId]);

  // Save all overrides
  const handleSaveAll = useCallback(() => {
    if (isGM) {
      const newOverrides: Record<string, any> = {};
      Object.entries(localOverrides).forEach(([pid, ov]) => {
        const override = ov as Partial<CursorEditorValues>;
        if (Object.keys(override).length > 0) {
          newOverrides[pid] = {
            shape: override.shapeId,
            color: override.color,
            name: override.name,
            clickAnimation: override.clickAnimation,
            clickColorLeft: override.clickColorLeft,
            clickColorRight: override.clickColorRight,
            pingColor: override.pingColor,
            pingAnimation: override.pingAnimation,
            trailEnabled: override.trailEnabled,
            trailSize: override.trailSize,
            trailColor: override.trailColor,
            trailAnimation: override.trailAnimation,
            trailLength: override.trailLength,
            showOthersTrails: override.showOthersTrails,
            showMyTrail: override.showMyTrail,
            useAppCursor: override.useAppCursor,
            explosionOnCollision: override.explosionOnCollision,
            showToolActivity: override.showToolActivity,
            showStatusActivity: override.showStatusActivity,
          };
        }
      });
      updatePermissions({ cursorOverrides: newOverrides });
    }
    onClose();
  }, [isGM, localOverrides, updatePermissions, onClose]);

  // Permissions for self editor
  const selfCanEdit = {
    shape: canChangeShape && !myOverride.shape,
    color: canChangeColor && !myOverride.color,
    name: canChangeName && !myOverride.name,
    animation: canChangeAnimation && !myOverride.clickAnimation,
    leftColor: canChangeAnimationColor && !myOverride.clickColorLeft,
    rightColor: canChangeAnimationColor && !myOverride.clickColorRight,
    pingColor: canChangeColor && !myOverride.pingColor,
    pingAnimation: canChangeAnimation && !myOverride.pingAnimation,
    trail: canChangeTrail && !myOverride.trailEnabled, // Simplified check
  };

  const selfOverrides = {
    shape: !!myOverride.shape,
    color: !!myOverride.color,
    name: !!myOverride.name,
    animation: !!myOverride.clickAnimation,
    leftColor: !!myOverride.clickColorLeft,
    rightColor: !!myOverride.clickColorRight,
    pingColor: !!myOverride.pingColor,
    pingAnimation: !!myOverride.pingAnimation,
    trail: !!myOverride.trailEnabled
  };

  // GM can edit everything for players
  const gmCanEdit = {
    shape: true, color: true, name: true, animation: true,
    leftColor: true, rightColor: true, pingColor: true, pingAnimation: true,
    trail: true,
  };

  // Get effective values for override (merge existing + local changes)
  const getOverrideValues = (): CursorEditorValues => {
    if (!selectedPlayerId || !selectedPlayer) {
      return selfValues;
    }
    const override = localOverrides[selectedPlayerId] || {};
    const existing = existingOverride as any;
    return {
      shapeId: override.shapeId || existing.shape || 'default',
      color: override.color || existing.color || '#fbbf24',
      name: override.name || existing.name || selectedPlayer.name || '',
      clickAnimation: override.clickAnimation || existing.clickAnimation || 'ripple',
      clickColorLeft: override.clickColorLeft || existing.clickColorLeft || '#3b82f6',
      clickColorRight: override.clickColorRight || existing.clickColorRight || '#f59e0b',
      pingColor: override.pingColor || existing.pingColor || '#fbbf24',
      pingAnimation: override.pingAnimation || existing.pingAnimation || 'radar',
      trailEnabled: override.trailEnabled ?? existing.trailEnabled ?? false,
      trailSize: override.trailSize ?? existing.trailSize ?? 4,
      trailColor: override.trailColor || existing.trailColor || '#fbbf24',
      trailAnimation: override.trailAnimation || existing.trailAnimation || 'line',
      trailLength: override.trailLength ?? existing.trailLength ?? 20,
      showOthersTrails: override.showOthersTrails ?? existing.showOthersTrails ?? true,
      showMyTrail: override.showMyTrail ?? existing.showMyTrail ?? true,
      useAppCursor: override.useAppCursor ?? existing.useAppCursor ?? true,
      explosionOnCollision: override.explosionOnCollision ?? existing.explosionOnCollision ?? true,
      showToolActivity: override.showToolActivity ?? existing.showToolActivity ?? true,
      showStatusActivity: override.showStatusActivity ?? existing.showStatusActivity ?? true,
    };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('vtt.cursor.settings.title')} size={isGM ? 'lg' : 'md'}>
      <div className={`flex flex-col md:flex-row gap-0 md:gap-4 ${isGM ? 'md:h-[420px]' : ''}`}>

        {/* Mobile: Player Dropdown (GM only) */}
        {isGM && (
          <div className="md:hidden mb-3 pb-3 border-b border-zinc-800">
            <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">{t('vtt.cursor.settings.editingLabel')}</label>
            <div className="relative">
              <select
                value={selectedPlayerId || ''}
                onChange={(e) => setSelectedPlayerId(e.target.value || null)}
                className="w-full appearance-none bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white pr-8 focus:border-primary outline-none"
              >
                <option value="">{t('vtt.cursor.settings.myCursor')}</option>
                {nonGMPlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Desktop: Player List Sidebar (GM only) */}
        {isGM && (
          <div className="hidden md:flex w-44 flex-shrink-0 border-r border-zinc-800 pr-3 flex-col">
            <button
              onClick={() => setSelectedPlayerId(null)}
              className={`w-full flex items-center gap-2 p-2 rounded-md text-sm mb-2 ${selectedPlayerId === null
                ? 'bg-primary/20 text-primary font-bold'
                : 'text-zinc-400 hover:bg-zinc-800'
                }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>{t('vtt.cursor.settings.myCursor')}</span>
            </button>

            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 px-2">{t('vtt.cursor.settings.playersLabel')}</div>

            <div className="flex-1 overflow-y-auto space-y-0.5">
              {nonGMPlayers.map(p => {
                const hasOverride = Object.keys(localOverrides[p.id] || {}).length > 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`w-full flex items-center gap-2 p-1.5 rounded-md text-xs ${selectedPlayerId === p.id
                      ? 'bg-amber-500/20 text-amber-400 font-bold'
                      : 'text-zinc-400 hover:bg-zinc-800'
                      }`}
                  >
                    <img src={p.avatarUrl} className="w-4 h-4 rounded-full bg-zinc-800" alt={p.name} />
                    <span className="truncate flex-1 text-left">{p.name}</span>
                    {hasOverride && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </button>
                );
              })}
              {nonGMPlayers.length === 0 && (
                <p className="text-[10px] text-zinc-600 italic px-2">{t('vtt.cursor.settings.noPlayers')}</p>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Self Editing Mode - ONLY RENDER WHEN SELECTED */}
          {selectedPlayerId === null && (
            <CursorEditor
              values={selfValues}
              onChange={handleSelfChange}
              canEdit={selfCanEdit}
              overrides={selfOverrides}
              isVisible={selectedPlayerId === null}
              userName={user?.name || t('vtt.cursor.settings.defaultName')}
              isGMMode={false}
            />
          )}

          {/* GM: Player Override Mode - ONLY RENDER WHEN PLAYER SELECTED */}
          {selectedPlayerId !== null && selectedPlayer && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 shrink-0">
                <div>
                  <h3 className="text-xs font-bold text-white">{selectedPlayer.name}</h3>
                  <p className="text-[9px] text-zinc-500">{t('vtt.cursor.settings.setOverride')}</p>
                </div>
                {Object.keys(currentOverride).length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearOverride} className="text-amber-400 text-[10px] h-6 px-2">
                    <RefreshCw className="w-3 h-3 mr-1" /> {t('vtt.cursor.settings.clearOverride')}
                  </Button>
                )}
              </div>

              <div className="flex-1 mt-2">
                <CursorEditor
                  values={getOverrideValues()}
                  onChange={handleOverrideChange}
                  canEdit={gmCanEdit}
                  isVisible={selectedPlayerId !== null}
                  userName={selectedPlayer.name}
                  isGMMode={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-zinc-800 mt-4">
        <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">{t('common.actions.cancel.label')}</Button>
        <Button onClick={handleSaveAll} className="w-full sm:w-auto">{t('common.actions.save.label')}</Button>
      </div>
    </Modal>
  );
};
