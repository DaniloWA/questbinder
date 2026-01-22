/**
 * Smart Loader Hook
 * 
 * Main orchestrator hook that composes useAssetLoader and useLoaderStages
 * to provide a complete loading experience for the VTT.
 * 
 * Following project handler patterns:
 * - Typed return interface
 * - Composed from specialized hooks
 * - Clean separation of concerns
 * 
 * @module hooks/useSmartLoader
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../../i18n/TranslationContext';
import { Token, Character, Handout, MapScene } from '../../../types';
import {
  UseSmartLoaderReturn,
  LoaderAsset,
  LOADER_STAGES,
} from './loading';
import { useAssetLoader } from './loading/useAssetLoader';
import { useLoaderStages } from './loading/useLoaderStages';
import { CORE_MODULES, LOADER_CONFIG } from './loading/constants';

// ============================================================================
// Types
// ============================================================================

export interface SmartLoaderProps {
  /** Active scene data */
  scene: MapScene | null;
  /** Tokens to preload images from */
  tokens: Token[];
  /** Characters to preload avatars from */
  characters: Character[];
  /** Handouts to preload images from */
  handouts: Handout[];
  /** Socket connection status */
  isConnected: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build asset list from scene data with deduplication.
 * Returns a hash for dependency tracking alongside the assets.
 */
function buildAssetList(
  scene: MapScene | null,
  tokens: Token[],
  characters: Character[],
  handouts: Handout[]
): { assets: Omit<LoaderAsset, 'status' | 'retryCount'>[]; hash: string; } {
  const uniqueUrls = new Set<string>();
  const assets: Omit<LoaderAsset, 'status' | 'retryCount'>[] = [];
  const hashParts: string[] = [];

  const add = (
    url: string | undefined | null,
    type: LoaderAsset['type'],
    name: string,
    loader?: () => Promise<unknown>
  ) => {
    if (!url || uniqueUrls.has(url)) return;
    uniqueUrls.add(url);
    hashParts.push(url);

    assets.push({
      id: `asset:${type}:${url}`,
      url,
      type,
      name,
      loader,
    });
  };

  // 1. Core Modules (High Priority)
  CORE_MODULES.forEach(m => add(m.url, 'module', m.name, m.loader));

  // 2. Scene Background
  if (scene?.imageUrl) {
    add(scene.imageUrl, 'image', 'Carregando: Imagem de Fundo do Mapa Principal');
  }

  // 3. Token Images
  (tokens || []).forEach((t, idx) => {
    if (t.imgUrl) {
      add(t.imgUrl, 'image', `Carregando: Sprite do Token "${t.name || `Criatura #${idx + 1}`}"`);
    }
  });

  // 4. Character Avatars
  (characters || []).forEach(c => {
    if (c.avatarUrl) {
      add(c.avatarUrl, 'image', `Carregando: Avatar do Personagem "${c.name}"`);
    }
  });

  // 5. Handout Images
  (handouts || []).forEach(h => {
    if (h.type === 'image' && h.content) {
      add(h.content, 'image', `Carregando: Imagem do Handout "${h.name}"`);
    }
  });

  return {
    assets,
    hash: hashParts.join('|'),
  };
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Smart Loader Hook - Main Orchestrator
 * 
 * Composes specialized hooks to provide complete loading functionality:
 * - useAssetLoader: Handles image/module loading with retry logic
 * - useLoaderStages: Manages stage progression and logging
 * 
 * @example
 * const loader = useSmartLoader({
 *   scene: session.activeScene,
 *   tokens,
 *   characters,
 *   handouts,
 *   isConnected: session.isConnected,
 * });
 * 
 * if (loader.isComplete) {
 *   // Show main interface
 * }
 */
export const useSmartLoader = ({
  scene,
  tokens,
  characters,
  handouts,
  isConnected,
}: SmartLoaderProps): UseSmartLoaderReturn => {
  // Track completion callback
  const completionCalledRef = useRef(false);

  // Create a stable key for memoization based on data counts and scene
  // This avoids the circular reference issue with assetHash
  const assetKey = useMemo(() => {
    const tokenUrls = (tokens || []).map(t => t.imgUrl).filter(Boolean).join(',');
    const charUrls = (characters || []).map(c => c.avatarUrl).filter(Boolean).join(',');
    const handoutUrls = (handouts || [])
      .filter(h => h.type === 'image' && h.content)
      .map(h => h.content)
      .join(',');
    return `${scene?.id || ''}|${scene?.imageUrl || ''}|${tokenUrls}|${charUrls}|${handoutUrls}`;
  }, [scene?.id, scene?.imageUrl, tokens, characters, handouts]);

  // Build asset list with memoized key for change detection
  const { assets: assetDefinitions } = useMemo(
    () => buildAssetList(scene, tokens, characters, handouts),
    [assetKey]
  );

  // Memoize asset definitions properly
  const memoizedAssets = useMemo(() => assetDefinitions, [assetKey]);

  // Translation hook
  const { t } = useTranslation();

  // Track if modules stage is complete (so we know when to start loading assets)
  const [modulesComplete, setModulesComplete] = useState(false);

  // Asset loading hook - only loads when modules stage is complete
  const assetLoader = useAssetLoader({ shouldStartLoading: modulesComplete });

  // Add assets when they change (but they won't load until shouldStartLoading is true)
  useEffect(() => {
    if (memoizedAssets.length > 0) {
      assetLoader.addAssets(memoizedAssets);
    }
  }, [memoizedAssets, assetLoader.addAssets]);

  // Stage management hook
  const stages = useLoaderStages({
    isConnected,
    hasActiveScene: !!scene,
    sceneName: scene?.name,
    assetsComplete: assetLoader.isComplete,
    assetCount: assetLoader.assets.length,
    t,
  });

  // Watch for modules stage completion to trigger asset loading
  useEffect(() => {
    if (stages.stageStatuses.modules === 'loaded' && !modulesComplete) {
      setModulesComplete(true);
    }
  }, [stages.stageStatuses.modules, modulesComplete]);

  // Final completion state
  const isComplete = stages.isComplete && assetLoader.isComplete;

  // Return composed state following project patterns
  return {
    // Core State
    currentStage: stages.currentStage,
    isComplete,

    // Progress
    progress: assetLoader.progress,
    overallProgress: stages.overallProgress,
    currentFile: assetLoader.currentFile || t('vtt.loading.finalization.ready'),

    // Detailed State
    assets: assetLoader.assets,
    stageStatuses: stages.stageStatuses,
    pingMs: stages.pingMs,
    logs: stages.logs,
  };
};

// Re-export types for convenience
export type { UseSmartLoaderReturn } from './loading';

