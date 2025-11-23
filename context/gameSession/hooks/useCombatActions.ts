import React from 'react';
import { GameSessionState } from '../types';
import { socketService } from '../../../services/socketService';
import { Combatant, CombatState } from '../../../types';

export const useCombatActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>
) => {
  const activeScene = state.scenes.find(s => s.id === state.activeSceneId) || null;

  const startCombat = () => {
    if (!activeScene) return;

    // Get all visible tokens or PC tokens for initial initiative
    const combatants: Combatant[] = activeScene.tokens
      .filter(t => t.type === 'pc' || (t.type === 'npc' && t.isVisibleToPlayers))
      .map(t => {
        // Mock dex mod extraction or just random
        const init = Math.floor(Math.random() * 20) + 1;
        return {
          id: t.id,
          name: t.name,
          initiative: init,
          hp: t.bars?.bar1?.value,
          maxHp: t.bars?.bar1?.max,
          imgUrl: t.imgUrl,
          type: t.type === 'pc' ? 'pc' : 'npc'
        };
      })
      .sort((a, b) => b.initiative - a.initiative);

    const newCombat: CombatState = {
      isActive: true,
      round: 1,
      turnOrder: combatants,
      activeTurnIndex: 0
    };

    setState(prev => ({ ...prev, combat: newCombat }));
    socketService.emit('combat:update', { combat: newCombat });
  };

  const endCombat = () => {
    setState(prev => ({ ...prev, combat: null }));
    socketService.emit('combat:update', { combat: null });
  };

  const nextTurn = () => {
    if (!state.combat) return;
    const nextIndex = (state.combat.activeTurnIndex + 1) % state.combat.turnOrder.length;
    const nextRound = nextIndex === 0 ? state.combat.round + 1 : state.combat.round;

    const updatedCombat = { ...state.combat, activeTurnIndex: nextIndex, round: nextRound };
    setState(prev => ({ ...prev, combat: updatedCombat }));
    socketService.emit('combat:update', { combat: updatedCombat });
  };

  const updateCombatant = (id: string, data: any) => {
    if (!state.combat) return;
    const updatedOrder = state.combat.turnOrder.map(c => c.id === id ? { ...c, ...data } : c);
    const updatedCombat = { ...state.combat, turnOrder: updatedOrder };
    setState(prev => ({ ...prev, combat: updatedCombat }));
    socketService.emit('combat:update', { combat: updatedCombat });
  };

  return {
    startCombat,
    endCombat,
    nextTurn,
    updateCombatant
  };
};
