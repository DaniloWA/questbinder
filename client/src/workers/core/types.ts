/**
 * Web Worker Core Types
 * 
 * Defines the contract between the Main Thread (Manager) and the Worker Thread (Host).
 */

// ============================================================================
// Message Envelopes
// ============================================================================

export type WorkerMessageType = 'REQUEST' | 'RESPONSE' | 'ERROR' | 'EVENT';

export interface WorkerMessage<T = any> {
  id: string;             // Correlation ID
  type: WorkerMessageType;
  payload: T;
}

// Request: Main -> Worker
export interface WorkerRequest<T = any> {
  module: string;         // Target module name (e.g., 'image-processing')
  action: string;         // Action to perform (e.g., 'detectWalls')
  payload: T;             // Action arguments
}

// Response: Worker -> Main
export interface WorkerResponse<T = any> {
  data: T;
}

// Error: Worker -> Main
export interface WorkerError {
  code: string;
  message: string;
  details?: any;
}

// Event: Worker -> Main (Unsolicited updates)
export interface WorkerEvent<T = any> {
  module: string;
  event: string;
  payload: T;
}

// ============================================================================
// Module Interface
// ============================================================================

export interface IWorkerModule {
  /**
   * Unique name of the module.
   */
  readonly name: string;

  /**
   * Handle an incoming request.
   */
  handle(action: string, payload: any): Promise<any>;

  /**
   * Lifecycle hook: Called when the module is initialized.
   */
  onInit?(): void | Promise<void>;

  /**
   * Lifecycle hook: Called when the module is destroyed.
   */
  onDestroy?(): void | Promise<void>;
}

// ============================================================================
// Registry
// ============================================================================

export type ModuleConstructor = new (host: IWorkerHost) => IWorkerModule;

export interface IWorkerHost {
  /**
   * Emit an event to the main thread.
   */
  emit(module: string, event: string, payload: any): void;

  /**
   * Register a module.
   */
  register(ModuleClass: ModuleConstructor): void;
}
