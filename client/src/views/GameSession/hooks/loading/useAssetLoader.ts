/**
 * Asset Loader Hook
 * 
 * Manages loading of individual assets (images, modules) with:
 * - Deduplication via ref-based tracking
 * - Retry logic on failure
 * - Progress tracking without race conditions
 * - Proper cleanup on unmount
 * 
 * @module loading/useAssetLoader
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { LoaderAsset, UseAssetLoaderReturn, LoaderProgress } from './types';
import { LOADER_CONFIG } from './constants';

interface UseAssetLoaderProps {
  /** Only start loading when this is true (waits for assets stage) */
  shouldStartLoading?: boolean;
}

/**
 * Hook for managing asset loading with proper race condition handling.
 * Uses refs to track in-progress loads and prevent duplicate requests.
 */
export const useAssetLoader = ({ shouldStartLoading = false }: UseAssetLoaderProps = {}): UseAssetLoaderReturn => {
  const [assets, setAssets] = useState<LoaderAsset[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('');

  // Refs to prevent race conditions
  const loadingRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef<Set<string>>(new Set());
  const isActiveRef = useRef<boolean>(true);
  const lastUpdateRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  /**
   * Add new assets to the loading queue.
   * Automatically deduplicates based on asset ID.
   */
  const addAssets = useCallback((newAssets: Omit<LoaderAsset, 'status' | 'retryCount'>[]) => {
    setAssets(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const uniqueNew = newAssets
        .filter(a => !existingIds.has(a.id))
        .map(a => ({
          ...a,
          status: 'pending' as const,
          retryCount: 0,
        }));

      if (uniqueNew.length === 0) return prev;
      return [...prev, ...uniqueNew];
    });
  }, []);

  /**
   * Update a single asset's status immutably.
   */
  const updateAssetStatus = useCallback((id: string, status: LoaderAsset['status'], error?: string) => {
    if (!isActiveRef.current) return;

    setAssets(prev => prev.map(asset =>
      asset.id === id
        ? { ...asset, status, error }
        : asset
    ));
  }, []);

  /**
   * Load a single image asset.
   */
  const loadImage = useCallback((asset: LoaderAsset): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        loadedRef.current.add(asset.id);
        updateAssetStatus(asset.id, 'loaded');
        resolve();
      };

      img.onerror = () => {
        if (asset.retryCount < LOADER_CONFIG.MAX_ASSET_RETRIES) {
          // Retry with incremented count
          setAssets(prev => prev.map(a =>
            a.id === asset.id
              ? { ...a, retryCount: a.retryCount + 1, status: 'pending' as const }
              : a
          ));
        } else {
          console.warn(`[AssetLoader] Failed to load after ${LOADER_CONFIG.MAX_ASSET_RETRIES} retries:`, asset.url);
          loadedRef.current.add(asset.id); // Count as "done" to not block completion
          updateAssetStatus(asset.id, 'error', `Failed to load: ${asset.url}`);
        }
        resolve();
      };

      img.src = asset.url;
    });
  }, [updateAssetStatus]);

  /**
   * Load a code module asset via dynamic import.
   */
  const loadModule = useCallback(async (asset: LoaderAsset): Promise<void> => {
    if (!asset.loader) {
      updateAssetStatus(asset.id, 'error', 'No loader function provided');
      return;
    }

    try {
      await asset.loader();
      loadedRef.current.add(asset.id);
      updateAssetStatus(asset.id, 'loaded');
    } catch (error) {
      console.error(`[AssetLoader] Module load failed:`, asset.name, error);
      if (asset.retryCount < LOADER_CONFIG.MAX_ASSET_RETRIES) {
        setAssets(prev => prev.map(a =>
          a.id === asset.id
            ? { ...a, retryCount: a.retryCount + 1, status: 'pending' as const }
            : a
        ));
      } else {
        loadedRef.current.add(asset.id);
        updateAssetStatus(asset.id, 'error', `Module load failed: ${asset.name}`);
      }
    }
  }, [updateAssetStatus]);

  /**
   * Process a single asset based on its type.
   */
  const processAsset = useCallback(async (asset: LoaderAsset) => {
    // Skip if already loading or loaded
    if (loadingRef.current.has(asset.id) || loadedRef.current.has(asset.id)) {
      return;
    }

    // Mark as loading
    loadingRef.current.add(asset.id);
    updateAssetStatus(asset.id, 'loading');

    // Throttle UI updates for current file
    const now = Date.now();
    if (now - lastUpdateRef.current > LOADER_CONFIG.PROGRESS_UPDATE_THROTTLE_MS) {
      setCurrentFile(asset.name);
      lastUpdateRef.current = now;
    }

    // Load based on type
    switch (asset.type) {
      case 'image':
        await loadImage(asset);
        break;
      case 'module':
        await loadModule(asset);
        break;
      default:
        // For unsupported types, just mark as loaded
        loadedRef.current.add(asset.id);
        updateAssetStatus(asset.id, 'loaded');
    }

    // Remove from loading set
    loadingRef.current.delete(asset.id);
  }, [loadImage, loadModule, updateAssetStatus]);

  // Sequential loading ref to prevent multiple loops
  const isLoadingSequenceRef = useRef(false);

  // Main loading effect - processes assets SEQUENTIALLY
  // Only starts when shouldStartLoading is true (assets stage has begun)
  useEffect(() => {
    if (!isActiveRef.current) return;
    if (!shouldStartLoading) return; // Wait for assets stage to begin
    if (isLoadingSequenceRef.current) return; // Already running sequence

    const pendingAssets = assets.filter(a => a.status === 'pending');
    if (pendingAssets.length === 0) return;

    // Start sequential loading
    isLoadingSequenceRef.current = true;

    const loadSequentially = async () => {
      for (const asset of pendingAssets) {
        if (!isActiveRef.current) break;

        // Show current file name
        setCurrentFile(asset.name);

        // Process the asset
        await processAsset(asset);

        // Wait minimum display time so user can see each asset
        await new Promise(resolve =>
          setTimeout(resolve, LOADER_CONFIG.MIN_ASSET_DISPLAY_MS)
        );
      }
      isLoadingSequenceRef.current = false;
    };

    loadSequentially();
  }, [assets, processAsset, shouldStartLoading]);

  // Calculate actual progress (no animation needed since loading is sequential)
  const progress: LoaderProgress = {
    loaded: assets.filter(a => a.status === 'loaded' || a.status === 'error').length,
    total: assets.length,
    percent: assets.length > 0
      ? Math.floor((assets.filter(a => a.status === 'loaded' || a.status === 'error').length / assets.length) * 100)
      : 0,
  };

  // Check if complete
  const isComplete = assets.length > 0 && assets.every(a => a.status === 'loaded' || a.status === 'error');

  // Get failed assets for error display
  const failedAssets = assets.filter(a => a.status === 'error');

  return {
    assets,
    progress,
    currentFile,
    isComplete,
    addAssets,
    failedAssets,
  };
};

