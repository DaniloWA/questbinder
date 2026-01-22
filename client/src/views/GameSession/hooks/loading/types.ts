/**
 * Smart Loader Type Definitions
 * 
 * Centralized types for the VTT loading system following project patterns.
 * @module loading/types
 */

// ============================================================================
// Asset Types
// ============================================================================

/** Type of asset being loaded */
export type LoaderAssetType = 'module' | 'image' | 'font' | 'audio';

/** Current status of an asset in the loading pipeline */
export type AssetStatus = 'pending' | 'loading' | 'loaded' | 'error';

/** Individual asset being tracked by the loader */
export interface LoaderAsset {
  /** Unique identifier for deduplication */
  id: string;
  /** URL or module path */
  url: string;
  /** Type of asset */
  type: LoaderAssetType;
  /** Human-readable name for display */
  name: string;
  /** Current loading status */
  status: AssetStatus;
  /** Number of retry attempts made */
  retryCount: number;
  /** Optional dynamic import function for code modules */
  loader?: () => Promise<unknown>;
  /** Error message if status is 'error' */
  error?: string;
}

// ============================================================================
// Stage Types
// ============================================================================

/** Loading stage identifiers in sequence order */
export type LoaderStage = 'connection' | 'ping' | 'session' | 'modules' | 'assets';

/** All possible stages as readonly array for iteration */
export const LOADER_STAGES: readonly LoaderStage[] = [
  'connection',
  'ping',
  'session',
  'modules',
  'assets'
] as const;

/** Configuration for a single loading stage */
export interface LoaderStageConfig {
  /** Stage identifier */
  stage: LoaderStage;
  /** Weight as percentage of total progress (all should sum to 100) */
  weight: number;
  /** Label for UI display */
  label: string;
  /** Icon name for UI display */
  icon: string;
}

// ============================================================================
// Progress Types
// ============================================================================

/** Progress tracking for assets */
export interface LoaderProgress {
  /** Number of successfully loaded assets */
  loaded: number;
  /** Total number of assets to load */
  total: number;
  /** Percentage complete (0-100) */
  percent: number;
}

/** Overall progress combining stages and assets */
export interface OverallProgress {
  /** Current percentage (0-100) */
  percent: number;
  /** Target percentage based on completed stages */
  target: number;
}

// ============================================================================
// Log Types
// ============================================================================

/** Entry in the loading log */
export interface LogEntry {
  /** Unique ID for React keys */
  id: string;
  /** Log message */
  message: string;
  /** Timestamp */
  timestamp: number;
  /** Log level */
  level: 'info' | 'warn' | 'error';
}

// ============================================================================
// Hook Return Types
// ============================================================================

/** Props for useSmartLoader hook */
export interface SmartLoaderProps {
  /** Active scene data */
  scene: {
    id?: string;
    imageUrl?: string;
  } | null;
  /** Tokens to preload images from */
  tokens: Array<{ id?: string; imgUrl?: string; name?: string; }>;
  /** Characters to preload avatars from */
  characters: Array<{ id?: string; avatarUrl?: string; name?: string; }>;
  /** Handouts to preload images from */
  handouts: Array<{ id?: string; type?: string; content?: string; name?: string; }>;
  /** Session connection status */
  isConnected: boolean;
  /** Active scene availability flag */
  hasActiveScene: boolean;
  /** Callback when loading completes */
  onComplete: () => void;
}

/** Return type for useAssetLoader hook */
export interface UseAssetLoaderReturn {
  /** All tracked assets with their status */
  assets: LoaderAsset[];
  /** Current loading progress */
  progress: LoaderProgress;
  /** Name of currently loading file (for UI) */
  currentFile: string;
  /** Whether all assets have finished loading */
  isComplete: boolean;
  /** Add new assets to the queue */
  addAssets: (newAssets: Omit<LoaderAsset, 'status' | 'retryCount'>[]) => void;
}

/** Return type for useLoaderStages hook */
export interface UseLoaderStagesReturn {
  /** Current active stage */
  currentStage: LoaderStage;
  /** Status of each stage */
  stageStatuses: Record<LoaderStage, AssetStatus>;
  /** Whether all stages are complete */
  isComplete: boolean;
  /** Overall progress percentage */
  overallProgress: number;
  /** Measured ping latency */
  pingMs: number | null;
  /** Logs for terminal display */
  logs: LogEntry[];
  /** Add a log entry */
  addLog: (message: string, level?: LogEntry['level']) => void;
}

/** Return type for useSmartLoader hook (main orchestrator) */
export interface UseSmartLoaderReturn {
  // Core State
  currentStage: LoaderStage;
  isComplete: boolean;

  // Progress
  progress: LoaderProgress;
  overallProgress: number;
  currentFile: string;

  // Detailed State
  assets: LoaderAsset[];
  stageStatuses: Record<LoaderStage, AssetStatus>;
  pingMs: number | null;
  logs: LogEntry[];
}
