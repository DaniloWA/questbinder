import React, { useState } from 'react';
import { useTranslation } from '../../i18n/TranslationContext';
import { Campaign, TokenHoverPermissions } from '../../types';
import { Eye, EyeOff, Save, Shield, User, Box } from 'lucide-react';
import { campaignService } from '../../services/campaignService';
import { useNotification } from '../../context/NotificationContext';

interface TokenHoverPermissionsCompactProps {
  campaign: Campaign;
  permissions: TokenHoverPermissions;
  onChange: (newPermissions: TokenHoverPermissions) => void;
}

export const TokenHoverPermissionsCompact: React.FC<TokenHoverPermissionsCompactProps> = ({ campaign, permissions: externalPermissions, onChange }) => {
  const { t } = useTranslation();
  const { show } = useNotification();
  const [permissions, setPermissions] = useState<TokenHoverPermissions>(
    externalPermissions || {
      enabled: true,
      pc: { showName: true, showHP: true, showResource: true, showConditions: true, showStats: true, showAttributes: true },
      npc: { showName: true, showHP: false, showResource: false, showConditions: true, showStats: false, showAttributes: false },
      object: { showName: true, showConditions: false }
    }
  );

  // Sync with external permissions when they change
  React.useEffect(() => {
    if (externalPermissions) {
      setPermissions(externalPermissions);
    }
  }, [externalPermissions]);

  const handleToggle = (type: keyof TokenHoverPermissions | 'enabled', field?: string) => {
    let newPermissions: TokenHoverPermissions;

    if (type === 'enabled') {
      newPermissions = {
        ...permissions,
        enabled: !permissions.enabled
      };
    } else if (field) {
      newPermissions = {
        ...permissions,
        [type]: {
          ...permissions[type],
          [field]: !(permissions[type] as any)[field]
        }
      };
    } else {
      return;
    }

    setPermissions(newPermissions);
    onChange(newPermissions); // Notify parent of changes
  };

  const renderCompactSection = (
    title: string,
    icon: React.ReactNode,
    iconColor: string,
    type: keyof TokenHoverPermissions,
    fields: { key: string; label: string; }[]
  ) => (
    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
      <div className="bg-zinc-900/80 px-3 py-2 border-b border-zinc-800 flex items-center gap-2">
        <div className={`p-1.5 bg-zinc-950 rounded-md border border-zinc-800 ${iconColor}`}>
          {icon}
        </div>
        <h4 className="font-bold text-sm text-zinc-200">{title}</h4>
      </div>
      <div className="p-2 space-y-0.5">
        {fields.map(field => {
          const isVisible = (permissions[type] as any)[field.key];
          return (
            <div
              key={field.key}
              onClick={() => handleToggle(type, field.key)}
              className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all group ${isVisible
                ? 'bg-primary/10 hover:bg-primary/15'
                : 'hover:bg-zinc-800/50'
                }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isVisible
                  ? 'bg-primary/20 text-primary'
                  : 'bg-zinc-800 text-zinc-600 group-hover:text-zinc-500'
                  }`}>
                  {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </div>
                <p className={`text-xs font-medium transition-colors ${isVisible ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'
                  }`}>
                  {field.label}
                </p>
              </div>
              <div className={`relative w-8 h-4 rounded-full transition-colors ${isVisible ? 'bg-primary' : 'bg-zinc-700'
                }`}>
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isVisible ? 'translate-x-4' : 'translate-x-0'
                  }`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="pb-2 border-b border-zinc-800">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" /> {t('vtt.tokenHover.permissions.title')}
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          {t('vtt.tokenHover.permissions.description')}
        </p>
      </div>

      {/* MASTER ENABLED TOGGLE */}
      <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-bold text-sm text-white">{t('vtt.tokenHover.permissions.enabled.title')}</h4>
            <p className="text-xs text-zinc-500 mt-0.5">{t('vtt.tokenHover.permissions.enabled.description')}</p>
          </div>
          <button
            onClick={() => handleToggle('enabled')}
            className={`relative w-11 h-6 rounded-full transition-colors ${permissions.enabled ? 'bg-primary' : 'bg-zinc-700'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${permissions.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {renderCompactSection(
          t('vtt.tokenHover.permissions.heroes.title'),
          <User className="w-3.5 h-3.5" />,
          'text-blue-400',
          'pc',
          [
            { key: 'showName', label: t('vtt.tokenHover.permissions.name.label') },
            { key: 'showHP', label: t('vtt.tokenHover.permissions.hpBar.label') },
            { key: 'showResource', label: t('vtt.tokenHover.permissions.resourceBar.label') },
            { key: 'showConditions', label: t('vtt.tokenHover.permissions.conditions.label') },
            { key: 'showStats', label: t('vtt.tokenHover.permissions.stats.label') },
            { key: 'showAttributes', label: t('vtt.tokenHover.permissions.attributes.label') },
          ]
        )}

        {renderCompactSection(
          t('vtt.tokenHover.permissions.creatures.title'),
          <Shield className="w-3.5 h-3.5" />,
          'text-red-400',
          'npc',
          [
            { key: 'showName', label: t('vtt.tokenHover.permissions.name.label') },
            { key: 'showHP', label: t('vtt.tokenHover.permissions.hpBar.label') },
            { key: 'showResource', label: t('vtt.tokenHover.permissions.resourceBar.label') },
            { key: 'showConditions', label: t('vtt.tokenHover.permissions.conditions.label') },
            { key: 'showStats', label: t('vtt.tokenHover.permissions.stats.label') },
            { key: 'showAttributes', label: t('vtt.tokenHover.permissions.attributes.label') },
          ]
        )}

        {renderCompactSection(
          t('vtt.tokenHover.permissions.objects.title'),
          <Box className="w-3.5 h-3.5" />,
          'text-amber-400',
          'object',
          [
            { key: 'showName', label: t('vtt.tokenHover.permissions.objectName.label') },
            { key: 'showConditions', label: t('vtt.tokenHover.permissions.states.label') },
          ]
        )}
      </div>

      <div className="pt-2 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600 italic text-center">
          {t('vtt.tokenHover.permissions.applyRulesHint')}
        </p>
      </div>
    </div>
  );
};
