import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';

interface OptimizedNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showControls?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  selectOnFocus?: boolean;
  placeholder?: string;
}

/**
 * Input numérico otimizado com:
 * - Debounce local para digitação
 * - Controles +/- para ajustes rápidos
 * - Validação em tempo real
 * - Memoização de callbacks
 */
export const OptimizedNumberInput = React.memo<OptimizedNumberInputProps>(({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  showControls = true,
  disabled = false,
  className = '',
  inputClassName = '',
  selectOnFocus = true,
  placeholder
}) => {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sincronizar com prop externa quando não focado
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value));
    }
  }, [value, isFocused]);

  // Validar e aplicar limites
  const validateValue = useCallback((val: number): number => {
    let validated = val;
    if (min !== undefined && validated < min) validated = min;
    if (max !== undefined && validated > max) validated = max;
    return validated;
  }, [min, max]);

  // Handler de mudança com debounce
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Limpar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce de 300ms para digitação
    debounceTimer.current = setTimeout(() => {
      const numValue = parseFloat(newValue) || 0;
      const validated = validateValue(numValue);
      onChange(validated);
    }, 300);
  }, [onChange, validateValue]);

  // Incrementar/Decrementar (com buffer para cliques rápidos)
  const handleIncrement = useCallback(() => {
    const numValue = parseFloat(localValue) || 0;
    const newValue = validateValue(numValue + step);
    setLocalValue(String(newValue));

    // Buffer de 200ms para cliques rápidos
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onChange(newValue);
    }, 200);
  }, [localValue, step, validateValue, onChange]);

  const handleDecrement = useCallback(() => {
    const numValue = parseFloat(localValue) || 0;
    const newValue = validateValue(numValue - step);
    setLocalValue(String(newValue));

    // Buffer de 200ms para cliques rápidos
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onChange(newValue);
    }, 200);
  }, [localValue, step, validateValue, onChange]);

  // Focus handlers
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (selectOnFocus) {
      e.target.select();
    }
  }, [selectOnFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    // Validar e corrigir ao perder foco
    const numValue = parseFloat(localValue) || 0;
    const validated = validateValue(numValue);
    setLocalValue(String(validated));

    // Garantir que onChange seja chamado com valor validado
    if (validated !== value) {
      onChange(validated);
    }
  }, [localValue, value, validateValue, onChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="flex items-center gap-1">
        {showControls && (
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || (min !== undefined && parseFloat(localValue) <= min)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded border border-zinc-700 transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        )}

        <input
          ref={inputRef}
          type="number"
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className={`
            flex-1 bg-zinc-900 text-zinc-200 text-center font-mono font-bold
            border border-zinc-700 rounded px-2 py-1.5
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all
            ${inputClassName}
          `}
        />

        {showControls && (
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || (max !== undefined && parseFloat(localValue) >= max)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded border border-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        )}
      </div>
    </div>
  );
});

OptimizedNumberInput.displayName = 'OptimizedNumberInput';
