import { useEffect, useRef, useState } from 'react';
import { MapScene, Token } from '../../../../types';

// Global cache to persist across re-renders/unmounts
const globalImageCache: { [src: string]: HTMLImageElement; } = {};

// Track retry counts for failed images (max 3 retries)
const imageRetryCount: { [src: string]: number; } = {};
const MAX_IMAGE_RETRIES = 3;
const RETRY_INTERVAL_MS = 5000; // 5 seconds between retry attempts

/**
 * Update the global image cache with a loaded image.
 * Can be called from other components (e.g., TokenHover) when they load an image.
 */
export const updateGlobalImageCache = (src: string, img: HTMLImageElement) => {
  if (img.complete && img.naturalWidth > 0) {
    globalImageCache[src] = img;
    // Clear any failed status since it loaded successfully
    delete imageRetryCount[src];
  }
};

/**
 * Get an image from the global cache, or null if not loaded.
 */
export const getFromImageCache = (src: string): HTMLImageElement | null => {
  const cached = globalImageCache[src];
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }
  return null;
};

/**
 * Check if an image is in cache and successfully loaded.
 */
export const isImageCached = (src: string): boolean => {
  const cached = globalImageCache[src];
  return !!(cached && cached.complete && cached.naturalWidth > 0);
};

export const useImageLoader = (scene: MapScene | null, tokens: Token[]) => {
  // We can use a ref to expose the cache synchronously
  const imageCacheRef = useRef<{ [src: string]: HTMLImageElement; }>(globalImageCache);

  // Track if the main scene background is loaded to trigger re-renders
  const [isBackgroundLoaded, setBackgroundLoaded] = useState(false);

  // Track overall loading progress
  const [progress, setProgress] = useState({ loaded: 0, total: 0, percent: 0 });
  const lastUpdateRef = useRef(0);

  // Track failed images for retry
  const failedImagesRef = useRef<Set<string>>(new Set());

  // Function to attempt loading an image with retry tracking
  const loadImage = (src: string, onLoad: () => void) => {
    // Check if we've exceeded max retries
    if ((imageRetryCount[src] || 0) >= MAX_IMAGE_RETRIES) {
      console.warn(`Max retries (${MAX_IMAGE_RETRIES}) exceeded for: ${src}`);
      return;
    }

    // Create new image element
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      // Success - remove from failed tracking
      failedImagesRef.current.delete(src);
      delete imageRetryCount[src];
      onLoad();
    };

    img.onerror = () => {
      // Track retry count
      imageRetryCount[src] = (imageRetryCount[src] || 0) + 1;
      failedImagesRef.current.add(src);

      console.warn(`Failed to load image (attempt ${imageRetryCount[src]}/${MAX_IMAGE_RETRIES}): ${src}`);

      // Count as "loaded" to not block progress, but keep tracking for retry
      onLoad();
    };

    img.src = src;
    globalImageCache[src] = img;
    imageCacheRef.current[src] = img;
  };

  useEffect(() => {
    if (!scene) return;

    // Identify unique images
    const imagesToLoad = new Set<string>();
    if (scene.imageUrl) imagesToLoad.add(scene.imageUrl);
    tokens.forEach(t => { if (t.imgUrl) imagesToLoad.add(t.imgUrl); });

    const total = imagesToLoad.size;

    // Use a ref-like object to track loaded count (avoids closure issues)
    const loadState = { loaded: 0, processed: new Set<string>() };

    // Check what is already in global cache and successfully loaded
    imagesToLoad.forEach(src => {
      const cached = globalImageCache[src];
      if (cached && cached.complete && cached.naturalWidth > 0) {
        loadState.loaded++;
        loadState.processed.add(src);
      }
    });

    // Initial State update
    setProgress({ loaded: loadState.loaded, total, percent: total === 0 ? 100 : Math.floor((loadState.loaded / total) * 100) });

    // Check BG status
    const bgImage = scene.imageUrl ? globalImageCache[scene.imageUrl] : null;
    if (bgImage?.complete && bgImage.naturalWidth > 0) {
      setBackgroundLoaded(true);
    } else {
      setBackgroundLoaded(false);
    }

    if (total === 0) {
      // pure grid map?
      setBackgroundLoaded(true);
      return;
    }

    // Shared handler that uses the loadState object (not closure variable)
    const handleImageLoaded = (src: string) => {
      // Prevent double-counting
      if (loadState.processed.has(src)) return;
      loadState.processed.add(src);

      loadState.loaded++;
      if (loadState.loaded > total) loadState.loaded = total;

      // Update immediate state for background
      const bgImg = globalImageCache[src];
      if (src === scene.imageUrl && bgImg?.complete && bgImg.naturalWidth > 0) {
        setBackgroundLoaded(true);
      }

      // Always update progress
      setProgress({ loaded: loadState.loaded, total, percent: Math.floor((loadState.loaded / total) * 100) });
    };

    // Load missing/pending images
    imagesToLoad.forEach(src => {
      // Skip already processed
      if (loadState.processed.has(src)) return;

      const cached = globalImageCache[src];

      if (cached && cached.complete && cached.naturalWidth > 0) {
        // Already successfully loaded (shouldn't happen due to initial check, but safety)
        handleImageLoaded(src);
      } else if (cached && cached.complete && cached.naturalWidth === 0) {
        // Broken image - mark as processed but track for retry
        failedImagesRef.current.add(src);
        handleImageLoaded(src);
      } else if (!cached) {
        // Not in cache - load it
        loadImage(src, () => handleImageLoaded(src));
      } else {
        // In progress - attach listeners
        const img = cached;
        const previous = img.onload;
        img.onload = (e) => {
          if (typeof previous === 'function') previous.call(img, e);
          handleImageLoaded(src);
        };
        const previousError = img.onerror;
        img.onerror = (e) => {
          if (typeof previousError === 'function') previousError.call(img, e);
          imageRetryCount[src] = (imageRetryCount[src] || 0) + 1;
          failedImagesRef.current.add(src);
          handleImageLoaded(src);
          console.warn(`Failed to load asset (attempt ${imageRetryCount[src]}/${MAX_IMAGE_RETRIES}): ${src}`);
        };
      }
    });

  }, [scene?.imageUrl, JSON.stringify(tokens.map(t => t.imgUrl))]);

  // Periodic retry for failed images
  useEffect(() => {
    const retryInterval = setInterval(() => {
      if (failedImagesRef.current.size === 0) return;

      // First, check if any "failed" images were actually loaded successfully elsewhere
      // (e.g., by TokenHover or another component)
      const actuallyLoaded: string[] = [];
      failedImagesRef.current.forEach(src => {
        const cached = globalImageCache[src];
        if (cached && cached.complete && cached.naturalWidth > 0) {
          // Image was actually loaded successfully! Remove from failed list
          actuallyLoaded.push(src);
          delete imageRetryCount[src];
        }
      });

      // Remove successfully loaded images from failed set
      actuallyLoaded.forEach(src => failedImagesRef.current.delete(src));

      // Filter to only images that need retry
      const toRetry = Array.from(failedImagesRef.current).filter(
        src => (imageRetryCount[src] || 0) < MAX_IMAGE_RETRIES
      );

      if (toRetry.length === 0) return;

      console.log(`Retrying ${toRetry.length} failed image(s)...`);

      toRetry.forEach(src => {
        // Double-check cache one more time
        const cached = globalImageCache[src];
        if (cached && cached.complete && cached.naturalWidth > 0) {
          failedImagesRef.current.delete(src);
          delete imageRetryCount[src];
          return;
        }

        // Remove old broken image from cache
        delete globalImageCache[src];
        delete imageCacheRef.current[src];
        failedImagesRef.current.delete(src);

        // Reload with retry tracking
        loadImage(src, () => {
          // Trigger a re-render by updating progress
          setProgress(prev => ({ ...prev }));
        });
      });
    }, RETRY_INTERVAL_MS);

    return () => clearInterval(retryInterval);
  }, []);

  return {
    imageCache: imageCacheRef.current,
    isBackgroundLoaded,
    progress
  };
};
