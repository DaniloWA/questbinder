import { WorkerManager } from '../workers/core/WorkerManager';
import { DebugLogger } from '../utils/DebugLogger';
import type { ZonesPayload, ProcessedZonesResult } from '../workers/modules/ZonesModule';

class ZonesWorkerService {
  private static instance: ZonesWorkerService;

  private constructor() { }

  public static getInstance(): ZonesWorkerService {
    if (!ZonesWorkerService.instance) {
      ZonesWorkerService.instance = new ZonesWorkerService();
    }
    return ZonesWorkerService.instance;
  }

  /**
   * Dispatches zone processing to the worker.
   */
  public async processZones(payload: ZonesPayload): Promise<ProcessedZonesResult> {
    const wm = WorkerManager.getInstance();

    // Log dispatch
    DebugLogger.log('zones', 'ZonesWorkerService', 'Dispatch', `Processing ${this.count(payload)} zones`);

    try {
      const result = await wm.execute<ProcessedZonesResult>(
        'zones',
        'processZones',
        payload,
        { timeout: 5000 }
      );
      return result;
    } catch (error) {
      DebugLogger.error('zones', 'ZonesWorkerService', 'Error', 'Failed to process zones', error);
      throw error;
    }
  }

  private count(payload: ZonesPayload): number {
    return (payload.lightZones?.length || 0) +
      (payload.audioZones?.length || 0) +
      (payload.triggerZones?.length || 0);
  }
}

export const zonesWorkerService = ZonesWorkerService.getInstance();
