import React, { useState, useCallback, useEffect } from 'react';
import { Character, Attributes, SkillName } from '../../types';
import { SheetCard, SheetHeader } from '../ui/SheetPrimitives';
import {
    Sword, Shield, Zap, Backpack, Dice5, X, Activity, Heart,
    Eye, Crosshair, Share2, Moon, Wind, Skull, Award, Hourglass, User, Lock, Settings, ScrollText, NotebookPen, FileWarning, Clock,
    Sparkles
} from 'lucide-react';
import { SKILLS_DATA } from '../../data/rules';
import { Tooltip } from '../ui/Tooltip';
import { Counter } from '../ui/Counter';
import { useGameSession } from '../../context/GameSessionContext';
import { SaveIndicator, useSaveIndicator } from '../ui/SaveIndicator';
import { OptimizedNumberInput } from '../ui/OptimizedNumberInput';
import { OptimizedTextInput } from '../ui/OptimizedTextInput';
import { useOptimizedCharacterSheet } from './hooks/useOptimizedCharacterSheet';

interface CharacterSheetViewerProps {
    character: Character;
    isGM?: boolean;
    currentUserId?: string;
    onClose: () => void;
    onUpdate: (updates: Partial<Character>) => void;
    onRoll: (label: string, formula: string) => void;
    onShare?: (type: 'item' | 'spell' | 'attack' | 'feature', data: any) => void;
}

// --- UTILS ---
const calcMod = (score: number) => Math.floor((score - 10) / 2);
const fmtMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

export const CharacterSheetViewer: React.FC<CharacterSheetViewerProps> = ({
    character: initialCharacter, onClose, onUpdate: onUpdateProp, onRoll, onShare, isGM = false, currentUserId
}) => {
    const [activeTab, setActiveTab] = useState<'combat' | 'spells' | 'inventory' | 'features' | 'bio' | 'history' | 'gmnotes'>('combat');
    const [openFeatures, setOpenFeatures] = useState<Record<string, boolean>>({});
    const [isEditing, setIsEditing] = useState(false);

    // Save indicator
    const { status: saveStatus, setSaving, setSaved, setError: setSaveError } = useSaveIndicator();

    // Try to get game session context, but don't fail if not available (e.g., in Dashboard)
    let gameSession: any;
    let permissionHelper: any = { can: () => true, isGameMaster: () => isGM };
    try {
        gameSession = useGameSession();
        permissionHelper = gameSession.permissionHelper;
    } catch (e) {
        // Not in GameSessionContext, use default permission (allow all for now)
    }

    // REGRA MILENAR: Use PermissionHelper
    // GM always true, Owner needs 'sheetEdit' perm
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
                // @ts-ignore
                await onUpdateProp(updates, immediate);
                setSaved();
            } catch (err) {
                setSaveError();
            }
        }, [onUpdateProp, setSaving, setSaved, setSaveError]),
        onTogglePrivacy: useCallback(async (fieldName: string) => {
            if (gameSession?.toggleFieldPrivacy) {
                await gameSession.toggleFieldPrivacy(initialCharacter.id, fieldName);
            }
        }, [gameSession, initialCharacter.id])
    });

    // Use optimized update function for all UI interactions
    const onUpdate = updateFields;

    // Cleanup on unmount
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    // --- ACTIONS ---
    const handleRoll = (label: string, mod: number | string, type: 'd20' | 'dmg' = 'd20') => {
        const modifier = typeof mod === 'string' ? parseInt(mod) || 0 : mod;
        const exhaustionPenalty = type === 'd20' ? (character.exhaustion * -2) : 0;
        const totalMod = modifier + exhaustionPenalty;
        const sign = totalMod >= 0 ? '+' : '';
        const penaltyText = character.exhaustion > 0 && type === 'd20' ? ` (Exaustão ${character.exhaustion})` : '';
        const formula = type === 'd20' ? `1d20${sign}${totalMod}` : `${mod}`;

        onRoll(`${label}${penaltyText}`, formula);
    };

    const handleRest = (type: 'short' | 'long') => {
        if (!canEdit) return;
        if (type === 'long') {
            onUpdate({
                hpCurrent: character.hpMax,
                exhaustion: Math.max(0, character.exhaustion - 1),
                heroicInspiration: false,
                hitDiceCurrent: parseInt(character.hitDiceTotal.split('d')[0]) || character.level,
                spellSlots: character.spellSlots.map(s => ({ ...s, used: 0 }))
            });
        }
    };

    // --- RENDER COMPONENTS ---

    // 1. Sidebar (Attributes & Skills)
    const renderSidebar = () => (
        <div className="w-full h-full overflow-y-auto custom-scrollbar p-3 space-y-4 bg-zinc-900/50">
            {/* ATTRIBUTES */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Activity className="w-3 h-3" /> Atributos</h3>
                {(Object.keys(character.attributes) as Array<keyof Attributes>).map(attr => {
                    const score = character.attributes[attr];
                    const mod = calcMod(score);
                    return (
                        <div key={attr as string} className="bg-zinc-950 border border-zinc-800 rounded-lg p-1 flex items-center gap-2 group hover:border-zinc-600 transition-colors">
                            <button
                                className="w-10 h-10 bg-zinc-800 rounded flex flex-col items-center justify-center hover:bg-primary hover:text-white transition-colors shrink-0 border border-zinc-700"
                                onClick={() => handleRoll(attr.toUpperCase(), mod)}
                            >
                                <span className="text-[9px] font-bold uppercase opacity-70 leading-none mb-0.5">{attr}</span>
                                <span className="text-base font-bold leading-none">{fmtMod(mod)}</span>
                            </button>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex justify-between items-baseline">
                                    {isEditing ? (
                                        <OptimizedNumberInput
                                            value={score}
                                            onChange={(val) => updateField('attributes', { ...character.attributes, [attr]: val })}
                                            className="w-16"
                                            showControls={false}
                                        />
                                    ) : (
                                        <span className="text-xs font-bold text-zinc-300">{score}</span>
                                    )}
                                    <button className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 hover:text-zinc-200 transition-colors" onClick={() => handleRoll(`Save ${attr.toUpperCase()}`, mod + character.profBonus)}>Save</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="h-px bg-zinc-800 w-full" />

            {/* SKILLS */}
            <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2"><BrainIcon className="w-3 h-3" /> Perícias</h3>
                {SKILLS_DATA.map(skill => {
                    const attr = character.attributes[skill.attr];
                    const mod = calcMod(attr);
                    const isProf = character.skills.includes(skill.id);
                    const isExpert = character.expertise?.includes(skill.id);
                    const total = mod + (isProf ? character.profBonus : 0) + (isExpert ? character.profBonus : 0);

                    return (
                        <div key={skill.id} className="flex items-center gap-1 group">
                            {isEditing && (
                                <button
                                    onClick={() => {
                                        let newSkills = [...character.skills];
                                        let newExpertise = [...(character.expertise || [])];

                                        if (isExpert) {
                                            newExpertise = newExpertise.filter(s => s !== skill.id);
                                            newSkills = newSkills.filter(s => s !== skill.id);
                                        } else if (isProf) {
                                            newExpertise.push(skill.id);
                                        } else {
                                            newSkills.push(skill.id);
                                        }

                                        updateFields({ skills: newSkills, expertise: newExpertise });
                                    }}
                                    className={`w-3 h-3 rounded-full border ${isExpert ? 'bg-yellow-500 border-yellow-500' : isProf ? 'bg-primary border-primary' : 'border-zinc-600'} hover:opacity-80`}
                                />
                            )}
                            <button
                                onClick={() => handleRoll(skill.name, total)}
                                className="flex-1 flex items-center justify-between px-2 py-1.5 rounded hover:bg-zinc-800 transition-colors text-left"
                            >
                                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                    {!isEditing && <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isExpert ? 'bg-yellow-500' : isProf ? 'bg-primary' : 'bg-zinc-700'}`} />}
                                    <span className={`text-xs truncate ${isProf ? 'text-zinc-200 font-medium' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                        {skill.name}
                                    </span>
                                </div>
                                <span className={`text-xs font-mono shrink-0 ${isProf ? 'text-white' : 'text-zinc-600'}`}>
                                    {fmtMod(total)}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // 2. Main Content Tabs
    const renderCombatTab = () => (
        <div className="p-3 md:p-5 space-y-5 pb-20 md:pb-6">
            {/* VITALS ROW - Responsive Grid */}
            <div className="grid grid-cols-12 gap-3">
                {/* HP Block */}
                <div className="col-span-12 md:col-span-5 bg-zinc-900 border border-zinc-700 rounded-xl p-0 overflow-hidden relative flex flex-col justify-between h-24 md:h-28 group">
                    <div className="absolute inset-0 bg-zinc-950">
                        <div className="h-full bg-green-900/20 transition-all duration-500" style={{ width: `${Math.min(100, (character.hpCurrent / character.hpMax) * 100)}%` }} />
                    </div>
                    <div className="relative z-10 p-3 flex justify-between items-start">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-green-500">
                            <Heart className="w-3 h-3 fill-current" /> Pontos de Vida
                        </div>
                        <div className="text-xs text-zinc-500 font-mono bg-black/40 px-1.5 rounded">
                            Máx: {character.hpMax}
                        </div>
                    </div>
                    <div className="relative z-10 px-3 pb-2 flex items-end gap-2">
                        <OptimizedNumberInput
                            value={character.hpCurrent}
                            onChange={(val) => updateField('hpCurrent', val, { immediate: true })}
                            disabled={!canEdit}
                            className="w-full"
                            inputClassName="bg-transparent text-4xl md:text-5xl font-black text-white w-full outline-none p-0 m-0 leading-none tracking-tighter disabled:opacity-90 border-none focus:ring-0 text-left"
                            showControls={false}
                        />
                        {character.hpTemp > 0 && (
                            <span className="text-lg md:text-xl font-bold text-blue-400 mb-1">+{character.hpTemp}</span>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="col-span-12 md:col-span-7 grid grid-cols-3 gap-2 md:gap-3">
                    {isEditing ? (
                        <>
                            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 flex flex-col items-center justify-center relative">
                                <Shield className="w-4 h-4 text-zinc-500 mb-1" />
                                <OptimizedNumberInput
                                    value={character.armorClass}
                                    onChange={(val) => updateField('armorClass', val)}
                                    className="w-16"
                                    inputClassName="bg-transparent text-center text-xl font-bold text-white border-b border-zinc-700 focus:border-primary outline-none"
                                    showControls={false}
                                />
                                <span className="text-[9px] font-bold uppercase text-zinc-600 mt-1">CA</span>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 flex flex-col items-center justify-center relative">
                                <RabbitIcon className="w-4 h-4 text-zinc-500 mb-1" />
                                <OptimizedNumberInput
                                    value={character.initiative}
                                    onChange={(val) => updateField('initiative', val)}
                                    className="w-16"
                                    inputClassName="bg-transparent text-center text-xl font-bold text-white border-b border-zinc-700 focus:border-primary outline-none"
                                    showControls={false}
                                />
                                <span className="text-[9px] font-bold uppercase text-zinc-600 mt-1">Iniciativa</span>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 flex flex-col items-center justify-center relative">
                                <Wind className="w-4 h-4 text-zinc-500 mb-1" />
                                <OptimizedNumberInput
                                    value={character.speed}
                                    onChange={(val) => updateField('speed', val)}
                                    className="w-16"
                                    inputClassName="bg-transparent text-center text-xl font-bold text-white border-b border-zinc-700 focus:border-primary outline-none"
                                    showControls={false}
                                />
                                <span className="text-[9px] font-bold uppercase text-zinc-600 mt-1">Desloc.</span>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 flex flex-col items-center justify-center relative">
                                <Award className="w-4 h-4 text-zinc-500 mb-1" />
                                <OptimizedNumberInput
                                    value={character.profBonus}
                                    onChange={(val) => updateField('profBonus', val)}
                                    className="w-16"
                                    inputClassName="bg-transparent text-center text-xl font-bold text-white border-b border-zinc-700 focus:border-primary outline-none"
                                    showControls={false}
                                />
                                <span className="text-[9px] font-bold uppercase text-zinc-600 mt-1">Prof.</span>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 flex flex-col items-center justify-center relative">
                                <Eye className="w-4 h-4 text-zinc-500 mb-1" />
                                <OptimizedNumberInput
                                    value={character.passivePerception}
                                    onChange={(val) => updateField('passivePerception', val)}
                                    className="w-16"
                                    inputClassName="bg-transparent text-center text-xl font-bold text-white border-b border-zinc-700 focus:border-primary outline-none"
                                    showControls={false}
                                />
                                <span className="text-[9px] font-bold uppercase text-zinc-600 mt-1">Percepção</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <StatBox label="Classe Armadura" value={character.armorClass} icon={<Shield className="w-4 h-4" />} />
                            <StatBox label="Iniciativa" value={fmtMod(character.initiative)} icon={<RabbitIcon className="w-4 h-4" />} onClick={() => handleRoll('Iniciativa', character.initiative)} highlight />
                            <StatBox label="Deslocamento" value={`${character.speed}m`} icon={<Wind className="w-4 h-4" />} />

                            <StatBox label="Proficiência" value={`+${character.profBonus}`} icon={<Award className="w-4 h-4" />} />
                            <StatBox label="Percepção Pas." value={character.passivePerception} icon={<Eye className="w-4 h-4" />} />
                        </>
                    )}
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-2 flex flex-col items-center justify-center relative">
                        <span className="text-[9px] font-bold uppercase text-zinc-500 mb-1">Inspiração</span>
                        <button
                            onClick={() => updateField('heroicInspiration', !character.heroicInspiration, { immediate: true })}
                            disabled={!canEdit}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${character.heroicInspiration ? 'bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-500/20' : 'bg-zinc-800 border-zinc-600 text-zinc-600 hover:border-zinc-400'}`}
                        >
                            <Dice5 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* RESOURCES ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 flex items-center gap-2"><Skull className="w-3.5 h-3.5" /> Exaustão</span>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono ${character.exhaustion > 0 ? 'text-red-400' : 'text-zinc-600'}`}>-{character.exhaustion * 2} em d20</span>
                        <Counter value={character.exhaustion} onChange={(v) => onUpdate({ exhaustion: v })} max={6} size="sm" disabled={!canEdit} />
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 flex items-center gap-2"><Hourglass className="w-3.5 h-3.5" /> Dados de Vida</span>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500">{character.hitDiceTotal}</span>
                        <Counter value={character.hitDiceCurrent} onChange={(v) => onUpdate({ hitDiceCurrent: v })} max={character.level} size="sm" disabled={!canEdit} />
                    </div>
                </div>
            </div>

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
                                        <button onClick={() => handleRoll(atk.name, atk.atkBonus)} className="flex-1 bg-zinc-800 hover:bg-primary hover:text-white text-zinc-300 py-1.5 rounded flex items-center justify-center gap-2 transition-colors border border-zinc-700 group/btn">
                                            <Crosshair className="w-3.5 h-3.5 text-zinc-500 group-hover/btn:text-white" />
                                            <span className="text-xs font-bold font-mono">{atk.atkBonus}</span>
                                        </button>
                                        <button onClick={() => handleRoll(`${atk.name} Dano`, atk.damage, 'dmg')} className="flex-[2] bg-zinc-800 hover:bg-red-900/50 hover:text-red-200 text-zinc-300 py-1.5 rounded flex items-center justify-center gap-2 transition-colors border border-zinc-700 group/btn">
                                            <Zap className="w-3.5 h-3.5 text-zinc-500 group-hover/btn:text-red-400" />
                                            <span className="text-xs font-bold font-mono truncate">{atk.damage}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {character.attacks.length === 0 && <div className="col-span-full text-center py-6 text-zinc-600 text-xs italic border border-dashed border-zinc-800 rounded-lg">Nenhum ataque configurado.</div>}
                </div>
            </div>
        </div>
    );

    const renderSpellsTab = () => (
        <div className="p-3 md:p-5 space-y-5 pb-20">
            {/* Spell Stats Header */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-zinc-500">Atributo</span>
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
                    <span className="text-[9px] font-bold uppercase text-zinc-500">Ataque</span>
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
                <SheetHeader title="Espaços de Magia" icon={Zap} />
                <div className="flex flex-wrap gap-2">
                    {character.spellSlots.map(slot => (
                        <div key={slot.level} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex flex-col items-center min-w-[60px]">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5">Nível {slot.level}</span>
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
                                            onUpdate({ spellSlots: newSlots });
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
                                <span className="text-xs font-bold text-zinc-400 uppercase">{lvl === 0 ? 'Truques' : `Nível ${lvl}`}</span>
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
                                                    onUpdate({ spells: newSpells });
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

    const renderInventoryTab = () => (
        <div className="p-3 md:p-5 space-y-5 pb-20">
            <div className="flex flex-wrap gap-3">
                <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex justify-around items-center min-w-[200px]">
                    {(Object.keys(character.currency) as Array<keyof typeof character.currency>).map(k => (
                        <div key={k as string} className="flex flex-col items-center">
                            <span className="text-[9px] font-bold uppercase text-zinc-500 mb-1">{k}</span>
                            <OptimizedNumberInput
                                value={character.currency[k]}
                                onChange={(val) => updateField('currency', { ...character.currency, [k]: val })}
                                className="w-12"
                                inputClassName="bg-transparent text-center font-mono font-bold text-white text-sm outline-none border-b border-transparent focus:border-primary focus:bg-white/5 rounded px-0"
                                disabled={!canEdit}
                                showControls={false}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <SheetHeader title="Equipamento" icon={Backpack} />
            <div className="space-y-1">
                {character.inventory.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900 hover:border-zinc-700 transition-all group">
                        <div className="flex items-center gap-3 min-w-0">
                            {isEditing ? (
                                <OptimizedNumberInput
                                    value={item.qty}
                                    onChange={(val) => {
                                        const newInventory = character.inventory.map(i => i.id === item.id ? { ...i, qty: val } : i);
                                        updateFields({ inventory: newInventory });
                                    }}
                                    className="w-10"
                                    inputClassName="bg-zinc-950 text-zinc-300 text-[10px] font-mono px-1 py-0.5 rounded border border-zinc-700 w-10 text-center outline-none focus:border-primary"
                                    showControls={false}
                                />
                            ) : (
                                <div className="bg-zinc-950 text-zinc-500 text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-800 min-w-[24px] text-center">{item.qty}</div>
                            )}
                            <span className="text-sm text-zinc-200 font-medium truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            {item.weight && <span className="text-[10px] text-zinc-600 hidden sm:block">{item.weight}</span>}
                            {onShare && <button onClick={() => onShare('item', item)} className="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Share2 className="w-3.5 h-3.5" /></button>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderFeaturesTab = () => (
        <div className="p-3 md:p-5 space-y-5 pb-20">
            <SheetHeader title="Características e Talentos" icon={Sparkles} />
            <div className="space-y-2">
                {character.features.map(feat => (
                    <div key={feat.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-all group">
                        <div className="flex justify-between items-start mb-1">
                            {isEditing ? (
                                <div className="flex-1 pr-2 space-y-1">
                                    <OptimizedTextInput
                                        value={feat.name}
                                        onChange={(val) => {
                                            const newFeatures = character.features.map(f => f.id === feat.id ? { ...f, name: val } : f);
                                            updateFields({ features: newFeatures });
                                        }}
                                        className="w-full"
                                        inputClassName="bg-zinc-950 text-sm font-bold text-white border border-zinc-700 rounded px-1"
                                        placeholder="Nome da característica"
                                    />
                                    <OptimizedTextInput
                                        value={feat.source}
                                        onChange={(val) => {
                                            const newFeatures = character.features.map(f => f.id === feat.id ? { ...f, source: val } : f);
                                            updateFields({ features: newFeatures });
                                        }}
                                        className="w-full"
                                        inputClassName="bg-zinc-950 text-[10px] text-zinc-500 border border-zinc-700 rounded px-1"
                                        placeholder="Fonte (ex: Raça, Classe)"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <div className="font-bold text-sm text-zinc-200">{feat.name}</div>
                                    <div className="text-[10px] text-zinc-500">{feat.source}</div>
                                </div>
                            )}
                            {onShare && <button onClick={() => onShare('feature', feat)} className="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Share2 className="w-3.5 h-3.5" /></button>}
                        </div>
                        {isEditing ? (
                            <OptimizedTextInput
                                value={feat.description}
                                onChange={(val) => {
                                    const newFeatures = character.features.map(f => f.id === feat.id ? { ...f, description: val } : f);
                                    updateFields({ features: newFeatures });
                                }}
                                className="w-full"
                                inputClassName="bg-zinc-950 text-xs text-zinc-400 border border-zinc-700 rounded px-1 w-full"
                                multiline
                                placeholder="Descrição..."
                            />
                        ) : (
                            <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{feat.description}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderBioTab = () => (
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
                <SheetHeader title="Personalidade" icon={BrainIcon} />
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

    const renderHistoryTab = () => (
        <div className="p-3 md:p-5 space-y-4 pb-20">
            {/* Change History */}
            <div className="space-y-2">
                <SheetHeader title="Histórico de Alterações" icon={Clock} />
                <p className="text-xs text-zinc-500 italic mb-2">Últimas 100 alterações na ficha.</p>
                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {(character.changeHistory && character.changeHistory.length > 0) ? (
                        [...character.changeHistory].reverse().map((entry) => (
                            <div key={entry.id} className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-zinc-300">{entry.userName}</span>
                                    <span className="text-[10px] text-zinc-500">
                                        {new Date(entry.timestamp).toLocaleString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <div className="text-xs text-zinc-400">
                                    <span className="text-zinc-500">Alterou:</span>{' '}
                                    {Object.keys(entry.changes).map((key, idx) => (
                                        <span key={key}>
                                            <span className="text-primary font-mono">{key}</span>
                                            {idx < Object.keys(entry.changes).length - 1 && ', '}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-zinc-600 text-xs italic border border-dashed border-zinc-800 rounded-lg">
                            Nenhuma alteração registrada ainda.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderGMNotesTab = () => (
        <div className="p-3 md:p-5 space-y-6 pb-20">
            {/* GM Notes */}
            <div className="space-y-2">
                <SheetHeader title="Notas do Mestre" icon={FileWarning} />
                <p className="text-xs text-zinc-500 italic mb-2">Estas notas são privadas e visíveis apenas para o Mestre.</p>
                <textarea
                    value={character.gmNotes || ''}
                    onChange={(e) => onUpdate({ gmNotes: e.target.value })}
                    className="w-full bg-zinc-900 text-sm text-zinc-300 border border-zinc-800 rounded-lg p-3 min-h-[200px] focus:border-primary outline-none resize-none"
                    placeholder="Adicione notas privadas sobre este personagem..."
                />
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-white overflow-hidden">
            {/* Header */}
            <div className="bg-zinc-950 border-b border-zinc-800 p-3 md:p-4 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0 relative group">
                        <img src={character.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Settings className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={character.name}
                                    onChange={(e) => onUpdate({ name: e.target.value })}
                                    className="w-full bg-transparent text-lg md:text-xl font-fantasy font-bold text-white leading-none outline-none border-b border-zinc-700 focus:border-primary"
                                    placeholder="Nome do Personagem"
                                />
                            ) : (
                                <h1 className="text-lg md:text-xl font-fantasy font-bold text-white leading-none truncate">{character.name}</h1>
                            )}
                            {!canEdit && <Lock className="w-3 h-3 text-zinc-500" />}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-zinc-400 font-medium uppercase tracking-wider truncate mt-1">
                            {isEditing ? (
                                <div className="flex gap-2 w-full">
                                    <input
                                        type="text"
                                        value={character.species}
                                        onChange={(e) => onUpdate({ species: e.target.value })}
                                        className="bg-transparent text-primary border-b border-zinc-700 focus:border-primary outline-none w-20"
                                        placeholder="Espécie"
                                    />
                                    <span className="hidden sm:inline">•</span>
                                    <input
                                        type="text"
                                        value={character.class}
                                        onChange={(e) => onUpdate({ class: e.target.value })}
                                        className="bg-transparent text-zinc-400 border-b border-zinc-700 focus:border-primary outline-none w-20"
                                        placeholder="Classe"
                                    />
                                    <input
                                        type="number"
                                        value={character.level}
                                        onChange={(e) => onUpdate({ level: parseInt(e.target.value) || 1 })}
                                        className="bg-transparent text-zinc-400 border-b border-zinc-700 focus:border-primary outline-none w-8 text-center"
                                        placeholder="Nvl"
                                    />
                                </div>
                            ) : (
                                <>
                                    <span className="text-primary">{character.species}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{character.class} {character.level}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <SaveIndicator status={saveStatus} />

                    {canEdit && (
                        <>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-primary text-white' : 'hover:bg-zinc-800 text-zinc-500 hover:text-white'}`}
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <div className="w-px h-6 bg-zinc-800 mx-1"></div>
                            <div className="flex bg-zinc-900 rounded-lg border border-zinc-800 p-0.5">
                                <Tooltip content="Descanso Curto"><button onClick={() => handleRest('short')} className="p-2 hover:bg-zinc-800 rounded text-zinc-500 hover:text-primary transition-colors"><Hourglass className="w-4 h-4" /></button></Tooltip>
                                <div className="w-px bg-zinc-800 my-1"></div>
                                <Tooltip content="Descanso Longo"><button onClick={() => handleRest('long')} className="p-2 hover:bg-zinc-800 rounded text-zinc-500 hover:text-primary transition-colors"><Moon className="w-4 h-4" /></button></Tooltip>
                            </div>
                        </>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Layout Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* Sidebar (Desktop) */}
                <div className="hidden md:block w-64 border-r border-zinc-800 shrink-0 bg-zinc-950">
                    {renderSidebar()}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-zinc-900 relative">

                    {/* Tabs */}
                    <div className="flex border-b border-zinc-800 bg-zinc-950/95 backdrop-blur z-10 overflow-x-auto hide-scrollbar shrink-0">
                        {[
                            { id: 'combat', label: 'Combate', icon: Sword },
                            { id: 'spells', label: 'Magias', icon: Zap },
                            { id: 'inventory', label: 'Items', icon: Backpack },
                            { id: 'features', label: 'Feitos', icon: Award },
                            { id: 'bio', label: 'Bio', icon: User },
                            { id: 'history', label: 'Histórico', icon: Clock },
                            ...(isGM ? [{ id: 'gmnotes', label: 'GM', icon: FileWarning }] : []),
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex-1 min-w-[80px] ${activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <tab.icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Scroll Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
                        {activeTab === 'combat' && renderCombatTab()}
                        {activeTab === 'spells' && renderSpellsTab()}
                        {activeTab === 'inventory' && renderInventoryTab()}
                        {activeTab === 'features' && renderFeaturesTab()}
                        {activeTab === 'bio' && renderBioTab()}
                        {activeTab === 'history' && renderHistoryTab()}
                        {activeTab === 'gmnotes' && isGM && renderGMNotesTab()}
                    </div>
                </div>
            </div>
        </div>
    );

};

const StatBox = ({ label, value, icon, onClick, highlight }: { label: string, value: string | number, icon: React.ReactNode, onClick?: () => void, highlight?: boolean; }) => (
    <div
        onClick={onClick}
        className={`bg-zinc-900 border border-zinc-700 rounded-xl p-2 flex flex-col items-center justify-center relative overflow-hidden group ${onClick ? 'cursor-pointer hover:border-primary/50 hover:bg-zinc-800' : ''}`}
    >
        {highlight && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}
        <div className="text-zinc-500 mb-0.5 group-hover:text-primary transition-colors">{icon}</div>
        <span className="text-xl md:text-2xl font-bold text-white leading-none">{value}</span>
        <span className="text-[9px] font-bold uppercase text-zinc-600 mt-1 truncate max-w-full">{label}</span>
    </div>
);

const BrainIcon = ({ className }: { className?: string; }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" /></svg>;
const RabbitIcon = ({ className }: { className?: string; }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M13 19a4 4 0 0 0-8 0" /><path d="M13 19c0-6-3-7-3-12" /><path d="M5 19c0-6 3-7 3-12" /><path d="M9 13h6" /><path d="M18 13c2.5 0 4-2.5 4-5 0-3-2-3-2-3s-1 2-3 2" /></svg>;
