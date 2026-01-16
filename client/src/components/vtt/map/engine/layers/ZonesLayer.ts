/**
 * VTT Engine - Zones Layer
 *
 * Renders Light Zones, Audio Zones, and Trigger Zones.
 * Only visible to GM in GM view mode.
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { LightZone, AudioZone, TriggerZone } from '../../../../../types';

/**
 * ZonesLayer - Renders special zones (light, audio, trigger).
 *
 * Features:
 * - Light zones with brightness indication
 * - Audio zones with speaker icon
 * - Trigger zones with lightning icon
 * - GM-only visibility
 * - Cached until zones change
 */
export class ZonesLayer extends BaseLayer {
  constructor() {
    super('zones', 'Zones', {
      useCache: true,
      cacheStrategy: 'world',
      description: 'Light, audio, and trigger zones',
    });
  }

  computeStateHash(context: RenderContext): string {
    const { scene, isGM, gmViewMode, zoom } = context;
    if (!scene) return 'no-scene';
    if (!isGM || gmViewMode !== 'gm') return 'hidden';

    return this.hashValues(
      scene.lightZones?.length || 0,
      scene.audioZones?.length || 0,
      scene.triggerZones?.length || 0,
      zoom
    );
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { scene, isGM, gmViewMode, zoom } = context;
    if (!scene) return;
    if (!isGM || gmViewMode !== 'gm') return;

    ctx.save();

    // Render light zones
    if (scene.lightZones) {
      for (const zone of scene.lightZones) {
        if (!zone.hidden) {
          this.renderLightZone(ctx, zone, zoom);
        }
      }
    }

    // Render audio zones
    if (scene.audioZones) {
      for (const zone of scene.audioZones) {
        this.renderAudioZone(ctx, zone, zoom);
      }
    }

    // Render trigger zones
    if (scene.triggerZones) {
      for (const zone of scene.triggerZones) {
        this.renderTriggerZone(ctx, zone, zoom);
      }
    }

    ctx.restore();
  }

  private renderLightZone(ctx: CanvasRenderingContext2D, zone: LightZone, zoom: number): void {
    ctx.save();

    ctx.beginPath();
    if (zone.type === 'rect' && zone.rect) {
      ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
    } else if (zone.type === 'polygon' && zone.points && zone.points.length > 0) {
      ctx.moveTo(zone.points[0].x, zone.points[0].y);
      for (let i = 1; i < zone.points.length; i++) {
        ctx.lineTo(zone.points[i].x, zone.points[i].y);
      }
      ctx.closePath();
    }

    // Visual style based on brightness
    const isDarkness = zone.brightness <= 0.2;
    const color = isDarkness ? 'rgba(30, 30, 30, 0.6)' : (zone.color || 'rgba(255, 220, 100, 0.3)');

    ctx.fillStyle = color;
    ctx.fill();

    ctx.strokeStyle = isDarkness ? 'rgba(80, 80, 80, 0.8)' : 'rgba(255, 220, 100, 0.6)';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([6 / zoom, 3 / zoom]);
    ctx.stroke();

    // Label
    const center = this.getZoneCenter(zone);
    if (center) {
      ctx.font = `bold ${14 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isDarkness ? '#666' : '#ffdc64';
      ctx.fillText(isDarkness ? '🌑' : '💡', center.x, center.y);
    }

    ctx.restore();
  }

  private renderAudioZone(ctx: CanvasRenderingContext2D, zone: AudioZone, zoom: number): void {
    ctx.save();

    ctx.beginPath();
    if (zone.type === 'rect' && zone.rect) {
      ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
    } else if (zone.type === 'polygon' && zone.points && zone.points.length > 0) {
      ctx.moveTo(zone.points[0].x, zone.points[0].y);
      for (let i = 1; i < zone.points.length; i++) {
        ctx.lineTo(zone.points[i].x, zone.points[i].y);
      }
      ctx.closePath();
    }

    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([8 / zoom, 4 / zoom]);
    ctx.stroke();

    // Label
    const center = this.getZoneCenter(zone);
    if (center) {
      ctx.font = `bold ${16 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(59, 130, 246, 1)';
      ctx.fillText('🔊', center.x, center.y);
    }

    ctx.restore();
  }

  private renderTriggerZone(ctx: CanvasRenderingContext2D, zone: TriggerZone, zoom: number): void {
    ctx.save();

    ctx.beginPath();
    if (zone.type === 'rect' && zone.rect) {
      ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
    } else if (zone.type === 'polygon' && zone.points && zone.points.length > 0) {
      ctx.moveTo(zone.points[0].x, zone.points[0].y);
      for (let i = 1; i < zone.points.length; i++) {
        ctx.lineTo(zone.points[i].x, zone.points[i].y);
      }
      ctx.closePath();
    }

    ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([8 / zoom, 4 / zoom]);
    ctx.stroke();

    // Label
    const center = this.getZoneCenter(zone);
    if (center) {
      ctx.font = `bold ${16 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(168, 85, 247, 1)';
      ctx.fillText('⚡', center.x, center.y);
    }

    ctx.restore();
  }

  private getZoneCenter(zone: LightZone | AudioZone | TriggerZone): { x: number; y: number; } | null {
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
    return null;
  }
}
