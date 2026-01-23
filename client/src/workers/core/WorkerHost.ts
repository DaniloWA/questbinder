import {
  IWorkerHost,
  IWorkerModule,
  ModuleConstructor,
  WorkerMessage,
  WorkerRequest,
  WorkerResponse
} from './types';

/**
 * WorkerHost (Worker Thread)
 * 
 * Central controller running inside the web worker.
 * Registers modules, routes requests, and handles errors.
 */
export class WorkerHost implements IWorkerHost {
  private modules: Map<string, IWorkerModule> = new Map();

  constructor() {
    self.onmessage = this.handleMessage.bind(this);
    console.log('[WorkerHost] Initialized');
  }

  public register(ModuleClass: ModuleConstructor) {
    const module = new ModuleClass(this);
    if (this.modules.has(module.name)) {
      console.warn(`[WorkerHost] Module '${module.name}' already registered. Overwriting.`);
    }

    this.modules.set(module.name, module);
    console.log(`[WorkerHost] Module registered: ${module.name}`);

    if (module.onInit) {
      module.onInit();
    }
  }

  public emit(module: string, event: string, payload: any) {
    const message: WorkerMessage = {
      id: 'event-' + crypto.randomUUID(),
      type: 'EVENT',
      payload: { module, event, payload }
    };
    self.postMessage(message);
  }

  private async handleMessage(event: MessageEvent) {
    const message: WorkerMessage<WorkerRequest> = event.data;
    const { id, type, payload } = message;

    if (type !== 'REQUEST') return;

    const { module: moduleName, action, payload: actionPayload } = payload;

    try {
      const module = this.modules.get(moduleName);
      if (!module) {
        throw new Error(`Module '${moduleName}' not found`);
      }

      console.log(`[WorkerHost] ⚙️ Processing: ${moduleName}.${action}`, { id });
      const start = performance.now();

      // Execute action
      const result = await module.handle(action, actionPayload);

      const duration = (performance.now() - start).toFixed(2);
      console.log(`[WorkerHost] ✅ Done: ${moduleName}.${action} (${duration}ms)`);

      // Send Response
      const response: WorkerMessage<WorkerResponse> = {
        id,
        type: 'RESPONSE',
        payload: { data: result }
      };
      self.postMessage(response);

    } catch (error: any) {
      console.error(`[WorkerHost] Error in ${moduleName}.${action}:`, error);

      // Send Error
      const errorMsg: WorkerMessage = {
        id,
        type: 'ERROR',
        payload: {
          code: 'EXECUTION_ERROR',
          message: error.message || 'Unknown worker error',
          details: error.stack
        }
      };
      self.postMessage(errorMsg);
    }
  }
}
