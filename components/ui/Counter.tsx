import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface CounterProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
}

export const Counter: React.FC<CounterProps> = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission if inside form
    if (!disabled && value > min) {
      // Fix floating point precision issues
      const nextVal = Math.max(min, parseFloat((value - step).toFixed(2)));
      onChange(nextVal);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled && value < max) {
      const nextVal = Math.min(max, parseFloat((value + step).toFixed(2)));
      onChange(nextVal);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(val);
    } else if (e.target.value === '') {
      onChange(min);
    }
  };

  const styles = {
    sm: {
      height: 'h-8',
      text: 'text-xs',
      inputW: 'w-12', 
      btnPad: 'px-1.5',
      iconSize: 12
    },
    md: {
      height: 'h-10',
      text: 'text-sm',
      inputW: 'w-16',
      btnPad: 'px-3',
      iconSize: 16
    }
  };

  const currentStyle = styles[size];

  return (
    <div className={`flex items-center shrink-0 rounded-md border border-input bg-card shadow-sm ring-offset-background group focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={`
          flex items-center justify-center shrink-0 ${currentStyle.btnPad} 
          text-muted-foreground transition-colors 
          hover:bg-accent hover:text-accent-foreground 
          disabled:pointer-events-none disabled:opacity-30
          rounded-l-md border-r border-input ${currentStyle.height}
        `}
      >
        <Minus size={currentStyle.iconSize} strokeWidth={3} />
      </button>
      
      <input
        type="number"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        step={step}
        className={`
          ${currentStyle.inputW} min-w-0 text-center bg-transparent border-0 outline-none focus:ring-0 font-mono font-bold
          ${currentStyle.height} ${currentStyle.text} text-foreground
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
        `}
      />
      
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={`
          flex items-center justify-center shrink-0 ${currentStyle.btnPad} 
          text-muted-foreground transition-colors 
          hover:bg-accent hover:text-accent-foreground 
          disabled:pointer-events-none disabled:opacity-30
          rounded-r-md border-l border-input ${currentStyle.height}
        `}
      >
        <Plus size={currentStyle.iconSize} strokeWidth={3} />
      </button>
    </div>
  );
};