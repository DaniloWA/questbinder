import React, { ReactNode, CSSProperties } from 'react';
import { useAccessControl } from '../hooks/useAccessControl';
import { PremiumFeatureKey, GameRole } from '../types/acl';
import { BooleanPermissionKey } from '../context/gameSession/types';
import { Lock, Crown } from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { useTranslation } from '../i18n/TranslationContext';

export type AccessMode = 'hide' | 'disable' | 'blur' | 'fallback';

interface AccessGateProps {
  children: ReactNode;
  requirePermission?: BooleanPermissionKey;
  requireFeature?: PremiumFeatureKey;
  requireRole?: GameRole;
  requireAll?: boolean; // Default true

  // Behavioral Props
  mode?: AccessMode; // Default 'hide'
  fallback?: ReactNode; // Content shown in 'fallback' mode or specialized replacement

  // Customization
  blurAmount?: string; // e.g., '4px', 'sm'
  showLockIcon?: boolean; // For 'blur' or 'disable' modes
  lockMessage?: string; // Override default message
  tooltip?: string; // Override default tooltip
  className?: string; // Wrapper class
  style?: CSSProperties; // Wrapper style

  // Events
  onBlock?: (reason: string) => void;
  onUnlockClick?: () => void; // e.g. Open upgrade modal
}

/**
 * Robust AccessGate - A versatile guard component for Permission/Feature/Role access control.
 * Supports multiple strategies: Hide, Disable, Blur, Fallback.
 */
export function AccessGate({
  children,
  requirePermission,
  requireFeature,
  requireRole,
  requireAll = true,
  mode = 'hide',
  fallback,
  blurAmount = '4px',
  showLockIcon = true,
  lockMessage,
  tooltip,
  className = '',
  style,
  onBlock,
  onUnlockClick
}: AccessGateProps) {
  const permissions = useAccessControl();
  const { t } = useTranslation();

  // Check Access
  // Note: checkAccess handles single checks. For multiple, we'll iterate or improve checkAccess later if needed.
  // For now, checkAccess accepts one of each. If multiple are passed, it checks all provided.
  const { allowed, reason } = permissions.checkAccess({
    permission: requirePermission,
    feature: requireFeature,
    role: requireRole
  });

  // --- Allowed State ---
  if (allowed) {
    return <>{children}</>;
  }

  // --- Blocked State Handling ---

  // Fire event once
  React.useEffect(() => {
    if (!allowed && onBlock && reason) {
      onBlock(reason);
    }
  }, [allowed, reason, onBlock]);

  // Derived Messages
  const defaultMessage = requireFeature
    ? t('access.upgradeToAccess', { feature: requireFeature })
    : t('access.restricted');

  const finalMessage = lockMessage || reason || defaultMessage;
  const finalTooltip = tooltip || finalMessage;

  // --- Mode Implementation ---

  if (mode === 'hide') {
    return fallback ? <>{fallback}</> : null;
  }

  if (mode === 'fallback') {
    return <>{fallback || <div className="p-4 text-center text-zinc-500 italic border border-dashed border-zinc-700 rounded-lg">{finalMessage}</div>}</>;
  }

  if (mode === 'disable') {
    return (
      <Tooltip content={finalTooltip}>
        <div
          className={`relative w-max opacity-50 grayscale pointer-events-none select-none ${className}`}
          style={style}
          aria-disabled
        >
          {children}
          {showLockIcon && (
            <div className="absolute -top-2 -right-2 z-10 bg-zinc-900 text-zinc-400 rounded-full p-1 border border-zinc-700 shadow-md">
              <Lock className="w-3 h-3" />
            </div>
          )}
        </div>
      </Tooltip>
    );
  }

  if (mode === 'blur') {
    return (
      <div
        className={`relative overflow-hidden group ${className}`}
        style={style}
      >
        {/* Blurred Content */}
        <div className="filter blur-[var(--blur)] transition-all duration-300 pointer-events-none select-none opacity-60" style={{ '--blur': blurAmount } as any}>
          {children}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/20 hover:bg-zinc-950/40 transition-colors backdrop-blur-[1px]">
          {showLockIcon && (
            <button
              onClick={(e) => { e.stopPropagation(); onUnlockClick?.(); }}
              className={`
                                flex flex-col items-center justify-center p-3 rounded-xl 
                                ${requireFeature ? 'bg-amber-500/10 text-amber-500 border border-amber-500/50 hover:bg-amber-500/20' : 'bg-zinc-900/80 text-white border border-zinc-700 hover:bg-zinc-900'}
                                shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer
                            `}
            >
              {requireFeature ? <Crown className="w-6 h-6 mb-1" /> : <Lock className="w-5 h-5 mb-1" />}
              <span className="text-[10px] font-bold uppercase tracking-wider max-w-[120px] text-center">{finalMessage}</span>
              {requireFeature && <span className="text-[9px] opacity-70 mt-1">{t('access.clickToUpgrade')}</span>}
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// === Feature Gate ===

interface FeatureGateProps {
  feature: PremiumFeatureKey;
  children: ReactNode;
  mode?: AccessMode; // Allow overriding mode (default 'blur' for features usually)
  showUpgradePrompt?: boolean;
  fallback?: ReactNode;
}

/**
 * FeatureGate - Specialized wrapper for Premium Features.
 * Defaults to 'blur' mode with an upgrade CTA.
 */
export function FeatureGate({
  feature,
  children,
  mode = 'blur',
  showUpgradePrompt = true,
  fallback
}: FeatureGateProps) {
  const { t } = useTranslation();

  // TODO: Hook into a global "Open Upgrade Modal" context
  const handleUpgradeClick = () => {
    console.log(`User clicked upgrade for ${feature}`);
    // openUpgradeModal(feature);
  };

  return (
    <AccessGate
      requireFeature={feature}
      mode={mode}
      fallback={fallback}
      onUnlockClick={handleUpgradeClick}
      lockMessage={t('access.featureLocked')}
      tooltip={t('access.upgradeRequired')}
      showLockIcon={showUpgradePrompt}
    >
      {children}
    </AccessGate>
  );
}
