/**
 * SmartSync System - useSyncSubscription Hook
 * 
 * React hook for subscribing to sync updates.
 * Provides reactive state that updates when entities change.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { smartSync } from './SmartSyncService';
import type { EntityType, ChangeType, SubscriptionOptions, ChangeCallback } from './types';

/**
 * Subscribe to a single entity and get reactive state.
 */
export function useSyncEntity<T>(
  entityType: EntityType,
  entityId: string | null
): T | null {
  const [data, setData] = useState<T | null>(() =>
    entityId ? smartSync.get<T>(entityType, entityId) : null
  );

  useEffect(() => {
    if (!entityId) {
      setData(null);
      return;
    }

    // Initial data
    setData(smartSync.get<T>(entityType, entityId));

    // Subscribe to changes
    const unsubscribe = smartSync.subscribe<T>(
      entityType,
      (id, newData, changeType) => {
        if (id === entityId) {
          setData(changeType === 'delete' ? null : newData);
        }
      },
      { filterIds: [entityId] }
    );

    return unsubscribe;
  }, [entityType, entityId]);

  return data;
}

/**
 * Subscribe to multiple entities of a type.
 */
export function useSyncCollection<T>(
  entityType: EntityType,
  filterIds?: string[]
): Map<string, T> {
  const [entities, setEntities] = useState<Map<string, T>>(() =>
    smartSync.getAll<T>(entityType)
  );

  // Track which IDs we're watching
  const filterRef = useRef(filterIds);
  filterRef.current = filterIds;

  useEffect(() => {
    // Initial data
    setEntities(smartSync.getAll<T>(entityType));

    // Subscribe to changes
    const unsubscribe = smartSync.subscribe<T>(
      entityType,
      (id, newData, changeType) => {
        // If we have a filter and this ID isn't in it, skip
        if (filterRef.current && !filterRef.current.includes(id)) return;

        setEntities(prev => {
          const next = new Map(prev);
          if (changeType === 'delete') {
            next.delete(id);
          } else if (newData) {
            next.set(id, newData);
          }
          return next;
        });
      },
      { filterIds }
    );

    return unsubscribe;
  }, [entityType, JSON.stringify(filterIds)]);

  return entities;
}

/**
 * Hook to apply sync changes.
 */
export function useSyncActions<T>(entityType: EntityType) {
  const apply = useCallback((
    entityId: string,
    changeType: ChangeType,
    data: Partial<T>,
    parentId?: string
  ) => {
    return smartSync.apply<T>(entityType, entityId, changeType, data, parentId);
  }, [entityType]);

  const update = useCallback((entityId: string, data: Partial<T>, parentId?: string) => {
    return apply(entityId, 'update', data, parentId);
  }, [apply]);

  const create = useCallback((entityId: string, data: T, parentId?: string) => {
    return apply(entityId, 'create', data as Partial<T>, parentId);
  }, [apply]);

  const remove = useCallback((entityId: string, parentId?: string) => {
    return apply(entityId, 'delete', {}, parentId);
  }, [apply]);

  const move = useCallback((entityId: string, x: number, y: number, parentId?: string) => {
    return apply(entityId, 'move', { x, y } as unknown as Partial<T>, parentId);
  }, [apply]);

  return { apply, update, create, remove, move };
}

/**
 * Hook to get sync status.
 */
export function useSyncStatus() {
  const [status, setStatus] = useState(() => smartSync.getStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(smartSync.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
}

/**
 * Hook for custom subscription with callback.
 */
export function useSyncSubscription<T>(
  entityType: EntityType,
  callback: ChangeCallback<T>,
  options: SubscriptionOptions = {}
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = smartSync.subscribe<T>(
      entityType,
      (id, data, changeType) => callbackRef.current(id, data, changeType),
      options
    );

    return unsubscribe;
  }, [entityType, JSON.stringify(options)]);
}
