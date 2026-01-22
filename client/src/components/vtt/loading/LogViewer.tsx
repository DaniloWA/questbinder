/**
 * Log Viewer Component
 * 
 * Terminal-style log display for the loading screen.
 * Shows recent log entries with timestamps.
 * 
 * @module loading/LogViewer
 */

import React from 'react';
import { LogEntry } from '../../../views/GameSession/hooks/loading';

interface LogViewerProps {
  /** Log entries to display */
  logs: LogEntry[];
  /** Currently loading file name */
  currentFile?: string;
  /** Whether assets are currently loading */
  isLoadingAssets: boolean;
  /** Finalization message to display */
  finalizationMessage?: string;
}

/**
 * Terminal-style log viewer for the loading screen.
 * Shows recent log entries with animated entry effect.
 */
export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  currentFile,
  isLoadingAssets,
  finalizationMessage,
}) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-black/40 rounded-xl overflow-hidden border border-white/5 mb-8 shadow-inner">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border-b border-white/5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-3 text-[10px] text-zinc-500 font-mono">SYSTEM_LOG</span>
      </div>

      {/* Log Content */}
      <div className="p-4 font-mono text-[11px] text-zinc-400 h-36 overflow-hidden flex flex-col justify-end gap-1.5">
        {logs.map((log) => (
          <div
            key={log.id}
            className="whitespace-nowrap overflow-hidden text-ellipsis animate-in slide-in-from-left-2 fade-in duration-300 leading-relaxed"
          >
            <span className="text-zinc-600 mr-2">
              [{formatTime(log.timestamp)}]
            </span>
            <span className="text-cyan-500">&gt;</span>{' '}
            <span
              className={
                log.level === 'error'
                  ? 'text-red-400'
                  : log.level === 'warn'
                    ? 'text-yellow-400'
                    : 'text-zinc-300'
              }
            >
              {log.message}
            </span>
          </div>
        ))}

        {isLoadingAssets && currentFile && !finalizationMessage && (
          <div className="whitespace-nowrap overflow-hidden text-ellipsis text-cyan-400 animate-pulse leading-relaxed">
            <span className="text-zinc-600 mr-2">
              [{new Date().toLocaleTimeString()}]
            </span>
            <span className="text-cyan-500">&gt;</span> {currentFile}
          </div>
        )}

        {finalizationMessage && (
          <div className="whitespace-nowrap overflow-hidden text-ellipsis text-green-400 animate-in slide-in-from-left-2 fade-in duration-500 leading-relaxed">
            <span className="text-zinc-600 mr-2">
              [{new Date().toLocaleTimeString()}]
            </span>
            <span className="text-green-500">✓</span> {finalizationMessage}
          </div>
        )}
      </div>
    </div>
  );
};
