/**
 * Progress Bar Component
 * 
 * Animated progress bar for the loading screen.
 * Shows installation progress with smooth transitions.
 * 
 * @module loading/ProgressBar
 */

import React from 'react';

interface ProgressBarProps {
  /** Current progress percentage (0-100) */
  percent: number;
  /** Optional label override */
  label?: string;
}

/**
 * Animated progress bar with glow effect.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  label = 'Installation Progress',
}) => {
  return (
    <div className="relative">
      <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1.5 uppercase tracking-wider">
        <span>{label}</span>
        <span className="text-cyan-400">{percent}%</span>
      </div>
      <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
