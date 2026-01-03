import React from 'react';
import { Loader2 } from 'lucide-react';

// --- SPINNER ---

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16',
  };

  return (
    <Loader2 
      className={`animate-spin text-primary ${sizeClasses[size]} ${className}`} 
      aria-label="Carregando"
    />
  );
};

// --- SKELETON ---

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape variant: 'default' (rounded-md) or 'circle' (rounded-full) */
  variant?: 'default' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'default', 
  ...props 
}) => {
  return (
    <div
      className={`
        relative overflow-hidden bg-muted/60
        ${variant === 'circle' ? 'rounded-full' : 'rounded-md'}
        ${className}
      `}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
    </div>
  );
};

// --- OVERLAY ---

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  blur?: boolean;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  message, 
  blur = true,
  children 
}) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative w-full h-full min-h-[100px]">
      <div className={blur ? 'blur-sm' : ''}>
        {children}
      </div>
      <div 
        className={`
          absolute inset-0 z-50 flex flex-col items-center justify-center 
          bg-background/70 backdrop-blur-sm
        `}
      >
        <Spinner size="lg" />
        {message && <p className="mt-4 font-semibold text-foreground animate-pulse">{message}</p>}
      </div>
    </div>
  );
};
