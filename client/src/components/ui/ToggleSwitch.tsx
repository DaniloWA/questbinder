import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
  icon?: React.ReactNode;
  iconActiveColor?: string;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled,
  onChange,
  label,
  description,
  icon,
  iconActiveColor = 'bg-yellow-500/20 text-yellow-500',
  className = '',
}) => {
  if (label || description) {
    return (
      <div className={`flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl ${className}`}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`p-2 rounded-full transition-colors ${enabled ? iconActiveColor : 'bg-zinc-800 text-zinc-500'}`}>
              {icon}
            </div>
          )}
          <div>
            {label && <h3 className="font-bold text-sm text-white">{label}</h3>}
            {description && <p className="text-xs text-zinc-500">{description}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-primary' : 'bg-zinc-700'}`}
        >
          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
    );
  }

  // Compact version without label
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-primary' : 'bg-zinc-700'} ${className}`}
    >
      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
};
