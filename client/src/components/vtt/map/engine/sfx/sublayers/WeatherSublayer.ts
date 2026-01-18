/**
 * Weather Sublayer
 * 
 * Handles Rain, Snow, and other particle-based weather effects.
 */

import { SFXSublayer } from '../core/SFXSublayer';
import { ParticleEngine, Particle } from '../core/ParticleEngine';
import { RenderContext } from '../../core/types';
import { SFXConfig, SFXParticleConfig } from '../../../../../../types/models';

const RE_RAIN = 1;
const RE_SNOW = 2;
const RE_LEAVES = 3;
const RE_EMBERS = 4;
const RE_FIREFLIES = 5;
const RE_DUST = 6;
const RE_ASH = 7;
const RE_BIRDS = 8;

export class WeatherSublayer implements SFXSublayer {
  id = 'weather';
  enabled = true;

  private engine: ParticleEngine;
  private config: SFXConfig = {}; // use SFXConfig

  // Track spawn timers per type
  private timeSinceSpawn = {
    rain: 0,
    snow: 0,
    leaves: 0,
    embers: 0,
    fireflies: 0,
    dust: 0,
    ash: 0,
    birds: 0
  };

  // Settings per weather type
  private settings = {
    rain: {
      spawnRate: 2,
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
    },
    leaves: {
      spawnRate: 100,
      gravity: 40,
      wind: 30,
      color: 'rgba(210, 140, 50, 0.9)', // Autumn Orange
      life: 10.0,
    },
    embers: {
      spawnRate: 20,
      gravity: -60, // Rises
      wind: 10,
      color: 'rgba(255, 100, 0, 1)', // Fire Orange
      life: 4.0,
    },
    fireflies: {
      spawnRate: 150,
      gravity: 0,
      wind: 5,
      color: 'rgba(150, 255, 100, 1)', // Glow Green
      life: 15.0,
    },
    dust: {
      spawnRate: 200,
      gravity: 5,
      wind: 5,
      color: 'rgba(200, 190, 180, 0.3)', // Pale Dust
      life: 20.0,
    },
    ash: {
      spawnRate: 15,
      gravity: 30,
      wind: 15,
      color: 'rgba(50, 50, 50, 0.8)', // Dark Grey
      life: 60.0,
    },
    birds: {
      spawnRate: 800,
      gravity: 0,
      wind: 150, // Fast
      color: 'rgba(220, 220, 220, 0.9)',
      life: 15.0
    }
  };

  constructor() {
    this.engine = new ParticleEngine({ maxParticles: 3000 }); // Bumped limit for more FX
  }

  // Called by SFXLayer
  setConfig(config: SFXConfig) {
    this.config = config;
  }

  update(deltaTime: number, context: RenderContext): void {
    const { mapWidth, mapHeight, viewport } = context;

    // Calculate visible bounds for culling
    const visibleTop = -viewport.y / viewport.zoom;
    const visibleBottom = (-viewport.y + context.canvas.height) / viewport.zoom;
    const visibleLeft = -viewport.x / viewport.zoom;
    const visibleRight = (-viewport.x + context.canvas.width) / viewport.zoom;

    // --- Spawner Logic ---
    const supportedTypes: Array<keyof typeof this.settings> = [
      'rain', 'snow', 'leaves', 'embers', 'fireflies', 'dust', 'ash', 'birds'
    ];

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

      // Type Specific Behavior
      if (p.data2 === RE_SNOW || p.data2 === RE_DUST) {
        // Simple Sway
        p.data1 += dt * (p.data2 === RE_DUST ? 1 : 2);
        p.x += Math.sin(p.data1) * (p.data2 === RE_DUST ? 5 : 20) * dt;
      }
      else if (p.data2 === RE_ASH) {
        // Chaotic sway
        p.x += (Math.random() - 0.5) * 10 * dt;
      }
      else if (p.data2 === RE_LEAVES) {
        // Complex Tumble
        p.rotation += p.rotSpeed * dt;
        p.data1 += dt * 1.5; // Phase
        p.x += Math.cos(p.data1) * 40 * dt; // Strong sway
        p.y += Math.sin(p.rotation) * 10 * dt; // Lift/Dip based on angle
      }
      else if (p.data2 === RE_EMBERS) {
        // Rise and Drift
        p.x += Math.sin(p.life * 2) * 10 * dt; // Wiggle
        // Cooling color handled in render
      }
      else if (p.data2 === RE_FIREFLIES) {
        // Wandering Steering
        const wanderStrength = 50;
        p.vx += (Math.random() - 0.5) * wanderStrength * dt;
        p.vy += (Math.random() - 0.5) * wanderStrength * dt;

        // Dampen velocity to keep them slowish
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Hard Clamp
        p.vx = Math.max(-30, Math.min(30, p.vx));
        p.vy = Math.max(-30, Math.min(30, p.vy));
      }
      else if (p.data2 === RE_BIRDS) {
        // Flapping Animation: data1 stores flap phase
        p.data1 += dt * 10; // Flap speed

        // Velocity Alignment
        // Ensure they fly "forward"
        // p.rotation is explicit for birds (direction)
        // If speed is high, align rotation
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 1) {
          const angle = Math.atan2(p.vy, p.vx);
          // Lerp rotation for smoothness?
          p.rotation = angle;
        }
      }

      // Kill if off-screen
      // Embers/Birds/Fireflies need wider bounds
      const buffer = 200;
      if (
        p.y > visibleBottom + buffer ||
        p.y < visibleTop - buffer ||
        p.x > visibleRight + buffer ||
        p.x < visibleLeft - buffer
      ) {
        p.life = 0;
      }
    });
  }

  private spawnParticles(type: keyof typeof this.settings, intensity: number, deltaTime: number, context: RenderContext) {
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

  private initParticle(p: Particle, type: keyof typeof this.settings, intensity: number, context: RenderContext) {
    const { viewport } = context;
    const visibleW = context.canvas.width / viewport.zoom;
    const visibleH = context.canvas.height / viewport.zoom;
    const visibleX = -viewport.x / viewport.zoom;
    const visibleY = -viewport.y / viewport.zoom;

    const config = this.config[type as keyof SFXConfig] as SFXParticleConfig;
    const base = this.settings[type];

    // Defaults
    const speedMult = config?.speed ?? 1;
    const sizeMult = config?.size ?? 1;
    const customColor = config?.color;
    const customWind = config?.wind ?? base.wind;

    // Position Logic
    p.x = visibleX + Math.random() * visibleW * 1.5 - visibleW * 0.25;

    if (type === 'embers') {
      p.y = visibleY + visibleH + 50; // Bottom
    } else if (type === 'fireflies' || type === 'dust' || type === 'birds') {
      // Birds usually spawn from side based on wind?
      if (type === 'birds') {
        p.x = customWind > 0 ? visibleX - 100 : visibleX + visibleW + 100;
        p.y = visibleY + Math.random() * visibleH;
      } else {
        // Fireflies/Dust: Spawn mostly onscreen (80%) for immediate visibility
        if (Math.random() < 0.8) {
          p.x = visibleX + Math.random() * visibleW;
          p.y = visibleY + Math.random() * visibleH;
        } else {
          // Edges
          p.y = visibleY - 50;
          p.x = visibleX + Math.random() * visibleW;
        }
      }
    } else {
      p.y = visibleY - 50; // Top
    }

    p.life = base.life;
    p.maxLife = base.life;
    p.color = customColor || base.color;
    p.alpha = 1;

    // Set Type ID
    const typeMap: Record<string, number> = {
      rain: RE_RAIN, snow: RE_SNOW, leaves: RE_LEAVES, embers: RE_EMBERS,
      fireflies: RE_FIREFLIES, dust: RE_DUST, ash: RE_ASH, birds: RE_BIRDS
    };
    p.data2 = typeMap[type];

    // Velocity
    p.vx = customWind + (Math.random() - 0.5) * (type === 'birds' ? 20 : 20);
    p.vy = (base.gravity * speedMult) + (Math.random() * (type === 'rain' ? 200 : 10));

    // Special Inits
    if (type === 'leaves') {
      p.size = (Math.random() * 4 + 3) * sizeMult;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 2;
      p.data1 = Math.random() * Math.PI; // Phase

      // Random leaf colors (only if no custom color)
      if (!customColor) {
        const colors = ['#e05206', '#d69611', '#8c2626', '#5d8c26']; // Autumn Mix
        p.color = Math.random() < 0.7 ? (Math.random() < 0.5 ? colors[0] : colors[1]) : colors[2];
      }
    }
    else if (type === 'embers') {
      p.size = (Math.random() * 2 + 1) * sizeMult;
    }
    else if (type === 'fireflies') {
      p.size = (Math.random() * 2 + 2) * sizeMult;
      p.vx = (Math.random() - 0.5) * 20;
      p.vy = (Math.random() - 0.5) * 20;
    }
    else if (type === 'birds') {
      p.size = (Math.random() * 5 + 3) * sizeMult;
      p.vx = customWind || (Math.random() > 0.5 ? 100 : -100); // Fast
      p.vy = (Math.random() - 0.5) * 20;
    }
    else if (type === 'ash') {
      p.size = (Math.random() * 3 + 1) * sizeMult;
      p.rotation = Math.random() * Math.PI;
    }
    else {
      p.size = (Math.random() * 2 + 1) * sizeMult;
      p.data1 = Math.random() * Math.PI * 2;
    }
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    if (this.engine.getActiveCount() === 0) return;

    ctx.save();

    this.engine.render(ctx, (c, p) => {
      // Fade out near end of life
      const lifePct = p.life / p.maxLife;
      c.globalAlpha = p.alpha * Math.min(1, lifePct * 2);

      if (p.data2 === RE_RAIN) {
        c.strokeStyle = p.color;
        c.lineWidth = p.size || 1;
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
        c.stroke();
      }
      else if (p.data2 === RE_SNOW) {
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();
      }
      else if (p.data2 === RE_ASH) {
        c.fillStyle = p.color;
        c.beginPath();
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rotation);
        // Jagged particle
        c.moveTo(-p.size, -p.size);
        c.lineTo(p.size, -p.size / 2);
        c.lineTo(0, p.size);
        c.fill();
        c.restore();
      }
      else if (p.data2 === RE_DUST) {
        c.fillStyle = p.color;
        c.shadowColor = p.color;
        c.shadowBlur = 4; // Soft mote
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
      }
      else if (p.data2 === RE_EMBERS) {
        // Cooling effect: White/Yellow -> Orange -> Red -> Grey
        // Simple trick: Start defined color, fade to red as life drops
        // Only if default color is used? Or blend?
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = p.color;
        // We can manipulate HSL for cooling if we had color util, but simple opacity fade works well with 'lighter'
        // Let's add an inner hot core
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();

        c.globalCompositeOperation = 'source-over';
      }
      else if (p.data2 === RE_FIREFLIES) {
        // Pulse
        const pulse = 0.5 + Math.sin(Date.now() * 0.005 + p.id) * 0.5;
        c.fillStyle = p.color;
        c.globalAlpha = pulse;

        c.shadowColor = p.color;
        c.shadowBlur = 8; // Glow
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
      }
      else if (p.data2 === RE_LEAVES) {
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rotation);
        c.fillStyle = p.color;

        // Leaf shape (Bezier)
        c.beginPath();
        c.moveTo(0, -p.size);
        c.bezierCurveTo(p.size, -p.size / 2, p.size, p.size / 2, 0, p.size);
        c.bezierCurveTo(-p.size, p.size / 2, -p.size, -p.size / 2, 0, -p.size);
        c.fill();

        // Vein
        c.strokeStyle = 'rgba(0,0,0,0.2)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, -p.size);
        c.lineTo(0, p.size * 0.8);
        c.stroke();

        c.restore();
      }
      else if (p.data2 === RE_BIRDS) {
        c.strokeStyle = p.color;
        c.lineWidth = 2;
        c.lineCap = 'round';
        c.lineJoin = 'round';

        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rotation); // Already aligned to velocity angle (0 = Right)

        const flap = Math.sin(p.data1);
        const wingY = p.size * (0.5 + flap * 0.5); // Flap amplitude

        c.beginPath();
        // "V" pointing Right (>)
        // Tip at (size/2, 0)
        // Wings at (-size/2, -wingY) and (-size/2, +wingY)
        c.moveTo(-p.size / 2, -wingY);
        c.lineTo(p.size / 2, 0);
        c.lineTo(-p.size / 2, wingY);
        c.stroke();

        c.restore();
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
