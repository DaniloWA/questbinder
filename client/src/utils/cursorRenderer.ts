import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Cache for rendered SVG images
const svgImageCache: Record<string, HTMLImageElement> = {};

// Cache for CSS cursor URLs
const cssCursorCache: Record<string, string> = {};

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
    Object.keys(cssCursorCache).forEach(key => {
      if (key.startsWith(prefix)) {
        delete cssCursorCache[key];
      }
    });
  } else {
    Object.keys(svgImageCache).forEach(key => delete svgImageCache[key]);
    Object.keys(cssCursorCache).forEach(key => delete cssCursorCache[key]);
  }
};

/**
 * Generates a CSS cursor value from a React cursor component
 * Returns a CSS cursor string like "url(data:...) 12 12, auto"
 */
export const generateCssCursor = (
  Component: React.FC<{ color?: string; size?: number; }>,
  color: string,
  size: number,
  hotspotX: number,
  hotspotY: number,
  cacheKey: string
): string => {
  // Check cache first
  if (cssCursorCache[cacheKey]) {
    return cssCursorCache[cacheKey];
  }

  // Render the React component to static SVG markup
  const svgMarkup = renderToStaticMarkup(
    React.createElement(Component, { color, size })
  );

  // Create a data URL from the SVG
  const encodedSvg = encodeURIComponent(svgMarkup);
  const dataUrl = `data:image/svg+xml,${encodedSvg}`;

  // Scale hotspot to cursor size (original components are designed for ~24px, we render at 32px)
  const scale = size / 24;
  const scaledHotspotX = Math.round(hotspotX * scale);
  const scaledHotspotY = Math.round(hotspotY * scale);

  // Create CSS cursor value with hotspot
  const cssValue = `url("${dataUrl}") ${scaledHotspotX} ${scaledHotspotY}, auto`;

  // Cache it
  cssCursorCache[cacheKey] = cssValue;

  return cssValue;
};

