import React from 'react';
import { useTranslation } from '../../../i18n/TranslationContext';
import { Combatant, CombatCondition } from '../../../types';
import { Heart, Shield, Zap, Skull, Swords, MoreVertical } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';
import { Button } from '../../ui/Button';

interface ActiveCombatantCardProps {
  combatant: Combatant;
  isGM: boolean;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
  onNextTurn: () => void;
}

export const ActiveCombatantCard: React.FC<ActiveCombatantCardProps> = ({
  combatant, isGM, onDamage, onHeal, onNextTurn
}) => {
  const { t } = useTranslation();
  const hpPercentage = combatant.maxHp ? (combatant.hp || 0) / combatant.maxHp * 100 : 0;

  const getHPColor = (p: number) => {
    if (p > 75) return 'bg-green-500';
    if (p > 50) return 'bg-yellow-500';
    if (p > 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-zinc-900/80 shadow-lg shadow-primary/10 animate-in zoom-in-95 duration-300">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative p-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={combatant.imgUrl || '/placeholder-avatar.png'}
                alt={combatant.name}
                className="w-16 h-16 rounded-full border-2 border-primary shadow-md object-cover bg-zinc-800"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm border border-zinc-900">
                <Swords className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white leading-tight">{combatant.name}</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                <span className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">{t('vtt.combat.card.init.abbr')} {combatant.initiative}</span>
                {combatant.ac && <span className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 flex items-center gap-1"><Shield className="w-3 h-3" /> {t('vtt.combat.card.ac.abbr')} {combatant.ac}</span>}
              </div>
            </div>
          </div>

          {/* Turn Actions */}
          {isGM && (
            <Button size="sm" onClick={onNextTurn} className="shadow-lg shadow-primary/20">
              {t('vtt.combat.card.nextTurn.button')}
            </Button>
          )}
        </div>

        {/* Stats & Conditions */}
        <div className="space-y-3">
          {/* HP Bar */}
          {combatant.hp !== undefined && combatant.maxHp && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold uppercase text-zinc-500">
                <span>{t('vtt.combat.card.hp.label')}</span>
                <span className="text-white">{combatant.hp} / {combatant.maxHp}</span>
              </div>
              <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-500 ${getHPColor(hpPercentage)}`}
                  style={{ width: `${hpPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Conditions */}
          {combatant.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {combatant.conditions.map(c => (
                <span key={c} className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
