import { TokenHoverPermissions, SessionPermissions } from '../types/models';

export const defaultTokenHoverPermissions: TokenHoverPermissions = {
  enabled: true, // Master toggle - hover enabled by default
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
  // Interação Básica - APENAS ferramentas essenciais habilitadas por padrão
  tokenMovement: true,  // Jogadores podem mover seus próprios tokens
  doorControl: false,   // GM deve habilitar explicitamente
  drawings: true,       // Ferramenta de desenho disponível
  measure: true,        // Régua disponível
  pingMap: false,       // GM deve habilitar explicitamente
  diceRolling: true,    // Mesa de dados disponível

  // Gestão de Tokens - Requer permissão do GM
  tokenCreate: false,
  tokenEdit: false,
  tokenDelete: false,

  // Ferramentas Avançadas - Requer permissão do GM
  fogReveal: false,

  // Novas Permissões
  compendiumBrowse: true, // Grimório disponível por padrão
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

