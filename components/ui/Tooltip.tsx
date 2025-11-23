import React, { useRef, useEffect } from 'react';
import { useTooltip, TooltipPosition, TooltipVariant } from '../../context/TooltipContext';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  delay?: number;
  className?: string;
}

// Re-export types for compatibility
export type { TooltipPosition, TooltipVariant };

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  variant = 'dark',
  delay = 500,
  className = '',
}) => {
  const { showTooltip, hideTooltip } = useTooltip();
  const timeoutRef = useRef<number | null>(null);

  const handleOpen = (e: React.MouseEvent | React.FocusEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      // FIX: Explicitly cast position and variant to their types. TypeScript might widen them to generic strings otherwise.
      showTooltip(content, rect, position as TooltipPosition, variant as TooltipVariant);
    }, delay);
  };

  const handleClose = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    hideTooltip();
  };

  // Ensure tooltip hides if component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      hideTooltip();
    };
  }, []);

  return (
    <div
      className={`inline-flex ${className}`}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      {children}
    </div>
  );
};