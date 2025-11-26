import React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface PrivacyToggleProps {
  isPrivate: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const PrivacyToggle: React.FC<PrivacyToggleProps> = ({
  isPrivate,
  onToggle,
  disabled = false,
  size = 'sm',
  showLabel = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
  };

  const iconSize = sizeClasses[size];
  const buttonSize = buttonSizeClasses[size];

  const tooltipContent = isPrivate
    ? 'Campo Privado (apenas você e o GM podem ver)'
    : 'Campo Público (todos os jogadores podem ver)';

  return (
    <Tooltip content={tooltipContent}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        disabled={disabled}
        className={`
          ${buttonSize}
          rounded-md transition-all
          ${isPrivate
            ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30'
            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 border border-zinc-700'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        title={tooltipContent}
      >
        <div className="flex items-center gap-1.5">
          {isPrivate ? (
            <Lock className={iconSize} />
          ) : (
            <Eye className={iconSize} />
          )}
          {showLabel && (
            <span className="text-xs font-medium">
              {isPrivate ? 'Privado' : 'Público'}
            </span>
          )}
        </div>
      </button>
    </Tooltip>
  );
};

// Wrapper para campos com controle de privacidade
interface PrivateFieldWrapperProps {
  label: string;
  isPrivate: boolean;
  onTogglePrivacy: () => void;
  canToggle?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const PrivateFieldWrapper: React.FC<PrivateFieldWrapperProps> = ({
  label,
  isPrivate,
  onTogglePrivacy,
  canToggle = true,
  children,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {label}
        </label>
        {canToggle && (
          <PrivacyToggle
            isPrivate={isPrivate}
            onToggle={onTogglePrivacy}
            size="sm"
          />
        )}
      </div>
      <div className={`
        ${isPrivate ? 'ring-1 ring-amber-500/20 rounded-lg p-2 bg-amber-500/5' : ''}
      `}>
        {children}
      </div>
      {isPrivate && (
        <div className="absolute top-0 right-0 -mt-1 -mr-1">
          <div className="bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            PRIVADO
          </div>
        </div>
      )}
    </div>
  );
};
