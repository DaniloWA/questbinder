import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipVariant = 'dark' | 'light' | 'brand';

interface TooltipContextType {
  showTooltip: (content: ReactNode, rect: DOMRect, position?: TooltipPosition, variant?: TooltipVariant) => void;
  hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export const TooltipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tooltip, setTooltip] = useState<{
    isVisible: boolean;
    content: ReactNode | null;
    rect: DOMRect | null;
    position: TooltipPosition;
    variant: TooltipVariant;
  }>({
    isVisible: false,
    content: null,
    rect: null,
    position: 'top',
    variant: 'dark',
  });

  const showTooltip = (content: ReactNode, rect: DOMRect, position: TooltipPosition = 'top', variant: TooltipVariant = 'dark') => {
    setTooltip({ isVisible: true, content, rect, position, variant });
  };

  const hideTooltip = () => {
    setTooltip((prev) => ({ ...prev, isVisible: false }));
  };

  return (
    <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      {tooltip.isVisible && tooltip.rect && tooltip.content && <TooltipPortal {...tooltip} />}
    </TooltipContext.Provider>
  );
};

const TooltipPortal: React.FC<{
  content: ReactNode;
  rect: DOMRect;
  position: TooltipPosition;
  variant: TooltipVariant;
}> = ({ content, rect, position, variant }) => {
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      let finalPos = position;

      // Smart flipping logic
      const gap = 8;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Check vertical space
      if (position === 'top' && rect.top - height - gap < 0) finalPos = 'bottom';
      else if (position === 'bottom' && rect.bottom + height + gap > viewportHeight) finalPos = 'top';
      
      // Check horizontal space
      if (position === 'left' && rect.left - width - gap < 0) finalPos = 'right';
      else if (position === 'right' && rect.right + width + gap > viewportWidth) finalPos = 'left';

      let top = 0;
      let left = 0;

      switch (finalPos) {
        case 'top':
          top = rect.top - height - gap;
          left = rect.left + (rect.width / 2) - (width / 2);
          break;
        case 'bottom':
          top = rect.bottom + gap;
          left = rect.left + (rect.width / 2) - (width / 2);
          break;
        case 'left':
          top = rect.top + (rect.height / 2) - (height / 2);
          left = rect.left - width - gap;
          break;
        case 'right':
          top = rect.top + (rect.height / 2) - (height / 2);
          left = rect.right + gap;
          break;
      }

      // Edge clamping to prevent overflow
      left = Math.max(gap, Math.min(left, viewportWidth - width - gap));
      top = Math.max(gap, Math.min(top, viewportHeight - height - gap));

      setStyle({
        top: `${top}px`,
        left: `${left}px`,
        opacity: 1,
        transform: 'scale(1)',
      });
    }
  }, [rect, position]);

  const variantClasses = {
    dark: 'bg-gray-900 text-white border border-gray-800',
    light: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
    brand: 'bg-primary-600 text-white border border-primary-500',
  };

  return createPortal(
    <div
      ref={ref}
      className={`
        fixed z-[10000] px-3 py-2 text-xs font-medium rounded-md shadow-xl pointer-events-none
        transition-all duration-200 ease-out origin-center
        ${variantClasses[variant]}
      `}
      style={{ ...style }}
    >
      {content}
    </div>,
    document.body
  );
};

export const useTooltip = (): TooltipContextType => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};