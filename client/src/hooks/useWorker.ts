import { useCallback, useEffect, useState } from 'react';
import { WorkerManager } from '../workers/core/WorkerManager';

/**
 * useWorker Hook
 * 
 * Provides easy access to the worker instance.
 */
export function useWorker() {
  const manager = WorkerManager.getInstance();

  /**
   * Run a task on the worker.
   */
  const execute = useCallback(async <T = any>(module: string, action: string, payload?: any): Promise<T> => {
    return manager.execute<T>(module, action, payload);
  }, []);

  /**
   * Subscribe to worker events.
   */
  const subscribe = useCallback((module: string, callback: (event: string, payload: any) => void) => {
    return manager.on(module, callback);
  }, []);

  return { execute, subscribe };
}

/**
 * useWorkerTask Hook
 * 
 * Wrapper for executing single tasks with loading/error state.
 */
export function useWorkerTask<T = any, P = any>(module: string, action: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { execute } = useWorker();

  const run = useCallback(async (payload: P) => {
    setLoading(true);
    setError(null);
    try {
      const result = await execute<T>(module, action, payload);
      setData(result);
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [module, action, execute]);

  return { run, loading, error, data };
}
