/**
 * Status Row Component
 * 
 * Displays a single loading stage status with icon and indicator.
 * Extracted for reusability and cleaner code organization.
 * 
 * @module loading/StatusRow
 */

import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { AssetStatus } from '../../../views/GameSession/hooks/loading';

interface StatusRowProps {
  /** Lucide icon component */
  icon: React.ComponentType<{ className?: string; }>;
  /** Display label */
  label: string;
  /** Current status */
  status: AssetStatus;
  /** Optional subtext (e.g., ping time, asset count) */
  subtext?: string;
}

/**
 * Individual status row for loading stages.
 * Shows icon, label, optional subtext, and status indicator.
 */
export const StatusRow: React.FC<StatusRowProps> = ({
  icon: Icon,
  label,
  status,
  subtext,
}) => {
  const getIconClass = () => {
    switch (status) {
      case 'loaded':
        return 'text-cyan-400';
      case 'loading':
        return 'text-cyan-600 animate-pulse';
      default:
        return 'text-zinc-700';
    }
  };

  const getLabelClass = () => {
    return status === 'loaded' ? 'text-zinc-100' : 'text-zinc-500';
  };

  return (
    <div className={`flex items-center justify-between group py-2 px-3 rounded-lg transition-all duration-300 ${status === 'loading' ? 'bg-cyan-500/5' : status === 'loaded' ? 'bg-green-500/5' : ''
      }`}>
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${status === 'loaded' ? 'bg-cyan-500/10' :
            status === 'loading' ? 'bg-cyan-500/5' :
              'bg-zinc-800/30'
          }`}>
          <Icon className={`w-4 h-4 transition-colors duration-300 ${getIconClass()}`} />
        </div>
        <span className={`transition-colors duration-300 font-medium ${getLabelClass()}`}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {subtext && (
          <span className="text-[11px] bg-zinc-800/70 text-cyan-300 px-2 py-1 rounded-md font-mono border border-white/5 tabular-nums">
            {subtext}
          </span>
        )}
        {status === 'loaded' ? (
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-green-400 animate-in zoom-in duration-300" />
          </div>
        ) : status === 'loading' ? (
          <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-zinc-800/30 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
          </div>
        )}
      </div>
    </div>
  );
};
