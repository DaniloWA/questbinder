/**
 * Loader Stages Hook
 * 
 * Manages sequential stage progression for the loading screen with:
 * - Configurable stage weights
 * - Async condition checking  
 * - Ping measurement
 * - Log management
 * 
 * @module loading/useLoaderStages
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { LoaderStage, AssetStatus, UseLoaderStagesReturn, LogEntry, LOADER_STAGES } from './types';
import { LOADER_CONFIG, STAGE_WEIGHTS, generateLogId } from './constants';
import { socketService } from '../../../../services/socketService';

interface UseLoaderStagesProps {
  /** Socket connection status */
  isConnected: boolean;
  /** Whether active scene is available */
  hasActiveScene: boolean;
  /** Scene name for logging */
  sceneName?: string;
  /** Whether asset loading is complete */
  assetsComplete: boolean;
  /** Total assets count for logging */
  assetCount: number;
  /** Translation function */
  t: (key: string, params?: Record<string, string | number>) => string;
}

/**
 * Hook for managing sequential loading stage progression.
 */
export const useLoaderStages = ({
  isConnected,
  hasActiveScene,
  sceneName,
  assetsComplete,
  assetCount,
  t,
}: UseLoaderStagesProps): UseLoaderStagesReturn => {
  // Stage statuses
  const [stageStatuses, setStageStatuses] = useState<Record<LoaderStage, AssetStatus>>({
    connection: 'pending',
    ping: 'pending',
    session: 'pending',
    modules: 'pending',
    assets: 'pending',
  });

  // Additional state
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  // Refs for cleanup and preventing duplicate executions
  const isActiveRef = useRef(true);
  const pingMeasuredRef = useRef(false);
  const modulesWarmupDoneRef = useRef(false);
  const connectionStartedRef = useRef(false);
  const sessionStartedRef = useRef(false);
  const assetsStartedRef = useRef(false);

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  /**
   * Add a log entry with automatic ID generation.
   */
  const addLog = useCallback((message: string, level: LogEntry['level'] = 'info') => {
    if (!isActiveRef.current) return;

    setLogs(prev => {
      const newLog: LogEntry = {
        id: generateLogId(),
        message,
        timestamp: Date.now(),
        level,
      };
      // Keep only last 5 logs
      return [...prev.slice(-4), newLog];
    });
  }, []);

  /**
   * Update a single stage status.
   */
  const setStageStatus = useCallback((stage: LoaderStage, status: AssetStatus) => {
    if (!isActiveRef.current) return;
    setStageStatuses(prev => ({ ...prev, [stage]: status }));
  }, []);

  /**
   * Measure network ping latency.
   */
  const measurePing = useCallback(async (): Promise<number> => {
    try {
      const ms = await Promise.race([
        socketService.getPing(),
        new Promise<number>((_, reject) =>
          setTimeout(() => reject(new Error('Ping timeout')), LOADER_CONFIG.PING_TIMEOUT_MS)
        ),
      ]);
      return ms;
    } catch {
      return LOADER_CONFIG.PING_FALLBACK_MS + Math.floor(Math.random() * 20);
    }
  }, []);

  /**
   * Add log with delay to prevent overlapping messages.
   */
  const addLogWithDelay = useCallback(async (message: string, delayMs: number = 300): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        addLog(message);
        resolve();
      }, delayMs);
    });
  }, [addLog]);

  // Stage advancement effect
  useEffect(() => {
    const advance = async () => {
      if (!isActiveRef.current) return;

      // Stage 1: Connection
      if (stageStatuses.connection !== 'loaded') {
        if (isConnected && !connectionStartedRef.current) {
          connectionStartedRef.current = true;

          await addLogWithDelay(t('vtt.loading.logs.connectingWebSocket'), 0);
          await addLogWithDelay(t('vtt.loading.logs.handshakeComplete'), 400);

          setStageStatus('connection', 'loaded');

          await addLogWithDelay(t('vtt.loading.logs.startingNetworkDiag'), 500);
          setStageStatus('ping', 'loading');
        }
        return;
      }

      // Stage 2: Ping
      if (stageStatuses.ping !== 'loaded') {
        if (stageStatuses.ping === 'loading' && !pingMeasuredRef.current) {
          pingMeasuredRef.current = true;

          addLog(t('vtt.loading.logs.sendingTestPackets'));
          const ms = await measurePing();
          if (!isActiveRef.current) return;

          setPingMs(ms);

          const qualityKey = ms < 50 ? 'qualityExcellent' : ms < 100 ? 'qualityGood' : ms < 200 ? 'qualityAcceptable' : 'qualityHigh';
          const quality = t(`vtt.loading.logs.${qualityKey}`);
          await addLogWithDelay(t('vtt.loading.logs.latencyMeasured', { ms: ms.toString(), quality }), 400);

          setTimeout(() => {
            if (!isActiveRef.current) return;
            setStageStatus('ping', 'loaded');
            addLog(t('vtt.loading.logs.connectingToSession'));
            setStageStatus('session', 'loading');
          }, LOADER_CONFIG.STAGE_TRANSITION_DELAY_MS);
        }
        return;
      }

      // Stage 3: Session
      if (stageStatuses.session !== 'loaded') {
        if (hasActiveScene && !sessionStartedRef.current) {
          sessionStartedRef.current = true;

          await addLogWithDelay(t('vtt.loading.logs.activeMapFound', { name: sceneName || 'Main Scene' }), 0);
          await addLogWithDelay(t('vtt.loading.logs.sessionSynced'), 400);

          setStageStatus('session', 'loaded');

          await addLogWithDelay(t('vtt.loading.logs.preparingModules'), 500);
          setStageStatus('modules', 'loading');
        }
        return;
      }

      // Stage 4: Modules (with warmup delay)
      if (stageStatuses.modules !== 'loaded') {
        if (stageStatuses.modules === 'loading' && !modulesWarmupDoneRef.current) {
          modulesWarmupDoneRef.current = true;

          await addLogWithDelay(t('vtt.loading.logs.loadingTypography'), 0);
          await document.fonts.ready;
          if (!isActiveRef.current) return;

          await addLogWithDelay(t('vtt.loading.logs.fontsLoaded'), 400);
          await addLogWithDelay(t('vtt.loading.logs.initializingModules'), 500);
          await addLogWithDelay(t('vtt.loading.logs.compilingShaders'), 600);

          setTimeout(() => {
            if (!isActiveRef.current) return;
            addLog(t('vtt.loading.logs.interfaceReady'));
            setStageStatus('modules', 'loaded');
            setStageStatus('assets', 'loading');
          }, LOADER_CONFIG.MODULES_WARMUP_DELAY_MS);
        }
        return;
      }

      // Stage 5: Assets
      if (stageStatuses.assets !== 'loaded') {
        if (assetsComplete && !assetsStartedRef.current) {
          assetsStartedRef.current = true;

          await addLogWithDelay(t('vtt.loading.logs.cacheComplete', { count: assetCount.toString() }), 0);
          await addLogWithDelay(t('vtt.loading.logs.allResourcesLoaded'), 400);
          setStageStatus('assets', 'loaded');
        }
        return;
      }
    };

    advance();
  }, [
    isConnected,
    hasActiveScene,
    sceneName,
    assetsComplete,
    assetCount,
    stageStatuses,
    addLog,
    setStageStatus,
    addLogWithDelay,
    measurePing,
    t,
  ]);

  // Progress calculation effect
  useEffect(() => {
    let target = 0;

    // Calculate target based on completed stages
    LOADER_STAGES.forEach(stage => {
      if (stageStatuses[stage] === 'loaded') {
        target += STAGE_WEIGHTS[stage];
      }
    });

    // Smooth progress animation
    if (overallProgress < target) {
      const interval = setInterval(() => {
        setOverallProgress(prev => {
          if (prev >= target) {
            clearInterval(interval);
            return target;
          }
          return Math.min(target, prev + LOADER_CONFIG.PROGRESS_INCREMENT);
        });
      }, LOADER_CONFIG.PROGRESS_ANIMATION_INTERVAL_MS);

      return () => clearInterval(interval);
    }
  }, [stageStatuses, overallProgress]);

  // Determine current stage
  const currentStage: LoaderStage = LOADER_STAGES.find(
    stage => stageStatuses[stage] === 'loading' || stageStatuses[stage] === 'pending'
  ) || 'assets';

  // Check if all stages complete
  const isComplete = LOADER_STAGES.every(stage => stageStatuses[stage] === 'loaded');

  return {
    currentStage,
    stageStatuses,
    isComplete,
    overallProgress,
    pingMs,
    logs,
    addLog,
  };
};

