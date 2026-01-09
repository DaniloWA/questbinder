import React, { useMemo } from 'react';
import { LightAnimationType } from '../../../../types';
import { SheetLabel } from '../../../ui/SheetPrimitives';
import { Counter } from '../../../ui/Counter';
import { ColorPicker } from '../../../ui/ColorPicker';
import { ToggleSwitch } from '../../../ui/ToggleSwitch';
import { Lightbulb } from 'lucide-react';
import { useTranslation } from '../../../../i18n/TranslationContext';

interface TokenLightTabProps {
  lightEnabled: boolean;
  onLightEnabledChange: (val: boolean) => void;
  lightBright: number;
  onLightBrightChange: (val: number) => void;
  lightDim: number;
  onLightDimChange: (val: number) => void;
  lightColor: string;
  onLightColorChange: (val: string) => void;
  lightIntensity: number;
  onLightIntensityChange: (val: number) => void;
  lightAnim: LightAnimationType;
  onLightAnimChange: (val: LightAnimationType) => void;
}

export const TokenLightTab: React.FC<TokenLightTabProps> = ({
  lightEnabled,
  onLightEnabledChange,
  lightBright,
  onLightBrightChange,
  lightDim,
  onLightDimChange,
  lightColor,
  onLightColorChange,
  lightIntensity,
  onLightIntensityChange,
  lightAnim,
  onLightAnimChange,
}) => {
  const { t } = useTranslation();

  const lightAnimOptions = useMemo(() => [
    { id: 'none', label: t('vtt.tokens.editModal.light.animations.none') },
    { id: 'torch', label: t('vtt.tokens.editModal.light.animations.torch') },
    { id: 'pulse', label: t('vtt.tokens.editModal.light.animations.pulse') },
  ], [t]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <ToggleSwitch
        enabled={lightEnabled}
        onChange={onLightEnabledChange}
        label={t('vtt.tokens.editModal.light.enabledLabel')}
        description={t('vtt.tokens.editModal.light.enabledDescription')}
        icon={<Lightbulb className="w-6 h-6" />}
        iconActiveColor="bg-yellow-500/20 text-yellow-500"
      />

      {lightEnabled && (
        <div className="space-y-4 animate-in slide-in-from-top-2 fade-in">
          {/* Radius */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <SheetLabel>{t('vtt.tokens.editModal.light.brightRadius')}</SheetLabel>
              <Counter value={lightBright} onChange={onLightBrightChange} min={0} max={200} className="bg-zinc-950" />
            </div>
            <div className="space-y-1">
              <SheetLabel>{t('vtt.tokens.editModal.light.dimRadius')}</SheetLabel>
              <Counter value={lightDim} onChange={onLightDimChange} min={0} max={200} className="bg-zinc-950" />
            </div>
          </div>

          {/* Color & Intensity */}
          <div className="space-y-2">
            <SheetLabel>{t('vtt.tokens.editModal.light.colorIntensity')}</SheetLabel>
            <div className="flex gap-3 items-center bg-zinc-950 p-2 rounded-lg border border-zinc-800">
              <ColorPicker value={lightColor} onChange={onLightColorChange} />
              <div className="flex-1 px-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={lightIntensity}
                  onChange={e => onLightIntensityChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
              <span className="text-xs font-bold w-8 text-right">{Math.round(lightIntensity * 100)}%</span>
            </div>
          </div>

          {/* Animation */}
          <div className="space-y-2">
            <SheetLabel>{t('vtt.tokens.editModal.light.animationLabel')}</SheetLabel>
            <div className="grid grid-cols-3 gap-2">
              {lightAnimOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onLightAnimChange(opt.id as LightAnimationType)}
                  className={`
                    py-2 text-xs font-bold rounded-md border transition-all
                    ${lightAnim === opt.id
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
