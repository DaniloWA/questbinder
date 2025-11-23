
import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';

interface DraggableWindowProps {
  title: string;
  icon?: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { w: number; h: number };
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  minimizedContent?: React.ReactNode; // What to show when minimized
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  title,
  icon,
  initialPosition = { x: 100, y: 100 },
  initialSize = { w: 320, h: 450 },
  children,
  isOpen,
  onClose,
  className = '',
  minimizedContent
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isMaximized) return;
      e.preventDefault();
      
      // Calculate new position
      let newX = e.clientX - dragStartRef.current.x;
      let newY = e.clientY - dragStartRef.current.y;

      // Boundaries check (keep roughly on screen)
      const maxX = window.innerWidth - 50;
      const maxY = window.innerHeight - 50;
      newX = Math.max(-100, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
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
  }, [isDragging, isMaximized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    // Only drag from header and ignore buttons
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div 
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`,
          zIndex: 100 
        }}
        className="fixed top-0 left-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        {minimizedContent || (
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-full shadow-xl flex items-center justify-center hover:border-primary text-white transition-colors">
             {icon}
          </div>
        )}
         {/* Invisible overlay to handle restore click slightly easier */}
         <div 
            className="absolute inset-0 z-10" 
            onDoubleClick={() => setIsMinimized(false)}
            title="Duplo clique para expandir"
         />
         <button 
            onClick={() => setIsMinimized(false)} 
            className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center text-[10px] shadow-md z-20"
         >
            <Maximize2 size={8} />
         </button>
      </div>
    );
  }

  // Calculate styles based on Maximized state
  const windowStyle: React.CSSProperties = isMaximized ? {
      top: '40px',
      left: '40px',
      right: '40px',
      bottom: '40px',
      width: 'auto',
      height: 'auto',
      zIndex: 100,
      position: 'fixed',
      transform: 'none'
  } : { 
      transform: `translate(${position.x}px, ${position.y}px)`,
      width: initialSize.w,
      height: initialSize.h,
      zIndex: 90,
      position: 'fixed',
      top: 0,
      left: 0
  };

  return (
    <div
      ref={windowRef}
      style={windowStyle}
      className={`flex flex-col bg-zinc-950/95 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 ${isDragging ? 'shadow-primary/20 ring-1 ring-primary/30' : ''} ${className}`}
    >
      {/* Header */}
      <div 
        className={`
            h-10 flex items-center justify-between px-3 bg-zinc-900/80 border-b border-zinc-800 select-none
            ${isMaximized ? '' : 'cursor-grab active:cursor-grabbing'}
        `}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => setIsMaximized(!isMaximized)}
      >
        <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wide">
           {icon && <span className="text-primary">{icon}</span>}
           {title}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" title="Minimizar">
            <Minus className="w-3 h-3" />
          </button>
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" title={isMaximized ? "Restaurar" : "Maximizar"}>
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-red-900/30 rounded text-zinc-400 hover:text-red-400" title="Fechar">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-zinc-900/50">
        {children}
      </div>
      
      {/* Resize Handle (Visual only for now) */}
      {!isMaximized && (
          <div className="absolute bottom-0.5 right-0.5 opacity-20 pointer-events-none">
             <svg width="10" height="10" viewBox="0 0 10 10">
                 <path d="M10 0 L10 10 L0 10 Z" fill="currentColor" />
             </svg>
          </div>
      )}
    </div>
  );
};
