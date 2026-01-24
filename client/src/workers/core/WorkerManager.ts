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

  // Health check interval
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  // Debug mode
  private debug: boolean = true;

  // Default timeout (30 seconds)
  private defaultTimeout: number = 30000;

  private constructor() {
    this.initWorker();
  }

  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
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

    // Initialize the worker using Vite's worker import syntax
    // @ts-ignore - Vite specific import
    this.worker = new Worker(new URL('../main.worker.ts', import.meta.url), {
      type: 'module',
    });

    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);

    DebugLogger.log('worker', 'WorkerManager', 'Init', 'Worker initialized');
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
    if (!this.worker) this.initWorker();

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

      // Use transferables for zero-copy transfer if provided
      if (transferables.length > 0) {
        this.worker!.postMessage(message, transferables);
      } else {
        this.worker!.postMessage(message);
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
   * Start periodic health checks.
   * 
   * @param intervalMs - Check interval in milliseconds (default: 30000)
   */
  public startHealthCheck(intervalMs: number = 30000): void {
    this.stopHealthCheck();

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.execute('system', 'ping', {}, { timeout: 5000 });
        if (this.debug) {
          DebugLogger.log('worker', 'WorkerManager', 'HealthCheck', 'Health check OK');
        }
      } catch (err) {
        DebugLogger.error('worker', 'WorkerManager', 'HealthCheck', 'Health check failed, reinitializing worker...', err);
        this.reinitializeWithPendingRejection();
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
   * Reinitialize worker and reject all pending requests.
   */
  private reinitializeWithPendingRejection(): void {
    // Reject all pending requests
    for (const [id, pending] of this.pending.entries()) {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId);
      }
      pending.reject(new Error('[Worker] Worker crashed and was reinitialized'));
    }
    this.pending.clear();

    // Reinitialize
    this.initWorker();
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
   * Handle worker-level errors (e.g., syntax errors, crashes).
   */
  private handleError(error: ErrorEvent) {
    DebugLogger.error('worker', 'WorkerManager', 'HandleError', 'Worker crash:', error);
    this.reinitializeWithPendingRejection();
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
