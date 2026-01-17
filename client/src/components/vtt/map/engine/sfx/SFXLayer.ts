/**
 * SFX Layer
 * 
 * Main container for all Special Effects.
 * Manages specialized sublayers (Weather, Atmosphere).
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { SFXSublayer } from './core/SFXSublayer';
import { WeatherSublayer } from './sublayers/WeatherSublayer';
import { AtmosphereSublayer } from './sublayers/AtmosphereSublayer';
import { SFXConfig } from '@/types';

export class SFXLayer extends BaseLayer {
  private sublayers: SFXSublayer[] = [];

  // Public accessors for controlling effects
  public weather: WeatherSublayer;
  public atmosphere: AtmosphereSublayer;

  constructor() {
    super('sfx', 'Special Effects', {
      useCache: false, // Always dynamic
      opacity: 1,
    });

    this.weather = new WeatherSublayer();
    this.atmosphere = new AtmosphereSublayer();

    // Default to a test state usually, but for production starting off
    // We can enable them via API later.
    // Testing:
    this.sublayers = [this.weather, this.atmosphere];
  }

  setConfig(config: any) { // Using any temporarly to avoid circular dep issues in this tool, but actually should be SFXConfig
    // In TS we import SFXConfig.
    // But since I can't easily change imports in this block without more lines, casting or assuming config structure matches.
    // Actually I should add import if missing. It is likely missing.

    this.weather.setConfig(config);

    if (config.fog) {
      this.atmosphere.setConfig(config.fog);
    } else {
      this.atmosphere.setConfig({ enabled: false, intensity: 0 });
    }
  }

  computeStateHash(context: RenderContext): string {
    return 'dynamic';
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    // Update steps
    // Ideally update should be separate from render in the Orchestrator,
    // but RenderContext includes deltaMs, so we can do it here.
    const dt = context.deltaMs / 1000;

    // Performance: Don't update if delta huge (tab inactive)
    if (dt > 0.5) return;

    for (const layer of this.sublayers) {
      if (layer.enabled) {
        layer.update(dt, context);

        ctx.save();
        layer.render(ctx, context);
        ctx.restore();
      }
    }
  }
}
