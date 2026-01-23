import { IWorkerHost, IWorkerModule } from '../core/types';

/**
 * BaseModule
 * 
 * Abstract base class for all worker modules.
 * Provides helper methods for emitting events and sending responses.
 */
export abstract class BaseModule implements IWorkerModule {
  public abstract readonly name: string;
  protected host: IWorkerHost;

  constructor(host: IWorkerHost) {
    this.host = host;
  }

  /**
   * Main handler for actions. Switch on action name here.
   */
  public abstract handle(action: string, payload: any): Promise<any>;

  public onInit(): void { }
  public onDestroy(): void { }

  /**
   * Helper to emit module-specific events
   */
  protected emit(event: string, payload: any) {
    this.host.emit(this.name, event, payload);
  }
}
