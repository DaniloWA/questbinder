import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Cache for rendered SVG images
const svgImageCache: Record<string, HTMLImageElement> = {};

/**
 * Renders a React SVG component to a canvas-drawable HTMLImageElement
 * Results are cached by a unique key (shapeId + color)
 */
export const renderCursorToImage = (
  Component: React.FC<{ color?: string; size?: number; }>,
  color: string,
  size: number,
  cacheKey: string
): HTMLImageElement | null => {
  // Check cache first
  if (svgImageCache[cacheKey] && svgImageCache[cacheKey].complete) {
    return svgImageCache[cacheKey];
  }

  // Render the React component to static SVG markup
  const svgMarkup = renderToStaticMarkup(
    React.createElement(Component, { color, size })
  );

  // Create a data URL from the SVG
  const encodedSvg = encodeURIComponent(svgMarkup);
  const dataUrl = `data:image/svg+xml,${encodedSvg}`;

  // Create and cache the image
  const img = new Image();
  img.src = dataUrl;
  svgImageCache[cacheKey] = img;

  // If already loaded (synchronous for data URLs), return it
  if (img.complete && img.naturalWidth > 0) {
    return img;
  }

  // Image not yet loaded, will be ready on next frame
  return null;
};

/**
 * Clears the cursor image cache (call when user changes cursor settings)
 */
export const clearCursorImageCache = (prefix?: string) => {
  if (prefix) {
    Object.keys(svgImageCache).forEach(key => {
      if (key.startsWith(prefix)) {
        delete svgImageCache[key];
      }
    });
  } else {
    Object.keys(svgImageCache).forEach(key => delete svgImageCache[key]);
  }
};
