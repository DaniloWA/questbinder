import { useState, useEffect } from 'react';
import { WorkerManager } from '../workers/core/WorkerManager';
import { DebugLogger } from '../utils/DebugLogger';

/**
 * Hook to track the number of active jobs in the WorkerManager queue.
 * Useful for showing loading indicators when background processing is happening.
 */
export const useWorkerQueue = () => {
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    // Get singleton instance
    const workerManager = WorkerManager.getInstance();

    // Subscribe to queue changes
    const unsubscribe = workerManager.onQueueChange((count) => {
      DebugLogger.log('worker', 'useWorkerQueue', 'Update', `Received update: ${count}`);
      setQueueSize(count);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return queueSize;
};
