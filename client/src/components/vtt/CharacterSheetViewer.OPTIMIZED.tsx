import React, { useState, useCallback, useEffect } from 'react';
import { Character, Attributes, SkillName } from '../../types';
import { SheetCard, SheetHeader } from '../ui/SheetPrimitives';
import {
  Sword, Shield, Zap, Backpack, Dice5, X, Activity, Heart,
  Eye, Crosshair, Share2, Moon, Wind, Skull, Award, Hourglass, User, Lock, Settings, ScrollText, NotebookPen, FileWarning, Clock, Save
} from 'lucide-react';
import { SKILLS_DATA } from '../../data/rules';
import { Tooltip } from '../ui/Tooltip';
import { Counter } from '../ui/Counter';
import { useGameSession } from '../../context/GameSessionContext';
import { SaveIndicator, useSaveIndicator } from '../ui/SaveIndicator';
import { PrivateFieldWrapper } from '../ui/PrivacyToggle';
import { OptimizedNumberInput } from '../ui/OptimizedNumberInput';
import { OptimizedTextInput } from '../ui/OptimizedTextInput';
import { useOptimizedCharacterSheet } from './hooks/useOptimizedCharacterSheet';

interface CharacterSheetViewerProps {
  character: Character;
  isGM?: boolean;
  currentUserId?: string;
  onClose: () => void;
  onUpdate: (updates: Partial<Character>, immediate?: boolean) => void;
  onRoll: (label: string, formula: string) => void;
  onShare?: (type: 'item' | 'spell' | 'attack' | 'feature', data: any) => void;
}

// --- UTILS ---
const calcMod = (score: number) => Math.floor((score - 10) / 2);
const fmtMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

export const CharacterSheetViewer: React.FC<CharacterSheetViewerProps> = ({
  character: initialCharacter, onClose, onUpdate, onRoll, onShare, isGM = false, currentUserId
}) => {
  const [activeTab, setActiveTab] = useState<'combat' | 'spells' | 'inventory' | 'features' | 'bio' | 'history' | 'gmnotes'>('combat');
  const [openFeatures, setOpenFeatures] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Save indicator
  const { status: saveStatus, setSaving, setSaved, setError: setSaveError } = useSaveIndicator();

  // Get game session context
  let gameSession: any;
  let permissionHelper: any = { can: () => true, isGameMaster: () => isGM };
  try {
    gameSession = useGameSession();
    permissionHelper = gameSession.permissionHelper;
  } catch (e) {
    // Not in GameSessionContext
  }

  // Permission check
  const canEdit = permissionHelper.isGameMaster() || (initialCharacter.ownerId === currentUserId && permissionHelper.can('sheetEdit'));

  // Optimized character sheet hook
  const {
    character,
    derivedValues,
    updateField,
    updateFields,
    isFieldPrivate,
    toggleFieldPrivacy,
    cleanup
  } = useOptimizedCharacterSheet({
    character: initialCharacter,
    onUpdate: useCallback(async (updates: Partial<Character>, immediate?: boolean) => {
      setSaving();
      try {
        await onUpdate(updates, immediate);
        setSaved();
      } catch (err) {
        setSaveError();
      }
    }, [onUpdate, setSaving, setSaved, setSaveError]),
    onTogglePrivacy: useCallback(async (fieldName: string) => {
      if (gameSession?.toggleFieldPrivacy) {
        await gameSession.toggleFieldPrivacy(initialCharacter.id, fieldName);
      }
    }, [gameSession, initialCharacter.id])
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // --- ACTIONS ---
  const handleRoll = useCallback((label: string, mod: number | string, type: 'd20' | 'dmg' = 'd20') => {
    const modifier = typeof mod === 'string' ? parseInt(mod) || 0 : mod;
    const exhaustionPenalty = type === 'd20' ? (character.exhaustion * -2) : 0;
    const totalMod = modifier + exhaustionPenalty;
    const sign = totalMod >= 0 ? '+' : '';
    const penaltyText = character.exhaustion > 0 && type === 'd20' ? ` (Exaustão ${character.exhaustion})` : '';
    const formula = type === 'd20' ? `1d20${sign}${totalMod}` : `${mod}`;

    onRoll(`${label}${penaltyText}`, formula);
  }, [character.exhaustion, onRoll]);

  const handleRest = useCallback((type: 'short' | 'long') => {
    if (!canEdit) return;
    if (type === 'long') {
      updateFields({
        hpCurrent: character.hpMax,
        exhaustion: Math.max(0, character.exhaustion - 1),
        heroicInspiration: false,
        hitDiceCurrent: parseInt(character.hitDiceTotal.split('d')[0]) || character.level,
        spellSlots: character.spellSlots.map(s => ({ ...s, used: 0 }))
      }, true);
    }
  }, [canEdit, character.hpMax, character.exhaustion, character.hitDiceTotal, character.level, character.spellSlots, updateFields]);

  // --- RENDER: HEADER ---
  const renderHeader = () => (
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
            onChange={(v) => updateField('name', v)}
            disabled={!canEdit}
            className="mb-1"
            inputClassName="text-xl font-bold bg-transparent border-none px-0 py-0 focus:ring-0"
            placeholder="Nome do Personagem"
          />
          <div className="text-xs text-zinc-500">
            {character.class} Nível {character.level} • {character.species}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SaveIndicator status={saveStatus} />

        {canEdit && (
          <Tooltip content={isEditing ? "Modo Visualização" : "Modo Edição"}>
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

  // --- RENDER: COMBAT TAB (OPTIMIZED) ---
  const renderCombatTab = () => (
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
                onClick={() => handleRoll('Iniciativa', character.initiative)}
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
    </div>
  );

  // Placeholder for other tabs (keep existing implementation)
  const renderSpellsTab = () => <div className="p-5">Spells Tab (mantém implementação existente)</div>;
  const renderInventoryTab = () => <div className="p-5">Inventory Tab (mantém implementação existente)</div>;
  const renderFeaturesTab = () => <div className="p-5">Features Tab (mantém implementação existente)</div>;
  const renderBioTab = () => <div className="p-5">Bio Tab (mantém implementação existente)</div>;
  const renderHistoryTab = () => <div className="p-5">History Tab (mantém implementação existente)</div>;
  const renderGMNotesTab = () => <div className="p-5">GM Notes Tab (mantém implementação existente)</div>;

  // --- MAIN RENDER ---
  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white">
      {renderHeader()}

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-2 border-b border-zinc-800 overflow-x-auto">
        {[
          { id: 'combat', label: 'Combate', icon: Sword },
          { id: 'spells', label: 'Magias', icon: Zap },
          { id: 'inventory', label: 'Inventário', icon: Backpack },
          { id: 'features', label: 'Características', icon: Award },
          { id: 'bio', label: 'Biografia', icon: User },
          { id: 'history', label: 'Histórico', icon: Clock },
          ...(isGM ? [{ id: 'gmnotes', label: 'Notas GM', icon: Lock }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'combat' && renderCombatTab()}
        {activeTab === 'spells' && renderSpellsTab()}
        {activeTab === 'inventory' && renderInventoryTab()}
        {activeTab === 'features' && renderFeaturesTab()}
        {activeTab === 'bio' && renderBioTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'gmnotes' && renderGMNotesTab()}
      </div>
    </div>
  );
};

// Helper Components
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

const BrainIcon = ({ className }: { className?: string; }) => <Activity className={className} />;
const RabbitIcon = ({ className }: { className?: string; }) => <Wind className={className} />;
