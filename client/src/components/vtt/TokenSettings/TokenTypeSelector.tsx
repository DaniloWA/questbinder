import React from 'react';
import { TokenType } from '../../../types';
import { User as UserIcon, Ghost, Box } from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';

interface TokenTypeSelectorProps {
  tokenType: TokenType;
  onTypeChange: (type: TokenType) => void;
}

export const TokenTypeSelector: React.FC<TokenTypeSelectorProps> = ({
  tokenType,
  onTypeChange,
}) => {
  const { t } = useTranslation();

  const types = [
    { id: 'pc', label: t('vtt.tokens.editModal.types.pc'), icon: UserIcon, activeColor: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50' },
    { id: 'npc', label: t('vtt.tokens.editModal.types.npc'), icon: Ghost, activeColor: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' },
    { id: 'object', label: t('vtt.tokens.editModal.types.object'), icon: Box, activeColor: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50' },
  ] as const;

  return (
    <div className="bg-zinc-800/50 p-1 rounded-lg flex gap-1 border border-zinc-800">
      {types.map(({ id, label, icon: Icon, activeColor }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTypeChange(id as TokenType)}
          className={`
            flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded transition-all
            ${tokenType === id ? activeColor : 'text-zinc-500 hover:text-zinc-300'}
          `}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};
