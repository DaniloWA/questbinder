import { BaseModule } from './BaseModule';
import { LightZone, AudioZone, TriggerZone, Point } from '../../types';
import { DebugLogger } from '../../utils/DebugLogger';

export interface ZonesPayload {
  lightZones: LightZone[];
  audioZones: AudioZone[];
  triggerZones: TriggerZone[];
}

export interface ProcessedZone {
  id: string; // Or some identifier if available, or generated
  original: LightZone | AudioZone | TriggerZone;
  type: 'light' | 'audio' | 'trigger';
  shapeType: 'rect' | 'polygon';
  points: Point[]; // Unified points (rect converted to points for consistency or kept separate?)
  // Actually, for rects rendering is faster as rect. Let's keep rect if rect.
  rect?: { x: number, y: number, w: number, h: number; };
  center: Point;
  color: { r: number, g: number, b: number, a: number; }; // Pre-parsed color
  label: string;
}

export interface ProcessedZonesResult {
  light: ProcessedZone[];
  audio: ProcessedZone[];
  trigger: ProcessedZone[];
}

export class ZonesModule extends BaseModule {
  public readonly name = 'zones';

  public async handle(action: string, payload: any): Promise<any> {
    switch (action) {
      case 'processZones':
        return this.processZones(payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private processZones(payload: ZonesPayload): ProcessedZonesResult {
    const start = performance.now();
    const { lightZones, audioZones, triggerZones } = payload;

    const result: ProcessedZonesResult = {
      light: (lightZones || []).map(z => this.processZone(z, 'light')),
      audio: (audioZones || []).map(z => this.processZone(z, 'audio')),
      trigger: (triggerZones || []).map(z => this.processZone(z, 'trigger')),
    };

    const duration = performance.now() - start;
    if (duration > 5) {
      const count = this.countZones(result);
      DebugLogger.log('zones', 'ZonesModule', 'Process', `Processed ${count} zones in ${duration.toFixed(2)}ms`, {
        light: result.light.length,
        audio: result.audio.length,
        trigger: result.trigger.length
      });
    }

    return result;
  }

  private countZones(result: ProcessedZonesResult): number {
    return result.light.length + result.audio.length + result.trigger.length;
  }

  private processZone(zone: LightZone | AudioZone | TriggerZone, type: 'light' | 'audio' | 'trigger'): ProcessedZone {
    const center = this.getZoneCenter(zone);
    const color = this.getZoneColor(zone, type);

    // Determine label
    let label = '';
    if (type === 'light') label = (zone as LightZone).brightness <= 0.2 ? '🌑' : '💡';
    else if (type === 'audio') label = '🔊';
    else if (type === 'trigger') label = '⚡';

    return {
      id: (zone as any).id || crypto.randomUUID(),
      original: zone,
      type,
      shapeType: zone.type,
      points: zone.points || [],
      rect: zone.rect,
      center,
      color,
      label
    };
  }

  private getZoneCenter(zone: LightZone | AudioZone | TriggerZone): Point {
    if (zone.type === 'rect' && zone.rect) {
      return {
        x: zone.rect.x + zone.rect.w / 2,
        y: zone.rect.y + zone.rect.h / 2,
      };
    } else if (zone.type === 'polygon' && zone.points && zone.points.length > 0) {
      const sum = zone.points.reduce(
        (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
        { x: 0, y: 0 }
      );
      return {
        x: sum.x / zone.points.length,
        y: sum.y / zone.points.length,
      };
    }
    return { x: 0, y: 0 };
  }

  private getZoneColor(zone: LightZone | AudioZone | TriggerZone, type: 'light' | 'audio' | 'trigger'): { r: number, g: number, b: number, a: number; } {
    // Default colors based on original ZonesLayer logic
    let r = 0, g = 0, b = 0, a = 1;

    if (type === 'light') {
      const lZone = zone as LightZone;
      const isDarkness = lZone.brightness <= 0.2;

      if (isDarkness) {
        // Darkness: rgba(30, 30, 30, 0.6)
        return { r: 30, g: 30, b: 30, a: 0.6 };
      } else if (lZone.color) {
        const rgb = this.hexToRgb(lZone.color);
        return { ...rgb, a: 0.3 };
      } else {
        // Default Light: rgba(255, 220, 100, 0.3)
        return { r: 255, g: 220, b: 100, a: 0.3 };
      }
    } else if (type === 'audio') {
      // Audio: rgba(59, 130, 246, 0.2)
      return { r: 59, g: 130, b: 246, a: 0.2 };
    } else if (type === 'trigger') {
      // Trigger: rgba(168, 85, 247, 0.15)
      return { r: 168, g: 85, b: 247, a: 0.15 };
    }

    return { r, g, b, a };
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number; } {
    if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 };

    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
      if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
        const r = parseInt(hex[1] + hex[1], 16);
        const g = parseInt(hex[2] + hex[2], 16);
        const b = parseInt(hex[3] + hex[3], 16);
        return { r, g, b };
      }
      return { r: 255, g: 255, b: 255 };
    }

    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }
}
