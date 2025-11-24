import { CombatSettings, CombatStats, CombatState } from '../types/models';

export const getDefaultCombatSettings = (): CombatSettings => ({
  autoRollInitiative: true,
  autoAdvanceTurn: false,
  autoAdvanceDelay: 30,
  showInitiativeToPlayers: true,
  showEnemyHP: false,
  showEnemyAC: false,
  trackConcentration: true,
  autoRemoveDeadCombatants: false,
  enableTurnTimer: false,
  turnTimerDuration: 60,
  enableSuggestions: true,
});

export const getDefaultCombatStats = (): CombatStats => ({
  totalDamageDealt: 0,
  totalHealingDone: 0,
  roundsElapsed: 0,
  combatStartTime: Date.now(),
});

export const getEmptyCombatState = (): CombatState => ({
  isActive: false,
  round: 0,
  turnOrder: [],
  activeTurnIndex: 0,
  settings: getDefaultCombatSettings(),
  history: [],
  surpriseRound: false,
  stats: getDefaultCombatStats(),
});
