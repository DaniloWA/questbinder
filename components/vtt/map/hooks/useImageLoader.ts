import { useEffect, useRef } from 'react';
import { MapScene, Token } from '../../../../types';

// Global cache to persist across re-renders/unmounts if desired, 
// or keep it local to the hook if we want it cleared. 
// The original code had it outside the component, so it was global to the module.
const globalImageCache: { [src: string]: HTMLImageElement; } = {};

export const useImageLoader = (scene: MapScene | null, tokens: Token[]) => {
  // We can use a ref to expose the cache synchronously
  const imageCacheRef = useRef<{ [src: string]: HTMLImageElement; }>(globalImageCache);

  useEffect(() => {
    if (!scene) return;
    const imagesToLoad = [scene.imageUrl, ...tokens.map(t => t.imgUrl)];
    imagesToLoad.forEach(src => {
      if (src && !globalImageCache[src]) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = src;
        img.onload = () => {
          globalImageCache[src] = img;
          // Force re-render? No, the canvas loop will pick it up on next frame.
        };
      }
    });
  }, [scene, tokens]);

  return imageCacheRef.current;
};
