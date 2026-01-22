import { useEffect, useRef, useState } from 'react';
import { MapScene, Token } from '../../../../types';

// Global cache to persist across re-renders/unmounts
const globalImageCache: { [src: string]: HTMLImageElement; } = {};

export const useImageLoader = (scene: MapScene | null, tokens: Token[]) => {
  // We can use a ref to expose the cache synchronously
  const imageCacheRef = useRef<{ [src: string]: HTMLImageElement; }>(globalImageCache);

  // Track if the main scene background is loaded to trigger re-renders
  const [isBackgroundLoaded, setBackgroundLoaded] = useState(false);

  // Track overall loading progress
  const [progress, setProgress] = useState({ loaded: 0, total: 0, percent: 0 });
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!scene) return;

    // Identify unique images
    const imagesToLoad = new Set<string>();
    if (scene.imageUrl) imagesToLoad.add(scene.imageUrl);
    tokens.forEach(t => { if (t.imgUrl) imagesToLoad.add(t.imgUrl); });

    const total = imagesToLoad.size;
    let loaded = 0;

    // Check what is already in global cache
    imagesToLoad.forEach(src => {
      if (globalImageCache[src] && globalImageCache[src].complete) {
        loaded++;
      }
    });

    // Initial State update
    setProgress({ loaded, total, percent: total === 0 ? 100 : Math.floor((loaded / total) * 100) });

    // Check BG status
    if (scene.imageUrl && globalImageCache[scene.imageUrl]?.complete) {
      setBackgroundLoaded(true);
    } else {
      setBackgroundLoaded(false);
    }

    if (total === 0) {
      // pure grid map?
      setBackgroundLoaded(true);
      return;
    }

    // Load missing/pending images
    imagesToLoad.forEach(src => {
      if (!globalImageCache[src]) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = src;
        globalImageCache[src] = img;
        imageCacheRef.current[src] = img;
      }

      const img = globalImageCache[src];

      // Handler with Throttling
      const handleLoad = () => {
        loaded++;
        if (loaded > total) loaded = total;

        // Update immediate state for background but throttle progress for UI
        if (src === scene.imageUrl) {
          setBackgroundLoaded(true);
        }

        // Throttle check
        const now = Date.now();
        // Always update on last image or if enough time passed
        if (loaded === total || (now - lastUpdateRef.current > 100)) {
          setProgress({ loaded, total, percent: Math.floor((loaded / total) * 100) });
          lastUpdateRef.current = now;
        }
      };

      if (img.complete) {
        // Already counted in initial pass?
        // If yes, we don't need to do anything.
        // If NO (it completed between init pass and here), we should count it.
        // But we can't easily know if we counted it above without a Set of "already counted".
        // Actually, we counted: `if (globalImageCache[src].complete) loaded++`.
        // So if it's complete, it's counted.
        // The original code had a redundant setBackgroundLoaded here.
        // The handleLoad function now correctly handles both.
        handleLoad();
      } else {
        // Not complete, attach listener
        // Note: If multiple effects attach, we might get multiple calls.
        // VTT usually stabilizes quickly, but let's be safe.
        const previous = img.onload;
        img.onload = (e) => {
          if (typeof previous === 'function') previous.call(img, e);
          handleLoad();
        };
        img.onerror = () => {
          // Count errors as loaded to not block progress
          handleLoad();
          console.warn(`Failed to load asset: ${src}`);
        };
      }
    });

  }, [scene?.imageUrl, JSON.stringify(tokens.map(t => t.imgUrl))]);

  return {
    imageCache: imageCacheRef.current,
    isBackgroundLoaded,
    progress
  };
};
