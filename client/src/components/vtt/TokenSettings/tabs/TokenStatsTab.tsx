import React from 'react';
import { Condition, CombatEffect } from '../../../../types';
import { Heart, Zap, Activity, Skull, Shield, Trash2 } from 'lucide-react';
import { StatusBarEditor } from '../StatusBarEditor';
import { ConditionGrid } from '../ConditionGrid';

interface TokenStatsTabProps {
  hpValue: number;
  onHpValueChange: (val: number) => void;
  hpMax: number;
  onHpMaxChange: (val: number) => void;
  hpVisible: boolean;
  onHpVisibleChange: (val: boolean) => void;
  mpValue: number;
  onMpValueChange: (val: number) => void;
  mpMax: number;
  onMpMaxChange: (val: number) => void;
  mpVisible: boolean;
  onMpVisibleChange: (val: boolean) => void;
  conditions: Condition[];
  onConditionsChange: (conditions: Condition[]) => void;
  effects: CombatEffect[];
  onEffectsChange: (effects: CombatEffect[]) => void;
  ignoredAuras: string[];
  onIgnoredAurasChange: (auras: string[]) => void;
}

export const TokenStatsTab: React.FC<TokenStatsTabProps> = ({
  hpValue,
  onHpValueChange,
  hpMax,
  onHpMaxChange,
  hpVisible,
  onHpVisibleChange,
  mpValue,
  onMpValueChange,
  mpMax,
  onMpMaxChange,
  mpVisible,
  onMpVisibleChange,
  conditions,
  onConditionsChange,
  effects,
  onEffectsChange,
  ignoredAuras,
  onIgnoredAurasChange,
}) => {
  const handleRemoveEffect = (effectId: string, sourceAuraId?: string) => {
    const newEffects = effects.filter(e => e.id !== effectId);
    onEffectsChange(newEffects);
    if (sourceAuraId) {
      onIgnoredAurasChange([...ignoredAuras, sourceAuraId]);
    }
  };

  const formatDuration = (duration: CombatEffect['duration']): string => {
    if (typeof duration === 'number') {
      return `${duration} rodadas`;
    }
    if (typeof duration === 'object' && duration !== null && 'remaining' in duration) {
      return `${duration.remaining} rodadas`;
    }
    return '';
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Status Bars */}
      <div className="space-y-4 bg-zinc-950/50 p-4 md:p-5 rounded-xl border border-zinc-800/50">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-2">
          <Activity className="w-3 h-3" /> Barras de Status
        </h3>

        <StatusBarEditor
          label="Vida (Barra 1)"
          icon={<Heart className="w-3 h-3" />}
          iconColor="text-green-500"
          value={hpValue}
          max={hpMax}
          visible={hpVisible}
          onValueChange={onHpValueChange}
          onMaxChange={onHpMaxChange}
          onVisibleChange={onHpVisibleChange}
        />

        <div className="pt-2 border-t border-zinc-800/50 mt-2">
          <StatusBarEditor
            label="Recurso (Barra 2)"
            icon={<Zap className="w-3 h-3" />}
            iconColor="text-blue-500"
            value={mpValue}
            max={mpMax}
            visible={mpVisible}
            onValueChange={onMpValueChange}
            onMaxChange={onMpMaxChange}
            onVisibleChange={onMpVisibleChange}
          />
        </div>
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Skull className="w-3 h-3" /> Condições Iniciais
        </h3>
        <ConditionGrid conditions={conditions} onChange={onConditionsChange} />
      </div>

      {/* Active Effects */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-3 h-3" /> Efeitos Ativos
        </h3>
        <div className="bg-zinc-950/50 p-2 rounded-lg border border-zinc-800 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
          {effects.length === 0 && (
            <span className="text-xs text-zinc-600 italic p-2 block text-center">
              Nenhum efeito ativo.
            </span>
          )}
          {effects.map(eff => (
            <div key={eff.id} className="flex items-center justify-between p-2 bg-zinc-900 rounded border border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-1 h-8 rounded-full bg-primary/50" />
                <div>
                  <div className="text-xs font-bold text-white">{eff.name}</div>
                  <div className="text-[10px] text-zinc-500 flex gap-2">
                    {eff.sourceAuraId && (
                      <span className="text-blue-400 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Aura
                      </span>
                    )}
                    {eff.duration && <span>{formatDuration(eff.duration)}</span>}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveEffect(eff.id, eff.sourceAuraId)}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                title={eff.sourceAuraId ? "Remover e Ignorar Aura" : "Remover Efeito"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
