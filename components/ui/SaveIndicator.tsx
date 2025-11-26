import React from 'react';
import { Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveIndicatorProps {
  status: SaveStatus;
  onRetry?: () => void;
  className?: string;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({ status, onRetry, className = '' }) => {
  if (status === 'idle') return null;

  return (
    <div className={`flex items-center gap-2 text-xs font-medium ${className}`}>
      {status === 'saving' && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          <span className="text-blue-500">Salvando...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <Check className="w-3.5 h-3.5 text-green-500" />
          <span className="text-green-500">Salvo</span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          <span className="text-red-500">Erro ao salvar</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-1 p-1 hover:bg-red-500/10 rounded transition-colors"
              title="Tentar novamente"
            >
              <RefreshCw className="w-3 h-3 text-red-500" />
            </button>
          )}
        </>
      )}
    </div>
  );
};

// Hook para gerenciar estado de salvamento
export const useSaveIndicator = (autoHideDuration: number = 2000) => {
  const [status, setStatus] = React.useState<SaveStatus>('idle');
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const setSaving = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('saving');
  };

  const setSaved = () => {
    setStatus('saved');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setStatus('idle');
    }, autoHideDuration);
  };

  const setError = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('error');
  };

  const reset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus('idle');
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { status, setSaving, setSaved, setError, reset };
};
