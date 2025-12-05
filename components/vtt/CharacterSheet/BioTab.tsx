import React from 'react';
import { User, Brain, ScrollText, NotebookPen } from 'lucide-react';
import { Character } from '../../../types';
import { OptimizedTextInput } from '../../ui/OptimizedTextInput';
import { SheetHeader } from '../../ui/SheetPrimitives';

interface BioTabProps {
  character: Character;
  isEditing: boolean;
  updateField: (field: keyof Character, value: any) => void;
}

export const BioTab: React.FC<BioTabProps> = ({
  character, isEditing, updateField
}) => {
  return (
    <div className="p-3 md:p-5 space-y-6 pb-20">
      {/* Appearance Grid */}
      <div className="space-y-2">
        <SheetHeader title="Aparência" icon={User} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.keys(character.appearance) as Array<keyof typeof character.appearance>).map(key => (
            <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
              <span className="text-[9px] font-bold uppercase text-zinc-500 block mb-1">{key}</span>
              {isEditing ? (
                <OptimizedTextInput
                  value={character.appearance[key]}
                  onChange={(val) => updateField('appearance', { ...character.appearance, [key]: val })}
                  className="w-full"
                  inputClassName="bg-transparent text-sm text-white border-b border-zinc-700 focus:border-primary outline-none"
                />
              ) : (
                <span className="text-sm text-zinc-300">{character.appearance[key] || '-'}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Personality Traits */}
      <div className="space-y-2">
        <SheetHeader title="Personalidade" icon={Brain} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(character.personality) as Array<keyof typeof character.personality>).map(key => (
            <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase text-primary block mb-2">{key}</span>
              {isEditing ? (
                <OptimizedTextInput
                  value={character.personality[key]}
                  onChange={(val) => updateField('personality', { ...character.personality, [key]: val })}
                  className="w-full"
                  inputClassName="bg-zinc-950/50 text-xs text-zinc-300 border border-zinc-800 rounded p-2 min-h-[80px] focus:border-primary outline-none resize-none"
                  multiline
                />
              ) : (
                <p className="text-xs text-zinc-400 italic leading-relaxed">{character.personality[key] || '...'}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Biography & Notes */}
      <div className="space-y-4">
        <div className="space-y-2">
          <SheetHeader title="Biografia" icon={ScrollText} />
          {isEditing ? (
            <OptimizedTextInput
              value={character.bio || ''}
              onChange={(val) => updateField('bio', val)}
              className="w-full"
              inputClassName="bg-zinc-900 text-sm text-zinc-300 border border-zinc-800 rounded-lg p-3 min-h-[150px] focus:border-primary outline-none"
              multiline
              placeholder="Escreva a história do seu personagem..."
            />
          ) : (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
              {character.bio || 'Nenhuma biografia disponível.'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <SheetHeader title="Notas & Outros" icon={NotebookPen} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-500 uppercase">Aliados & Organizações</span>
              {isEditing ? (
                <OptimizedTextInput
                  value={character.alliesAndOrgs || ''}
                  onChange={(val) => updateField('alliesAndOrgs', val)}
                  className="w-full"
                  inputClassName="bg-zinc-900 text-xs text-zinc-300 border border-zinc-800 rounded p-2 min-h-[100px] focus:border-primary outline-none"
                  multiline
                />
              ) : (
                <div className="bg-zinc-900/30 border border-zinc-800 rounded p-2 text-xs text-zinc-400 min-h-[60px] whitespace-pre-wrap">
                  {character.alliesAndOrgs || '-'}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-500 uppercase">Tesouro & Itens Especiais</span>
              {isEditing ? (
                <OptimizedTextInput
                  value={character.treasure || ''}
                  onChange={(val) => updateField('treasure', val)}
                  className="w-full"
                  inputClassName="bg-zinc-900 text-xs text-zinc-300 border border-zinc-800 rounded p-2 min-h-[100px] focus:border-primary outline-none"
                  multiline
                />
              ) : (
                <div className="bg-zinc-900/30 border border-zinc-800 rounded p-2 text-xs text-zinc-400 min-h-[60px] whitespace-pre-wrap">
                  {character.treasure || '-'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
