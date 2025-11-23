
import React, { useState, useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import { diceEngine, RollResult, RollMode, RollVisibility } from '../../utils/dice';
import { Eraser, Dices, ArrowUpCircle, ArrowDownCircle, Plus, Minus, Eye, EyeOff, Hash } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

// --- TYPES ---
export interface DiceRollerHandle {
    roll: (formula: string, label?: string) => void;
    reset: () => void;
}

interface DiceRollerProps {
    onRollComplete?: (result: RollResult) => void;
    className?: string;
}

// --- ASSETS (SVG Dice Icons) ---
const DieIcon = ({ faces, className = "", label = true, value }: { faces: number, className?: string, label?: boolean, value?: number }) => {
    // Paths for polyhedrons
    const paths: Record<number, string> = {
        4: "M12 2L22 22H2L12 2Z",
        6: "M4 4H20V20H4V4Z",
        8: "M12 2L22 12L12 22L2 12L12 2Z",
        10: "M12 2L20 10L12 22L4 10L12 2Z",
        12: "M12 2L21.5 9L18 19.5H6L2.5 9L12 2Z",
        20: "M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z",
        100: "M12 2A10 10 0 1 1 12 22A10 10 0 1 1 12 2Z"
    };
    
    const colorMap: Record<number, string> = {
        4: "text-emerald-500", 6: "text-blue-500", 8: "text-violet-500",
        10: "text-pink-500", 12: "text-orange-500", 20: "text-amber-500", 100: "text-zinc-400"
    };

    return (
        <div className={`relative flex items-center justify-center transition-transform hover:scale-110 ${className}`}>
            {/* Fill */}
            <svg viewBox="0 0 24 24" className={`w-full h-full fill-current opacity-20 ${colorMap[faces]}`}>
                <path d={paths[faces] || paths[20]} />
            </svg>
            {/* Outline */}
            <svg viewBox="0 0 24 24" className={`absolute inset-0 w-full h-full stroke-current ${colorMap[faces]}`} fill="none" strokeWidth="1.5" strokeLinejoin="round">
                <path d={paths[faces] || paths[20]} />
            </svg>
            {/* Label / Value */}
            {label && (
                <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-black font-mono ${faces === 4 ? 'pt-1.5' : ''} ${colorMap[faces]}`}>
                    {value !== undefined ? value : (faces === 100 ? '%' : `d${faces}`)}
                </span>
            )}
        </div>
    );
};

// --- HELPER COMPONENT TO RENDER MARKDOWN-LIKE STRIKETHROUGH ---
const BreakdownDisplay: React.FC<{ breakdown: string }> = ({ breakdown }) => {
  // Splits the string by the strikethrough syntax (e.g., ~~text~~), keeping the delimiters
  const parts = breakdown.split(/(~~.*?~~)/g);

  return (
    <div className="text-base text-zinc-200 font-mono break-words tracking-wide">
      {parts.map((part, index) => {
        if (part.startsWith('~~') && part.endsWith('~~')) {
          // This is a strikethrough part for a discarded die
          return (
            <s key={index} className="opacity-60 text-red-400/90 no-underline line-through">
              {part.replace(/~~/g, '')}
            </s>
          );
        }
        // This is a normal part of the breakdown
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};


// --- COMPONENT ---
export const DiceRoller = forwardRef<DiceRollerHandle, DiceRollerProps>(({ onRollComplete, className = '' }, ref) => {
    // Visual State
    const [rollMode, setRollMode] = useState<RollMode>('normal');
    const [visibility, setVisibility] = useState<RollVisibility>('public');
    
    // Refs to ensure sync logic accesses latest state
    const rollModeRef = useRef<RollMode>('normal');
    const visibilityRef = useRef<RollVisibility>('public');

    const [dicePool, setDicePool] = useState<{faces: number, id: string}[]>([]); 
    const [modifier, setModifier] = useState(0);
    
    // Interaction State
    const [isRolling, setIsRolling] = useState(false);
    const [displayValue, setDisplayValue] = useState<string | number>('');
    const [result, setResult] = useState<RollResult | null>(null);

    // Sync
    useEffect(() => { rollModeRef.current = rollMode; }, [rollMode]);
    useEffect(() => { visibilityRef.current = visibility; }, [visibility]);

    const triggerRoll = async (formula: string, label: string) => {
        if (isRolling) return;
        
        setIsRolling(true);
        setResult(null);
        
        // Access refs for current configuration
        const currentMode = rollModeRef.current;
        const currentVis = visibilityRef.current;

        const rollData = diceEngine.roll(formula, currentMode, label, currentVis);
        
        // Animation Sequence
        const duration = 600; // ms
        const steps = 12;
        const interval = duration / steps;
        
        for (let i = 0; i < steps; i++) {
            setDisplayValue(Math.floor(Math.random() * 20) + 1);
            await new Promise(r => setTimeout(r, interval));
        }

        setResult(rollData);
        setDisplayValue(rollData.total);
        setIsRolling(false);
        
        if (onRollComplete) onRollComplete(rollData);
    };

    useImperativeHandle(ref, () => ({
        roll: (formula: string, label?: string) => {
            setDicePool([]);
            setModifier(0);
            triggerRoll(formula, label || 'Rolagem Automática');
        },
        reset: () => {
            setDicePool([]);
            setModifier(0);
            setResult(null);
            setDisplayValue('');
        }
    }));

    const addDie = (faces: number) => {
        if (dicePool.length >= 12) return; 
        setDicePool(prev => [...prev, { faces, id: Math.random().toString() }]);
        setResult(null);
    };

    const removeDie = (index: number) => {
        setDicePool(prev => prev.filter((_, i) => i !== index));
    };
    
    const clearPool = () => {
        setDicePool([]);
        setModifier(0);
        setResult(null);
        setDisplayValue('');
    };

    const buildFormula = () => {
        const counts: Record<number, number> = {};
        dicePool.forEach(d => { counts[d.faces] = (counts[d.faces] || 0) + 1; });
        
        const parts: string[] = [];
        Object.entries(counts).forEach(([faces, count]) => {
            if ((count as number) > 0) parts.push(`${count}d${faces}`);
        });
        
        if (modifier !== 0) parts.push(modifier > 0 ? `+${modifier}` : `${modifier}`);
        return parts.join('+') || '1d20'; 
    };

    const handleManualRoll = () => {
        triggerRoll(buildFormula(), 'Rolagem Manual');
    };

    const hasInput = dicePool.length > 0 || modifier !== 0;

    const renderResultOverlay = () => {
        if (!result && !isRolling) return null;
        
        const currentMode = result?.mode || (isRolling ? rollMode : 'normal');
        const currentVis = result?.visibility || (isRolling ? visibility : 'public');

        let statusColor = "text-white";
        let statusGlow = "";
        let anim = "";

        if (result?.isCritical) { statusColor = "text-yellow-400"; statusGlow = "drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]"; anim = "animate-crit-pulse"; }
        else if (result?.isFumble) { statusColor = "text-red-500"; statusGlow = "drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]"; anim = "animate-shake-hard"; }
        
        return (
            <div className="absolute inset-0 z-20 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300 rounded-xl">
                <div className="text-center space-y-2 mb-8">
                    <div className="text-sm font-bold uppercase text-zinc-400 tracking-[0.2em] animate-pulse">
                        {result?.label || (isRolling ? 'ROLANDO...' : 'RESULTADO')}
                    </div>
                    <div className="flex gap-2 justify-center">
                        {currentMode !== 'normal' && (
                            <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-full inline-block tracking-wider ${currentMode === 'advantage' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                {currentMode === 'advantage' ? 'Vantagem' : 'Desvantagem'}
                            </div>
                        )}
                        {currentVis !== 'public' && (
                            <div className="text-[10px] font-black uppercase px-3 py-1 rounded-full inline-block tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
                                {currentVis === 'gm' ? 'Secreto (GM)' : 'Resumido'}
                            </div>
                        )}
                    </div>
                </div>

                <div className={`text-9xl font-black font-mono tabular-nums tracking-tighter transition-all scale-110 ${statusColor} ${statusGlow} ${isRolling ? 'blur-sm opacity-80' : anim}`}>
                    {displayValue}
                </div>

                {!isRolling && result && (
                    <div className="mt-10 space-y-4 w-full max-w-xs animate-in slide-in-from-bottom-8 fade-in duration-500">
                        <div className="text-center bg-white/5 rounded-xl py-4 px-4 border border-white/10">
                            <BreakdownDisplay breakdown={result.breakdown} />
                            <div className="text-[10px] text-zinc-500 uppercase mt-2 font-bold tracking-widest">Fórmula: {result.formula}</div>
                        </div>
                        <Button onClick={clearPool} variant="secondary" fullWidth className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 h-14 text-base uppercase tracking-wide font-bold shadow-lg">
                             Nova Rolagem
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`relative flex flex-col bg-zinc-950 h-full rounded-xl overflow-hidden ${className}`}>
            {renderResultOverlay()}

            {/* Main Interface */}
            <div className="p-4 md:p-6 flex-1 flex flex-col h-full">
                
                {/* 1. Mode Selector */}
                <div className="flex bg-zinc-900 p-1 rounded-xl mb-4 border border-zinc-800 shadow-inner shrink-0">
                    {[
                        { id: 'advantage', label: 'VANT', icon: <ArrowUpCircle className="w-4 h-4"/>, color: 'text-green-400 bg-green-500/10 border-green-500/30' },
                        { id: 'normal', label: 'NORMAL', icon: null, color: 'text-zinc-200 bg-zinc-800 border-zinc-700 shadow-sm' },
                        { id: 'disadvantage', label: 'DESV', icon: <ArrowDownCircle className="w-4 h-4"/>, color: 'text-red-400 bg-red-500/10 border-red-500/30' }
                    ].map(m => (
                        <button
                            key={m.id}
                            onClick={() => setRollMode(m.id as RollMode)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] md:text-xs font-black tracking-widest border transition-all ${rollMode === m.id ? m.color : 'text-zinc-600 border-transparent hover:text-zinc-400'}`}
                        >
                            {m.icon} {m.label}
                        </button>
                    ))}
                </div>

                {/* 2. Dice Pool Visualizer (The Tray) */}
                <div className="flex-1 min-h-[120px] bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-800/50 p-4 mb-4 relative group transition-colors hover:border-zinc-700 hover:bg-zinc-900">
                    {!hasInput ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 pointer-events-none">
                            <Dices className="w-10 h-10 mb-3 opacity-20" />
                            <span className="text-xs font-bold uppercase tracking-wider opacity-50">Adicione dados à mesa</span>
                        </div>
                    ) : (
                        <div className="flex flex-wrap content-center items-center justify-center gap-3 h-full overflow-y-auto custom-scrollbar">
                            {dicePool.map((d, i) => (
                                <div 
                                    key={d.id} 
                                    onClick={() => removeDie(i)}
                                    className="w-14 h-14 bg-zinc-950 rounded-xl border border-zinc-800 shadow-xl flex items-center justify-center cursor-pointer hover:border-red-500/50 hover:bg-red-950/10 group/die transition-all animate-in zoom-in duration-200"
                                >
                                    <DieIcon faces={d.faces} className="w-8 h-8 group-hover/die:opacity-20 transition-opacity" label={false} />
                                    <Plus className="w-5 h-5 text-red-500 absolute opacity-0 group-hover/die:opacity-100 transition-opacity scale-75 group-hover/die:scale-100" style={{transform: 'rotate(45deg)'}} />
                                    <span className="absolute bottom-0.5 text-[9px] font-bold text-zinc-500 group-hover/die:opacity-0">d{d.faces}</span>
                                </div>
                            ))}
                            {modifier !== 0 && (
                                <div className="h-12 px-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-lg text-white shadow-lg animate-in fade-in slide-in-from-left-2">
                                    {modifier > 0 ? `+${modifier}` : modifier}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {hasInput && (
                        <button onClick={clearPool} className="absolute top-2 right-2 p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Eraser className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* 3. Keypad Controls */}
                <div className="mt-auto space-y-4">
                    {/* Visibility Toggles */}
                    <div className="flex justify-between items-center px-2 gap-2">
                        <Tooltip content="Público: Todos veem">
                            <button 
                                onClick={() => setVisibility('public')}
                                className={`p-2 rounded-lg border transition-all flex-1 flex items-center justify-center ${visibility === 'public' ? 'bg-primary/20 border-primary text-primary' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </Tooltip>
                        <Tooltip content="Privado: Apenas você e o Mestre">
                            <button 
                                onClick={() => setVisibility('gm')}
                                className={`p-2 rounded-lg border transition-all flex-1 flex items-center justify-center ${visibility === 'gm' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                            >
                                <EyeOff className="w-4 h-4" />
                            </button>
                        </Tooltip>
                        <Tooltip content="Resumido: Apenas total">
                            <button 
                                onClick={() => setVisibility('total')}
                                className={`p-2 rounded-lg border transition-all flex-1 flex items-center justify-center ${visibility === 'total' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                            >
                                <Hash className="w-4 h-4" />
                            </button>
                        </Tooltip>
                    </div>

                    {/* Dice Types */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                        {[4, 6, 8, 10, 12, 20, 100].map(d => (
                            <button 
                                key={d}
                                onClick={() => addDie(d)}
                                className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col items-center justify-center hover:bg-zinc-800 hover:border-zinc-600 transition-all active:scale-95 group shadow-sm"
                            >
                                <DieIcon faces={d} className="w-8 h-8 sm:w-10 sm:h-10" label={true} />
                            </button>
                        ))}
                        {/* Modifier Control in the grid */}
                        <div className="aspect-square flex flex-col gap-1">
                            <button onClick={() => setModifier(m => m+1)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:text-green-400 text-zinc-500 flex items-center justify-center transition-colors active:bg-zinc-700"><Plus className="w-5 h-5"/></button>
                            <button onClick={() => setModifier(m => m-1)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:text-red-400 text-zinc-500 flex items-center justify-center transition-colors active:bg-zinc-700"><Minus className="w-5 h-5"/></button>
                        </div>
                    </div>

                    {/* Roll Button */}
                    <button 
                        onClick={handleManualRoll}
                        disabled={!hasInput}
                        className={`
                            w-full py-5 rounded-xl font-black text-xl uppercase tracking-[0.15em] transition-all shadow-xl flex items-center justify-center gap-3 relative overflow-hidden
                            ${hasInput 
                                ? 'bg-gradient-to-r from-primary to-violet-700 text-white hover:scale-[1.02] shadow-primary/30' 
                                : 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-800'
                            }
                        `}
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
                        <Dices className={`w-6 h-6 ${hasInput ? 'animate-bounce' : ''}`} /> 
                        <span>ROLAR</span>
                    </button>
                </div>
            </div>
        </div>
    );
});

DiceRoller.displayName = 'DiceRoller';
