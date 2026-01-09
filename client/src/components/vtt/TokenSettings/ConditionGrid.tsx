import React from 'react';
import { Condition } from '../../../types';
import { Activity } from 'lucide-react';
import { STATUS_RULES } from '../../../data/rules';
import { CONDITION_ICONS } from './tokenModalUtils';
import { Tooltip } from '../../ui/Tooltip';
import { useTranslation } from '../../../i18n/TranslationContext';

interface ConditionGridProps {
  conditions: Condition[];
  onChange: (conditions: Condition[]) => void;
  maxHeight?: string;
}

export const ConditionGrid: React.FC<ConditionGridProps> = ({
  conditions,
  onChange,
  maxHeight = 'max-h-48',
}) => {
  const { t, hasKey } = useTranslation();

  const toggleCondition = (key: string) => {
    const isActive = conditions.includes(key as Condition);
    if (isActive) {
      onChange(conditions.filter(c => c !== key));
    } else {
      onChange([...conditions, key as Condition]);
    }
  };

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 ${maxHeight} overflow-y-auto custom-scrollbar p-1`}>
      {Object.entries(STATUS_RULES).map(([key, rule]) => {
        const isActive = conditions.includes(key as Condition);
        const icon = CONDITION_ICONS[key] || <Activity className="w-5 h-5" />;

        // Use translated name if available, fallback to rule.name
        const nameKey = `dnd.rules.conditions.${key}.name`;
        const translatedName = hasKey(nameKey) ? t(nameKey) : rule.name;

        return (
          <Tooltip
            key={key}
            content={
              <div className="max-w-[200px]">
                <div className="font-bold mb-1">{translatedName}</div>
                <ul className="list-disc pl-3 text-xs space-y-1">
                  {rule.effects.map((e, i) => {
                    const effectKey = `dnd.rules.conditions.${key}.effects.${i}`;
                    return <li key={i}>{hasKey(effectKey) ? t(effectKey) : e}</li>;
                  })}
                </ul>
              </div>
            }
          >
            <button
              type="button"
              onClick={() => toggleCondition(key)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-2 h-20 w-full
                ${isActive
                  ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(124,58,237,0.3)] scale-105'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 hover:border-zinc-700'
                }
              `}
            >
              {icon}
              <span className="text-[10px] font-bold uppercase tracking-wide text-center leading-tight line-clamp-2 w-full">
                {translatedName}
              </span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};
