import React from 'react';
import { GameSessionState } from '../types';
import { socketService } from '../../../services/socketService';
import {
  Combatant, CombatState, CombatEffect, CombatCondition,
  CombatAction, CombatSettings
} from '../../../types';
import { getDefaultCombatSettings, getDefaultCombatStats } from '../../../utils/combatHelpers';

export const useCombatActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>
) => {
  const activeScene = state.scenes.find(s => s.id === state.activeSceneId) || null;

  // ==================== COMBAT MANAGEMENT ====================

  const startCombat = (combatants?: Combatant[], settings?: Partial<CombatSettings>) => {
    if (!activeScene && !combatants) return;

    let initialCombatants: Combatant[] = combatants || [];

    // Se não foram passados combatentes, pegar do mapa
    if (!combatants && activeScene) {
      initialCombatants = activeScene.tokens
        .filter(t => t.type === 'pc' || (t.type === 'npc' && t.isVisibleToPlayers))
        .map(t => {
          const init = Math.floor(Math.random() * 20) + 1;
          return {
            id: t.id,
            name: t.name,
            initiative: init,
            initiativeBonus: 0,
            hp: t.bars?.bar1?.value,
            maxHp: t.bars?.bar1?.max,
            ac: t.stats?.ac,
            imgUrl: t.imgUrl,
            type: t.type === 'pc' ? 'pc' : 'npc',
            effects: [],
            conditions: [],
            actions: {
              action: true,
              bonusAction: true,
              reaction: true,
              movement: t.speed || 9
            }
          } as Combatant;
        })
        .sort((a, b) => b.initiative - a.initiative);
    }

    const combatSettings = { ...getDefaultCombatSettings(), ...settings };

    const newCombat: CombatState = {
      isActive: true,
      round: 1,
      turnOrder: initialCombatants,
      activeTurnIndex: 0,
      settings: combatSettings,
      history: [],
      surpriseRound: false,
      stats: getDefaultCombatStats(),
      turnStartTime: Date.now()
    };

    setState(prev => ({ ...prev, combat: newCombat }));
    socketService.emit('combat:start', { combat: newCombat });

    // Log de início
    logAction({
      type: 'other',
      description: `Combate iniciado com ${initialCombatants.length} combatentes`,
      combatantId: 'system',
      combatantName: 'Sistema'
    });
  };

  const endCombat = () => {
    if (!state.combat) return;

    // Calcular duração final
    const duration = Date.now() - state.combat.stats.combatStartTime;
    const finalStats = { ...state.combat.stats, combatDuration: duration };

    // Log de fim
    logAction({
      type: 'other',
      description: `Combate finalizado após ${state.combat.round} rodadas`,
      combatantId: 'system',
      combatantName: 'Sistema'
    });

    setState(prev => ({ ...prev, combat: null }));
    socketService.emit('combat:end', { stats: finalStats });
  };

  // ==================== TURN MANAGEMENT ====================

  const nextTurn = () => {
    if (!state.combat) return;

    const currentCombatant = state.combat.turnOrder[state.combat.activeTurnIndex];
    const nextIndex = (state.combat.activeTurnIndex + 1) % state.combat.turnOrder.length;
    const isNewRound = nextIndex === 0;
    const nextRound = isNewRound ? state.combat.round + 1 : state.combat.round;

    // Reset ações do próximo combatente
    const updatedTurnOrder = state.combat.turnOrder.map((c, idx) => {
      if (idx === nextIndex) {
        return {
          ...c,
          actions: {
            action: true,
            bonusAction: true,
            reaction: true,
            movement: c.actions.movement // Reset movement to max (would need token speed)
          }
        };
      }
      return c;
    });

    // Processar efeitos (decrementar duração)
    const processedTurnOrder = updatedTurnOrder.map(c => ({
      ...c,
      effects: c.effects.map(e => {
        if (e.duration.type === 'turns' || (e.duration.type === 'rounds' && isNewRound)) {
          return { ...e, duration: { ...e.duration, remaining: e.duration.remaining - 1 } };
        }
        return e;
      }).filter(e => e.duration.remaining > 0 || e.duration.type === 'permanent')
    }));

    const updatedCombat: CombatState = {
      ...state.combat,
      activeTurnIndex: nextIndex,
      round: nextRound,
      turnOrder: processedTurnOrder,
      turnStartTime: Date.now()
    };

    setState(prev => ({ ...prev, combat: updatedCombat }));
    socketService.emit('combat:next-turn', { combat: updatedCombat });

    // Log de turno
    const nextCombatant = processedTurnOrder[nextIndex];
    logAction({
      type: 'other',
      description: `Turno de ${nextCombatant.name}${isNewRound ? ` (Rodada ${nextRound})` : ''}`,
      combatantId: nextCombatant.id,
      combatantName: nextCombatant.name
    });
  };

  const previousTurn = () => {
    if (!state.combat) return;

    const prevIndex = state.combat.activeTurnIndex === 0
      ? state.combat.turnOrder.length - 1
      : state.combat.activeTurnIndex - 1;
    const isNewRound = state.combat.activeTurnIndex === 0;
    const prevRound = isNewRound ? Math.max(1, state.combat.round - 1) : state.combat.round;

    const updatedCombat = {
      ...state.combat,
      activeTurnIndex: prevIndex,
      round: prevRound,
      turnStartTime: Date.now()
    };

    setState(prev => ({ ...prev, combat: updatedCombat }));
    socketService.emit('combat:update', { combat: updatedCombat });
  };

  const goToTurn = (index: number) => {
    if (!state.combat || index < 0 || index >= state.combat.turnOrder.length) return;

    const updatedCombat = {
      ...state.combat,
      activeTurnIndex: index,
      turnStartTime: Date.now()
    };

    setState(prev => ({ ...prev, combat: updatedCombat }));
    socketService.emit('combat:update', { combat: updatedCombat });
  };

  // ==================== COMBATANT MANAGEMENT ====================

  const addCombatant = (combatant: Omit<Combatant, 'id'>) => {
    if (!state.combat) return;

    const newCombatant: Combatant = {
      ...combatant,
      id: crypto.randomUUID(),
      effects: combatant.effects || [],
      conditions: combatant.conditions || [],
      actions: combatant.actions || {
        action: true,
        bonusAction: true,
        reaction: true,
        movement: 9
      }
    };

    // Inserir na ordem correta de iniciativa
    const updatedOrder = [...state.combat.turnOrder, newCombatant]
      .sort((a, b) => b.initiative - a.initiative);

    const updatedCombat = { ...state.combat, turnOrder: updatedOrder };
    setState(prev => ({ ...prev, combat: updatedCombat }));
    socketService.emit('combat:combatant:add', { combatant: newCombatant });

    logAction({
      type: 'other',
      description: `${newCombatant.name} entrou no combate`,
      combatantId: newCombatant.id,
      combatantName: newCombatant.name
    });
  };

  const removeCombatant = (id: string) => {
    if (!state.combat) return;

    const combatant = state.combat.turnOrder.find(c => c.id === id);
    if (!combatant) return;

    const updatedOrder = state.combat.turnOrder.filter(c => c.id !== id);

    // Ajustar índice ativo se necessário
    let newActiveIndex = state.combat.activeTurnIndex;
    if (state.combat.activeTurnIndex >= updatedOrder.length) {
      newActiveIndex = 0;
    }

    const updatedCombat = {
      ...state.combat,
      turnOrder: updatedOrder,
      activeTurnIndex: newActiveIndex
    };

    setState(prev => ({ ...prev, combat: updatedCombat }));
    socketService.emit('combat:combatant:remove', { id });

    logAction({
      type: 'other',
      description: `${combatant.name} saiu do combate`,
      combatantId: id,
      combatantName: combatant.name
    });
  };

  const updateCombatant = (id: string, updates: Partial<Combatant>) => {
    if (!state.combat) return;

    const updatedOrder = state.combat.turnOrder.map(c =>
      c.id === id ? { ...c, ...updates } : c
    );

    const updatedCombat = { ...state.combat, turnOrder: updatedOrder };
    setState(prev => ({ ...prev, combat: updatedCombat }));
    socketService.emit('combat:combatant:update', { id, updates });
  };

  const rerollInitiative = (id?: string) => {
    if (!state.combat) return;

    const updatedOrder = state.combat.turnOrder.map(c => {
      // Se id específico, só re-roll esse. Se não, re-roll todos NPCs
      if ((id && c.id === id) || (!id && c.type === 'npc')) {
        const newInit = Math.floor(Math.random() * 20) + 1 + (c.initiativeBonus || 0);
        return { ...c, initiative: newInit };
      }
      return c;
    }).sort((a, b) => b.initiative - a.initiative);

    const updatedCombat = { ...state.combat, turnOrder: updatedOrder };
    setState(prev => ({ ...prev, combat: updatedCombat }));
    socketService.emit('combat:update', { combat: updatedCombat });
  };

  const updateCombatSettings = (settings: Partial<CombatSettings>) => {
    if (!state.combat) return;

    const updatedSettings = { ...state.combat.settings, ...settings };
    const updatedCombat = { ...state.combat, settings: updatedSettings };

    setState(prev => ({ ...prev, combat: updatedCombat }));
    socketService.emit('combat:update', { combat: updatedCombat });
  };

  // ==================== ACTIONS ====================

  const applyDamage = (targetId: string, amount: number, source?: string) => {
    if (!state.combat) return;

    const target = state.combat.turnOrder.find(c => c.id === targetId);
    if (!target || !target.hp) return;

    const newHp = Math.max(0, target.hp - amount);
    const isDead = newHp === 0;

    updateCombatant(targetId, { hp: newHp });

    // Atualizar stats
    const updatedStats = {
      ...state.combat.stats,
      totalDamageDealt: state.combat.stats.totalDamageDealt + amount
    };
    setState(prev => ({
      ...prev,
      combat: prev.combat ? { ...prev.combat, stats: updatedStats } : null
    }));

    // Check de concentração
    if (target.isConcentrating && state.combat.settings.trackConcentration) {
      checkConcentration(targetId, amount);
    }

    // Log
    logAction({
      type: 'damage',
      description: `${target.name} sofreu ${amount} de dano${source ? ` de ${source}` : ''}`,
      value: amount,
      combatantId: targetId,
      combatantName: target.name,
      targetId,
      targetName: target.name
    });

    // Auto-remover se morto e configurado
    if (isDead && state.combat.settings.autoRemoveDeadCombatants) {
      setTimeout(() => removeCombatant(targetId), 1000);
    }
  };

  const applyHealing = (targetId: string, amount: number, source?: string) => {
    if (!state.combat) return;

    const target = state.combat.turnOrder.find(c => c.id === targetId);
    if (!target || !target.hp || !target.maxHp) return;

    const newHp = Math.min(target.maxHp, target.hp + amount);
    updateCombatant(targetId, { hp: newHp });

    // Atualizar stats
    const updatedStats = {
      ...state.combat.stats,
      totalHealingDone: state.combat.stats.totalHealingDone + amount
    };
    setState(prev => ({
      ...prev,
      combat: prev.combat ? { ...prev.combat, stats: updatedStats } : null
    }));

    // Log
    logAction({
      type: 'heal',
      description: `${target.name} recuperou ${amount} HP${source ? ` de ${source}` : ''}`,
      value: amount,
      combatantId: targetId,
      combatantName: target.name,
      targetId,
      targetName: target.name
    });
  };

  // ==================== EFFECTS & CONDITIONS ====================

  const applyEffect = (targetId: string, effect: Omit<CombatEffect, 'id'>) => {
    if (!state.combat) return;

    const target = state.combat.turnOrder.find(c => c.id === targetId);
    if (!target) return;

    const newEffect: CombatEffect = {
      ...effect,
      id: crypto.randomUUID()
    };

    const updatedEffects = [...target.effects, newEffect];
    updateCombatant(targetId, { effects: updatedEffects });

    // Log
    logAction({
      type: 'effect',
      description: `${effect.name} aplicado em ${target.name}`,
      combatantId: targetId,
      combatantName: target.name,
      targetId,
      targetName: target.name
    });
  };

  const removeEffect = (targetId: string, effectId: string) => {
    if (!state.combat) return;

    const target = state.combat.turnOrder.find(c => c.id === targetId);
    if (!target) return;

    const effect = target.effects.find(e => e.id === effectId);
    const updatedEffects = target.effects.filter(e => e.id !== effectId);
    updateCombatant(targetId, { effects: updatedEffects });

    if (effect) {
      logAction({
        type: 'effect',
        description: `${effect.name} removido de ${target.name}`,
        combatantId: targetId,
        combatantName: target.name
      });
    }
  };

  const addCondition = (targetId: string, condition: CombatCondition) => {
    if (!state.combat) return;

    const target = state.combat.turnOrder.find(c => c.id === targetId);
    if (!target || target.conditions.includes(condition)) return;

    const updatedConditions = [...target.conditions, condition];
    updateCombatant(targetId, { conditions: updatedConditions });

    logAction({
      type: 'condition',
      description: `${target.name} está ${condition}`,
      combatantId: targetId,
      combatantName: target.name
    });
  };

  const removeCondition = (targetId: string, condition: CombatCondition) => {
    if (!state.combat) return;

    const target = state.combat.turnOrder.find(c => c.id === targetId);
    if (!target) return;

    const updatedConditions = target.conditions.filter(c => c !== condition);
    updateCombatant(targetId, { conditions: updatedConditions });

    logAction({
      type: 'condition',
      description: `${target.name} não está mais ${condition}`,
      combatantId: targetId,
      combatantName: target.name
    });
  };

  // ==================== AUTOMATION ====================

  const toggleAction = (combatantId: string, action: 'action' | 'bonusAction' | 'reaction') => {
    if (!state.combat) return;

    const combatant = state.combat.turnOrder.find(c => c.id === combatantId);
    if (!combatant) return;

    const updatedActions = {
      ...combatant.actions,
      [action]: !combatant.actions[action]
    };

    updateCombatant(combatantId, { actions: updatedActions });
  };

  const resetActions = (combatantId: string) => {
    if (!state.combat) return;

    const combatant = state.combat.turnOrder.find(c => c.id === combatantId);
    if (!combatant) return;

    const resetActions = {
      action: true,
      bonusAction: true,
      reaction: true,
      movement: combatant.actions.movement // Mantém movimento atual
    };

    updateCombatant(combatantId, { actions: resetActions });
  };

  const checkConcentration = (combatantId: string, damage: number): boolean => {
    if (!state.combat) return false;

    const combatant = state.combat.turnOrder.find(c => c.id === combatantId);
    if (!combatant || !combatant.isConcentrating) return false;

    // DC = 10 ou metade do dano, o que for maior
    const dc = Math.max(10, Math.floor(damage / 2));

    // Simular rolagem de CON save (seria melhor pegar o modificador real)
    const roll = Math.floor(Math.random() * 20) + 1;
    const success = roll >= dc;

    if (!success) {
      updateCombatant(combatantId, {
        isConcentrating: false,
        concentrationSpell: undefined
      });

      logAction({
        type: 'other',
        description: `${combatant.name} perdeu concentração em ${combatant.concentrationSpell}`,
        combatantId,
        combatantName: combatant.name
      });
    }

    return success;
  };

  // ==================== UTILITY ====================

  const logAction = (action: Omit<CombatAction, 'id' | 'timestamp' | 'round' | 'turn'>) => {
    if (!state.combat) return;

    const newAction: CombatAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      round: state.combat.round,
      turn: state.combat.activeTurnIndex
    };

    const updatedHistory = [...state.combat.history, newAction];
    setState(prev => ({
      ...prev,
      combat: prev.combat ? { ...prev.combat, history: updatedHistory } : null
    }));

    socketService.emit('combat:action', { action: newAction });
  };

  const getCombatStats = () => {
    return state.combat?.stats || null;
  };

  const exportCombatLog = (): string => {
    if (!state.combat) return '';

    const lines = [
      `=== COMBATE - Rodada ${state.combat.round} ===`,
      `Início: ${new Date(state.combat.stats.combatStartTime).toLocaleString()}`,
      ``,
      `=== PARTICIPANTES ===`,
      ...state.combat.turnOrder.map(c =>
        `${c.name} (Init: ${c.initiative}, HP: ${c.hp}/${c.maxHp})`
      ),
      ``,
      `=== HISTÓRICO ===`,
      ...state.combat.history.map(a =>
        `[R${a.round}T${a.turn}] ${a.description}`
      ),
      ``,
      `=== ESTATÍSTICAS ===`,
      `Dano Total: ${state.combat.stats.totalDamageDealt}`,
      `Cura Total: ${state.combat.stats.totalHealingDone}`,
      `Rodadas: ${state.combat.stats.roundsElapsed}`
    ];

    return lines.join('\n');
  };

  return {
    // Combat Management
    startCombat,
    endCombat,
    nextTurn,
    previousTurn,
    goToTurn,

    // Combatant Management
    addCombatant,
    removeCombatant,
    updateCombatant,
    rerollInitiative,
    updateCombatSettings,

    // Actions
    applyDamage,
    applyHealing,
    applyEffect,
    removeEffect,
    addCondition,
    removeCondition,

    // Automation
    toggleAction,
    resetActions,
    checkConcentration,

    // Utility
    getCombatStats,
    exportCombatLog
  };
};
