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

    let fillColor = 'rgba(255, 220, 100, 0.3)';
    let strokeColor = 'rgba(255, 220, 100, 0.6)';
    let labelColor = '#ffdc64';

    if (isDarkness) {
      fillColor = 'rgba(30, 30, 30, 0.6)';
      strokeColor = 'rgba(80, 80, 80, 0.8)';
      labelColor = '#666';
    } else if (zone.color) {
      // Use custom color but enforce opacity
      const rgb = this.hexToRgb(zone.color);
      fillColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
      strokeColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
      labelColor = zone.color;
    }

    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([6 / zoom, 3 / zoom]);
    ctx.stroke();

    // Label
    const center = this.getZoneCenter(zone);
    if (center) {
      ctx.font = `bold ${14 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = labelColor;
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

  /**
   * Convert hex color to RGB.
   */
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
