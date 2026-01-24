/**
 * SmartSync - Retry Manager
 * 
 * Handles retry logic with exponential backoff for failed sync operations.
 */

import { PendingChange, generateChangeId } from './types';
import { DebugLogger } from '../../utils/DebugLogger';

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in ms */
  initialDelayMs: number;
  /** Maximum delay in ms */
  maxDelayMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Add jitter to prevent thundering herd */
  jitter: boolean;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 500,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

// =============================================================================
// RETRY STATE
// =============================================================================

interface RetryState {
  changeId: string;
  change: PendingChange;
  attempts: number;
  lastAttempt: number;
  nextRetry: number;
  error?: string;
}

// =============================================================================
// RETRY MANAGER
// =============================================================================

/**
 * RetryManager - Handles retry logic with exponential backoff.
 */
export class RetryManager {
  private config: RetryConfig;
  private retryQueue: Map<string, RetryState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private onRetry: ((change: PendingChange) => void) | null = null;
  private onMaxRetriesExceeded: ((change: PendingChange, error: string) => void) | null = null;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set retry callback.
   */
  setOnRetry(callback: (change: PendingChange) => void): void {
    this.onRetry = callback;
  }

  /**
   * Set max retries exceeded callback.
   */
  setOnMaxRetriesExceeded(callback: (change: PendingChange, error: string) => void): void {
    this.onMaxRetriesExceeded = callback;
  }

  /**
   * Schedule a retry for a failed change.
   */
  scheduleRetry(change: PendingChange, error: string): boolean {
    const key = `${change.entityType}:${change.entityId}`;

    const existing = this.retryQueue.get(key);
    const attempts = existing ? existing.attempts + 1 : 1;

    if (attempts > this.config.maxRetries) {
      this.retryQueue.delete(key);
      this.onMaxRetriesExceeded?.(change, error);
      return false;
    }

    const delay = this.calculateDelay(attempts);
    const now = Date.now();

    const state: RetryState = {
      changeId: change.id,
      change,
      attempts,
      lastAttempt: now,
      nextRetry: now + delay,
      error,
    };

    this.retryQueue.set(key, state);

    // Schedule timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    const timer = setTimeout(() => {
      this.executeRetry(key);
    }, delay);

    this.timers.set(key, timer);

    return true;
  }

  /**
   * Calculate delay with exponential backoff and optional jitter.
   */
  private calculateDelay(attempt: number): number {
    let delay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, this.config.maxDelayMs);

    if (this.config.jitter) {
      // Add up to 25% jitter
      const jitter = delay * 0.25 * Math.random();
      delay += jitter;
    }

    return Math.round(delay);
  }

  /**
   * Execute a scheduled retry.
   */
  private executeRetry(key: string): void {
    const state = this.retryQueue.get(key);
    if (!state) return;

    this.timers.delete(key);
    this.onRetry?.(state.change);
  }

  /**
   * Cancel retry for a change.
   */
  cancel(entityType: string, entityId: string): void {
    const key = `${entityType}:${entityId}`;

    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }

    this.retryQueue.delete(key);
  }

  /**
   * Mark a change as successful (remove from retry queue).
   */
  success(entityType: string, entityId: string): void {
    this.cancel(entityType, entityId);
  }

  /**
   * Get pending retry count.
   */
  getPendingCount(): number {
    return this.retryQueue.size;
  }

  /**
   * Get all pending retries.
   */
  getPendingRetries(): RetryState[] {
    return Array.from(this.retryQueue.values());
  }

  /**
   * Clear all pending retries.
   */
  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.retryQueue.clear();
  }

  /**
   * Debug log retry state.
   */
  debug(): void {
    console.group('[RetryManager] State');
    DebugLogger.log('sync', 'RetryManager', 'Debug', 'Pending Retries:', this.retryQueue.size);
    for (const [key, state] of this.retryQueue) {
      DebugLogger.log('sync', 'RetryManager', 'Debug', `  ${key}: attempt ${state.attempts}, next in ${state.nextRetry - Date.now()}ms`);
    }
    console.groupEnd();
  }
}

// Export singleton
export const retryManager = new RetryManager();
