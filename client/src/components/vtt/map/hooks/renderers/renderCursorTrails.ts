/**
 * Remote Cursor Trail Renderer
 * 
 * Uses shared trailRenderer module for consistent rendering with local cursor.
 * This file handles the remote cursor specific interface and data transformation.
 */

import {
  renderTrail,
  TrailConfig,
  TrailPoint,
  HealthStatus,
  getEffectiveAnimation
} from '../../../../../utils/trailRenderer';

// Re-export types for compatibility with existing imports
export type { TrailConfig } from '../../../../../utils/trailRenderer';

export interface RenderData {
  position: { x: number; y: number; };
  trailHistory: TrailPoint[];
  trailConfig: TrailConfig;
  healthStatus?: string;
}

/**
 * Renders cursor trails for remote cursors.
 * Uses the shared trailRenderer module for consistent visuals with local cursor.
 * 
 * @param ctx - Canvas 2D rendering context
 * @param renderData - Data from cursor physics engine
 * @param cursorColor - Fallback color if not specified in config
 * @param zoom - Current viewport zoom level
 */
export const renderCursorTrails = (
  ctx: CanvasRenderingContext2D,
  renderData: RenderData,
  cursorColor: string,
  zoom: number
): void => {
  const { trailConfig, trailHistory, healthStatus, position } = renderData;

  // Skip if no trail history
  if (!trailHistory || trailHistory.length === 0) return;

  // Build config with fallback color
  const config: TrailConfig = {
    ...trailConfig,
    color: trailConfig.color || cursorColor,
  };

  // Call shared renderer
  renderTrail(ctx, trailHistory, config, {
    zoom,
    currentPosition: position,
    healthStatus: healthStatus as HealthStatus,
  });
};
