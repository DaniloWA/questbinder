import { useTranslation } from '../../i18n/TranslationContext';
import React, { useState, useEffect } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Swords, Dice6, Users, Eye, EyeOff, Zap,
  Settings, RotateCcw, Play, AlertTriangle
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { Combatant, CombatSettings, Token } from '../../types';
import { getDefaultCombatSettings } from '../../utils/combatHelpers';

interface CombatInitiativeRollerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CombatInitiativeRoller: React.FC<CombatInitiativeRollerProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { activeScene, startCombat, isGM } = useGameSession();

  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [initiatives, setInitiatives] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<CombatSettings>(getDefaultCombatSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [surpriseRound, setSurpriseRound] = useState(false);

  // Auto-select visible tokens on open
  useEffect(() => {
    if (isOpen && activeScene) {
      const autoSelect = new Set<string>();
      activeScene.tokens.forEach(token => {
        // Auto-select PCs and visible NPCs
        if (token.type === 'pc' || (token.type === 'npc' && token.isVisibleToPlayers)) {
          autoSelect.add(token.id);
        }
      });
      setSelectedTokens(autoSelect);
    }
  }, [isOpen, activeScene]);

  if (!activeScene) return null;

  const availableTokens = activeScene.tokens.filter(t => t.type === 'pc' || t.type === 'npc');
  const selectedTokensList = availableTokens.filter(t => selectedTokens.has(t.id));

  const toggleToken = (tokenId: string) => {
    const newSet = new Set(selectedTokens);
    if (newSet.has(tokenId)) {
      newSet.delete(tokenId);
    } else {
      newSet.add(tokenId);
    }
    setSelectedTokens(newSet);
  };

  const rollInitiative = (token: Token) => {
    // Roll 1d20 + dex mod (simplified - would need actual character data)
    const roll = Math.floor(Math.random() * 20) + 1;
    const dexMod = 0; // TODO: Get from character/token stats
    return roll + dexMod;
  };

  const rollAllNPCs = () => {
    const newInitiatives = { ...initiatives };
    selectedTokensList.forEach(token => {
      if (token.type === 'npc') {
        newInitiatives[token.id] = rollInitiative(token);
      }
    });
    setInitiatives(newInitiatives);
  };

  const rollAll = () => {
    const newInitiatives: Record<string, number> = {};
    selectedTokensList.forEach(token => {
      newInitiatives[token.id] = rollInitiative(token);
    });
    setInitiatives(newInitiatives);
  };

  const handleStartCombat = () => {
    if (selectedTokensList.length === 0) return;

    console.log('[CombatInitiativeRoller] Starting combat with', selectedTokensList.length, t('vtt.combat.initiativeroller.combatants.label'));

    const combatants: Combatant[] = selectedTokensList.map(token => ({
      id: token.id,
      name: token.name,
      initiative: initiatives[token.id] || 0,
      initiativeBonus: 0,
      hp: token.bars?.bar1?.value,
      maxHp: token.bars?.bar1?.max,
      ac: token.stats?.ac,
      imgUrl: token.imgUrl,
      type: (token.type === 'pc' ? 'pc' : 'npc') as 'pc' | 'npc',
      effects: [],
      conditions: [],
      actions: {
        action: true,
        bonusAction: true,
        reaction: true,
        movement: token.speed || 9
      }
    })).sort((a, b) => b.initiative - a.initiative);

    console.log('[CombatInitiativeRoller] Combatants:', combatants);
    console.log('[CombatInitiativeRoller] Settings:', settings);

    startCombat(combatants, settings);

    console.log('[CombatInitiativeRoller] Combat started, closing modal');
    onClose();
  };

  const pcCount = selectedTokensList.filter(t => t.type === 'pc').length;
  const npcCount = selectedTokensList.filter(t => t.type === 'npc').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('vtt.combat.initiativeroller.iniciarCombate.title')}
      size="lg"
    >
      <div className="space-y-4">
        {/* Stats Header */}
        <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-zinc-400">{t('vtt.combat.initiativeroller.pcs.label')}</span>
              <span className="font-bold text-white">{pcCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-red-400" />
              <span className="text-zinc-400">{t('vtt.combat.initiativeroller.npcs.label')}</span>
              <span className="font-bold text-white">{npcCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip content={t('vtt.combat.initiativeroller.rolarTodosOs.tooltip')}>
              <Button
                size="sm"
                variant="outline"
                onClick={rollAllNPCs}
                disabled={npcCount === 0}
              >
                <Dice6 className="w-4 h-4 mr-2" />{t('vtt.combat.initiativeroller.npcs.label')}</Button>
            </Tooltip>

            <Tooltip content={t('vtt.combat.initiativeroller.rolarTodos.tooltip')}>
              <Button
                size="sm"
                onClick={rollAll}
                disabled={selectedTokensList.length === 0}
              >
                <Zap className="w-4 h-4 mr-2" />{t('vtt.combat.initiativeroller.todos.label')}</Button>
            </Tooltip>

            <Tooltip content={t('vtt.combat.initiativeroller.configuraes.tooltip')}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(!showSettings);
                }}
                className={`p-2 rounded hover:bg-zinc-800 transition-colors ${showSettings ? 'bg-zinc-800 text-primary' : 'text-zinc-400'}`}
              >
                <Settings className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800 space-y-3">
            <h4 className="text-sm font-bold text-zinc-300 mb-3">{t('vtt.combat.initiativeroller.configuraesDoCombate.text')}</h4>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRollInitiative}
                  onChange={(e) => setSettings({ ...settings, autoRollInitiative: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                />
                <span className="text-zinc-300">{t('vtt.combat.initiativeroller.autorolarIniciativa.text')}</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showInitiativeToPlayers}
                  onChange={(e) => setSettings({ ...settings, showInitiativeToPlayers: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                />
                <span className="text-zinc-300">Mostrar iniciativa aos jogadores</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showEnemyHP}
                  onChange={(e) => setSettings({ ...settings, showEnemyHP: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                />
                <span className="text-zinc-300">Mostrar HP de inimigos</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.trackConcentration}
                  onChange={(e) => setSettings({ ...settings, trackConcentration: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                />
                <span className="text-zinc-300">{t('vtt.combat.initiativeroller.rastrearConcentrao.text')}</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableTurnTimer}
                  onChange={(e) => setSettings({ ...settings, enableTurnTimer: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                />
                <span className="text-zinc-300">{t('vtt.combat.initiativeroller.timerDeTurno.text')}</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableSuggestions}
                  onChange={(e) => setSettings({ ...settings, enableSuggestions: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                />
                <span className="text-zinc-300">{t('vtt.combat.initiativeroller.sugestesInteligentes.text')}</span>
              </label>
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={surpriseRound}
                  onChange={(e) => setSurpriseRound(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-yellow-500 focus:ring-yellow-500"
                />
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-zinc-300 font-bold">{t('vtt.combat.initiativeroller.rodadaSurpresa.text')}</span>
              </label>
            </div>
          </div>
        )}

        {/* Token Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-400 uppercase">{t('vtt.combat.initiativeroller.participantes.label')}</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedTokens(new Set(availableTokens.map(t => t.id)))}
              >{t('vtt.combat.initiativeroller.selecionarTodos.text')}</Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedTokens(new Set())}
              >{t('vtt.combat.initiativeroller.limpar.label')}</Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
            {availableTokens.map(token => {
              const isSelected = selectedTokens.has(token.id);
              const initiative = initiatives[token.id];

              return (
                <div
                  key={token.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                    ${isSelected
                      ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/30'
                      : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                    }
                  `}
                  onClick={() => toggleToken(token.id)}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => { }}
                    className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                  />

                  {/* Avatar */}
                  <img
                    src={token.imgUrl || '/placeholder-avatar.png'}
                    alt={token.name}
                    className="w-10 h-10 rounded-full border-2 border-zinc-700 bg-zinc-800 object-cover"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white truncate">{token.name}</p>
                      {token.type === 'pc' && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                          PC
                        </span>
                      )}
                      {!token.isVisibleToPlayers && token.type === 'npc' && (
                        <Tooltip content={t('vtt.combat.initiativeroller.invisvelParaJogadores.tooltip')}>
                          <EyeOff className="w-3 h-3 text-zinc-600" />
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      {token.bars?.bar1?.max && (
                        <span>{t('vtt.combat.initiativeroller.hp.label')}{token.bars.bar1.value}/{token.bars.bar1.max}</span>
                      )}
                      {token.stats?.ac && <span>{t('vtt.combat.initiativeroller.ca.label')}{token.stats.ac}</span>}
                    </div>
                  </div>

                  {/* Initiative Input */}
                  {isSelected && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={initiative || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          setInitiatives({
                            ...initiatives,
                            [token.id]: parseInt(e.target.value) || 0
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Init"
                        className="w-16 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm text-center outline-none focus:ring-1 focus:ring-primary"
                      />
                      <Tooltip content={t('vtt.combat.initiativeroller.rolarIniciativa.tooltip')}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInitiatives({
                              ...initiatives,
                              [token.id]: rollInitiative(token)
                            });
                          }}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                          <Dice6 className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              );
            })}

            {availableTokens.length === 0 && (
              <div className="text-center py-8 text-zinc-600">
                <Swords className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{t('vtt.combat.initiativeroller.nenhumTokenDisponvel.text')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
          <Button variant="ghost" onClick={onClose}>{t('vtt.combat.initiativeroller.cancelar.label')}</Button>

          <Button
            onClick={handleStartCombat}
            disabled={selectedTokensList.length === 0}
            className="shadow-lg shadow-primary/20"
          >
            <Play className="w-4 h-4 mr-2" />{t('vtt.combat.initiativeroller.iniciarCombate.text')}{selectedTokensList.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
};
