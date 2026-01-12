import React, { useState, useEffect, useRef, useCallback } from 'react';

interface OptimizedTextInputProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'textarea';
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  rows?: number;
  maxLength?: number;
  debounceMs?: number;
  selectOnFocus?: boolean;
  showCharCount?: boolean;
}

/**
 * Input de texto otimizado com:
 * - Debounce configurável (padrão 800ms)
 * - Contador de caracteres
 * - Validação de tamanho
 * - Memoização de callbacks
 */
export const OptimizedTextInput = React.memo<OptimizedTextInputProps>(({
  value,
  onChange,
  type = 'text',
  label,
  placeholder,
  disabled = false,
  className = '',
  inputClassName = '',
  rows = 3,
  maxLength,
  debounceMs = 800,
  selectOnFocus = false,
  showCharCount = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sincronizar com prop externa quando não focado
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  // Handler de mudança com debounce
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Aplicar maxLength se definido
    const finalValue = maxLength && newValue.length > maxLength
      ? newValue.slice(0, maxLength)
      : newValue;

    setLocalValue(finalValue);

    // Limpar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce
    debounceTimer.current = setTimeout(() => {
      onChange(finalValue);
    }, debounceMs);
  }, [onChange, debounceMs, maxLength]);

  // Focus handlers
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (selectOnFocus) {
      e.target.select();
    }
  }, [selectOnFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    // Garantir que onChange seja chamado ao perder foco
    if (localValue !== value) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      // Flush imediato
      onChange(localValue);
    }
  }, [localValue, value, onChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const baseInputClasses = `
    w-full bg-zinc-900 text-zinc-200
    border border-zinc-700 rounded px-3 py-2
    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all
    ${inputClassName}
  `;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            {label}
          </label>
          {showCharCount && maxLength && (
            <span className={`text-xs font-mono ${localValue.length > maxLength * 0.9 ? 'text-amber-500' : 'text-zinc-600'
              }`}>
              {localValue.length}/{maxLength}
            </span>
          )}
        </div>
      )}

      {type === 'textarea' ? (
        <textarea
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className={`${baseInputClasses} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          className={baseInputClasses}
        />
      )}
    </div>
  );
});

OptimizedTextInput.displayName = 'OptimizedTextInput';
