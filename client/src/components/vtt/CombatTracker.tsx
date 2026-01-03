import React from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { Swords, ChevronRight, ShieldAlert, Heart, Skull } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { Button } from '../ui/Button';

export const CombatTracker: React.FC = () => {
    const { combat, isGM, nextTurn, updateCombatant } = useGameSession();

    if (!combat || !combat.isActive) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 text-zinc-500">
                <ShieldAlert className="w-12 h-12 mb-4" />
                <h3 className="font-bold text-zinc-300">Nenhum combate ativo.</h3>
                <p className="text-sm">Inicie um combate pela barra de ferramentas do mestre.</p>
            </div>
        );
    }

    const activeCombatant = combat.turnOrder[combat.activeTurnIndex];

    return (
        <div className="h-full flex flex-col bg-zinc-950/50">
            {/* Header */}
            <div className="p-3 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Swords className="w-5 h-5 text-red-400" />
                    <span>Ordem de Turno</span>
                </h3>
                <div className="text-center">
                    <span className="text-xs uppercase text-zinc-400">Rodada</span>
                    <p className="font-bold text-xl">{combat.round}</p>
                </div>
            </div>

            {/* Turn Order List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {combat.turnOrder.map((c, index) => (
                    <div
                        key={c.id}
                        className={`
                            flex items-center gap-3 p-3 border-b border-zinc-800/50 transition-all
                            ${index === combat.activeTurnIndex ? 'bg-primary/10 ring-2 ring-primary/50' : 'hover:bg-zinc-800/50'}
                        `}
                    >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <img src={c.imgUrl} alt={c.name} className="w-10 h-10 rounded-full border-2 border-zinc-700 bg-zinc-800 object-cover" />
                            {index === combat.activeTurnIndex && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                    <Swords className="w-2.5 h-2.5 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold truncate text-white">{c.name}</p>
                            <p className="text-xs text-zinc-400">Iniciativa: {c.initiative}</p>
                        </div>
                        
                        {/* HP */}
                        <div className="flex items-center gap-2">
                           <Heart className="w-4 h-4 text-red-500" />
                           <input 
                              type="number"
                              value={c.hp ?? ''}
                              onChange={(e) => updateCombatant(c.id, { hp: parseInt(e.target.value) || 0 })}
                              className="w-12 bg-zinc-900 border border-zinc-700 rounded text-center text-sm p-1 outline-none focus:ring-1 focus:ring-primary"
                              disabled={!isGM}
                           />
                        </div>

                    </div>
                ))}
            </div>

            {/* GM Controls */}
            {isGM && (
                <div className="p-3 border-t border-zinc-800 bg-zinc-900">
                    <Button onClick={nextTurn} fullWidth className="shadow-lg shadow-primary/20">
                        Próximo Turno
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            )}
        </div>
    );
};