import React from 'react';
import { Zap, Share2 } from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';
import { Character } from '../../../types';
import { OptimizedTextInput } from '../../ui/OptimizedTextInput';
import { OptimizedNumberInput } from '../../ui/OptimizedNumberInput';
import { SheetHeader } from '../../ui/SheetPrimitives';

interface SpellsTabProps {
  character: Character;
  isEditing: boolean;
  canEdit: boolean;
  updateField: (field: keyof Character, value: any) => void;
  updateFields: (updates: Partial<Character>) => void;
  onShare?: (type: 'spell', data: any) => void;
}

export const SpellsTab: React.FC<SpellsTabProps> = ({
  character, isEditing, canEdit, updateField, updateFields, onShare
}) => {
  const { t } = useTranslation();
  return (
    <div className="p-3 md:p-5 space-y-5 pb-20">
      {/* Spell Stats Header */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase text-zinc-500">{t('vtt.character.spells.attribute.label')}</span>
          {isEditing ? (
            <OptimizedTextInput
              value={character.spellInfo.ability}
              onChange={(val) => updateField('spellInfo', { ...character.spellInfo, ability: val })}
              className="w-16"
              inputClassName="bg-zinc-900 text-sm font-bold text-primary uppercase border border-zinc-700 rounded px-1 text-center"
            />
          ) : (
            <span className="text-sm font-bold text-primary uppercase">{character.spellInfo.ability}</span>
          )}
        </div>
        <div className="flex flex-col text-center">
          <span className="text-[9px] font-bold uppercase text-zinc-500">CD</span>
          {isEditing ? (
            <OptimizedNumberInput
              value={character.spellInfo.saveDc}
              onChange={(val) => updateField('spellInfo', { ...character.spellInfo, saveDc: val })}
              className="w-12 mx-auto"
              inputClassName="bg-zinc-900 text-xl font-bold text-white border border-zinc-700 rounded px-1 text-center"
              showControls={false}
            />
          ) : (
            <span className="text-xl font-bold text-white">{character.spellInfo.saveDc}</span>
          )}
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[9px] font-bold uppercase text-zinc-500">{t('vtt.character.spells.attack.label')}</span>
          {isEditing ? (
            <OptimizedNumberInput
              value={character.spellInfo.atkBonus}
              onChange={(val) => updateField('spellInfo', { ...character.spellInfo, atkBonus: val })}
              className="w-12 ml-auto"
              inputClassName="bg-zinc-900 text-xl font-bold text-white border border-zinc-700 rounded px-1 text-center"
              showControls={false}
            />
          ) : (
            <span className="text-xl font-bold text-white">+{character.spellInfo.atkBonus}</span>
          )}
        </div>
      </div>

      {/* Spell Slots */}
      <div className="space-y-2">
        <SheetHeader title={t('vtt.character.spells.slots.title')} icon={Zap} />
        <div className="flex flex-wrap gap-2">
          {character.spellSlots.map(slot => (
            <div key={slot.level} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex flex-col items-center min-w-[60px]">
              <span className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5">{t('vtt.character.spells.level.text')} {slot.level}</span>
              <div className="flex flex-wrap justify-center gap-1">
                {Array.from({ length: slot.total }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (!canEdit) return;
                      const newSlots = [...character.spellSlots];
                      const slotIndex = newSlots.findIndex(s => s.level === slot.level);
                      const isAvailable = i < (slot.total - slot.used);
                      newSlots[slotIndex] = { ...slot, used: isAvailable ? slot.used + 1 : slot.used - 1 };
                      updateFields({ spellSlots: newSlots });
                    }}
                    className={`w-3 h-4 rounded-sm transition-all border ${i < (slot.total - slot.used) ? 'bg-purple-500 border-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.4)]' : 'bg-zinc-950 border-zinc-800'}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spells List */}
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, lvl) => {
          const levelSpells = character.spells.filter(s => s.level === lvl);
          if (levelSpells.length === 0) return null;
          return (
            <div key={lvl} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold text-zinc-400 uppercase">{lvl === 0 ? t('vtt.character.spells.cantrips.label') : `${t('vtt.character.spells.level.text')} ${lvl}`}</span>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {levelSpells.map(spell => (
                  <div key={spell.id} className="bg-zinc-900/30 border border-zinc-800 hover:border-purple-500/30 rounded-lg p-2 flex items-center justify-between group transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        disabled={!isEditing}
                        onClick={() => {
                          const newSpells = character.spells.map(s => s.id === spell.id ? { ...s, prepared: !s.prepared } : s);
                          updateFields({ spells: newSpells });
                        }}
                        className={`w-8 h-8 shrink-0 rounded flex items-center justify-center text-[10px] font-bold border uppercase transition-all ${spell.prepared ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'} ${isEditing ? 'hover:border-purple-500 cursor-pointer' : ''}`}
                      >
                        {spell.school.substring(0, 2)}
                      </button>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-zinc-200 truncate">{spell.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{spell.castingTime} • {spell.range}</div>
                      </div>
                    </div>
                    {onShare && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => onShare('spell', spell)} className="p-1.5 text-zinc-600 hover:text-white"><Share2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
