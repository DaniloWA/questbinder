/**
 * Weather Sublayer
 * 
 * Handles Rain, Snow, and other particle-based weather effects.
 */

import { SFXSublayer } from '../core/SFXSublayer';
import { ParticleEngine, Particle } from '../core/ParticleEngine';
import { RenderContext } from '../../core/types';
import { SFXConfig } from '@/types'; // Path might need adjustment depending on aliases

const RE_RAIN = 1;
const RE_SNOW = 2;

export class WeatherSublayer implements SFXSublayer {
  id = 'weather';
  enabled = true;

  private engine: ParticleEngine;
  private config: SFXConfig = {}; // use SFXConfig

  // Track spawn timers per type
  private timeSinceSpawn = {
    rain: 0,
    snow: 0
  };

  // Settings per weather type
  private settings = {
    rain: {
      spawnRate: 2, // ms between spawns (at max intensity)
      gravity: 800,
      wind: -50,
      color: 'rgba(170, 190, 220, 0.6)',
      life: 5.0,
    },
    snow: {
      spawnRate: 10,
      gravity: 50,
      wind: 20,
      color: 'rgba(255, 255, 255, 0.8)',
      life: 60.0,
    }
  };

  constructor() {
    this.engine = new ParticleEngine({ maxParticles: 2000 });
  }

  // Called by SFXLayer
  setConfig(config: SFXConfig) {
    this.config = config;
    // If all disabled, maybe reset?
    // For now we just stop spawning. Particles die naturally.
  }

  update(deltaTime: number, context: RenderContext): void {
    const { mapWidth, mapHeight, viewport } = context;

    // Calculate visible bounds for culling
    const visibleTop = -viewport.y / viewport.zoom;
    const visibleBottom = (-viewport.y + context.canvas.height) / viewport.zoom;

    // --- Spawner Logic ---
    const supportedTypes: Array<'rain' | 'snow'> = ['rain', 'snow'];

    supportedTypes.forEach(type => {
      const effect = this.config[type];
      if (effect && effect.enabled && effect.intensity > 0) {
        this.spawnParticles(type, effect.intensity, deltaTime, context);
      }
    });

    // --- Update Particles ---
    this.engine.update(deltaTime, (p, dt) => {
      // Common Physics
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Type Specific
      if (p.data2 === RE_SNOW) {
        // Sway
        p.data1 += dt * 2; // sway time
        p.x += Math.sin(p.data1) * 20 * dt;
      }

      // Kill if off-screen (bottom)
      // Allow buffer for wide screens or swaying
      if (p.y > visibleBottom + 100) {
        p.life = 0;
      }
    });
  }

  private spawnParticles(type: 'rain' | 'snow', intensity: number, deltaTime: number, context: RenderContext) {
    const settings = this.settings[type];
    this.timeSinceSpawn[type] += deltaTime * 1000;

    // Intensity affects spawn rate directly. 
    // Higher intensity = lower interval.
    // Base rate is for max intensity.
    const spawnInterval = settings.spawnRate / Math.max(0.01, intensity);

    let spawnCount = 0;
    // Cap spawn per frame to avoid freezing if huge lag spike
    while (this.timeSinceSpawn[type] > spawnInterval && spawnCount < 100) {
      this.timeSinceSpawn[type] -= spawnInterval;
      spawnCount++;
      const p = this.engine.spawn();
      if (p) {
        this.initParticle(p, type, intensity, context);
      }
    }
  }

  private initParticle(p: Particle, type: 'rain' | 'snow', intensity: number, context: RenderContext) {
    const { viewport } = context;
    const visibleW = context.canvas.width / viewport.zoom;
    const visibleX = -viewport.x / viewport.zoom;
    const visibleY = -viewport.y / viewport.zoom;

    const config = this.config[type];
    const base = this.settings[type];

    // Defaults
    const speedMult = config?.speed ?? 1;
    const sizeMult = config?.size ?? 1;
    const customColor = config?.color;
    const customWind = config?.wind;

    // Spawn area
    p.x = visibleX + Math.random() * visibleW * 1.5 - visibleW * 0.25;
    p.y = visibleY - 100;

    p.life = base.life;
    p.maxLife = base.life;
    p.color = customColor || base.color;
    p.data2 = type === 'rain' ? RE_RAIN : RE_SNOW;

    if (type === 'rain') {
      const wind = customWind ?? base.wind;
      p.vx = wind + (Math.random() - 0.5) * 20;
      p.vy = (base.gravity * speedMult) + (Math.random() * 200);
      p.size = 2 * sizeMult;
      p.data1 = 15 * sizeMult; // tail length scaled
    } else {
      const wind = customWind ?? base.wind;
      p.vx = wind + (Math.random() - 0.5) * 10;
      p.vy = (base.gravity * speedMult) + (Math.random() * 20);
      p.size = (Math.random() * 2 + 1) * sizeMult;
      p.data1 = Math.random() * Math.PI * 2;
    }
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    if (this.engine.getActiveCount() === 0) return;

    ctx.save();

    // We can't batch efficiently without sorting, but canvas draw calls are cheap enough for this count
    // or we set style per particle.
    // For optimization, we could accept that we set strokeStyle multiple times.

    this.engine.render(ctx, (c, p) => {
      if (p.data2 === RE_RAIN) {
        c.strokeStyle = p.color;
        c.lineWidth = p.size || 1; // Use particle size
        c.beginPath();
        c.moveTo(p.x, p.y);
        // Use data1 for tail length factor if we want independent control, 
        // but vx/vy based trail is usually good enough. 
        // p.data1 is tail length in init?
        // in init: p.data1 = 15 * sizeMult;
        // current buffer: 0.05s of movement.
        // Let's keep existing logic but maybe check if we want to use data1? 
        // "c.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);" corresponds to 50ms of travel.
        c.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
        c.stroke();
      } else if (p.data2 === RE_SNOW) {
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();
      }
    });

    ctx.restore();
  }

  destroy(): void {
    this.engine.reset();
  }

  getStats() {
    return {
      activeParticles: this.engine.getActiveCount(),
      rainEnabled: this.config.rain?.enabled,
      snowEnabled: this.config.snow?.enabled
    };
  }
}
