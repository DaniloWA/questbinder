/**
 * VTT Engine - Particle Core
 * 
 * High-performance particle engine using object pooling.
 * Designed for canvas rendering of weather and spell effects.
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface Particle {
  id: number;
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotSpeed: number;
  // Generic data for specific effects (e.g., drift offset for snow)
  data1: number;
  data2: number;
}

export interface ParticleConfig {
  maxParticles: number;
}

export class ParticleEngine {
  private particles: Particle[] = [];
  private pool: number[] = []; // Indices of inactive particles
  private activeCount: number = 0;
  private maxParticles: number;

  constructor(config: ParticleConfig) {
    this.maxParticles = config.maxParticles;
    this.initPool();
  }

  private initPool(): void {
    this.particles = new Array(this.maxParticles);
    this.pool = [];

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles[i] = {
        id: i,
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 1,
        color: '#fff',
        alpha: 1,
        rotation: 0,
        rotSpeed: 0,
        data1: 0,
        data2: 0,
      };
      this.pool.push(i);
    }
  }

  /**
   * Spawn a new particle.
   * Returns the particle object (reference) to initialize, or null if pool is full.
   */
  spawn(): Particle | null {
    if (this.pool.length === 0) return null;

    const index = this.pool.pop()!;
    const p = this.particles[index];
    p.active = true;
    this.activeCount++;
    return p;
  }

  /**
   * Update all active particles.
   * @param deltaTime Time in seconds
   * @param updateFn Callback to update individual particle logic (physics, aging)
   */
  update(deltaTime: number, updateFn: (p: Particle, dt: number) => void): void {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      updateFn(p, deltaTime);

      // Kill if dead
      if (p.life <= 0 || p.alpha <= 0) {
        this.kill(i);
      }
    }
  }

  /**
   * Render all active particles.
   * @param ctx Canvas Context
   * @param renderFn Callback to render individual particle
   */
  render(ctx: CanvasRenderingContext2D, renderFn: (ctx: CanvasRenderingContext2D, p: Particle) => void): void {
    // Optimization: Batch rendering could happen in the renderFn if we grouped by texture/color
    // For now, we iterate.
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      renderFn(ctx, p);
    }
  }

  private kill(index: number): void {
    if (this.particles[index].active) {
      this.particles[index].active = false;
      this.pool.push(index);
      this.activeCount--;
    }
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  reset(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.particles[i].active) {
        this.particles[i].active = false;
        this.pool.push(i);
      }
    }
    this.activeCount = 0;
  }
}
