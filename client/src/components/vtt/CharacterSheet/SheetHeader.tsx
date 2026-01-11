import React from 'react';
import { X, Settings } from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';
import { Character } from '../../../types';
import { OptimizedTextInput } from '../../ui/OptimizedTextInput';
import { SaveIndicator } from '../../ui/SaveIndicator';
import { Tooltip } from '../../ui/Tooltip';

interface SheetHeaderProps {
  character: Character;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  onUpdateName: (name: string) => void;
  onClose: () => void;
  canEdit: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
}

export const SheetHeader: React.FC<SheetHeaderProps> = ({
  character, isEditing, setIsEditing, onUpdateName, onClose, canEdit, saveStatus
}) => {
  const { t } = useTranslation();
  return (
    <div className="sticky top-0 z-20 bg-zinc-950 border-b border-zinc-800 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <OptimizedTextInput
            value={character.name}
            onChange={onUpdateName}
            disabled={!canEdit}
            className="mb-1"
            inputClassName="text-xl font-bold bg-transparent border-none px-0 py-0 focus:ring-0"
            placeholder={t('vtt.character.sheet.characterName.placeholder')}
          />
          <div className="text-xs text-zinc-500">
            {character.class} {t('vtt.character.header.level.text')} {character.level} • {character.species}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SaveIndicator status={saveStatus} />

        {canEdit && (
          <Tooltip content={isEditing ? t('vtt.character.header.viewMode.tooltip') : t('vtt.character.header.editMode.tooltip')}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-lg transition-all ${isEditing
                ? 'bg-primary text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
