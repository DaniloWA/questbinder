import React from 'react';
import { Heart, Shield, Wind, Award, Eye, Dice5, Skull, Hourglass, Moon, Sword, Crosshair, Zap, Share2 } from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';
import { Character } from '../../../types';
import { OptimizedNumberInput } from '../../ui/OptimizedNumberInput';
import { OptimizedTextInput } from '../../ui/OptimizedTextInput';
import { Counter } from '../../ui/Counter';
import { SheetHeader } from '../../ui/SheetPrimitives';

interface CombatTabProps {
  character: Character;
  derivedValues: { hpPercentage: number; };
  isEditing: boolean;
  canEdit: boolean;
  updateField: (field: keyof Character, value: any, options?: any) => void;
  updateFields: (updates: Partial<Character>, immediate?: boolean) => void;
  onRoll: (label: string, mod: number | string, type?: 'd20' | 'dmg') => void;
  onShare?: (type: 'attack', data: any) => void;
  handleRest: (type: 'short' | 'long') => void;
}

const fmtMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

const StatBox = ({ label, value, icon, onClick, highlight }: any) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`bg-zinc-900 border border-zinc-700 rounded-xl p-3 flex flex-col items-center justify-center transition-colors ${onClick ? 'hover:border-primary cursor-pointer' : 'cursor-default'
      } ${highlight ? 'hover:bg-primary/10' : ''}`}
  >
    <div className="text-zinc-500 mb-1">{icon}</div>
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="text-[9px] font-bold uppercase text-zinc-600 mt-1">{label}</div>
  </button>
);

const RabbitIcon = ({ className }: { className?: string; }) => <Wind className={className} />;

export const CombatTab: React.FC<CombatTabProps> = ({
  character, derivedValues, isEditing, canEdit, updateField, updateFields, onRoll, onShare, handleRest
}) => {
  const { t } = useTranslation();
  return (
    <div className="p-3 md:p-5 space-y-5 pb-20 md:pb-6">
      {/* HP SECTION - OPTIMIZED */}
      <div className="grid grid-cols-12 gap-3">
        {/* HP Block */}
        <div className="col-span-12 md:col-span-5 bg-zinc-900 border border-zinc-700 rounded-xl p-4 relative overflow-hidden">
          {/* HP Bar Background */}
          <div className="absolute inset-0 bg-zinc-950">
            <div
              className="h-full bg-green-900/20 transition-all duration-500"
              style={{ width: `${derivedValues.hpPercentage}%` }}
            />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-green-500">
                <Heart className="w-4 h-4 fill-current" />
                Pontos de Vida
              </div>
              <div className="text-xs text-zinc-500 font-mono">
                Máx: {character.hpMax}
              </div>
            </div>

            <OptimizedNumberInput
              value={character.hpCurrent}
              onChange={(v) => updateField('hpCurrent', v)}
              min={0}
              max={character.hpMax + (character.hpTemp || 0)}
              disabled={!canEdit}
              showControls={true}
              inputClassName="text-5xl font-black text-white bg-transparent border-none"
              selectOnFocus={true}
            />

            {character.hpTemp > 0 && (
              <div className="text-sm text-blue-400 font-bold">
                +{character.hpTemp} HP Temporário
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid - OPTIMIZED */}
        <div className="col-span-12 md:col-span-7 grid grid-cols-3 gap-2 md:gap-3">
          {isEditing ? (
            <>
              <OptimizedNumberInput
                value={character.armorClass}
                onChange={(v) => updateField('armorClass', v)}
                min={1}
                max={30}
                label="CA"
                showControls={false}
              />
              <OptimizedNumberInput
                value={character.initiative}
                onChange={(v) => updateField('initiative', v)}
                min={-5}
                max={10}
                label="Iniciativa"
                showControls={false}
              />
              <OptimizedNumberInput
                value={character.speed}
                onChange={(v) => updateField('speed', v)}
                min={0}
                max={120}
                label="Deslocamento"
                showControls={false}
              />
              <OptimizedNumberInput
                value={character.profBonus}
                onChange={(v) => updateField('profBonus', v)}
                min={2}
                max={6}
                label="Proficiência"
                showControls={false}
              />
              <OptimizedNumberInput
                value={character.passivePerception}
                onChange={(v) => updateField('passivePerception', v)}
                min={1}
                max={30}
                label="Percepção"
                showControls={false}
              />
            </>
          ) : (
            <>
              <StatBox label="CA" value={character.armorClass} icon={<Shield className="w-4 h-4" />} />
              <StatBox
                label="Iniciativa"
                value={fmtMod(character.initiative)}
                icon={<RabbitIcon className="w-4 h-4" />}
                onClick={() => onRoll('Iniciativa', character.initiative)}
                highlight
              />
              <StatBox label="Deslocamento" value={`${character.speed}m`} icon={<Wind className="w-4 h-4" />} />
              <StatBox label="Proficiência" value={`+${character.profBonus}`} icon={<Award className="w-4 h-4" />} />
              <StatBox label="Percepção Pas." value={character.passivePerception} icon={<Eye className="w-4 h-4" />} />
            </>
          )}

          {/* Heroic Inspiration */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold uppercase text-zinc-500 mb-1">Inspiração</span>
            <button
              onClick={() => updateField('heroicInspiration', !character.heroicInspiration)}
              disabled={!canEdit}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${character.heroicInspiration
                ? 'bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-500/20'
                : 'bg-zinc-800 border-zinc-600 text-zinc-600 hover:border-zinc-400'
                }`}
            >
              <Dice5 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RESOURCES ROW - OPTIMIZED */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400 flex items-center gap-2">
            <Skull className="w-3.5 h-3.5" /> Exaustão
          </span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono ${character.exhaustion > 0 ? 'text-red-400' : 'text-zinc-600'}`}>
              -{character.exhaustion * 2} em d20
            </span>
            <Counter
              value={character.exhaustion}
              onChange={(v) => updateField('exhaustion', v)}
              max={6}
              size="sm"
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400 flex items-center gap-2">
            <Hourglass className="w-3.5 h-3.5" /> Dados de Vida
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">{character.hitDiceTotal}</span>
            <Counter
              value={character.hitDiceCurrent}
              onChange={(v) => updateField('hitDiceCurrent', v)}
              max={character.level}
              size="sm"
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Rest Button */}
      {canEdit && (
        <button
          onClick={() => handleRest('long')}
          className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg py-2 px-4 font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Moon className="w-4 h-4" />
          Descanso Longo
        </button>
      )}

      {/* ATTACKS LIST */}
      <div className="space-y-3">
        <SheetHeader title="Ações & Ataques" icon={Sword} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {character.attacks.map(atk => (
            <div key={atk.id} className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 hover:border-primary/50 transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="space-y-1 pr-2">
                      <OptimizedTextInput
                        value={atk.name}
                        onChange={(val) => {
                          const newAttacks = character.attacks.map(a => a.id === atk.id ? { ...a, name: val } : a);
                          updateFields({ attacks: newAttacks });
                        }}
                        className="w-full"
                        inputClassName="bg-zinc-950 text-sm font-bold text-white border border-zinc-700 rounded px-1 mb-1"
                        placeholder="Nome do ataque"
                      />
                      <div className="flex gap-1">
                        <OptimizedTextInput
                          value={atk.range}
                          onChange={(val) => {
                            const newAttacks = character.attacks.map(a => a.id === atk.id ? { ...a, range: val } : a);
                            updateFields({ attacks: newAttacks });
                          }}
                          className="w-1/3"
                          inputClassName="bg-zinc-950 text-[10px] text-zinc-400 border border-zinc-700 rounded px-1"
                          placeholder="Alcance"
                        />
                        <OptimizedTextInput
                          value={atk.type}
                          onChange={(val) => {
                            const newAttacks = character.attacks.map(a => a.id === atk.id ? { ...a, type: val } : a);
                            updateFields({ attacks: newAttacks });
                          }}
                          className="w-1/3"
                          inputClassName="bg-zinc-950 text-[10px] text-zinc-400 border border-zinc-700 rounded px-1"
                          placeholder="Tipo"
                        />
                        <OptimizedTextInput
                          value={atk.mastery || ''}
                          onChange={(val) => {
                            const newAttacks = character.attacks.map(a => a.id === atk.id ? { ...a, mastery: val } : a);
                            updateFields({ attacks: newAttacks });
                          }}
                          className="w-1/3"
                          inputClassName="bg-zinc-950 text-[10px] text-primary border border-zinc-700 rounded px-1"
                          placeholder="Maestria"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="font-bold text-sm text-zinc-200 truncate pr-2">{atk.name}</div>
                      <div className="text-[10px] text-zinc-500 flex flex-wrap gap-2 mt-0.5">
                        <span className="truncate">{atk.range}</span>
                        <span className="truncate opacity-70">{atk.type}</span>
                        {atk.mastery && <span className="text-primary truncate">{atk.mastery}</span>}
                      </div>
                    </>
                  )}
                </div>
                {onShare && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => onShare('attack', atk)} className="p-1.5 text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Share2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 relative z-10">
                {isEditing ? (
                  <>
                    <div className="flex-1 flex items-center gap-1 bg-zinc-950 border border-zinc-700 rounded px-1">
                      <Crosshair className="w-3 h-3 text-zinc-500" />
                      <OptimizedTextInput
                        value={atk.atkBonus}
                        onChange={(val) => {
                          const newAttacks = character.attacks.map(a => a.id === atk.id ? { ...a, atkBonus: val } : a);
                          updateFields({ attacks: newAttacks });
                        }}
                        className="w-full"
                        inputClassName="bg-transparent text-xs font-mono text-white outline-none text-center border-none focus:ring-0"
                        placeholder="+0"
                      />
                    </div>
                    <div className="flex-[2] flex items-center gap-1 bg-zinc-950 border border-zinc-700 rounded px-1">
                      <Zap className="w-3 h-3 text-zinc-500" />
                      <OptimizedTextInput
                        value={atk.damage}
                        onChange={(val) => {
                          const newAttacks = character.attacks.map(a => a.id === atk.id ? { ...a, damage: val } : a);
                          updateFields({ attacks: newAttacks });
                        }}
                        className="w-full"
                        inputClassName="bg-transparent text-xs font-mono text-white outline-none text-center border-none focus:ring-0"
                        placeholder="1d6+2"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <button onClick={() => onRoll(atk.name, atk.atkBonus)} className="flex-1 bg-zinc-800 hover:bg-primary hover:text-white text-zinc-300 py-1.5 rounded flex items-center justify-center gap-2 transition-colors border border-zinc-700 group/btn">
                      <Crosshair className="w-3.5 h-3.5 text-zinc-500 group-hover/btn:text-white" />
                      <span className="text-xs font-bold font-mono">{atk.atkBonus}</span>
                    </button>
                    <button onClick={() => onRoll(`${atk.name} Dano`, atk.damage, 'dmg')} className="flex-[2] bg-zinc-800 hover:bg-red-900/50 hover:text-red-200 text-zinc-300 py-1.5 rounded flex items-center justify-center gap-2 transition-colors border border-zinc-700 group/btn">
                      <Zap className="w-3.5 h-3.5 text-zinc-500 group-hover/btn:text-red-400" />
                      <span className="text-xs font-bold font-mono truncate">{atk.damage}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {character.attacks.length === 0 && <div className="col-span-full text-center py-6 text-zinc-600 text-xs italic border border-dashed border-zinc-800 rounded-lg">{t('vtt.character.combatTab.noAttacks.text')}</div>}
        </div>
      </div>
    </div>
  );
};
