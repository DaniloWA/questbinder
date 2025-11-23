
import React, { useState } from 'react';
import { Token, Condition, Character } from '../../types';
import { Heart, Shield, Zap, Eye, EyeOff, Droplets, Skull, AlertTriangle, Wind, ScrollText, Activity, Hand, Flame, Ghost, Anchor, EarOff, Lock, Moon, Plus } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { STATUS_RULES, StatusDefinition } from '../../data/rules';
import { useGameSession } from '../../context/GameSessionContext';

interface TokenHoverCardProps {
    token: Token;
    character?: Character | null; // Linked character data for PCs
    position: { x: number, y: number; };
    isGM: boolean;
    currentUserId?: string;
    onUpdate: (id: string, data: Partial<Token>) => void;
    onCharacterUpdate?: (id: string, data: Partial<Character>) => void; // Callback for character updates
    onOpenSheet?: (token: Token) => void;
    onRoll?: (formula: string, label: string) => void; // Callback for quick rolls
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

// Map condition IDs to Lucide Icons
const ICON_MAP: Record<string, React.ReactNode> = {
    'dead': <Skull className="w-3.5 h-3.5" />,
    'bloodied': <Droplets className="w-3.5 h-3.5" />,
    'stunned': <Zap className="w-3.5 h-3.5" />,
    'shielded': <Shield className="w-3.5 h-3.5" />,
    'alert': <AlertTriangle className="w-3.5 h-3.5" />,
    'frightened': <Ghost className="w-3.5 h-3.5" />,
    'grappled': <Hand className="w-3.5 h-3.5" />,
    'prone': <Activity className="w-3.5 h-3.5 transform rotate-90" />,
    'blinded': <EyeOff className="w-3.5 h-3.5" />,
    'charmed': <Heart className="w-3.5 h-3.5" />,
    'poisoned': <Skull className="w-3.5 h-3.5 text-green-500" />,
    'restrained': <Anchor className="w-3.5 h-3.5" />,
    'incapacitated': <Shield className="w-3.5 h-3.5 opacity-50" />,
    'unconscious': <Moon className="w-3.5 h-3.5" />,
    'invisible': <Ghost className="w-3.5 h-3.5 opacity-50" />,
    'paralyzed': <Zap className="w-3.5 h-3.5 text-yellow-500" />,
    'petrified': <Lock className="w-3.5 h-3.5" />,
    'deafened': <EarOff className="w-3.5 h-3.5" />,
    'exhausted': <Activity className="w-3.5 h-3.5 text-orange-500" />,
    'burning': <Flame className="w-3.5 h-3.5 text-orange-500" />,
    'bleeding': <Droplets className="w-3.5 h-3.5 text-red-600" />,
};

const getDefaultStyle = (id: string) => {
    const map: Record<string, string> = {
        'dead': 'bg-zinc-800 text-zinc-400 border-zinc-700',
        'bloodied': 'bg-red-950/30 text-red-400 border-red-900/50',
        'poisoned': 'bg-green-950/30 text-green-400 border-green-900/50',
        'burning': 'bg-orange-950/30 text-orange-400 border-orange-900/50',
        'stunned': 'bg-yellow-950/30 text-yellow-400 border-yellow-900/50',
        'default': 'bg-zinc-900 text-zinc-300 border-zinc-700'
    };
    return map[id] || map['default'];
};

// Helper to calculate modifier
const getMod = (score: number = 10) => Math.floor((score - 10) / 2);
const fmtMod = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export const TokenHoverCard: React.FC<TokenHoverCardProps> = ({
    token, character, position, isGM, currentUserId,
    onUpdate, onCharacterUpdate, onOpenSheet, onRoll, onMouseEnter, onMouseLeave
}) => {

    const { sendChatMessage } = useGameSession();
    const [isAdding, setIsAdding] = useState(false);

    const style: React.CSSProperties = {
        position: 'fixed', // Fixed ensures smooth movement relative to viewport without jitter from parent scaling
        left: position.x,
        top: position.y - 10, // 10px Gap above the token
        transform: 'translate(-50%, -100%)', // Center horizontally, position above
        zIndex: 5000, // Ensure it's above everything on the map
    };

    // Determine effective stats (PC vs NPC/Token)
    // If character is linked, use character HP/MP. Otherwise use token bars.
    const hp = character ? { value: character.hpCurrent, max: character.hpMax, visible: true } : token.bars?.bar1;
    const mp = character ? { value: character.manaCurrent, max: character.manaMax, visible: true } : token.bars?.bar2;
    const isController = token.ownerId === currentUserId || token.controlledBy?.includes(currentUserId || '');
    const canControl = isGM || isController;

    // Stats Resolution Priority: Linked Character > Token Stats (NPC) > Default
    const stats = {
        ac: character?.armorClass ?? token.stats?.ac ?? 10,
        speed: character?.speed ? `${character.speed}m` : token.stats?.speed ?? (token.speed ? `${token.speed}m` : '9m'),
        pp: character?.passivePerception ?? (10 + getMod(token.stats?.attributes?.wis)),
        attributes: character?.attributes ?? token.stats?.attributes ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, cou: 10 }
    };

    const adjustBar = (e: React.MouseEvent, barKey: 'bar1' | 'bar2', amount: number) => {
        e.stopPropagation(); // Prevent map click

        // If linked to character, update character stats instead
        if (character && onCharacterUpdate) {
            if (barKey === 'bar1') {
                const current = character.hpCurrent;
                const max = character.hpMax;
                const newValue = Math.max(0, Math.min(max, current + amount));
                onCharacterUpdate(character.id, { hpCurrent: newValue });
            } else if (barKey === 'bar2') {
                const current = character.manaCurrent;
                const max = character.manaMax;
                const newValue = Math.max(0, Math.min(max, current + amount));
                onCharacterUpdate(character.id, { manaCurrent: newValue });
            }
            return;
        }

        const bar = token.bars?.[barKey];
        if (!bar) return;

        const current = bar.value;
        const max = bar.max;
        const newValue = Math.max(0, Math.min(max, current + amount));

        const updates: Partial<Token> = {
            bars: {
                ...token.bars,
                [barKey]: { ...bar, value: newValue }
            }
        };

        // Auto-manage dead/bloodied visual states ONLY for HP (bar1)
        if (barKey === 'bar1') {
            let newConditions: Condition[] = token.conditions || [];

            if (newValue === 0 && !newConditions.includes('dead')) newConditions = [...newConditions, 'dead'];
            else if (newValue > 0 && newConditions.includes('dead')) newConditions = newConditions.filter(c => c !== 'dead');

            if (newValue <= max / 2 && newValue > 0 && !newConditions.includes('bloodied')) newConditions = [...newConditions, 'bloodied'];
            else if (newValue > max / 2 && newConditions.includes('bloodied')) newConditions = newConditions.filter(c => c !== 'bloodied');

            updates.conditions = newConditions;
        }

        onUpdate(token.id, updates);
    };

    const toggleCondition = (e: React.MouseEvent, conditionId: Condition) => {
        e.stopPropagation(); // Prevent map click
        const current = token.conditions || [];
        const def = STATUS_RULES[conditionId];
        const next = current.includes(conditionId) ? current.filter(c => c !== conditionId) : [...current, conditionId];

        onUpdate(token.id, { conditions: next });

        // Chat Message on ADD only
        if (!current.includes(conditionId) && def) {
            const markdown = `**${def.name}**\n\n${def.effects.map(e => `- ${e}`).join('\n')}\n\n*Duração: ${def.duration}*`;
            sendChatMessage(
                `Aplicou **${def.name}** em ${token.name}.`,
                'system',
                undefined,
                {
                    type: 'compendium',
                    label: def.name,
                    compendiumCategory: 'sections',
                    contentMarkdown: markdown
                }
            );
        }
        setIsAdding(false);
    };

    const shareCondition = (e: React.MouseEvent, conditionId: Condition) => {
        e.stopPropagation();
        const def = STATUS_RULES[conditionId];
        if (def) {
            const markdown = `**${def.name}**\n\n${def.effects.map(e => `- ${e}`).join('\n')}\n\n*Duração: ${def.duration}*`;
            sendChatMessage(
                `Compartilhou a condição **${def.name}**.`,
                'system',
                undefined,
                {
                    type: 'compendium',
                    label: def.name,
                    compendiumCategory: 'sections',
                    contentMarkdown: markdown
                }
            );
        }
    };

    const handleAttributeRoll = (e: React.MouseEvent, attr: string, score: number) => {
        e.stopPropagation(); // Prevent map click
        if (!onRoll) return;
        const mod = getMod(score);
        onRoll(`1d20${fmtMod(mod)}`, `Teste de ${attr.toUpperCase()}`);
    };

    // Helper to render tooltip content
    const renderConditionTooltip = (def: StatusDefinition) => (
        <div className="space-y-2 max-w-[200px]">
            <div className="font-bold border-b border-white/10 pb-1 mb-1">{def.name}</div>
            <ul className="list-disc list-inside space-y-1">
                {def.effects.map((eff, i) => <li key={i} className="text-zinc-300 leading-snug">{eff}</li>)}
            </ul>
            {def.duration && (
                <div className="text-[10px] text-zinc-500 italic mt-2 border-t border-white/5 pt-1">
                    Duração: {def.duration}
                </div>
            )}
            <div className="text-[9px] text-primary mt-1 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Clique para compartilhar
            </div>
        </div>
    );

    return (
        <div
            className="w-[320px] bg-zinc-950/95 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl overflow-visible flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 pointer-events-auto ring-1 ring-white/10"
            style={style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={() => { setIsAdding(false); onMouseLeave(); }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* HEADER */}
            <div className="relative bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-b border-white/10 p-3 flex items-center gap-3 rounded-t-xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />

                <div className="relative z-10 w-10 h-10 rounded-lg border-2 border-zinc-600 bg-zinc-800 overflow-hidden shrink-0 shadow-lg">
                    {token.displayMode === 'text' ? (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: token.textDetails?.backgroundColor }}>
                            <span className="font-bold text-sm" style={{ color: token.textDetails?.textColor }}>{token.textDetails?.text || '?'}</span>
                        </div>
                    ) : (
                        token.imgUrl ? (
                            <img src={token.imgUrl} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                                <Ghost className="w-6 h-6" />
                            </div>
                        )
                    )}
                </div>

                <div className="relative z-10 min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                        <div className="min-w-0">
                            <h4 className="font-bold text-sm text-white truncate leading-tight font-fantasy tracking-wide">{token.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[9px] px-1.5 rounded-sm uppercase font-bold leading-none py-0.5 ${token.type === 'pc' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                                    {token.type === 'pc' ? 'Herói' : 'Criatura'}
                                </span>
                                {stats.pp > 0 && canControl && (
                                    <span className="text-[9px] text-zinc-400 flex items-center gap-1" title="Percepção Passiva">
                                        <Eye className="w-2.5 h-2.5" /> PP {stats.pp}
                                    </span>
                                )}
                            </div>
                        </div>

                        {isGM && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onUpdate(token.id, { isVisibleToPlayers: !token.isVisibleToPlayers }); }}
                                className={`p-1.5 rounded-md transition-all border ${!token.isVisibleToPlayers ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'}`}
                                title={token.isVisibleToPlayers ? "Token Visível" : "Token Oculto"}
                            >
                                {token.isVisibleToPlayers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-3 space-y-3">

                {/* BARS SECTION */}
                <div className="space-y-3">
                    {/* HP BAR */}
                    {(canControl || (hp && hp.visible)) && hp && hp.max > 0 && (
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500 px-0.5">
                                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500 fill-current" /> Vida</span>
                                <div className="flex items-center gap-1">
                                    <span className={`text-sm font-black ${hp.value < hp.max / 2 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{hp.value}</span>
                                    <span className="text-[10px] text-zinc-600">/ {hp.max}</span>
                                </div>
                            </div>

                            <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative shadow-inner">
                                <div
                                    className={`h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)] ${hp.value < hp.max / 4 ? 'bg-red-600' : hp.value < hp.max / 2 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(100, (hp.value / hp.max) * 100)}%` }}
                                ></div>
                            </div>

                            {/* HP CONTROLS (Owner/GM Only) */}
                            {canControl && (
                                <div className="grid grid-cols-6 gap-1 pt-0.5">
                                    <button onClick={(e) => adjustBar(e, 'bar1', -5)} className="col-span-1 bg-red-950/40 hover:bg-red-900/60 border border-red-900/30 hover:border-red-700 rounded text-[10px] font-bold text-red-400 py-1 flex items-center justify-center">-5</button>
                                    <button onClick={(e) => adjustBar(e, 'bar1', -1)} className="col-span-2 bg-red-950/40 hover:bg-red-900/60 border border-red-900/30 hover:border-red-700 rounded text-[10px] font-bold text-red-400 py-1 flex items-center justify-center">-1</button>
                                    <button onClick={(e) => adjustBar(e, 'bar1', 1)} className="col-span-2 bg-green-950/40 hover:bg-green-900/60 border border-green-900/30 hover:border-green-700 rounded text-[10px] font-bold text-green-400 py-1 flex items-center justify-center">+1</button>
                                    <button onClick={(e) => adjustBar(e, 'bar1', 5)} className="col-span-1 bg-green-950/40 hover:bg-green-900/60 border border-green-900/30 hover:border-green-700 rounded text-[10px] font-bold text-green-400 py-1 flex items-center justify-center">+5</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* RESOURCE BAR (MP) */}
                    {(canControl || (mp && mp.visible)) && mp && mp.max > 0 && (
                        <div className="space-y-1 pt-1 border-t border-zinc-800/50">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500 px-0.5">
                                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-blue-500 fill-current" /> Recurso</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-black text-blue-200">{mp.value}</span>
                                    <span className="text-[10px] text-zinc-600">/ {mp.max}</span>
                                </div>
                            </div>

                            <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative shadow-inner">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                                    style={{ width: `${Math.min(100, (mp.value / mp.max) * 100)}%` }}
                                ></div>
                            </div>

                            {/* MP CONTROLS (Owner/GM Only) */}
                            {canControl && (
                                <div className="grid grid-cols-4 gap-1 pt-0.5">
                                    <button onClick={(e) => adjustBar(e, 'bar2', -1)} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded text-[10px] font-bold text-zinc-300 py-1 flex items-center justify-center">-1</button>
                                    <button onClick={(e) => adjustBar(e, 'bar2', 1)} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded text-[10px] font-bold text-zinc-300 py-1 flex items-center justify-center">+1</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ACTIVE CONDITIONS (Visible to All) */}
                {(token.conditions?.length > 0 || canControl) && (
                    <div className="flex flex-wrap gap-1.5 pt-1 items-center relative border-t border-zinc-800/50 mt-1">
                        {token.conditions && token.conditions.map(cId => {
                            const def = STATUS_RULES[cId] || { id: cId, name: cId, effects: ['Efeito desconhecido.'], duration: '' };
                            const styleClass = getDefaultStyle(cId);
                            const icon = ICON_MAP[cId] || <Activity className="w-3.5 h-3.5" />;

                            return (
                                <Tooltip key={cId} content={renderConditionTooltip(def)}>
                                    <button
                                        onClick={(e) => shareCondition(e, cId)}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase border shadow-sm hover:opacity-80 transition-opacity ${styleClass}`}
                                    >
                                        {icon}
                                        <span>{def.name}</span>
                                    </button>
                                </Tooltip>
                            );
                        })}

                        {/* Add Condition Button (Owner/GM Only) */}
                        {canControl && (
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsAdding(!isAdding); }}
                                    className={`w-6 h-6 flex items-center justify-center rounded-full border border-dashed border-zinc-600 text-zinc-500 hover:text-white hover:border-white hover:bg-zinc-800 transition-colors ${isAdding ? 'bg-zinc-800 text-white' : ''}`}
                                    title="Adicionar Condição"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>

                                {/* POPUP LIST */}
                                {isAdding && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl p-1.5 max-h-60 overflow-y-auto custom-scrollbar z-50 animate-in fade-in zoom-in-95">
                                        <div className="px-2 py-1 mb-1 text-[9px] font-bold uppercase text-zinc-500">Adicionar Condição</div>
                                        {Object.entries(STATUS_RULES).map(([key, rule]) => {
                                            if (token.conditions?.includes(key)) return null;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={(e) => toggleCondition(e, key)}
                                                    className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:bg-primary/20 hover:text-white rounded transition-colors flex items-center gap-2"
                                                >
                                                    {ICON_MAP[key]} <span>{rule.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* QUICK STATS ROW */}
                <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                    <div className="flex-1 flex flex-col items-center justify-center p-1.5 border-r border-zinc-800/50 last:border-0">
                        <span className="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">CA</span>
                        <div className="flex items-center gap-1 text-blue-300 font-bold text-xs">
                            <Shield className="w-3 h-3" /> {stats.ac}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-1.5 border-r border-zinc-800/50 last:border-0">
                        <span className="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">Desl.</span>
                        <div className="flex items-center gap-1 text-green-300 font-bold text-xs">
                            <Wind className="w-3 h-3" /> {stats.speed}
                        </div>
                    </div>
                    {token.linkedId && onOpenSheet && (
                        <div className="flex-1 flex items-center justify-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); onOpenSheet(token); }}
                                className="w-full h-full flex flex-col items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors group"
                            >
                                <ScrollText className="w-3.5 h-3.5 mb-0.5 group-hover:text-primary" />
                                <span className="text-[9px] uppercase font-bold">Ficha</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* ATTRIBUTE ROLLERS (Grid) - Owner/GM Only */}
                {canControl && (
                    <div className="grid grid-cols-3 gap-1.5">
                        {(Object.entries(stats.attributes) as [string, number][]).slice(0, 6).map(([key, val]) => (
                            <Tooltip key={key} content={`Rolar Teste de ${key.toUpperCase()} (${fmtMod(getMod(val))})`}>
                                <button
                                    onClick={(e) => handleAttributeRoll(e, key, val)}
                                    className="flex items-center justify-between bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded px-2 py-1 transition-all group active:bg-zinc-700"
                                >
                                    <span className="text-[9px] font-bold uppercase text-zinc-500 group-hover:text-primary transition-colors">{key.substring(0, 3)}</span>
                                    <span className="text-[10px] font-mono font-bold text-zinc-300 group-hover:text-white">{fmtMod(getMod(val))}</span>
                                </button>
                            </Tooltip>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
