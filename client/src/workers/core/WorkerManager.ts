import { WorkerMessage, WorkerRequest, WorkerResponse, WorkerError, WorkerEvent } from './types';
import { DebugLogger } from '../../utils/DebugLogger';

/**
 * Options for execute method
 */
export interface ExecuteOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Transferable objects for zero-copy transfer */
  transferables?: Transferable[];
}

/**
 * WorkerManager (Main Thread)
 * 
 * Singleton that manages the Web Worker instance, handles message correlation,
 * and exposes a clean Promise-based API for executing tasks.
 * 
 * Features:
 * - Promise-based API with correlation IDs
 * - Transferable support for zero-copy buffer transfers
 * - Configurable timeout handling
 * - Health monitoring
 * - Event subscription system
 * - Crash Loop Protection (Backoff)
 */
export class WorkerManager {
  private static instance: WorkerManager;
  private worker: Worker | null = null;

  // Pending requests map: Correlation ID -> { resolve, reject, timeoutId }
  private pending: Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeoutId?: ReturnType<typeof setTimeout>;
  }> = new Map();

  // Event listeners: Module -> Set of callbacks
  private listeners: Map<string, Set<(event: string, payload: any) => void>> = new Map();
  private restartListeners: Set<() => void> = new Set();

  // Health check interval
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  // Debug mode
  private debug: boolean = true;

  // Default timeout (30 seconds)
  private defaultTimeout: number = 30000;

  // Crash Loop Protection
  private restartCount: number = 0;
  private lastRestartTime: number = 0;
  private isRestoring: boolean = false;
  private readonly MAX_RESTARTS = 5;
  private readonly RESET_TIMEOUT = 10000; // Reset count if worker lives this long


  private constructor() {
    DebugLogger.log('worker', 'WorkerManager', 'Constructor', `🏗️ Constructor called for ${this._debugId}`);

    if (typeof window !== 'undefined') {
      // 1. Check for Duplicate Instances (Same Page)
      if ((window as any).__QB_WORKER_MANAGER__ && (window as any).__QB_WORKER_MANAGER__ !== this) {
        DebugLogger.error('worker', 'WorkerManager', 'Singleton', `🚨 CRITICAL: Duplicate instance created! Global: ${(window as any).__QB_WORKER_MANAGER__._debugId}, New: ${this._debugId}`);
      }
    }

    this.initWorker();
  }

  // Debug ID to track instances
  public readonly _debugId = Math.random().toString(36).slice(2, 7);

  public static getInstance(): WorkerManager {
    // 0. CRITICAL: Detect Worker Context FIRST
    // Some environments (or polyfills) might define 'window' inside a worker, fooling the check.
    // We must check for specific Worker globals first.
    const isWorker =
      (typeof self !== 'undefined' && self.constructor.name === 'DedicatedWorkerGlobalScope') ||
      // @ts-ignore - Worker global
      typeof importScripts === 'function';

    if (isWorker) {
      // We are definitely in a worker. Do NOT create a manager.
      // We can return a specific error or a dummy object if needed, but throwing is safest to highlight the logic error.
      // However, to avoid crashing the worker completely if a module imports it safely but doesn't use it:
      DebugLogger.warn('worker', 'WorkerManager', 'Singleton', 'Warning: WorkerManager imported inside Worker context. This is likely a mistake.');
      throw new Error('[WorkerManager] Critical: Attempted to instantiate WorkerManager inside a Worker.');
    }

    // 1. Basic Singleton
    if (WorkerManager.instance) {
      return WorkerManager.instance;
    }

    // 2. Global Singleton (HMR/Hot-Reload Survival)
    if (typeof window !== 'undefined') {
      const globalKey = '__QB_WORKER_MANAGER__';
      const globalInstance = (window as any)[globalKey];

      if (globalInstance) {
        DebugLogger.log('worker', 'WorkerManager', 'Singleton', `♻️ Reusing global instance: ${globalInstance._debugId}`);
        WorkerManager.instance = globalInstance;
        // Re-attach debug logger if needed or ensure state is clean
        return WorkerManager.instance;
      }

      DebugLogger.log('worker', 'WorkerManager', 'Singleton', `✨ Creating NEW global instance...`);
      WorkerManager.instance = new WorkerManager();
      (window as any)[globalKey] = WorkerManager.instance;
      return WorkerManager.instance;
    }

    // 3. Fail-safe for non-browser envs (Node.js/Test)
    // Only reach here if no window and no worker
    WorkerManager.instance = new WorkerManager();
    return WorkerManager.instance;
  }

  public setDebug(enabled: boolean) {
    this.debug = enabled;
  }

  /**
   * Set default timeout for all execute calls.
   */
  public setDefaultTimeout(timeoutMs: number) {
    this.defaultTimeout = timeoutMs;
  }

  /**
   * Initialize or restart the worker.
   */
  private initWorker() {
    if (this.worker) {
      this.worker.terminate();
    }

    // Reset loop protection if enough time has passed since last restart (and we aren't in a crash loop)
    const now = Date.now();
    if (now - this.lastRestartTime > this.RESET_TIMEOUT && !this.isRestoring) {
      this.restartCount = 0;
    }
    this.lastRestartTime = now;

    try {
      // Initialize the worker using Vite's worker import syntax
      // @ts-ignore - Vite specific import
      this.worker = new Worker(new URL('../main.worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = this.handleError.bind(this);

      this.isRestoring = false;

      // Notify listeners of restart/init
      this.restartListeners.forEach(cb => cb());

      DebugLogger.log('worker', 'WorkerManager', 'Init', `Worker initialized (Attempt ${this.restartCount + 1})`);
    } catch (e) {
      DebugLogger.error('worker', 'WorkerManager', 'Init', `Worker initialization failed: ${e}`);
      // If we can't even construct the worker, we are likely in a fatal environment state.
      // We should not loop here.
    }
  }

  /**
   * Execute an action on a specific module in the worker.
   * 
   * @param module - Target module name
   * @param action - Action to execute
   * @param payload - Action payload
   * @param options - Execution options (timeout, transferables)
   */
  public execute<T>(
    module: string,
    action: string,
    payload: any = {},
    options: ExecuteOptions = {}
  ): Promise<T> {
    if (!this.worker) {
      // If we are in backoff, we might not have a worker.
      // Try to revive if we aren't permanently stopped.
      if (this.restartCount < this.MAX_RESTARTS) {
        this.initWorker();
      } else {
        return Promise.reject(new Error('[WorkerManager] Worker is dead (Maximum restart attempts exceeded)'));
      }
    }

    const { timeout = this.defaultTimeout, transferables = [] } = options;
    const id = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      // Setup timeout
      const timeoutId = timeout > 0 ? setTimeout(() => {
        const pending = this.pending.get(id);
        if (pending) {
          this.pending.delete(id);
          reject(new Error(`[Worker Timeout] ${module}.${action} exceeded ${timeout}ms`));
        }
      }, timeout) : undefined;

      this.pending.set(id, { resolve, reject, timeoutId });

      const message: WorkerMessage<WorkerRequest> = {
        id,
        type: 'REQUEST',
        payload: { module, action, payload }
      };

      try {
        // Use transferables for zero-copy transfer if provided
        if (transferables.length > 0) {
          this.worker!.postMessage(message, transferables);
        } else {
          this.worker!.postMessage(message);
        }
      } catch (err) {
        // Handle immediate postMessage failures (e.g., DataCloneError)
        if (this.pending.has(id)) {
          clearTimeout(timeoutId);
          this.pending.delete(id);
          reject(err);
        }
      }
    });
  }

  /**
   * Subscribe to events from a specific module.
   */
  public on(module: string, callback: (event: string, payload: any) => void): () => void {
    if (!this.listeners.has(module)) {
      this.listeners.set(module, new Set());
    }
    this.listeners.get(module)!.add(callback);

    // Return unsubscribe function
    return () => {
      const moduleListeners = this.listeners.get(module);
      if (moduleListeners) {
        moduleListeners.delete(callback);
        if (moduleListeners.size === 0) {
          this.listeners.delete(module);
        }
      }
    };
  }

  /**
   * Subscribe to worker restart events (system-wide).
   */
  public onWorkerRestart(callback: () => void): () => void {
    this.restartListeners.add(callback);
    return () => this.restartListeners.delete(callback);
  }

  /**
   * Start periodic health checks.
   * 
   * @param intervalMs - Check interval in milliseconds (default: 30000)
   */
  public startHealthCheck(intervalMs: number = 30000): void {
    this.stopHealthCheck();

    this.healthCheckInterval = setInterval(async () => {
      // Don't ping if we are dead
      if (!this.worker && this.restartCount >= this.MAX_RESTARTS) return;

      try {
        await this.execute('system', 'ping', {}, { timeout: 5000 });
        if (this.debug) {
          DebugLogger.log('worker', 'WorkerManager', 'HealthCheck', 'Health check OK');
        }
      } catch (err) {
        DebugLogger.error('worker', 'WorkerManager', 'HealthCheck', 'Health check failed, reinitializing worker...', err);
        this.reinitializeWithBackoff();
      }
    }, intervalMs);
  }

  /**
   * Stop health checks.
   */
  public stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Reinitialize worker with exponential backoff handling.
   */
  private reinitializeWithBackoff(): void {
    if (this.isRestoring) return; // Prevent double-trigger
    this.isRestoring = true;

    DebugLogger.error('worker', 'WorkerManager', 'Crash', `Worker crashed. Restart attempt ${this.restartCount + 1}/${this.MAX_RESTARTS}`);

    // Reject all pending requests
    for (const [id, pending] of this.pending.entries()) {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId);
      }
      pending.reject(new Error('[Worker] Worker crashed and was reinitialized'));
    }
    this.pending.clear();

    // Check restart limits
    if (this.restartCount >= this.MAX_RESTARTS) {
      DebugLogger.error('worker', 'WorkerManager', 'Fatal', '[WorkerManager] 🚨 FATAL: Worker keeps crashing. Stopping restart loop.');
      this.terminate();
      return;
    }

    // Exponential Backoff: 1s, 2s, 4s, 8s, 16s...
    const backoffTime = Math.pow(2, this.restartCount) * 1000;
    this.restartCount++;

    DebugLogger.log('worker', 'WorkerManager', 'Backoff', `Waiting ${backoffTime}ms before restart...`);

    setTimeout(() => {
      this.initWorker();
    }, backoffTime);
  }

  /**
   * Handle worker-level errors (e.g., syntax errors, crashes).
   */
  private handleError(error: ErrorEvent) {
    // Critical: Raw log to ensure we see this even if DebugLogger fails or is filtered
    DebugLogger.error('worker', 'WorkerManager', 'HandleError', '[WorkerManager] 🚨 RAW WORKER CRASH', {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      error: error.error
    });
    this.reinitializeWithBackoff();
  }

  /**
   * Handle incoming messages from the worker.
   */
  private handleMessage(event: MessageEvent) {
    const message: WorkerMessage = event.data;
    const { id, type, payload } = message;

    // Handle Requests/Responses
    if (type === 'RESPONSE') {
      const resolver = this.pending.get(id);
      if (resolver) {
        if (resolver.timeoutId) {
          clearTimeout(resolver.timeoutId);
        }
        resolver.resolve((payload as WorkerResponse).data);
        this.pending.delete(id);
      }
    }
    else if (type === 'ERROR') {
      const resolver = this.pending.get(id);
      if (resolver) {
        if (resolver.timeoutId) {
          clearTimeout(resolver.timeoutId);
        }
        const error = payload as WorkerError;
        resolver.reject(new Error(`[Worker Error] ${error.code}: ${error.message}`));
        this.pending.delete(id);
      } else {
        DebugLogger.error('worker', 'WorkerManager', 'HandleMessage', 'Unhandled worker error:', payload);
      }
    }
    else if (type === 'EVENT') {
      const eventPayload = payload as WorkerEvent;
      const moduleListeners = this.listeners.get(eventPayload.module);
      if (moduleListeners) {
        moduleListeners.forEach(cb => cb(eventPayload.event, eventPayload.payload));
      }
    }
  }

  /**
   * Get number of pending requests.
   */
  public getPendingCount(): number {
    return this.pending.size;
  }

  /**
   * Check if worker is initialized.
   */
  public isReady(): boolean {
    return this.worker !== null;
  }

  public terminate() {
    this.stopHealthCheck();

    // Clear all pending timeouts
    for (const pending of this.pending.values()) {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId);
      }
    }
    this.pending.clear();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
