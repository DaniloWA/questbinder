import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, GripHorizontal } from 'lucide-react';
import { ModalOptions } from '../../types';

interface ModalProps extends ModalOptions {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  variant = 'default',
  size = 'md',
  preventOutsideClick = false,
  hideCloseButton = false,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Dragging State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        // If preventOutsideClick is true, we typically also prevent Escape from closing
        // or we can decide to allow Escape but not Click. 
        // Standard robust modal pattern: Escape always closes unless explicitly blocked,
        // but user requested 'prevent closing', implying strictness.
        if (!preventOutsideClick) {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, preventOutsideClick]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Global Mouse Events for Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      setPosition({ x: dx, y: dy });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (preventOutsideClick) return;
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (size === 'full') return; // Cannot drag full screen modal

    // Prevent dragging if clicking on buttons inside header
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  // Size Classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]',
  };

  // Variant specific styling
  const isAlert = variant === 'alert';

  // Animation Classes
  // Note: 'duration-300' aligns with the ModalContext close timeout
  const animationClasses = isOpen
    ? 'animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300'
    : 'animate-out fade-out zoom-out-95 slide-out-to-bottom-4 duration-300';

  // Portal rendering to document.body
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop with blur and fade */}
      <div
        ref={overlayRef}
        onClick={handleBackdropClick}
        className={`
          absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0'}
        `}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={`
          relative w-full ${sizeClasses[size]} 
          bg-card text-card-foreground 
          rounded-lg shadow-2xl border border-border
          flex flex-col
          ${size === 'full' ? 'h-full' : 'max-h-[90vh]'}
          ${animationClasses}
        `}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'auto'
        }}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div
            onMouseDown={handleHeaderMouseDown}
            className={`
              flex items-start justify-between px-6 py-4 border-b border-border select-none
              ${isAlert ? 'bg-destructive/5' : ''}
              ${size !== 'full' ? 'cursor-grab active:cursor-grabbing' : ''}
            `}
          >
            <div className="flex items-center gap-3 pr-8 pointer-events-none">
              {isAlert && (
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
              )}
              <div className="flex-1">
                {title && (
                  <h3 className={`text-lg font-semibold leading-none tracking-tight flex items-center gap-2 ${isAlert ? 'text-destructive' : 'text-foreground'}`}>
                    {title}
                    {size !== 'full' && <GripHorizontal className="w-4 h-4 text-muted-foreground/30" />}
                  </h3>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              >
                <X className="w-5 h-5" />
                <span className="sr-only">Close</span>
              </button>
            )}
          </div>
        )}

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};