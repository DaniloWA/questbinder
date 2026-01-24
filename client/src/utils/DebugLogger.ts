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

/**
 * DebugLogger v2.0 - Advanced Console & Diagnostics System
 * 
 * Features:
 * - Semantic Styling: Identity colors for categories, semantic colors for status.
 * - Time Machine: In-memory history of last 1000 logs.
 * - Filtering: Regex/Text filtering for console output.
 * - Export: Download logs as JSON for bug reporting.
 * - Metrics: Performance aggregation.
 */

type DebugCategory = 'vision' | 'lighting' | 'render' | 'sync' | 'worker' | 'input' | 'system';
type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface LogConfig {
  enabled: boolean;
  categories: Record<DebugCategory, boolean>;
  performance: boolean;
  filter: string | null; // Regex string or plain text
}

interface LogEntry {
  id: number;
  timestamp: number;
  category: DebugCategory;
  level: LogLevel;
  where: string;
  what: string;
  message: string;
  data?: any;
  duration?: number;
}

const DEFAULT_CONFIG: LogConfig = {
  enabled: true,
  categories: {
    vision: true,
    lighting: true,
    render: true,
    sync: true,
    worker: true,
    input: true,
    system: true
  },
  performance: true,
  filter: null
};

// Identity Colors (Category)
const CATEGORY_COLORS: Record<DebugCategory, string> = {
  vision: '#0ea5e9',   // Sky Blue
  lighting: '#f59e0b', // Amber
  render: '#6366f1',   // Indigo
  sync: '#8b5cf6',     // Violet
  worker: '#d946ef',   // Fuchsia
  input: '#ec4899',    // Pink
  system: '#64748b'    // Slate
};

// Semantic Colors (Status)
const STATUS_COLORS: Record<LogLevel, string> = {
  info: '#3b82f6',    // Blue
  success: '#22c55e', // Green
  warn: '#eab308',    // Yellow
  error: '#ef4444'    // Red
};

class DebugLoggerService {
  private config: LogConfig = { ...DEFAULT_CONFIG };
  private timers: Map<string, number> = new Map();
  private history: LogEntry[] = [];
  private readonly MAX_HISTORY = 1000;
  private historyIdCounter = 0;

  constructor() {
    this.loadConfig();
    // Safe global access
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).QB_DEBUG = this;
    } else if (typeof window !== 'undefined') {
      (window as any).QB_DEBUG = this;
    } else if (typeof self !== 'undefined') {
      (self as any).QB_DEBUG = this;
    }
  }

  // --- Configuration ---

  private loadConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('qb_debug_config');
        if (saved) {
          this.config = { ...this.config, ...JSON.parse(saved) };
        }
      }
    } catch { }
  }

  private saveConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('qb_debug_config', JSON.stringify(this.config));
      }
    } catch { }
  }

  public setCategory(category: DebugCategory, enabled: boolean) {
    this.config.categories[category] = enabled;
    this.saveConfig();
  }

  public setAll(enabled: boolean) {
    Object.keys(this.config.categories).forEach(k => this.config.categories[k as DebugCategory] = enabled);
    this.saveConfig();
  }

  public setFilter(query: string | null) {
    this.config.filter = query;
    this.saveConfig();
    console.log(`%c[DEBUG] Filter set to: "${query || '(none)'}"`, 'color: #888');
  }

  // --- Core Logging ---

  private shouldLog(category: DebugCategory, message: string, where: string, what: string): boolean {
    if (!this.config.enabled) return false;
    if (!this.config.categories[category]) return false;

    if (this.config.filter) {
      const filter = this.config.filter.toLowerCase();
      // Smart search: matches category, where, what, or message
      return (
        category.includes(filter) ||
        where.toLowerCase().includes(filter) ||
        what.toLowerCase().includes(filter) ||
        message.toLowerCase().includes(filter)
      );
    }

    return true;
  }

  private addToHistory(entry: LogEntry) {
    this.history.push(entry);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    }
  }

  private print(entry: LogEntry) {
    const catColor = CATEGORY_COLORS[entry.category];
    const statusColor = STATUS_COLORS[entry.level];

    // Normalize widths: Max Category (8=LIGHTING), Max Level (7=SUCCESS)
    const catBadge = entry.category.toUpperCase().padEnd(8, ' ');
    const lvlBadge = entry.level.toUpperCase().padEnd(7, ' ');

    // Badge Style: [CATEGORY] [STATUS] Message
    console.log(
      `%c ${catBadge} %c ${lvlBadge} %c ${entry.message}`,
      `background: ${catColor}; color: white; border-radius: 3px 0 0 3px; font-weight: bold; padding: 2px 5px; white-space: pre;`,
      `background: ${statusColor}; color: white; border-radius: 0 3px 3px 0; font-weight: bold; padding: 2px 5px; white-space: pre;`,
      'color: inherit; padding-left: 5px;',
      {
        where: entry.where,
        what: entry.what,
        data: entry.data,
        time: new Date(entry.timestamp).toLocaleTimeString()
      }
    );
  }

  // --- Public API ---

  public log(category: DebugCategory, where: string, what: string, message: string, data?: any) {
    const entry: LogEntry = {
      id: ++this.historyIdCounter,
      timestamp: Date.now(),
      category,
      level: 'info',
      where,
      what,
      message,
      data
    };

    this.addToHistory(entry);
    if (this.shouldLog(category, message, where, what)) {
      this.print(entry);
    }
  }

  public warn(category: DebugCategory, where: string, what: string, message: string, data?: any) {
    const entry: LogEntry = {
      id: ++this.historyIdCounter,
      timestamp: Date.now(),
      category,
      level: 'warn',
      where,
      what,
      message,
      data
    };

    this.addToHistory(entry);
    // Warns are important, we might want to show them even if regex doesn't match? 
    // User requested "robust filter", so we respect filter but maybe log warning normally if allowed.
    if (this.shouldLog(category, message, where, what)) {
      const catBadge = category.toUpperCase().padEnd(8, ' ');
      // Use console.warn for stack trace capability, but formatted custom
      console.groupCollapsed(
        `%c ${catBadge} %c WARN    %c ${message}`,
        `background: ${CATEGORY_COLORS[category]}; color: white; font-weight: bold; padding: 2px 5px; white-space: pre;`,
        `background: ${STATUS_COLORS.warn}; color: black; font-weight: bold; padding: 2px 5px; white-space: pre;`,
        'font-weight: bold;'
      );
      console.warn(message);
      console.log('Context:', { where, what, data });
      console.groupEnd();
    }
  }

  public error(category: DebugCategory, where: string, what: string, message: string, data?: any) {
    const entry: LogEntry = {
      id: ++this.historyIdCounter,
      timestamp: Date.now(),
      category,
      level: 'error',
      where,
      what,
      message,
      data
    };

    this.addToHistory(entry);
    // Always show errors unless master switch off
    if (this.config.enabled) {
      const catBadge = category.toUpperCase().padEnd(8, ' ');
      console.groupCollapsed(
        `%c ${catBadge} %c ERROR   %c ${message}`,
        `background: ${CATEGORY_COLORS[category]}; color: white; font-weight: bold; padding: 2px 5px; white-space: pre;`,
        `background: ${STATUS_COLORS.error}; color: white; font-weight: bold; padding: 2px 5px; white-space: pre;`,
        'font-weight: bold; color: #ef4444;'
      );
      console.error(message);
      console.log('Context:', { where, what, data });
      console.trace(); // Helpful for errors
      console.groupEnd();
    }
  }

  public success(category: DebugCategory, where: string, what: string, message: string, data?: any) {
    const entry: LogEntry = {
      id: ++this.historyIdCounter,
      timestamp: Date.now(),
      category,
      level: 'success', // New level
      where,
      what,
      message,
      data
    };
    this.addToHistory(entry);
    if (this.shouldLog(category, message, where, what)) {
      this.print(entry);
    }
  }

  // --- Performance ---

  public time(label: string) {
    if (!this.config.performance) return;
    this.timers.set(label, performance.now());
  }

  public timeEnd(category: DebugCategory, label: string, thresholdMs = 0) {
    if (!this.config.performance) return;
    const start = this.timers.get(label);
    if (!start) return;

    const duration = performance.now() - start;
    this.timers.delete(label);

    if (duration >= thresholdMs) {
      // Internal Log
      this.log(category, 'DebugLogger', 'Timer', `${label} took ${duration.toFixed(2)}ms`, { duration });
    }
  }

  // --- DevTools Features ---

  /**
   * Returns copy of current history
   */
  public getHistory() {
    return [...this.history];
  }

  /**
   * Downloads history as JSON file
   */
  public downloadLogs() {
    if (typeof document === 'undefined') {
      console.warn('[DebugLogger] Cannot download logs in this environment (likely a Web Worker).');
      return;
    }
    const data = JSON.stringify(this.history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qb-debug-logs-${new Date().toISOString().replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('%c[DEBUG] Logs downloaded', 'color: #22c55e');
  }

  /**
   * Show performance report
   */
  public perfReport() {
    const timers = this.history.filter(e => e.what === 'Timer' && e.data?.duration !== undefined);
    const stats: Record<string, { count: number, total: number, max: number; }> = {};

    timers.forEach(t => {
      const key = t.message.split(' took')[0]; // Quick parse "X took Yms"
      if (!stats[key]) stats[key] = { count: 0, total: 0, max: 0 };
      stats[key].count++;
      stats[key].total += t.data.duration;
      stats[key].max = Math.max(stats[key].max, t.data.duration);
    });

    console.table(
      Object.entries(stats).map(([label, s]) => ({
        label,
        avg: (s.total / s.count).toFixed(2) + 'ms',
        max: s.max.toFixed(2) + 'ms',
        calls: s.count
      }))
    );
  }

  public clear() {
    this.history = [];
    console.clear();
  }
}

export const DebugLogger = new DebugLoggerService();
