import { socketService } from '../../../../services/socketService';
import { CombatUpdatePayload } from '../../../../types';
import { notifySmartSync } from '../../syncHelpers';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for combat-related events.
 * All handlers update React state AND notify SmartSync cache.
 */
export const registerCombatListeners = ({
  state,
  setState,
  show
}: ListenerDeps): ListenerCleanup => {

  // Handler: combat:update
  const handleCombatUpdate = (payload: CombatUpdatePayload) => {
    if (payload.combat) {
      notifySmartSync({
        entityType: 'combat',
        entityId: (payload.combat as any).id || 'current',
        changeType: 'update',
        data: payload.combat
      });
    }
  };

  // Handler: combat:start
  const handleCombatStart = (payload: { combat: any; }) => {
    notifySmartSync({
      entityType: 'combat',
      entityId: payload.combat?.id || 'current',
      changeType: 'create',
      data: payload.combat
    });

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
    // Get combat ID before clearing state
    const combatId = (state.combat as any)?.id || 'current';

    notifySmartSync({
      entityType: 'combat',
      entityId: combatId,
      changeType: 'delete',
      data: {}
    });

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
    notifySmartSync({
      entityType: 'combat',
      entityId: payload.combat?.id || 'current',
      changeType: 'update',
      data: payload.combat
    });

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
    notifySmartSync({
      entityType: 'combatant',
      entityId: payload.combatant.id,
      changeType: 'create',
      data: payload.combatant
    });
  };

  // Handler: combat:combatant:update
  const handleCombatCombatantUpdate = (payload: { id: string; updates: any; }) => {
    notifySmartSync({
      entityType: 'combatant',
      entityId: payload.id,
      changeType: 'update',
      data: payload.updates
    });
  };

  // Handler: combat:combatant:remove
  const handleCombatCombatantRemove = (payload: { id: string; }) => {
    notifySmartSync({
      entityType: 'combatant',
      entityId: payload.id,
      changeType: 'delete',
      data: {}
    });
  };

  // Handler: combat:action
  const handleCombatAction = (payload: { action: any; }) => {
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
    // Actions are appended to history, no separate cache entry needed
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
