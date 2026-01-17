import { RenderContext } from '../../core/types';

/**
 * Interface for SFX Sublayers (Weather, Atmosphere, etc.)
 */
export interface SFXSublayer {
  id: string;
  enabled: boolean;

  /** Update simulation state (physics, particles) */
  update(deltaTime: number, context: RenderContext): void;

  /** Render the effect */
  render(ctx: CanvasRenderingContext2D, context: RenderContext): void;

  /** Clean up resources */
  destroy(): void;
}
