import { socketService } from '../../../../services/socketService';
import { CombatUpdatePayload } from '../../../../types';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for combat-related events
 * - combat:start
 * - combat:end
 * - combat:update
 * - combat:next-turn
 * - combat:combatant:add
 * - combat:combatant:update
 * - combat:combatant:remove
 * - combat:action
 */
export const registerCombatListeners = ({
  state,
  setState,
  show
}: ListenerDeps): ListenerCleanup => {

  // Handler: combat:update
  const handleCombatUpdate = (payload: CombatUpdatePayload) => {
    setState(previousState => ({
      ...previousState,
      combat: payload.combat
    }));
  };

  // Handler: combat:start
  const handleCombatStart = (payload: { combat: any; }) => {
    console.log('[WS] Combat started:', payload);
    setState(prev => ({
      ...prev,
      combat: payload.combat
    }));

    if (!state.isGM) {
      show({
        type: 'info',
        message: '⚔️ Combate iniciado!',
        duration: 3000
      });
    }
  };

  // Handler: combat:end
  const handleCombatEnd = (payload: { stats: any; }) => {
    console.log('[WS] Combat ended:', payload);
    setState(prev => ({
      ...prev,
      combat: null
    }));

    if (!state.isGM) {
      show({
        type: 'success',
        message: '✅ Combate finalizado',
        duration: 3000
      });
    }
  };

  // Handler: combat:next-turn
  const handleCombatNextTurn = (payload: { combat: any; }) => {
    console.log('[WS] Combat turn advanced:', payload);
    setState(prev => ({
      ...prev,
      combat: payload.combat
    }));

    const activeCombatant = payload.combat.turnOrder[payload.combat.activeTurnIndex];
    if (!state.isGM && activeCombatant) {
      show({
        type: 'info',
        message: `🎯 Turno de ${activeCombatant.name}`,
        duration: 2000
      });
    }
  };

  // Handler: combat:combatant:add
  const handleCombatCombatantAdd = (payload: { combatant: any; }) => {
    console.log('[WS] Combatant added:', payload);
    setState(prev => {
      if (!prev.combat) return prev;
      return {
        ...prev,
        combat: {
          ...prev.combat,
          turnOrder: [...prev.combat.turnOrder, payload.combatant]
            .sort((a, b) => b.initiative - a.initiative)
        }
      };
    });
  };

  // Handler: combat:combatant:update
  const handleCombatCombatantUpdate = (payload: { id: string; updates: any; }) => {
    console.log('[WS] Combatant updated:', payload);
    setState(prev => {
      if (!prev.combat) return prev;
      return {
        ...prev,
        combat: {
          ...prev.combat,
          turnOrder: prev.combat.turnOrder.map(c =>
            c.id === payload.id ? { ...c, ...payload.updates } : c
          )
        }
      };
    });
  };

  // Handler: combat:combatant:remove
  const handleCombatCombatantRemove = (payload: { id: string; }) => {
    console.log('[WS] Combatant removed:', payload);
    setState(prev => {
      if (!prev.combat) return prev;
      return {
        ...prev,
        combat: {
          ...prev.combat,
          turnOrder: prev.combat.turnOrder.filter(c => c.id !== payload.id)
        }
      };
    });
  };

  // Handler: combat:action
  const handleCombatAction = (payload: { action: any; }) => {
    console.log('[WS] Combat action:', payload);
    setState(prev => {
      if (!prev.combat) return prev;
      return {
        ...prev,
        combat: {
          ...prev.combat,
          history: [...prev.combat.history, payload.action]
        }
      };
    });
  };

  // Register listeners
  socketService.on('combat:update', handleCombatUpdate);
  socketService.on('combat:start', handleCombatStart);
  socketService.on('combat:end', handleCombatEnd);
  socketService.on('combat:next-turn', handleCombatNextTurn);
  socketService.on('combat:combatant:add', handleCombatCombatantAdd);
  socketService.on('combat:combatant:update', handleCombatCombatantUpdate);
  socketService.on('combat:combatant:remove', handleCombatCombatantRemove);
  socketService.on('combat:action', handleCombatAction);

  // Return cleanup function
  return () => {
    socketService.off('combat:update', handleCombatUpdate);
    socketService.off('combat:start', handleCombatStart);
    socketService.off('combat:end', handleCombatEnd);
    socketService.off('combat:next-turn', handleCombatNextTurn);
    socketService.off('combat:combatant:add', handleCombatCombatantAdd);
    socketService.off('combat:combatant:update', handleCombatCombatantUpdate);
    socketService.off('combat:combatant:remove', handleCombatCombatantRemove);
    socketService.off('combat:action', handleCombatAction);
  };
};
