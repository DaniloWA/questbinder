import { smartSync } from '../../services/sync';
import { EntityType, ChangeType, SyncEvent } from '../../services/sync/types';

/**
 * Metadata for syncing an event with SmartSync cache.
 */
export interface SyncMetadata {
  entityType: EntityType;
  entityId: string;
  changeType: ChangeType;
  data: unknown;
  parentId?: string;
  userId?: string;
}

/**
 * Notifies SmartSync cache of an incoming socket event.
 * Call this from any listener handler to keep SmartSync in sync.
 * 
 * @example
 * const handleTokenUpdate = (payload) => {
 *   setState(prev => ...); // Update React state
 *   
 *   notifySmartSync({
 *     entityType: 'token',
 *     entityId: payload.id,
 *     changeType: 'update',
 *     data: payload.changes,
 *     parentId: payload.sceneId
 *   });
 * };
 */
export function notifySmartSync(meta: SyncMetadata): void {
  const event: SyncEvent = {
    entityType: meta.entityType,
    entityId: meta.entityId,
    changeType: meta.changeType,
    data: meta.data,
    parentId: meta.parentId,
    version: Date.now(),
    timestamp: Date.now(),
    userId: meta.userId,
  };

  smartSync.receive(event);
}

/**
 * Helper to extract entity info from common payload shapes.
 */
export function extractTokenInfo(payload: { id: string; sceneId: string; changes?: unknown; token?: unknown; }) {
  return {
    entityId: payload.id || (payload.token as any)?.id,
    parentId: payload.sceneId,
    data: payload.changes || payload.token || payload,
  };
}

export function extractSceneInfo(payload: { id: string; changes?: unknown; scene?: unknown; }) {
  return {
    entityId: payload.id || (payload.scene as any)?.id,
    data: payload.changes || payload.scene || payload,
  };
}

export function extractDrawingInfo(payload: { id?: string; sceneId: string; drawing?: unknown; }) {
  return {
    entityId: payload.id || (payload.drawing as any)?.id,
    parentId: payload.sceneId,
    data: payload.drawing || payload,
  };
}
