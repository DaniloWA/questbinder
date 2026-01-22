/**
 * VTT Loading Screen
 * 
 * Full-screen loading overlay for the Virtual Tabletop.
 * Displays loading stages, progress, and terminal-style logs.
 * 
 * ARCHITECTURE:
 * - Pure presentation component (no business logic)
 * - All loading logic handled by useSmartLoader hook
 * - Uses extracted sub-components for cleaner code
 * 
 * @module loading/VttLoadingScreen
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Wifi,
  Database,
  Terminal,
  FileCode,
  Layers,
  ArrowLeft,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';
import { useGameSession } from '../../../context/GameSessionContext';
import { useSmartLoader } from '../../../views/GameSession/hooks/useSmartLoader';
import { Token, Character, Handout } from '../../../types';
import { STAGE_CONFIGS, LOADER_CONFIG } from '../../../views/GameSession/hooks/loading';

// Sub-components
import { StatusRow } from './StatusRow';
import { LogViewer } from './LogViewer';
import { ProgressBar } from './ProgressBar';

// ============================================================================
// Types
// ============================================================================

interface VttLoadingScreenProps {
  /** Callback when loading completes */
  onReady: () => void;
  /** Callback to return to lobby */
  onBackToLobby?: () => void;
  /** Tokens to preload */
  tokens: Token[];
  /** Characters to preload */
  characters: Character[];
  /** Handouts to preload */
  handouts: Handout[];
}

// ============================================================================
// Icon Mapping
// ============================================================================

const STAGE_ICONS: Record<string, React.ComponentType<{ className?: string; }>> = {
  Wifi,
  Terminal,
  Database,
  FileCode,
  Layers,
};

// ============================================================================
// Component
// ============================================================================

/**
 * VTT Loading Screen
 * 
 * Displays a professional loading screen with:
 * - Sequential stage tracking (connection, ping, session, modules, assets)
 * - Real-time progress bar
 * - Terminal-style activity log
 * - Smooth transitions and animations
 * - Timeout safety net (30s)
 * - Force entry button (after 10s stuck)
 * - Back to lobby button
 * - Error modal for failed assets
 */
export const VttLoadingScreen: React.FC<VttLoadingScreenProps> = ({
  onReady,
  onBackToLobby,
  tokens,
  characters,
  handouts,
}) => {
  const { t } = useTranslation();
  const session = useGameSession();
  const onReadyCalledRef = useRef(false);
  const loadingStartTimeRef = useRef(Date.now());
  const lastStageChangeRef = useRef(Date.now());

  // New state for smart loading strategies
  const [showForceEntry, setShowForceEntry] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorCountdown, setErrorCountdown] = useState(3);

  // Use the smart loader hook
  const loader = useSmartLoader({
    scene: session.activeScene,
    tokens,
    characters,
    handouts,
    isConnected: session.isConnected,
  });

  // Finalization state
  const [isFinalizingRef, setIsFinalizing] = useState(false);
  const [finalizationMessage, setFinalizationMessage] = useState('');

  // Finalization messages from translations
  const FINALIZATION_MESSAGES = [
    t('vtt.loading.finalization.preparing'),
    t('vtt.loading.finalization.syncing'),
    t('vtt.loading.finalization.optimizing'),
    t('vtt.loading.finalization.ready'),
  ];

  // Track stage changes for force entry button
  useEffect(() => {
    lastStageChangeRef.current = Date.now();
    setShowForceEntry(false);
  }, [loader.currentStage, loader.progress.loaded]);

  // Check for stuck stages (10s timeout for force entry button)
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceStageChange = Date.now() - lastStageChangeRef.current;
      if (timeSinceStageChange > LOADER_CONFIG.STAGE_TIMEOUT_MS && !showForceEntry && !loader.isComplete) {
        setShowForceEntry(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [showForceEntry, loader.isComplete]);

  // Global timeout (30s) - force entry with error modal if assets failed
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!onReadyCalledRef.current && !loader.isComplete) {
        handleForceEntry();
      }
    }, LOADER_CONFIG.MAX_LOADING_TIME_MS);
    return () => clearTimeout(timeout);
  }, []);

  // Handle force entry (shows error modal if there are failed assets)
  const handleForceEntry = () => {
    if (onReadyCalledRef.current) return;

    if (loader.failedAssets.length > 0) {
      setShowErrorModal(true);
      // Countdown and auto-enter
      let countdown = 3;
      setErrorCountdown(countdown);
      const countdownInterval = setInterval(() => {
        countdown--;
        setErrorCountdown(countdown);
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          onReadyCalledRef.current = true;
          onReady();
        }
      }, 1000);
    } else {
      onReadyCalledRef.current = true;
      onReady();
    }
  };

  // Handle finalization sequence when loading completes
  useEffect(() => {
    if (loader.isComplete && !onReadyCalledRef.current && !isFinalizingRef) {
      // If there are failed assets, show error modal
      if (loader.failedAssets.length > 0) {
        handleForceEntry();
        return;
      }

      setIsFinalizing(true);

      // Show finalization messages sequentially
      let messageIndex = 0;
      const messageInterval = LOADER_CONFIG.FINALIZATION_DELAY_MS / FINALIZATION_MESSAGES.length;

      const showNextMessage = () => {
        if (messageIndex < FINALIZATION_MESSAGES.length) {
          setFinalizationMessage(FINALIZATION_MESSAGES[messageIndex]);
          messageIndex++;
          setTimeout(showNextMessage, messageInterval);
        } else {
          // All messages shown, now ready
          onReadyCalledRef.current = true;
          setTimeout(() => {
            onReady();
          }, LOADER_CONFIG.COMPLETION_DELAY_MS);
        }
      };

      showNextMessage();
    }
  }, [loader.isComplete, onReady, isFinalizingRef]);

  // Helper to get subtext for stages
  const getStageSubtext = (stage: string): string | undefined => {
    switch (stage) {
      case 'ping':
        return loader.pingMs ? `${loader.pingMs}ms` : undefined;
      case 'assets':
        if (loader.stageStatuses.assets === 'loading' || loader.stageStatuses.assets === 'loaded') {
          return `${loader.progress.loaded}/${loader.progress.total}`;
        }
        return undefined;
      default:
        return undefined;
    }
  };

  return (
    <div className="absolute inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center text-white select-none cursor-wait">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-cyan-900/30 via-cyan-950/10 to-transparent blur-[100px] rounded-full animate-pulse" />
        {/* Secondary Glow */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-900/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04]" />
        {/* Scan Lines Effect */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />
      </div>

      {/* Main Card */}
      <div className="w-[560px] bg-zinc-900/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-cyan-900/20 relative overflow-hidden flex flex-col">
        {/* Animated Header Bar */}
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>

        <div className="px-10 pb-10 pt-8">
          {/* Title Area */}
          <div className="flex items-center gap-5 mb-10">
            {/* Animated Logo */}
            <div className="relative">
              <div className="absolute -inset-2 bg-cyan-500/20 rounded-xl blur-lg animate-pulse" />
              <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white flex items-center gap-3">
                {t('vtt.loading.title')}
                <span className="text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 font-medium tracking-wider">
                  {t('vtt.loading.version')}
                </span>
              </h1>
              <p className="text-xs text-zinc-500 font-mono mt-1.5 tracking-wider">
                {t('vtt.loading.subtitle')}
              </p>
            </div>
          </div>

          {/* Stage Status Grid */}
          <div className="space-y-2 mb-10 bg-black/20 rounded-xl p-4 border border-white/5">
            {STAGE_CONFIGS.map((config) => {
              const IconComponent = STAGE_ICONS[config.icon];
              return (
                <StatusRow
                  key={config.stage}
                  icon={IconComponent}
                  label={t(config.label)}
                  status={loader.stageStatuses[config.stage]}
                  subtext={getStageSubtext(config.stage)}
                />
              );
            })}
          </div>

          {/* Terminal Log */}
          <LogViewer
            logs={loader.logs}
            currentFile={loader.currentFile}
            isLoadingAssets={loader.stageStatuses.assets === 'loading'}
            finalizationMessage={finalizationMessage}
          />

          {/* Progress Bar */}
          <ProgressBar
            percent={loader.overallProgress}
            label={t('vtt.loading.progressLabel')}
          />
        </div>

        {/* Action Buttons */}
        <div className="px-10 pb-6 flex justify-between items-center">
          {/* Back to Lobby */}
          {onBackToLobby && (
            <button
              onClick={onBackToLobby}
              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('vtt.loading.buttons.backToLobby')}
            </button>
          )}

          {/* Spacer */}
          {!onBackToLobby && <div />}

          {/* Force Entry */}
          {showForceEntry && !showErrorModal && (
            <button
              onClick={handleForceEntry}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 rounded-lg hover:from-amber-500/30 hover:to-orange-500/30 transition-all animate-pulse"
            >
              <Zap className="w-4 h-4" />
              {t('vtt.loading.buttons.forceEntry')}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-[10px] text-zinc-600 font-mono tracking-widest flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        {t('vtt.loading.footer')}
      </div>

      {/* Error Modal Overlay */}
      {showErrorModal && (
        <div className="absolute inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
          <div className="w-[500px] bg-zinc-900 border border-red-500/30 rounded-2xl shadow-2xl shadow-red-900/30 overflow-hidden">
            {/* Modal Header */}
            <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />

            <div className="p-8">
              {/* Icon & Title */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {t('vtt.loading.errorModal.title')}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    {t('vtt.loading.errorModal.autoEntering', { seconds: errorCountdown })}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-zinc-400 mb-4">
                {t('vtt.loading.errorModal.description')}
              </p>

              {/* Failed Assets List */}
              {loader.failedAssets.length > 0 && (
                <div className="bg-black/40 rounded-lg p-4 mb-4 max-h-32 overflow-y-auto border border-red-500/20">
                  <p className="text-xs text-red-400 font-medium mb-2">
                    {t('vtt.loading.errorModal.failedAssets')}
                  </p>
                  <ul className="space-y-1">
                    {loader.failedAssets.slice(0, 5).map((asset) => (
                      <li key={asset.id} className="text-xs text-zinc-500 font-mono truncate">
                        • {asset.name}
                      </li>
                    ))}
                    {loader.failedAssets.length > 5 && (
                      <li className="text-xs text-zinc-600 italic">
                        +{loader.failedAssets.length - 5} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Consequence */}
              <p className="text-xs text-zinc-500">
                {t('vtt.loading.errorModal.consequence')}
              </p>
            </div>

            {/* Progress bar for countdown */}
            <div className="h-1 bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-1000"
                style={{ width: `${(errorCountdown / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

