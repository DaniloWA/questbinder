import React from 'react';
import { SheetLabel } from './SheetPrimitives';

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  showValue?: boolean;
  valueFormat?: (val: number) => string;
  icon?: React.ReactNode;
  accentColor?: string;
  className?: string;
}

export const SliderField: React.FC<SliderFieldProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  showValue = false,
  valueFormat,
  icon,
  accentColor = 'accent-primary',
  className = '',
}) => {
  const displayValue = valueFormat ? valueFormat(value) : String(value);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {icon && <span className="text-zinc-500 shrink-0">{icon}</span>}
      <span className="text-[10px] uppercase font-bold text-zinc-500 w-16 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`flex-1 ${accentColor} h-1.5 bg-zinc-800 rounded-lg cursor-pointer`}
      />
      {showValue && (
        <span className="text-xs font-bold w-10 text-right text-zinc-300">{displayValue}</span>
      )}
    </div>
  );
};

// Vertical variant for more compact layouts
interface SliderFieldVerticalProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  accentColor?: string;
  className?: string;
}

export const SliderFieldVertical: React.FC<SliderFieldVerticalProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  accentColor = 'accent-primary',
  className = '',
}) => {
  return (
    <div className={`flex-1 space-y-1 ${className}`}>
      <span className="text-[10px] uppercase font-bold text-zinc-500 block">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full ${accentColor} h-1.5 bg-zinc-800 rounded-lg cursor-pointer`}
      />
    </div>
  );
};
