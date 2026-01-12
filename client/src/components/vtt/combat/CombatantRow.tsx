import React from 'react';
import { Combatant, CombatCondition } from '../../../types';
import { Heart, Skull, Swords, MoreVertical } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';

interface CombatantRowProps {
  combatant: Combatant;
  isActive: boolean;
  onClick: () => void;
}

export const CombatantRow: React.FC<CombatantRowProps> = ({
  combatant, isActive, onClick
}) => {
  const hpPercentage = combatant.maxHp ? (combatant.hp || 0) / combatant.maxHp * 100 : 0;

  const getHPColor = (p: number) => {
    if (p > 75) return 'bg-green-500';
    if (p > 50) return 'bg-yellow-500';
    if (p > 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div
      onClick={onClick}
      className={`
                group flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer relative overflow-hidden
                ${isActive ? 'bg-primary/10 border-primary/50' : 'bg-zinc-900/30 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700'}
            `}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={combatant.imgUrl || '/placeholder-avatar.png'}
          alt={combatant.name}
          className={`w-10 h-10 rounded-full border-2 object-cover bg-zinc-800 ${isActive ? 'border-primary' : 'border-zinc-700'}`}
        />
        {combatant.conditions.includes('dead') && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
            <Skull className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-bold truncate text-sm ${isActive ? 'text-white' : 'text-zinc-300'}`}>{combatant.name}</p>
          {combatant.type === 'pc' && (
            <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">PC</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Init: {combatant.initiative}</span>
          {combatant.ac && <span>• CA: {combatant.ac}</span>}
        </div>
      </div>

      {/* HP Mini Bar */}
      {combatant.hp !== undefined && combatant.maxHp && (
        <div className="w-16 shrink-0 flex flex-col items-end gap-1">
          <div className="text-[10px] font-mono text-zinc-400">
            {combatant.hp}/{combatant.maxHp}
          </div>
          <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
            <div
              className={`h-full ${getHPColor(hpPercentage)}`}
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
