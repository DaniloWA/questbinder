// components/vtt/AttackZoneContextMenu.tsx

import React, { useEffect, useRef } from 'react';
import { Edit3, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../../i18n/TranslationContext';
import { AttackZoneConfig } from '../../types/attackZone';
import { AccessGate } from '../AccessGate';
import { GameRole } from '../../types/acl';
import { BooleanPermissionKey } from '../../context/gameSession/types';

interface AttackZoneContextMenuProps {
  x: number;
  y: number;
  zone: AttackZoneConfig;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleVisibility?: () => void;
}

export const AttackZoneContextMenu: React.FC<AttackZoneContextMenuProps> = ({
  x,
  y,
  zone,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleVisibility,
}) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const menuItems: {
      label: string;
      icon: any;
      onClick: () => void;
      color: string;
      separator?: boolean;
      permission?: BooleanPermissionKey;
      role?: GameRole;
  }[] = [
    {
      label: t('vtt.attackZone.contextMenu.edit.label'),
      icon: Edit3,
      onClick: () => {
        onEdit();
        onClose();
      },
      color: 'text-blue-400 hover:text-blue-300',
      permission: 'attackZoneCreate'
    },
    {
      label: t('vtt.attackZone.contextMenu.duplicate.label'),
      icon: Copy,
      onClick: () => {
        onDuplicate();
        onClose();
      },
      color: 'text-cyan-400 hover:text-cyan-300',
      permission: 'attackZoneUse'
    },
    {
      label: t('vtt.attackZone.contextMenu.delete.label'),
      icon: Trash2,
      onClick: () => {
        onDelete();
        onClose();
      },
      color: 'text-red-400 hover:text-red-300',
      separator: true,
      permission: 'attackZoneCreate'
    },
  ];

  // Adjust position to keep menu on screen
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - (menuItems.length * 45 + 20));

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl py-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
      }}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-white/10">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          {t('vtt.attackZone.contextMenu.header')}
        </p>
        <p className="text-sm font-semibold text-white truncate mt-0.5">
          {zone.name}
        </p>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            <AccessGate requirePermission={item.permission} requireRole={item.role}>
              <button
                onClick={item.onClick}
                className={`w-full px-4 py-2.5 flex items-center gap-3 transition-all ${item.color} hover:bg-white/5`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            </AccessGate>
            {item.separator && index < menuItems.length - 1 && (
              <div className="h-px bg-white/10 my-1 mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Zone Info */}
      <div className="px-4 py-2 border-t border-white/10 text-xs text-zinc-500 space-y-1">
        <div className="flex justify-between">
          <span>{t('vtt.attackZone.contextMenu.shape.label')}:</span>
          <span className="text-zinc-400 font-medium capitalize">{zone.shape}</span>
        </div>
        {zone.damageFormula && (
          <div className="flex justify-between">
            <span>{t('vtt.attackZone.contextMenu.damage.label')}:</span>
            <span className="text-zinc-400 font-medium">{zone.damageFormula}</span>
          </div>
        )}
        {zone.saveType && (
          <div className="flex justify-between">
            <span>Save:</span>
            <span className="text-zinc-400 font-medium uppercase">
              {zone.saveType} {zone.saveDC ? `DC ${zone.saveDC}` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
