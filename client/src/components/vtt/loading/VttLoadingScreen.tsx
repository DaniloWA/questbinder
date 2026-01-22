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

import React, { useEffect, useRef } from 'react';
import {
  Loader2,
  Wifi,
  Database,
  Terminal,
  FileCode,
  Layers,
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
 */
export const VttLoadingScreen: React.FC<VttLoadingScreenProps> = ({
  onReady,
  tokens,
  characters,
  handouts,
}) => {
  const { t } = useTranslation();
  const session = useGameSession();
  const onReadyCalledRef = useRef(false);

  // Use the smart loader hook
  const loader = useSmartLoader({
    scene: session.activeScene,
    tokens,
    characters,
    handouts,
    isConnected: session.isConnected,
  });

  // Finalization state
  const [isFinalizingRef, setIsFinalizing] = React.useState(false);
  const [finalizationMessage, setFinalizationMessage] = React.useState('');

  // Finalization messages from translations
  const FINALIZATION_MESSAGES = [
    t('vtt.loading.finalization.preparing'),
    t('vtt.loading.finalization.syncing'),
    t('vtt.loading.finalization.optimizing'),
    t('vtt.loading.finalization.ready'),
  ];

  // Handle finalization sequence when loading completes
  useEffect(() => {
    if (loader.isComplete && !onReadyCalledRef.current && !isFinalizingRef) {
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
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-[10px] text-zinc-600 font-mono tracking-widest flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        {t('vtt.loading.footer')}
      </div>
    </div>
  );
};

