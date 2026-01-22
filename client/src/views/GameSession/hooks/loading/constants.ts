/**
 * Smart Loader Constants
 * 
 * Configurable constants and core module definitions.
 * @module loading/constants
 */

import { LoaderStageConfig, LoaderAsset } from './types';

// ============================================================================
// Timing Configuration
// ============================================================================

export const LOADER_CONFIG = {
  /** Throttle progress updates to reduce UI churn (ms) */
  PROGRESS_UPDATE_THROTTLE_MS: 50,

  /** Minimum time to display each stage so users can read it (ms) */
  MIN_STAGE_DISPLAY_MS: 300,

  /** Delay between stage transitions for visual effect (ms) */
  STAGE_TRANSITION_DELAY_MS: 200,

  /** Delay after modules stage for font loading (ms) */
  MODULES_WARMUP_DELAY_MS: 400,

  /** Maximum retry attempts for failed assets */
  MAX_ASSET_RETRIES: 3,

  /** Timeout for ping measurement (ms) */
  PING_TIMEOUT_MS: 2000,

  /** Fallback ping value if measurement fails (ms) */
  PING_FALLBACK_MS: 45,

  /** Interval for smooth progress animation (ms) */
  PROGRESS_ANIMATION_INTERVAL_MS: 20,

  /** Progress increment per animation frame (slower = more readable) */
  PROGRESS_INCREMENT: 1,

  /** Finalization delay with extra messages before ready (ms) */
  FINALIZATION_DELAY_MS: 2000,

  /** Delay before calling onReady after finalization (ms) */
  COMPLETION_DELAY_MS: 500,

  /** Minimum time to display each asset during loading (ms) */
  MIN_ASSET_DISPLAY_MS: 100,

  /** Maximum total loading time before forcing entry (ms) */
  MAX_LOADING_TIME_MS: 25000,

  /** Time before showing force entry button for stuck stages (ms) */
  STAGE_TIMEOUT_MS: 8000,

  /** Duration to display error modal before auto-entering (ms) */
  ERROR_DISPLAY_MS: 2500,
} as const;

// ============================================================================
// Stage Configuration
// ============================================================================

/** Stage weights for progress calculation (must sum to 100) */
export const STAGE_WEIGHTS: Record<string, number> = {
  connection: 10,
  ping: 10,
  session: 10,
  modules: 20,
  assets: 50,
} as const;

/** Stage configuration with labels and icons */
export const STAGE_CONFIGS: LoaderStageConfig[] = [
  { stage: 'connection', weight: 10, label: 'vtt.loading.connection', icon: 'Wifi' },
  { stage: 'ping', weight: 10, label: 'vtt.loading.ping', icon: 'Terminal' },
  { stage: 'session', weight: 10, label: 'vtt.loading.session', icon: 'Database' },
  { stage: 'modules', weight: 20, label: 'vtt.loading.ui', icon: 'FileCode' },
  { stage: 'assets', weight: 50, label: 'vtt.loading.assets', icon: 'Layers' },
];

// ============================================================================
// Core Modules
// ============================================================================

/** 
 * Core UI modules to preload during the loading screen.
 * These are lazy-loaded components that users will likely need immediately.
 */
export const CORE_MODULES: Omit<LoaderAsset, 'status' | 'retryCount'>[] = [
  {
    id: 'module:permissions',
    url: 'module:permissions',
    type: 'module',
    name: 'Carregando: Sistema de Permissões e Controle de Acesso',
    loader: () => import('../../../../components/vtt/PermissionsModal'),
  },
  {
    id: 'module:sheet-viewer',
    url: 'module:sheet-viewer',
    type: 'module',
    name: 'Carregando: Motor de Visualização de Fichas de Personagem',
    loader: () => import('../../../../components/vtt/CharacterSheetViewer'),
  },
  {
    id: 'module:map-settings',
    url: 'module:map-settings',
    type: 'module',
    name: 'Carregando: Painel de Configurações de Mapa',
    loader: () => import('../../../../components/vtt/MapSettingsModal'),
  },
  {
    id: 'module:handout',
    url: 'module:handout',
    type: 'module',
    name: 'Carregando: Sistema de Handouts e Recursos',
    loader: () => import('../../../../components/vtt/HandoutFormModal'),
  },
  {
    id: 'module:cursor-effects',
    url: 'module:cursor-effects',
    type: 'module',
    name: 'Carregando: Motor de Efeitos de Cursor e Animações',
    loader: () => import('../../../../components/vtt/CursorSettingsModal'),
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique ID for log entries
 */
export const generateLogId = (): string => {
  return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate cumulative progress up to a given stage
 */
export const getStageProgress = (completedStages: string[]): number => {
  return completedStages.reduce((sum, stage) => sum + (STAGE_WEIGHTS[stage] || 0), 0);
};
