/**
 * DebugLogger - Intelligent Console Logging System
 * 
 * Provides categorized, colorful, and filterable logs for debugging complex systems
 * like Rendering, Vision, and Sync.
 * 
 * Usage:
 * DebugLogger.log('vision', 'PolygonCalc', 'Start', 'Calculating polygon', { points: 50 });
 * DebugLogger.warn('sync', 'SyncService', 'Conflict', 'Conflict detected', { id: '123' });
 */

type DebugCategory = 'vision' | 'lighting' | 'render' | 'sync' | 'worker' | 'input' | 'system';

interface LogConfig {
  enabled: boolean;
  categories: Record<DebugCategory, boolean>;
  performance: boolean; // Timing logs
}

const DEFAULT_CONFIG: LogConfig = {
  enabled: true, // Master switch
  categories: {
    vision: true,
    lighting: true,
    render: true,
    sync: true,
    worker: true,
    input: true,
    system: true
  },
  performance: true
};

const CATEGORY_COLORS: Record<DebugCategory, string> = {
  vision: '#10b981', // Emerald
  lighting: '#f59e0b', // Amber
  render: '#6366f1', // Indigo
  sync: '#ef4444', // Red
  worker: '#8b5cf6', // Violet
  input: '#ec4899', // Pink
  system: '#64748b' // Slate
};

class DebugLoggerService {
  private config: LogConfig = { ...DEFAULT_CONFIG };
  private timers: Map<string, number> = new Map();

  constructor() {
    // Load config from localStorage if available
    try {
      const saved = localStorage.getItem('qb_debug_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
      (window as any).QB_DEBUG = this; // Expose for runtime toggling
    } catch { }
  }

  public setCategory(category: DebugCategory, enabled: boolean) {
    this.config.categories[category] = enabled;
    this.save();
  }

  public setAll(enabled: boolean) {
    Object.keys(this.config.categories).forEach(k => this.config.categories[k as DebugCategory] = enabled);
    this.save();
  }

  private save() {
    try {
      localStorage.setItem('qb_debug_config', JSON.stringify(this.config));
    } catch { }
  }

  private shouldLog(category: DebugCategory): boolean {
    return this.config.enabled && this.config.categories[category];
  }

  public log(category: DebugCategory, where: string, what: string, message: string, data?: any) {
    if (!this.shouldLog(category)) return;
    const color = CATEGORY_COLORS[category];
    // Format: [CATEGORY] [INFO] Message -> { where, what, data }
    console.log(
      `%c[${category.toUpperCase()}][INFO] %c${message}`,
      `color: ${color}; font-weight: bold;`,
      'color: inherit;',
      { where, what, data }
    );
  }

  public warn(category: DebugCategory, where: string, what: string, message: string, data?: any) {
    if (!this.shouldLog(category)) return;
    console.warn(
      `[${category.toUpperCase()}] [WARN] ${message}`,
      { where, what, data }
    );
  }

  public error(category: DebugCategory, where: string, what: string, message: string, data?: any) {
    console.error(
      `[${category.toUpperCase()}] [ERROR] ${message}`,
      { where, what, data }
    );
  }

  public time(label: string) {
    if (!this.config.performance) return;
    this.timers.set(label, performance.now());
  }

  public timeEnd(category: DebugCategory, label: string, thresholdMs = 0) {
    if (!this.config.performance) return;
    const start = this.timers.get(label);
    if (!start) return;
    const duration = performance.now() - start;
    if (duration >= thresholdMs) {
      this.log(category, 'DebugLogger', 'Timer', `${label} took ${duration.toFixed(2)}ms`);
    }
    this.timers.delete(label);
  }
}

export const DebugLogger = new DebugLoggerService();
