import {
  IWorkerHost,
  IWorkerModule,
  ModuleConstructor,
  WorkerMessage,
  WorkerRequest,
  WorkerResponse
} from './types';
import { DebugLogger } from '../../utils/DebugLogger';

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
    DebugLogger.log('worker', 'WorkerHost', 'Init', 'Initialized');
  }

  public register(ModuleClass: ModuleConstructor) {
    const module = new ModuleClass(this);
    if (this.modules.has(module.name)) {
      DebugLogger.warn('worker', 'WorkerHost', 'Register', `Module '${module.name}' already registered. Overwriting.`);
    }

    this.modules.set(module.name, module);
    DebugLogger.log('worker', 'WorkerHost', 'Register', `Module registered: ${module.name}`);

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

      DebugLogger.log('worker', 'WorkerHost', 'Process', `⚙️ Processing: ${moduleName}.${action}`, { id });
      // DebugLogger.log('worker', `⚙️ Processing: ${moduleName}.${action}`, { id }); 
      // Keep console.log for worker raw output if DebugLogger fails in worker context?
      // No, DebugLogger sends to console anyway.

      const start = performance.now();

      // Execute action
      const result = await module.handle(action, actionPayload);

      const duration = (performance.now() - start).toFixed(2);
      DebugLogger.log('worker', 'WorkerHost', 'Process', `✅ Done: ${moduleName}.${action} (${duration}ms)`);

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
