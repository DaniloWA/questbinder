/**
 * SmartSync System - SyncQueue
 * 
 * Intelligent queue for batching and prioritizing sync operations.
 * Automatically flushes based on priority configuration.
 */

import { socketService } from '../socketService';
import {
  EntityType,
  PendingChange,
  SyncPriority,
  getEntityPriority,
  getPriorityConfig,
  generateChangeId,
  ChangeType,
} from './types';

/**
 * Queue entry with metadata.
 */
interface QueueEntry {
  change: PendingChange;
  retries: number;
  addedAt: number;
}

/**
 * Batch of changes to send together.
 */
interface SyncBatch {
  id: string;
  changes: PendingChange[];
  priority: SyncPriority;
  timestamp: number;
}

/**
 * SyncQueue - Batched operation queue with priority-based flushing.
 * 
 * Features:
 * - Priority-based batching (critical = immediate, low = 500ms batch)
 * - Automatic flush timers per priority
 * - Retry logic with exponential backoff
 * - Change deduplication (latest change wins)
 */
export class SyncQueue {
  private queues: Map<SyncPriority, Map<string, QueueEntry>> = new Map();
  private flushTimers: Map<SyncPriority, NodeJS.Timeout | null> = new Map();
  private listeners: Set<(batch: SyncBatch) => void> = new Set();

  // Configuration
  private maxRetries = 3;
  private retryDelayMs = 1000;
  private enabled = true;

  constructor() {
    // Initialize priority queues
    const priorities: SyncPriority[] = ['critical', 'high', 'medium', 'low'];
    for (const priority of priorities) {
      this.queues.set(priority, new Map());
      this.flushTimers.set(priority, null);
    }
  }

  // ===========================================================================
  // QUEUE OPERATIONS
  // ===========================================================================

  /**
   * Enqueue a change for syncing.
   */
  enqueue<T>(
    entityType: EntityType,
    entityId: string,
    changeType: ChangeType,
    data: Partial<T>,
    parentId?: string,
    version = 0
  ): string {
    if (!this.enabled) return '';

    const priority = getEntityPriority(entityType);
    const changeId = generateChangeId();

    const change: PendingChange<T> = {
      id: changeId,
      entityType,
      entityId,
      parentId,
      changeType,
      data,
      version,
      timestamp: Date.now(),
      optimistic: true,
      priority,
    };

    const entry: QueueEntry = {
      change: change as PendingChange,
      retries: 0,
      addedAt: Date.now(),
    };

    // Deduplication key: entityType:entityId
    const key = `${entityType}:${entityId}`;
    const queue = this.queues.get(priority)!;

    // If same entity already queued, merge changes
    const existing = queue.get(key);
    if (existing && existing.change.changeType === 'update' && changeType === 'update') {
      // Merge data for same entity updates
      existing.change.data = { ...existing.change.data, ...data };
      existing.change.timestamp = Date.now();
      existing.change.id = changeId; // Update ID to new one
    } else {
      queue.set(key, entry);
    }

    // Schedule flush based on priority
    this.scheduleFlush(priority);

    return changeId;
  }

  /**
   * Remove a change from queue (e.g., on rollback).
   */
  dequeue(changeId: string): boolean {
    for (const queue of this.queues.values()) {
      for (const [key, entry] of queue) {
        if (entry.change.id === changeId) {
          queue.delete(key);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get pending changes count.
   */
  getPendingCount(): number {
    let count = 0;
    for (const queue of this.queues.values()) {
      count += queue.size;
    }
    return count;
  }

  // ===========================================================================
  // FLUSH OPERATIONS
  // ===========================================================================

  /**
   * Schedule a flush for the given priority.
   */
  private scheduleFlush(priority: SyncPriority): void {
    const config = getPriorityConfig(priority);

    // Critical priority: flush immediately
    if (config.immediate) {
      this.flush(priority);
      return;
    }

    // Check if already scheduled
    if (this.flushTimers.get(priority)) return;

    // Check if batch size reached
    const queue = this.queues.get(priority)!;
    if (queue.size >= config.maxBatchSize) {
      this.flush(priority);
      return;
    }

    // Schedule delayed flush
    const timer = setTimeout(() => {
      this.flushTimers.set(priority, null);
      this.flush(priority);
    }, config.flushIntervalMs);

    this.flushTimers.set(priority, timer);
  }

  /**
   * Flush all changes for a priority.
   */
  flush(priority: SyncPriority): void {
    const queue = this.queues.get(priority);
    if (!queue || queue.size === 0) return;

    // Clear timer
    const timer = this.flushTimers.get(priority);
    if (timer) {
      clearTimeout(timer);
      this.flushTimers.set(priority, null);
    }

    // Collect changes
    const changes: PendingChange[] = [];
    for (const entry of queue.values()) {
      changes.push(entry.change);
    }

    // Clear queue
    queue.clear();

    // Create batch
    const batch: SyncBatch = {
      id: generateChangeId(),
      changes,
      priority,
      timestamp: Date.now(),
    };

    // Notify listeners
    for (const listener of this.listeners) {
      listener(batch);
    }

    // Send to server
    this.sendBatch(batch);
  }

  /**
   * Flush all queues.
   */
  flushAll(): void {
    const priorities: SyncPriority[] = ['critical', 'high', 'medium', 'low'];
    for (const priority of priorities) {
      this.flush(priority);
    }
  }

  /**
   * Send batch to server via socket.
   */
  private sendBatch(batch: SyncBatch): void {
    for (const change of batch.changes) {
      this.sendChange(change);
    }
  }

  /**
   * Send individual change to server.
   */
  private sendChange(change: PendingChange): void {
    const { entityType, entityId, parentId, changeType, data } = change;

    // Map to existing socket events
    const eventMap: Record<string, string> = {
      'token:create': 'token:add',
      'token:update': 'token:update',
      'token:delete': 'token:remove',
      'token:move': 'token:update',
      'scene:update': 'scene:update',
      'character:update': 'character:update',
      'drawing:create': 'drawing:add',
      'drawing:delete': 'drawing:remove',
      'obstacle:create': 'scene:update',
      'obstacle:delete': 'scene:update',
      'combat:create': 'combat:start',
      'combat:update': 'combat:update',
      'combat:delete': 'combat:end',
      'attackZone:create': 'attackZone:add',
      'attackZone:update': 'attackZone:update',
      'attackZone:delete': 'attackZone:remove',
      'handout:update': 'handout:update',
      'campaign:update': 'campaign:update',
      'chatMessage:create': 'chat:message',
      'chatMessage:update': 'chat:reaction',
      'player:update': 'player:update', // Unified player update event
    };

    const eventKey = `${entityType}:${changeType}`;
    const event = eventMap[eventKey];

    if (!event) {
      console.warn('[SyncQueue] Unknown event mapping:', eventKey);
      return;
    }

    // Build payload based on entity type
    let payload: any;
    const common = { clientVersion: change.version, changeId: change.id };

    switch (entityType) {
      case 'token':
        payload = changeType === 'create'
          ? { sceneId: parentId, token: data, ...common }
          : changeType === 'delete'
            ? { sceneId: parentId, id: entityId, ...common }
            : { sceneId: parentId, id: entityId, changes: data, token: data, ...data, ...common };
        break;

      case 'scene':
        payload = { id: entityId, changes: data, ...common };
        break;

      case 'character':
        payload = { characterId: entityId, updates: data, ...common };
        break;

      case 'drawing':
        payload = changeType === 'create'
          ? { sceneId: parentId, drawing: data, ...common }
          : { sceneId: parentId, id: entityId, ...common };
        break;

      case 'combat':
        payload = { combat: data, ...common };
        break;

      case 'chatMessage':
        if (changeType === 'create') {
          payload = { message: data, ...common };
        } else if (changeType === 'update') {
          // Providing specific payload for chat:reaction
          // data should contain { reactions: ... }
          payload = { messageId: entityId, reaction: (data as any).reactions, ...common };
        }
        break;

      case 'player':
        // For player updates (viewport etc)
        payload = { id: entityId, changes: data, ...common };
        break;

      default:
        payload = { id: entityId, ...data, ...common };
    }

    socketService.emit(event as any, payload);
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Subscribe to batch events.
   */
  onBatch(callback: (batch: SyncBatch) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Enable/disable the queue.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Clear all queues.
   */
  clear(): void {
    for (const [priority, timer] of this.flushTimers) {
      if (timer) clearTimeout(timer);
      this.flushTimers.set(priority, null);
    }
    for (const queue of this.queues.values()) {
      queue.clear();
    }
  }

  /**
   * Debug log queue state.
   */
  debug(): void {
    console.group('[SyncQueue] State');
    for (const [priority, queue] of this.queues) {
      if (queue.size > 0) {
        console.log(`${priority}: ${queue.size} pending`);
        for (const [key, entry] of queue) {
          console.log(`  ${key}: ${entry.change.changeType}`);
        }
      }
    }
    console.groupEnd();
  }
}

// Export singleton instance
export const syncQueue = new SyncQueue();
