
import React, { useState, useEffect, useRef } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { Character, Attributes } from '../../types';
import { DiceRoller, DiceRollerHandle } from './DiceRoller';
import { DraggableWindow } from '../ui/DraggableWindow';
import { Dices, Sword, Brain, Crosshair, Skull, User, Shield, Activity, Zap, Backpack } from 'lucide-react';
import { SKILLS_DATA } from '../../data/rules';
import { RollResult } from '../../utils/dice';

// Helpers
const getMod = (score: number) => Math.floor((score - 10) / 2);
const fmtMod = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

interface SmartDiceRollerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SmartDiceRoller: React.FC<SmartDiceRollerProps> = ({ isOpen, onClose }) => {
    const { selectedTokenIds, scenes, activeSceneId, campaignCharacters, broadcastRoll, permissionHelper } = useGameSession();
    const [activeTab, setActiveTab] = useState<'manual' | 'attributes' | 'combat' | 'skills' | 'inventory'>('manual');
    const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);

    const rollerRef = useRef<DiceRollerHandle>(null);

    // REGRA MILENAR: Use PermissionHelper
    const canRoll = permissionHelper.canAsGMOr('diceRolling');

    // Auto-detect character from selection
    useEffect(() => {
        if (selectedTokenIds.length === 1) {
            const scene = scenes.find(s => s.id === activeSceneId);
            const token = scene?.tokens.find(t => t.id === selectedTokenIds[0]);
            if (token && token.linkedId) {
                const char = campaignCharacters.find(c => c.id === token.linkedId);
                if (char) {
                    setCurrentCharacter(char);
                }
            } else {
                setCurrentCharacter(null);
            }
        } else if (selectedTokenIds.length === 0) {
            // Optional: setCurrentCharacter(null); if we want to clear it
        }
    }, [selectedTokenIds, scenes, activeSceneId, campaignCharacters]);

    const handleQuickRoll = (formula: string, label: string) => {
        if (!canRoll) {
            console.warn('[SmartDiceRoller] Roll denied - no permission');
            return;
        }
        // Switch to visual roller and trigger roll
        setActiveTab('manual');
        setTimeout(() => {
            rollerRef.current?.roll(formula, label);
        }, 10);
    };

    const handleRollComplete = (result: RollResult) => {
        broadcastRoll(result);
    };

    const renderCharacterHeader = () => {
        if (!currentCharacter) return (
            <div className="shrink-0 bg-zinc-950 border-b border-zinc-800 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Dices className="w-6 h-6 text-zinc-600" />
                </div>
                <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Mesa Livre</div>
                    <div className="font-bold text-zinc-300 text-sm">Nenhum Herói Selecionado</div>
                </div>
            </div>
        );

        return (
            <div className="shrink-0 bg-zinc-950 border-b border-zinc-800 p-3 flex items-center gap-3 transition-all animate-in slide-in-from-top-2">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0 relative group">
                    <img src={currentCharacter.avatarUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl"></div>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3" /> Personagem Ativo
                    </div>
                    <div className="font-bold text-white text-base truncate">{currentCharacter.name}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-900 px-1.5 rounded border border-zinc-800">
                            <Shield className="w-3 h-3" /> CA {currentCharacter.armorClass}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-900 px-1.5 rounded border border-zinc-800">
                            <Activity className="w-3 h-3" /> HP {currentCharacter.hpCurrent}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderAttributesTab = () => {
        if (!currentCharacter) return null;

        const attrKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

        return (
            <div className="p-4 space-y-6 min-h-full bg-zinc-900/20">
                <div className="space-y-2">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Testes de Atributo
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {attrKeys.map((attr) => {
                            const score = currentCharacter.attributes[attr];
                            const mod = getMod(score);
                            return (
                                <button
                                    key={attr}
                                    onClick={() => handleQuickRoll(`1d20${fmtMod(mod)}`, `Teste de ${attr.toUpperCase()}`)}
                                    className="flex flex-col items-center bg-zinc-900 border border-zinc-800 rounded-lg p-2 hover:border-primary/50 hover:bg-zinc-800 transition-all active:scale-95 group"
                                >
                                    <span className="text-[10px] font-bold uppercase text-zinc-500 group-hover:text-primary transition-colors">{attr}</span>
                                    <span className="text-lg font-black text-white">{fmtMod(mod)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-px bg-zinc-800 w-full" />

                <div className="space-y-2">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-2">
                        <Shield className="w-3 h-3" /> Salvaguardas (Resistência)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {attrKeys.map((attr) => {
                            const mod = getMod(currentCharacter.attributes[attr]);
                            return (
                                <button
                                    key={`save-${attr}`}
                                    onClick={() => handleQuickRoll(`1d20${fmtMod(mod)}`, `Salvaguarda de ${attr.toUpperCase()}`)}
                                    className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 hover:border-green-500/50 transition-all group"
                                >
                                    <span className="text-xs font-bold uppercase text-zinc-400">{attr} Save</span>
                                    <span className="text-sm font-bold text-white">{fmtMod(mod)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderCombatTab = () => {
        if (!currentCharacter) return null;
        return (
            <div className="p-4 space-y-6 min-h-full bg-zinc-900/20">
                {/* Attacks */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
                        <Sword className="w-3 h-3" /> Ataques Físicos
                    </div>
                    {currentCharacter.attacks.length === 0 && <p className="text-zinc-600 text-xs text-center py-4 bg-zinc-900/30 rounded-lg border border-dashed border-zinc-800">Nenhum ataque registrado.</p>}
                    {currentCharacter.attacks.map(atk => (
                        <div key={atk.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 hover:border-zinc-600 shadow-sm transition-all group">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-sm text-zinc-200">{atk.name}</span>
                                <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{atk.range}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleQuickRoll(`1d20${atk.atkBonus}`, `Ataque: ${atk.name}`)}
                                    className="flex-1 bg-zinc-900 hover:bg-primary hover:text-white text-zinc-300 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-zinc-800"
                                >
                                    <Crosshair className="w-3.5 h-3.5" /> {atk.atkBonus}
                                </button>
                                <button
                                    onClick={() => handleQuickRoll(atk.damage, `Dano: ${atk.name}`)}
                                    className="flex-1 bg-zinc-900 hover:bg-red-900/50 hover:text-red-200 text-zinc-300 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-zinc-800"
                                >
                                    <Skull className="w-3.5 h-3.5" /> {atk.damage}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="h-px bg-zinc-800 w-full" />

                {/* Spells */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            <Zap className="w-3 h-3" /> Grimório
                        </div>
                        <div className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                            CD {currentCharacter.spellInfo.saveDc} • ATK +{currentCharacter.spellInfo.atkBonus}
                        </div>
                    </div>

                    <button
                        onClick={() => handleQuickRoll(`1d20+${currentCharacter.spellInfo.atkBonus}`, `Ataque Mágico (${currentCharacter.spellInfo.ability})`)}
                        className="w-full py-2 bg-purple-900/20 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-500 hover:text-white transition-all mb-2"
                    >
                        Rolar Ataque Mágico Genérico
                    </button>

                    {currentCharacter.spells.length === 0 && <p className="text-zinc-600 text-xs text-center py-4 bg-zinc-900/30 rounded-lg border border-dashed border-zinc-800">Nenhuma magia preparada.</p>}

                    <div className="grid grid-cols-1 gap-2">
                        {currentCharacter.spells.map(spell => (
                            <div key={spell.id} className="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-zinc-300">{spell.name}</span>
                                    <span className="text-[9px] text-zinc-500">{spell.level === 0 ? 'Truque' : `Nível ${spell.level}`} • {spell.school}</span>
                                </div>
                                <button
                                    onClick={() => handleQuickRoll(`1d20+${currentCharacter.spellInfo.atkBonus}`, `Conjurar: ${spell.name}`)}
                                    className="p-1.5 bg-zinc-800 hover:bg-purple-500 text-zinc-400 hover:text-white rounded transition-colors"
                                >
                                    <Zap className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderSkillsTab = () => {
        if (!currentCharacter) return null;
        return (
            <div className="p-2 space-y-1 min-h-full bg-zinc-900/20">
                {SKILLS_DATA.map(skill => {
                    const mod = getMod(currentCharacter.attributes[skill.attr]);
                    const isProf = currentCharacter.skills.includes(skill.id);
                    const total = mod + (isProf ? currentCharacter.profBonus : 0);
                    const sign = total >= 0 ? '+' : '';

                    return (
                        <button
                            key={skill.id}
                            onClick={() => handleQuickRoll(`1d20${sign}${total}`, skill.name)}
                            className={`
                            flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-800 transition-all text-sm group cursor-pointer w-full text-left border border-transparent hover:border-zinc-700
                            ${isProf ? 'bg-zinc-900/50' : ''}
                        `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${isProf ? 'bg-primary shadow-[0_0_8px_rgba(124,58,237,0.8)]' : 'bg-zinc-800'}`}></div>
                                <span className={`text-zinc-400 group-hover:text-zinc-200 ${isProf ? 'font-bold text-zinc-200' : ''}`}>{skill.name}</span>
                            </div>
                            <span className="font-mono text-zinc-500 group-hover:text-white font-bold text-xs">{fmtMod(total)}</span>
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderInventoryTab = () => {
        if (!currentCharacter) return null;
        return (
            <div className="p-4 space-y-4 min-h-full bg-zinc-900/20">
                <div className="space-y-2">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-2">
                        <Backpack className="w-3 h-3" /> Itens
                    </div>
                    {currentCharacter.inventory.length === 0 && <p className="text-zinc-600 text-xs text-center">Mochila vazia.</p>}
                    {currentCharacter.inventory.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-800">{item.qty}x</span>
                                <span className="text-sm text-zinc-300">{item.name}</span>
                            </div>
                            <button
                                onClick={() => handleQuickRoll('1d20', `Usar Item: ${item.name}`)}
                                className="text-[10px] font-bold uppercase text-zinc-500 hover:text-white transition-colors"
                            >
                                Usar
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-xs italic gap-4 opacity-50 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                <User className="w-10 h-10" />
            </div>
            <p>Selecione um token no mapa para acessar ações rápidas.</p>
        </div>
    );

    const minimizedIcon = (
        <div className="w-16 h-16 bg-zinc-950/90 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.3)] flex items-center justify-center text-primary hover:scale-110 hover:border-primary transition-all cursor-pointer relative group ring-1 ring-white/10">
            <Dices className="w-8 h-8" />
            {currentCharacter && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-lg overflow-hidden border-2 border-zinc-950 shadow-md">
                    <img src={currentCharacter.avatarUrl} className="w-full h-full object-cover" />
                </div>
            )}
        </div>
    );

    return (
        <DraggableWindow
            isOpen={isOpen}
            onClose={onClose}
            title="Mesa de Dados"
            icon={<Dices className="w-4 h-4 text-primary" />}
            initialPosition={{ x: Math.max(20, window.innerWidth - 450), y: 80 }}
            initialSize={{ w: Math.min(400, window.innerWidth - 40), h: Math.min(700, window.innerHeight - 100) }}
            minimizedContent={minimizedIcon}
            className="border-zinc-700/50 shadow-2xl bg-zinc-950"
        >
            <div className="flex flex-col h-full">

                {/* Character Header */}
                {renderCharacterHeader()}

                {/* Navigation Tabs */}
                <div className="flex border-b border-zinc-800 bg-zinc-950 shrink-0 overflow-x-auto hide-scrollbar">
                    {[
                        { id: 'manual', icon: <Dices className="w-3.5 h-3.5" />, label: 'Mesa' },
                        { id: 'attributes', icon: <Activity className="w-3.5 h-3.5" />, label: 'Atrib' },
                        { id: 'combat', icon: <Sword className="w-3.5 h-3.5" />, label: 'Combate' },
                        { id: 'skills', icon: <Brain className="w-3.5 h-3.5" />, label: 'Perícias' },
                        { id: 'inventory', icon: <Backpack className="w-3.5 h-3.5" />, label: 'Itens' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                            flex-1 py-3 min-w-[70px] text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 relative
                            ${activeTab === tab.id ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}
                        `}
                        >
                            {tab.icon} {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_-2px_8px_rgba(124,58,237,0.8)]"></div>}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden relative bg-zinc-950">
                    {/* Manual Roller is kept mounted but hidden if inactive to preserve state/history */}
                    <div className={`absolute inset-0 z-10 flex flex-col ${activeTab === 'manual' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                        <DiceRoller ref={rollerRef} onRollComplete={handleRollComplete} className="h-full" />
                    </div>

                    {/* Other tabs are conditional renders */}
                    {activeTab !== 'manual' && !currentCharacter && renderEmptyState()}

                    {activeTab === 'attributes' && (
                        <div className="absolute inset-0 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                            {renderAttributesTab()}
                        </div>
                    )}

                    {activeTab === 'combat' && (
                        <div className="absolute inset-0 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                            {renderCombatTab()}
                        </div>
                    )}

                    {activeTab === 'skills' && (
                        <div className="absolute inset-0 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                            {renderSkillsTab()}
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="absolute inset-0 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                            {renderInventoryTab()}
                        </div>
                    )}
                </div>
            </div>
        </DraggableWindow>
    );
};
