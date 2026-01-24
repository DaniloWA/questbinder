import { BaseModule } from './BaseModule';
import { Point, Obstacle } from '../../types/models';
import { computeVisibilityPolygon } from '../../utils/visibilityAlgorithm';
import { DebugLogger } from '../../utils/DebugLogger';

interface VisibilityPayload {
  origin: Point;
  obstacles: Obstacle[];
  visionRadius: number;
}

export class VisibilityModule extends BaseModule {
  public readonly name = 'visibility';
  private obstacles: Obstacle[] = []; // Cache obstacles inside worker

  public async handle(action: string, payload: any): Promise<any> {
    switch (action) {
      case 'setObstacles':
        this.obstacles = payload.obstacles || [];
        // LOG: Confirm update
        if (this.obstacles.length > 0) {
          DebugLogger.log('worker', 'VisibilityModule', 'Update', `Updated obstacles: ${this.obstacles.length}`);
        }
        return true;
      case 'calculateVisibility':
        return this.calculateVisibility(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private calculateVisibility(payload: VisibilityPayload): Point[] {
    const { origin, visionRadius } = payload;
    // Use payload obstacles if provided (one-off), otherwise use state
    // SAFETY: Ensure we never map over undefined
    const obstacles = payload.obstacles || this.obstacles || [];

    // DIAGNOSTIC LOG: Check for empty state
    if (obstacles.length === 0 && visionRadius > 0) {
      DebugLogger.warn('worker', 'VisibilityModule', 'Calc', 'Warning: Calculating with 0 obstacles! (State likely empty)');
    }

    // Explicit Worker Log (Throttled)
    if (Math.random() < 0.005) {
      DebugLogger.log('worker', 'VisibilityModule', 'Calc', `Spec: ${obstacles.length} obstacles, Radius: ${visionRadius}`);
    }

    return computeVisibilityPolygon(origin, obstacles, visionRadius);
  }
}
