import React from 'react';

interface SwitchProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string; // Add className prop for flexibility
}

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, disabled, className = '' }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        if (onCheckedChange) {
          e.stopPropagation();
          onCheckedChange(!checked);
        }
      }}
      className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 
                focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
                ${checked ? 'bg-primary' : 'bg-zinc-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
            `}
    >
      <span
        className={`
                    pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 
                    transition-transform duration-200 ease-in-out
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `}
      />
    </button>
  );
};
