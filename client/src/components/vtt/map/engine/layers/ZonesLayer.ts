/**
 * VTT Engine - Zones Layer
 *
 * Renders Light Zones, Audio Zones, and Trigger Zones.
 * Uses WebWorker for heavy data processing (colors, centers, geometry).
 */

import { BaseLayer } from '../core/BaseLayer';
import { RenderContext } from '../core/types';
import { LightZone, AudioZone, TriggerZone } from '../../../../../types';
import { zonesWorkerService } from '../../../../../services/ZonesWorkerService';
import { ProcessedZonesResult, ProcessedZone } from '../../../../../workers/modules/ZonesModule';
import { DebugLogger } from '../../../../../utils/DebugLogger';

/**
 * ZonesLayer - Renders special zones (light, audio, trigger).
 *
 * Features:
 * - Worker-based processing for geometry and styling
 * - Light zones with brightness indication
 * - Audio zones with speaker icon
 * - Trigger zones with lightning icon
 * - GM-only visibility
 * - Cached until zones change
 */
export class ZonesLayer extends BaseLayer {
  // Worker State
  private processedData: ProcessedZonesResult | null = null;
  private lastDispatchedHash: string | null = null;
  private isProcessing: boolean = false;

  constructor() {
    super('zones', 'Zones', {
      useCache: true,
      cacheStrategy: 'world',
      description: 'Light, audio, and trigger zones',
    });
  }

  /**
   * Lifecycle Hook: Called before every render frame.
   * Checks if we need to dispatch a new worker job.
   */
  onBeforeRender(context: RenderContext): void {
    const { scene, isGM, gmViewMode } = context;
    if (!scene || !isGM || gmViewMode !== 'gm') return;

    // Calculate a hash of the SOURCE data to see if it changed
    const sourceHash = this.computeSourceHash(scene.lightZones, scene.audioZones, scene.triggerZones);

    if (sourceHash !== this.lastDispatchedHash && !this.isProcessing) {
      this.dispatchWorker(sourceHash, scene.lightZones || [], scene.audioZones || [], scene.triggerZones || []);
    }
  }

  private computeSourceHash(light?: LightZone[], audio?: AudioZone[], trigger?: TriggerZone[]): string {
    // Simple length + last item ID hash for speed
    // For deep changes (like moving a point), we rely on the editor updating the zones array reference or IDs
    // If mutable updates happen without reference change, this might need deeper checking, 
    // but in Redux/React land, immutability usually gives us new references.
    // For robust "content" hashing without excessive cost:
    const l = light?.length ?? 0;
    const a = audio?.length ?? 0;
    const t = trigger?.length ?? 0;
    return `l${l}-a${a}-t${t}-${light?.[l - 1]?.id ?? ''}`;
  }

  private async dispatchWorker(hash: string, lightZones: LightZone[], audioZones: AudioZone[], triggerZones: TriggerZone[]) {
    this.isProcessing = true;
    this.lastDispatchedHash = hash;

    DebugLogger.log('zones', 'ZonesLayer', 'Dispatch', 'Zone data changed, dispatching worker...');

    try {
      const result = await zonesWorkerService.processZones({
        lightZones,
        audioZones,
        triggerZones
      });

      this.processedData = result;
      this.isProcessing = false;

      // Invalidate cache to force re-render with new data
      this.invalidateCache();
      DebugLogger.log('zones', 'ZonesLayer', 'Update', 'Worker finished, cache invalidated.');

    } catch (err) {
      DebugLogger.error('zones', 'ZonesLayer', 'Error', 'Worker failed', err);
      this.isProcessing = false;
      // Reset hash so we retry later or on next change
      this.lastDispatchedHash = null;
    }
  }

  computeStateHash(context: RenderContext): string {
    const { scene, isGM, gmViewMode, zoom } = context;
    if (!scene) return 'no-scene';
    if (!isGM || gmViewMode !== 'gm') return 'hidden';

    // We include the PROCESSED data presence in the hash. 
    // If processedData updates, this hash changes, triggering render().
    // We also include zoom because stroke width depends on it.
    const dataHash = this.processedData
      ? `ready-${this.countProcessed()}`
      : 'pending';

    return this.hashValues(
      dataHash,
      zoom
    );
  }

  private countProcessed(): number {
    if (!this.processedData) return 0;
    return this.processedData.light.length + this.processedData.audio.length + this.processedData.trigger.length;
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { scene, isGM, gmViewMode, zoom } = context;
    if (!scene) return;
    if (!isGM || gmViewMode !== 'gm') return;

    if (!this.processedData) {
      // Data not ready yet. 
      // Option 1: Render nothing (avoids ghosting)
      // Option 2: Render loading indicator?
      return;
    }

    ctx.save();

    // Render processed light zones
    for (const zone of this.processedData.light) {
      this.renderProcessedZone(ctx, zone, zoom);
    }

    // Render processed audio zones
    for (const zone of this.processedData.audio) {
      this.renderProcessedZone(ctx, zone, zoom);
    }

    // Render processed trigger zones
    for (const zone of this.processedData.trigger) {
      this.renderProcessedZone(ctx, zone, zoom);
    }

    ctx.restore();
  }

  private renderProcessedZone(ctx: CanvasRenderingContext2D, zone: ProcessedZone, zoom: number): void {
    ctx.save();

    ctx.beginPath();
    if (zone.shapeType === 'rect' && zone.rect) {
      ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
    } else if (zone.shapeType === 'polygon' && zone.points && zone.points.length > 0) {
      ctx.moveTo(zone.points[0].x, zone.points[0].y);
      for (let i = 1; i < zone.points.length; i++) {
        ctx.lineTo(zone.points[i].x, zone.points[i].y);
      }
      ctx.closePath();
    }

    // Use pre-calculated color
    const c = zone.color;
    ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
    ctx.fill();

    // Stroke (slightly more opaque than fill)
    ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.min(1, c.a * 2)})`;
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash(zone.type === 'light' ? [6 / zoom, 3 / zoom] : [8 / zoom, 4 / zoom]);
    ctx.stroke();

    // Label
    const center = zone.center;
    if (center && zone.label) {
      ctx.font = `bold ${14 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Label color matches stroke or specific logic
      // Ideally worker provides labelColor too, but for now we reuse refined logic
      if (zone.type === 'light' && (zone.original as LightZone).brightness <= 0.2) {
        ctx.fillStyle = '#666';
      } else if (zone.type === 'light') {
        // Using custom color or default yellow
        ctx.fillStyle = (zone.original as LightZone).color || '#ffdc64';
      } else if (zone.type === 'audio') {
        ctx.fillStyle = 'rgba(59, 130, 246, 1)';
      } else {
        ctx.fillStyle = 'rgba(168, 85, 247, 1)';
      }

      ctx.fillText(zone.label, center.x, center.y);
    }

    ctx.restore();
  }
}
