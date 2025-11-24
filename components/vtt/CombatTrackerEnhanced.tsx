import React, { useState, useEffect } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import {
  Swords, ChevronRight, ChevronLeft, ShieldAlert, Heart,
  Clock, Settings, History, Plus, Skull, Zap, Shield,
  Activity, MoreVertical, Trash2, RotateCcw, Play, Pause,
  Lightbulb, X, Keyboard
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { Button } from '../ui/Button';
import { CombatCondition } from '../../types';
import { getCombatSuggestions, CombatSuggestion } from '../../utils/combatAI';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { ActiveCombatantCard } from './combat/ActiveCombatantCard';
import { CombatantRow } from './combat/CombatantRow';

export const CombatTrackerEnhanced: React.FC = () => {
  const {
    combat, isGM,
    nextTurn, previousTurn, endCombat,
    applyDamage, applyHealing, removeCombatant,
    addCondition, removeCondition,
    getCombatStats, updateCombatSettings
  } = useGameSession();

  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(null);
  const [quickActionTarget, setQuickActionTarget] = useState<string | null>(null);
  const [damageAmount, setDamageAmount] = useState<string>('');
  const [healAmount, setHealAmount] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Timer
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (!combat?.isActive || !combat.turnStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (combat.turnStartTime || 0)) / 1000);
      setTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [combat?.turnStartTime, combat?.isActive]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!combat?.isActive || !isGM) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ': // Space - Next turn
          e.preventDefault();
          nextTurn();
          break;
        case 'arrowleft': // Previous turn
          if (e.shiftKey) {
            e.preventDefault();
            previousTurn();
          }
          break;
        case 'h': // Toggle history
          e.preventDefault();
          setShowHistory(!showHistory);
          break;
        case 's': // Toggle suggestions
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowSuggestions(!showSuggestions);
          }
          break;
        case 'escape': // Close panels
          setQuickActionTarget(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [combat?.isActive, isGM, nextTurn, previousTurn, showHistory, showSuggestions]);

  if (!combat || !combat.isActive) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-500">
        <ShieldAlert className="w-16 h-16 mb-4 text-zinc-700" />
        <h3 className="font-bold text-zinc-300 text-lg mb-2">Nenhum combate ativo</h3>
        <p className="text-sm text-zinc-500">Inicie um combate pela barra de ferramentas do mestre.</p>
      </div>
    );
  }

  const activeCombatant = combat.turnOrder[combat.activeTurnIndex];
  const stats = getCombatStats();

  const handleQuickDamage = (targetId: string) => {
    const amount = parseInt(damageAmount);
    if (isNaN(amount) || amount <= 0) return;

    applyDamage(targetId, amount);
    setDamageAmount('');
    setQuickActionTarget(null);
  };

  const handleQuickHeal = (targetId: string) => {
    const amount = parseInt(healAmount);
    if (isNaN(amount) || amount <= 0) return;

    applyHealing(targetId, amount);
    setHealAmount('');
    setQuickActionTarget(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950/50 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 shrink-0 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2 text-white">
            <Swords className="w-5 h-5 text-red-500" />
            <span>Combate</span>
          </h3>

          <div className="flex items-center gap-2">
            {/* Timer */}
            {combat.settings.enableTurnTimer && (
              <Tooltip content="Tempo do turno">
                <div className="flex items-center gap-1.5 text-xs bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-300">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono font-bold">{formatTime(timeElapsed)}</span>
                </div>
              </Tooltip>
            )}

            {/* Round Counter */}
            <div className="bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700">
              <span className="text-[10px] uppercase text-zinc-500 font-bold mr-1">Rodada</span>
              <span className="font-bold text-white">{combat.round}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 pl-2 border-l border-zinc-800 ml-2">
              <Tooltip content="Histórico">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-2 rounded-lg transition-all ${showHistory ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                >
                  <History className="w-4 h-4" />
                </button>
              </Tooltip>

              {isGM && (
                <>
                  <Tooltip content="Configurações">
                    <button
                      type="button"
                      onClick={() => setShowSettings(!showSettings)}
                      className={`p-2 rounded-lg transition-all ${showSettings ? 'bg-primary/20 text-primary' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </Tooltip>

                  <Tooltip content="Atalhos">
                    <button
                      type="button"
                      onClick={() => setShowKeyboardHelp(true)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                      <Keyboard className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Active Combatant Card */}
        <ActiveCombatantCard
          combatant={activeCombatant}
          isGM={isGM}
          onDamage={(amt) => applyDamage(activeCombatant.id, amt)}
          onHeal={(amt) => applyHealing(activeCombatant.id, amt)}
          onNextTurn={nextTurn}
        />
      </div>

      {/* Settings Panel */}
      {showSettings && isGM && (
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 space-y-4 animate-in slide-in-from-top-2 shadow-inner">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Configurações de Batalha</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'autoRollInitiative', label: 'Auto-rolar Init' },
              { key: 'showInitiativeToPlayers', label: 'Mostrar Init' },
              { key: 'showEnemyHP', label: 'Mostrar HP Inimigo' },
              { key: 'trackConcentration', label: 'Concentração' },
              { key: 'enableTurnTimer', label: 'Timer Turno' },
              { key: 'enableSuggestions', label: 'Sugestões IA' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 text-xs cursor-pointer hover:bg-zinc-800/50 p-2 rounded-lg transition-colors border border-transparent hover:border-zinc-800">
                <input
                  type="checkbox"
                  checked={(combat.settings as any)[key]}
                  onChange={(e) => updateCombatSettings({ [key]: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-zinc-300 font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="border-b border-zinc-800 bg-zinc-900/50 p-3 max-h-48 overflow-y-auto custom-scrollbar shrink-0 shadow-inner">
          <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2">Histórico de Ações</h4>
          <div className="space-y-1">
            {combat.history.slice(-10).reverse().map(action => (
              <div key={action.id} className="text-xs text-zinc-500 flex items-start gap-2">
                <span className="text-zinc-600 font-mono shrink-0">[R{action.round}]</span>
                <span className="flex-1">{action.description}</span>
              </div>
            ))}
            {combat.history.length === 0 && (
              <p className="text-xs text-zinc-600 italic">Nenhuma ação registrada ainda.</p>
            )}
          </div>
        </div>
      )}

      {/* Turn Order List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        <h4 className="text-xs font-bold text-zinc-500 uppercase px-1">Próximos Turnos</h4>
        {combat.turnOrder.map((combatant, index) => {
          if (index === combat.activeTurnIndex) return null; // Skip active (shown in card)

          return (
            <div key={combatant.id} className="relative group">
              <CombatantRow
                combatant={combatant}
                isGM={isGM}
                isActive={false}
                onClick={() => setQuickActionTarget(quickActionTarget === combatant.id ? null : combatant.id)}
              />

              {/* Quick Actions Overlay */}
              {quickActionTarget === combatant.id && isGM && (
                <div className="absolute inset-x-0 top-full mt-1 z-10 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-3 animate-in slide-in-from-top-2 fade-in">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="number"
                      value={damageAmount}
                      onChange={(e) => setDamageAmount(e.target.value)}
                      placeholder="Dano"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm outline-none focus:border-red-500"
                      autoFocus
                    />
                    <Button size="sm" variant="destructive" onClick={() => handleQuickDamage(combatant.id)} disabled={!damageAmount}>
                      <Zap className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="number"
                      value={healAmount}
                      onChange={(e) => setHealAmount(e.target.value)}
                      placeholder="Cura"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm outline-none focus:border-green-500"
                    />
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleQuickHeal(combatant.id)} disabled={!healAmount}>
                      <Heart className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs"
                    onClick={() => {
                      if (confirm(`Remover ${combatant.name}?`)) removeCombatant(combatant.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-2" /> Remover do Combate
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* GM Controls Footer */}
      {isGM && (
        <div className="p-3 border-t border-zinc-800 bg-zinc-900 shrink-0 space-y-2">
          <div className="flex gap-2">
            <Tooltip content="Turno Anterior">
              <Button
                size="sm"
                variant="outline"
                onClick={previousTurn}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Tooltip>

            <Button
              onClick={nextTurn}
              className="flex-[3] shadow-lg shadow-primary/20"
            >
              Próximo Turno
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Finalizar combate?')) {
                endCombat();
              }
            }}
            fullWidth
            size="sm"
            className="opacity-50 hover:opacity-100 transition-opacity"
          >
            Finalizar Combate
          </Button>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
};
