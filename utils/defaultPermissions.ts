import { TokenHoverPermissions, SessionPermissions } from '../types/models';

export const defaultTokenHoverPermissions: TokenHoverPermissions = {
  pc: {
    showName: true,
    showHP: true,
    showResource: true,
    showConditions: true,
    showStats: true,
    showAttributes: true,
  },
  npc: {
    showName: true,
    showHP: true,
    showResource: true,
    showConditions: true,
    showStats: true,
    showAttributes: true,
  },
  object: {
    showName: true,
    showConditions: true,
  },
};

export const getDefaultPermissions = (): SessionPermissions => ({
  // Interação Básica
  tokenMovement: true,
  doorControl: true,
  drawings: true,
  measure: true,
  pingMap: true,
  diceRolling: true,

  // Gestão de Tokens
  tokenCreate: false,
  tokenEdit: false,
  tokenDelete: false,

  // Ferramentas Avançadas
  fogReveal: false,

  // Novas Permissões
  compendiumBrowse: true,
  journalCreate: false,
  sheetEdit: true,
  initiativeRoll: true,
  drawingDelete: false,
  drawingClear: false,

  // Privacidade
  shareCursor: true,
  allowSpectate: true,

  // Token Hover Visibility
  tokenHover: defaultTokenHoverPermissions,

  // Logs
  logConfig: {
    movement: 'gm',
    combat: 'public',
    rolls: 'public',
    system: 'gm',
    broadcastConditions: true, // Default: GM broadcasts condition changes to chat
  },

  // Overrides por Usuário
  userOverrides: {},
});

