import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check } from 'lucide-react';

export interface FieldValidator {
  validate: (value: any) => string | null; // Returns error message or null
  message?: string;
}

interface EditableFieldProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'number' | 'textarea';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  validator?: FieldValidator;
  min?: number;
  max?: number;
  rows?: number;
  autoFocus?: boolean;
  selectOnFocus?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  className = '',
  inputClassName = '',
  validator,
  min,
  max,
  rows = 3,
  autoFocus = false,
  selectOnFocus = false,
  onBlur,
  onFocus
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setLocalValue(newValue);

    // Validate
    if (validator) {
      const validationError = validator.validate(newValue);
      setError(validationError);
      setIsValid(!validationError);

      // Only call onChange if valid
      if (!validationError) {
        onChange(newValue);
      }
    } else {
      setError(null);
      setIsValid(true);
      onChange(newValue);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (selectOnFocus) {
      e.target.select();
    }
    onFocus?.();
  };

  const handleBlur = () => {
    // Revert to original value if invalid
    if (!isValid) {
      setLocalValue(value);
      setError(null);
      setIsValid(true);
    }
    onBlur?.();
  };

  const baseInputClasses = `
    w-full bg-zinc-900 text-zinc-200 border rounded px-2 py-1.5
    focus:outline-none focus:ring-2 transition-all
    disabled:opacity-50 disabled:cursor-not-allowed
    ${isValid
      ? 'border-zinc-700 focus:border-primary focus:ring-primary/20'
      : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
    }
    ${inputClassName}
  `;

  return (
    <div className={`relative ${className}`}>
      {type === 'textarea' ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          autoFocus={autoFocus}
          className={`${baseInputClasses} resize-none`}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          autoFocus={autoFocus}
          className={baseInputClasses}
        />
      )}

      {/* Validation Indicator */}
      {!isValid && error && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
      )}

      {isValid && localValue !== value && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Check className="w-4 h-4 text-green-500" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};

// Common validators
export const validators = {
  required: (message = 'Campo obrigatório'): FieldValidator => ({
    validate: (value) => (!value || value === '' ? message : null)
  }),

  minMax: (min: number, max: number, message?: string): FieldValidator => ({
    validate: (value) => {
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(num)) return 'Valor inválido';
      if (num < min || num > max) {
        return message || `Valor deve estar entre ${min} e ${max}`;
      }
      return null;
    }
  }),

  positive: (message = 'Valor deve ser positivo'): FieldValidator => ({
    validate: (value) => {
      const num = typeof value === 'number' ? value : parseFloat(value);
      return num < 0 ? message : null;
    }
  }),

  maxLength: (max: number, message?: string): FieldValidator => ({
    validate: (value) => {
      const str = String(value);
      return str.length > max ? (message || `Máximo de ${max} caracteres`) : null;
    }
  }),

  custom: (fn: (value: any) => string | null): FieldValidator => ({
    validate: fn
  })
};
