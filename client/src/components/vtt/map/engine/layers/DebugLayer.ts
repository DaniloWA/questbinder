/**
 * VTT Engine - Debug Layer V2 (Professional)
 *
 * Renders real-time performance statistics overlay.
 * - 3-Minute History Graphs (FPS & Frame Time)
 * - Advanced Statistics (Min/Max/Avg/1% Low) per Layer
 * - Dynamic Resizing Layout
 * - Internationalization Support
 * - Configurable Modules
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { DebugLogger } from '../../../../../utils/DebugLogger';

interface StatsSnapshot {
  min: number;
  max: number;
  avg: number;
  low1: number; // 1% Low (99th percentile for Frame Time, 1st for FPS)
}

interface LayerStatsSnapshot extends StatsSnapshot {
  id: string;
}

export class DebugLayer extends BaseLayer {
  constructor() {
    super('debug', 'Debug Stats', {
      useCache: false, // Always dynamic
      opacity: 0.9,
    });
  }

  computeStateHash(context: RenderContext): string {
    return 'dynamic'; // Never cache
  }

  // --- History Buffers (Circular) ---
  // 60 FPS * 180 Seconds = 10,800 frames (~3 minutes)
  private readonly HISTORY_SIZE = 10800;
  private fpsHistory: Float32Array = new Float32Array(this.HISTORY_SIZE);
  private ftHistory: Float32Array = new Float32Array(this.HISTORY_SIZE);
  private headIndex = 0;
  private count = 0;

  // Per-Layer History: Map<LayerID, History>
  // We keep a shorter history for layers to save memory (e.g. 10s = 600 frames)
  private readonly LAYER_HISTORY_SIZE = 600;
  private layerHistories: Map<string, Float32Array> = new Map();
  private layerHeadIndex = 0; // Shared index for simplicity (assuming all layers update same frame)

  // Stats Cache
  private lastStatsUpdate = 0;
  private cachedGlobalStats = {
    fps: { min: 0, max: 0, avg: 0, low1: 0 },
    ft: { min: 0, max: 0, avg: 0, low1: 0 }
  };
  private cachedLayerStats: LayerStatsSnapshot[] = [];

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    if (!this.orchestrator) return;

    // Reset transform to draw in screen space (HUD)
    ctx.save();
    ctx.resetTransform();

    const now = performance.now();
    const fps = this.orchestrator.getFps();
    const layerStates = this.orchestrator.getLayerStates();
    const i18n = context.i18nLabels?.diagnostics || {
      title: 'Performance Diagnostics',
      fpsStability: 'FPS Stability',
      frameTime: 'Frame Time',
      layerBreakdown: 'Layer Breakdown',
      min: 'MIN',
      max: 'MAX',
      avg: 'AVG',
      low1: '1% LOW'
    };

    // 0. Get Config
    const config = DebugLogger.getConfig().diagnostics || {
      showFps: true, showFrameTime: true, showLayerBreakdown: true, detailedStats: true, graphDuration: 4
    };

    // 1. Update History
    this.updateHistory(fps, layerStates);

    // 2. Update Stats (Throttle to 500ms)
    if (now - this.lastStatsUpdate > 500) {
      this.calculateAllStats(layerStates);
      this.lastStatsUpdate = now;
    }

    // 3. Stable Sort
    layerStates.sort((a, b) => a.id.localeCompare(b.id));

    // 4. Layout & Rendering
    this.drawLayout(ctx, i18n, fps, layerStates, config);

    ctx.restore();
  }

  private updateHistory(fps: number, layers: import('../core/types').LayerState[]) {
    // Global
    this.fpsHistory[this.headIndex] = fps;

    const totalFrameTime = layers.reduce((acc, l) => acc + l.lastRenderTime, 0);
    this.ftHistory[this.headIndex] = totalFrameTime;

    this.headIndex = (this.headIndex + 1) % this.HISTORY_SIZE;
    if (this.count < this.HISTORY_SIZE) this.count++;

    // Layers
    for (const layer of layers) {
      let hist = this.layerHistories.get(layer.id);
      if (!hist) {
        hist = new Float32Array(this.LAYER_HISTORY_SIZE);
        this.layerHistories.set(layer.id, hist);
      }
      hist[this.layerHeadIndex] = layer.lastRenderTime;
    }
    this.layerHeadIndex = (this.layerHeadIndex + 1) % this.LAYER_HISTORY_SIZE;
  }

  private calculateAllStats(layers: import('../core/types').LayerState[]) {
    // 1. Global FPS
    this.cachedGlobalStats.fps = this.computeStats(this.fpsHistory, this.count, true);

    // 2. Global Frame Time
    this.cachedGlobalStats.ft = this.computeStats(this.ftHistory, this.count, false);

    // 3. Per Layer
    this.cachedLayerStats = layers.map(l => {
      const hist = this.layerHistories.get(l.id);
      if (!hist) return { id: l.id, min: 0, max: 0, avg: 0, low1: 0 };

      const count = Math.min(this.count, this.LAYER_HISTORY_SIZE);
      const stats = this.computeStats(hist, count, false);
      return { id: l.id, ...stats };
    });
  }

  private computeStats(buffer: Float32Array, count: number, higherIsBetter: boolean): StatsSnapshot {
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    const values: number[] = [];

    for (let i = 0; i < count; i++) {
      const val = buffer[i];
      if (val < min) min = val;
      if (val > max) max = val;
      sum += val;
      values.push(val);
    }

    values.sort((a, b) => a - b);
    let low1 = 0;
    if (higherIsBetter) {
      const idx = Math.floor(values.length * 0.01);
      low1 = values[idx] || min;
    } else {
      const idx = Math.floor(values.length * 0.99);
      low1 = values[idx] || max;
    }

    return {
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 0 : max,
      avg: count > 0 ? sum / count : 0,
      low1
    };
  }

  // --- Drawing ---

  private drawLayout(ctx: CanvasRenderingContext2D, i18n: any, currentFps: number, layers: import('../core/types').LayerState[], config: any) {
    // 1. Measure Content
    const padding = 12;
    const startY = 85;
    const baseWidth = 320;

    // Calculate Height Dynamically
    let contentHeight = 40; // Title area
    if (config.showFps) contentHeight += 120; // FPS height
    if (config.showFrameTime) contentHeight += 120; // FT height

    if (config.showLayerBreakdown) {
      contentHeight += 30; // List Header
      contentHeight += layers.length * 18; // List items
    }

    // 2. Draw Background
    ctx.fillStyle = 'rgba(8, 8, 8, 0.95)'; // Deep black
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(5, startY, baseWidth, contentHeight, 8);
    ctx.fill();
    ctx.stroke();

    // 3. Draw Content
    let y = startY + padding + 10;
    const contentW = baseWidth - (padding * 2);

    // Title
    ctx.font = 'bold 13px system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(i18n.title, padding + 5, y);
    y += 25;

    // FPS Section
    if (config.showFps) {
      this.drawSection(ctx, i18n.fpsStability, currentFps.toFixed(0), this.cachedGlobalStats.fps, this.fpsHistory, '#22c55e', padding + 5, y, contentW, true, i18n, '', config.detailedStats);
      y += 120;
    }

    // Frame Time Section
    if (config.showFrameTime) {
      this.drawSection(ctx, i18n.frameTime, this.cachedGlobalStats.ft.avg.toFixed(2) + 'ms', this.cachedGlobalStats.ft, this.ftHistory, '#f59e0b', padding + 5, y, contentW, false, i18n, 'ms', config.detailedStats);
      y += 120;
    }

    // Layer Breakdown Section
    if (config.showLayerBreakdown) {
      // Extra spacing to prevent overlap
      y += 0;

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 11px monospace';
      ctx.fillText(i18n.layerBreakdown.toUpperCase(), padding + 5, y);
      y += 25; // More breathing room for headers

      // Headers
      const col1 = contentW * 0.40; // Name
      const col2 = contentW * 0.20; // Avg
      const col3 = contentW * 0.20; // 1%
      const col4 = contentW * 0.20; // Graph

      ctx.font = '10px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('LAYER', padding + 5, y - 15);

      if (config.detailedStats) {
        ctx.fillText(i18n.avg, padding + 5 + col1, y - 15);
        ctx.fillText(i18n.low1, padding + 5 + col1 + col2, y - 15);
      } else {
        ctx.fillText('TIME', padding + 5 + col1, y - 15);
      }

      for (const layer of layers) {
        const stats = this.cachedLayerStats.find(s => s.id === layer.id) || { avg: 0, low1: 0, max: 0, min: 0 };
        const rowY = y;

        // Highlights for slow layers
        if (stats.avg > 2 || stats.low1 > 4) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
          ctx.fillRect(padding, rowY - 11, contentW + 10, 18);
        } else if (layer.lastRenderTime > 2) {
          ctx.fillStyle = 'rgba(234, 179, 8, 0.1)';
          ctx.fillRect(padding, rowY - 11, contentW + 10, 18);
        }

        // Name
        ctx.fillStyle = layer.enabled ? '#e2e8f0' : '#475569';
        ctx.font = '11px monospace';
        ctx.fillText(layer.id.slice(0, 15), padding + 5, rowY);

        // Values
        if (config.detailedStats) {
          ctx.fillStyle = this.getCostColor(stats.avg);
          ctx.fillText(stats.avg.toFixed(1), padding + 5 + col1, rowY);

          ctx.fillStyle = this.getCostColor(stats.low1);
          ctx.fillText(stats.low1.toFixed(1), padding + 5 + col1 + col2, rowY);
        } else {
          // Simple View
          ctx.fillStyle = this.getCostColor(layer.lastRenderTime);
          ctx.fillText(layer.lastRenderTime.toFixed(1) + 'ms', padding + 5 + col1, rowY);
        }

        // Micro Graph (Always visible as visual aid)
        const maxGraph = 8; // 8ms full
        const barW = Math.min(col4, (layer.lastRenderTime / maxGraph) * col4);

        // Start X depends on layout
        const barX = config.detailedStats ? (padding + 5 + col1 + col2 + col3) : (padding + 5 + col1 + col2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(barX, rowY - 7, col4, 6);

        ctx.fillStyle = this.getCostColor(layer.lastRenderTime);
        ctx.fillRect(barX, rowY - 7, barW, 6);

        y += 18;
      }
    }
  }

  private drawSection(ctx: CanvasRenderingContext2D, title: string, value: string, stats: StatsSnapshot, history: Float32Array, color: string, x: number, y: number, w: number, isFps: boolean, i18n: any, unit = '', detailed = true) {
    // Header
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(title, x, y);

    ctx.textAlign = 'right';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = color;
    ctx.fillText(value, x + w, y);
    ctx.textAlign = 'left';

    y += 8;

    // Graph
    const graphH = 50;
    this.drawGraph(ctx, history, this.headIndex, this.count, x, y, w, graphH, isFps ? 144 : 33, color);
    y += graphH + 8;

    // Stats Row
    if (detailed) {
      const colW = w / 4;
      ctx.font = '10px monospace';
      ctx.fillStyle = '#64748b';

      ctx.fillText(i18n.min, x, y + 10);
      ctx.fillText(i18n.max, x + colW, y + 10);
      ctx.fillText(i18n.avg, x + colW * 2, y + 10);
      ctx.fillText(i18n.low1, x + colW * 3, y + 10);

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#e2e8f0';

      const valY = y + 22;
      ctx.fillText(stats.min.toFixed(1) + unit, x, valY);
      ctx.fillText(stats.max.toFixed(1) + unit, x + colW, valY);
      ctx.fillText(stats.avg.toFixed(1) + unit, x + colW * 2, valY);

      ctx.fillStyle = isFps ? (stats.low1 < 30 ? '#ef4444' : '#e2e8f0') : (stats.low1 > 16 ? '#ef4444' : '#e2e8f0');
      ctx.fillText(stats.low1.toFixed(1) + unit, x + colW * 3, valY);
    }
  }

  // Optimized Graph Drawing for Circular Buffer
  private drawGraph(ctx: CanvasRenderingContext2D, buffer: Float32Array, head: number, count: number, x: number, y: number, w: number, h: number, maxVal: number, color: string) {
    // BG
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Draw last 4 seconds
    const drawCount = Math.min(count, 240);
    const stepX = w / drawCount;

    let bufferIdx = (head - drawCount + this.HISTORY_SIZE) % this.HISTORY_SIZE;

    for (let i = 0; i < drawCount; i++) {
      const val = buffer[bufferIdx];
      const normalized = Math.min(1, Math.max(0, val / maxVal));
      const plotY = y + h - (normalized * h);
      const plotX = x + (i * stepX);

      if (i === 0) ctx.moveTo(plotX, plotY);
      else ctx.lineTo(plotX, plotY);

      bufferIdx = (bufferIdx + 1) % this.HISTORY_SIZE;
    }
    ctx.stroke();

    // Fill
    const gradient = ctx.createLinearGradient(0, y, 0, y + h);
    gradient.addColorStop(0, color + '44');
    gradient.addColorStop(1, color + '00');

    ctx.fillStyle = gradient;
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.fill();
  }

  private getCostColor(ms: number): string {
    if (ms > 5) return '#ef4444'; // Red
    if (ms > 2) return '#f97316'; // Orange
    if (ms > 1) return '#eab308'; // Yellow
    return '#3b82f6'; // Blue
  }
}
