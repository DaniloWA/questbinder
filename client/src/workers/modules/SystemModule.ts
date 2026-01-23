import { BaseModule } from './BaseModule';

export class SystemModule extends BaseModule {
  public readonly name = 'system';

  public async handle(action: string, payload: any): Promise<any> {
    switch (action) {
      case 'ping':
        return this.ping(payload);
      case 'status':
        return this.status();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async ping(payload: any) {
    return {
      pong: true,
      ts: Date.now(),
      echo: payload
    };
  }

  private async status() {
    return {
      status: 'ok',
      uptime: performance.now(),
      memory: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 'unknown'
    };
  }
}
