import { WorkerMessage, WorkerRequest, WorkerResponse, WorkerError, WorkerEvent } from './types';

/**
 * WorkerManager (Main Thread)
 * 
 * Singleton that manages the Web Worker instance, handles message correlation,
 * and exposes a clean Promise-based API for executing tasks.
 */
export class WorkerManager {
  private static instance: WorkerManager;
  private worker: Worker | null = null;

  // Pending requests map: Correlation ID -> { resolve, reject }
  private pending: Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = new Map();

  // Event listeners: Module -> Set of callbacks
  private listeners: Map<string, Set<(event: string, payload: any) => void>> = new Map();

  // Debug mode
  private debug: boolean = true;

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

    console.log('[WorkerManager] Worker initialized');
  }

  /**
   * Execute an action on a specific module in the worker.
   */
  public execute<T>(module: string, action: string, payload: any = {}): Promise<T> {
    if (!this.worker) this.initWorker();

    const id = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      const message: WorkerMessage<WorkerRequest> = {
        id,
        type: 'REQUEST',
        payload: { module, action, payload }
      };

      this.worker!.postMessage(message);
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
   * Handle incoming messages from the worker.
   */
  private handleMessage(event: MessageEvent) {
    const message: WorkerMessage = event.data;
    const { id, type, payload } = message;

    // Handle Requests/Responses
    if (type === 'RESPONSE') {
      const resolver = this.pending.get(id);
      if (resolver) {
        resolver.resolve((payload as WorkerResponse).data);
        this.pending.delete(id);
      }
    }
    else if (type === 'ERROR') {
      const resolver = this.pending.get(id);
      if (resolver) {
        const error = payload as WorkerError;
        resolver.reject(new Error(`[Worker Error] ${error.code}: ${error.message}`));
        this.pending.delete(id);
      } else {
        console.error('[WorkerManager] Unhandled worker error:', payload);
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
    console.error('[WorkerManager] Worker crash:', error);
    // Optionally restart worker here if critical
    // this.pending.forEach(p => p.reject(new Error('Worker crashed')));
    // this.pending.clear();
    // this.initWorker();
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
