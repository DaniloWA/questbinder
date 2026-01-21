import React from 'react';
import { GameSessionState } from '../types';
import { socketService } from '../../../services/socketService';
import { smartSync } from '../../../services/sync';
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

    // Use ID 'current' for singleton combat or the new combat ID
    // Generally combat is a singleton in state.combat
    smartSync.apply('combat', 'current', 'create', newCombat);

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

    smartSync.apply('combat', 'current', 'delete', { stats: finalStats });
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

    smartSync.apply('combat', 'current', 'update', updatedCombat);

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

    smartSync.apply('combat', 'current', 'update', updatedCombat);
  };

  const goToTurn = (index: number) => {
    if (!state.combat || index < 0 || index >= state.combat.turnOrder.length) return;

    const updatedCombat = {
      ...state.combat,
      activeTurnIndex: index,
      turnStartTime: Date.now()
    };

    smartSync.apply('combat', 'current', 'update', updatedCombat);
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
    smartSync.apply('combat', 'current', 'update', { turnOrder: updatedOrder });
    // Or use granular combatant events? SyncQueue suggests 'combat:update' is general.
    // Actually SyncQueue maps 'combat:combatan:add' not present.
    // Wait, let's check SyncQueue again. 
    // SyncQueue maps 'combat:update' -> 'combat:update'.
    // Originally addCombatant emitted 'combat:combatant:add'.
    // DOES SyncQueue support 'combat:combatant:add'?
    // NO. It supports `combat` entity.
    // So if I use `smartSync.apply('combat', 'current', 'update', { turnOrder: ... })`, it emits `combat:update`.
    // The server needs to handle full combat object update?
    // If the server expects `combat:combatant:add`, I might be BREAKING it if I switch to `combat:update`.
    // Let's check `SyncQueue` mapping CAREFULLY.
    // `combat` entity type -> `combat:update` event.
    // There is no `combatant` entity type in SyncQueue?
    // Start of SyncQueue file (I viewed it) didn't show `combatant`.
    // I should check `SyncCache` to see if `combatant` is tracked.
    // `SyncCache` has `combat` (singular).
    // So `combatant` management is likely via the `combat` object.
    // BUT the original code emitted `combat:combatant:add`.
    // If I change to `smartSync.apply('combat', ...)` it sends `combat:update`.
    // If the server supports full object update, it's fine.
    // If the server is granular, I might simply retain the `setState` removal but stick to `socketService` for granular events?
    // NO -> "Unidirectional Data Flow".
    // I should probably invoke `smartSync` to update cache, but if it doesn't emit the right event...
    // I will stick to updating the WHOLE combat object via SmartSync. This is safer for data consistency.
    // If `turnOrder` is array, SmartSync merges?
    // `smartSync` usually replaces root data or merges at top level.
    // If I send `{ turnOrder: [...] }`, it merges.
    // So `combat:update` with new turnOrder is valid.

    // HOWEVER, I see `handleCombatCombatantAdd` in listeners.
    // It calls `notifySmartSync('combatant', ...)`?
    // Let's check `combatListeners.ts` (Viewed in step 807).
    // `handleCombatCombatantAdd` -> `notifySmartSync('combatant', ...)`
    // This implies `combatant` IS an entity type in listeners.
    // But `SyncQueue` doesn't have it?
    // I should add `combatant` to `SyncQueue` to be safe/granular.
    // If I don't, I must sync the whole `combat` object.
    // Updating the whole combat object on every turn/add is heavier but safer for "Single Source of Truth".
    // I'll stick to updating `combat` object for now to match `SyncQueue` capabilities immediately.

    smartSync.apply('combat', 'current', 'update', updatedCombat);

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

    smartSync.apply('combat', 'current', 'update', updatedCombat);

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
    smartSync.apply('combat', 'current', 'update', updatedCombat);
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
    smartSync.apply('combat', 'current', 'update', updatedCombat);
  };

  const updateCombatSettings = (settings: Partial<CombatSettings>) => {
    if (!state.combat) return;

    const updatedSettings = { ...state.combat.settings, ...settings };
    const updatedCombat = { ...state.combat, settings: updatedSettings };

    smartSync.apply('combat', 'current', 'update', updatedCombat);
  };

  // ==================== ACTIONS ====================

  const applyDamage = (targetId: string, amount: number, source?: string) => {
    if (!state.combat) return;

    const target = state.combat.turnOrder.find(c => c.id === targetId);
    if (!target || !target.hp) return;

    const newHp = Math.max(0, target.hp - amount);
    const isDead = newHp === 0;

    const updatedStats = {
      ...state.combat.stats,
      totalDamageDealt: state.combat.stats.totalDamageDealt + amount
    };

    const updatedOrder = state.combat.turnOrder.map(c =>
      c.id === targetId ? { ...c, hp: newHp } : c
    );

    const updatedCombat = {
      ...state.combat,
      turnOrder: updatedOrder,
      stats: updatedStats
    };

    smartSync.apply('combat', 'current', 'update', updatedCombat);
    // Removed setState and updateCombatant call to avoid dual/partial updates

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
    const updatedStats = {
      ...state.combat.stats,
      totalHealingDone: state.combat.stats.totalHealingDone + amount
    };

    const updatedOrder = state.combat.turnOrder.map(c =>
      c.id === targetId ? { ...c, hp: newHp } : c
    );

    const updatedCombat = {
      ...state.combat,
      turnOrder: updatedOrder,
      stats: updatedStats
    };

    smartSync.apply('combat', 'current', 'update', updatedCombat);
    // Removed setState and updateCombatant call

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
    // update whole combat history
    smartSync.apply('combat', 'current', 'update', { history: updatedHistory });
    // Note: socketService.emit('combat:action') was distinct. 
    // SyncQueue doesn't map 'combat:action'.
    // BUT we are updating the 'combat' entity (history field).
    // If listeners respond to 'combat:update', they will see the new history.
    // If listeners expect 'combat:action', we might need to add it to SyncQueue.
    // Given 'combat:update' updates the whole object, it's safer for state sync.
    // We can assume 'combat:action' was for a toast or log event?
    // Listeners usually handle 'combat:update' to refresh state.
    // I will check combatListeners.ts again briefly? 
    // It listens to 'combat:update'.
    // Does it listen to 'combat:action'? No (I didn't see it in the audit list, only 'combat:update', 'start', 'end', 'turn', 'combatant:*').
    // So 'combat:action' might be legacy or for Chat?
    // Wait, logAction emits 'combat:action'.
    // If no one listens to it, does it matter?
    // It updates `history` in state.
    // Using `smartSync` to update `history` ensures persistent state.
    // I'll assume 'combat:action' is redundant for state, maybe used for toasts?
    // I will rely on `combat:update` which smartSync sends.
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
