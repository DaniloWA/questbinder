import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Palette, X } from 'lucide-react';

interface ColorPickerProps {
  value: string; // Expects a HEX string like #RRGGBB
  onChange: (color: string) => void;
  className?: string;
  disabled?: boolean;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ffffff', '#9ca3af', '#1f2937',
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX;

      // Prevent overflow
      const popoverHeight = 250; // Approximate height
      if (top + popoverHeight > window.innerHeight) {
        top = rect.top + window.scrollY - popoverHeight - 8;
      }

      setCoords({ top, left });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        className={`w-10 h-10 p-1 bg-transparent border-2 border-zinc-700 cursor-pointer rounded-md transition-colors hover:border-primary ${className}`}
      >
        <div className="w-full h-full rounded-sm" style={{ backgroundColor: value }} />
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[10000] w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl p-4 space-y-4 animate-in fade-in zoom-in-95"
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Selecionar Cor</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 text-zinc-400 hover:text-white"><X size={16} /></button>
          </div>

          <div className="grid grid-cols-8 gap-1.5">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${value.toLowerCase() === color ? 'border-primary' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-zinc-700">
            <div className="relative w-10 h-10 rounded-md overflow-hidden border border-zinc-600">
              <div className="absolute inset-0" style={{ backgroundColor: value }}></div>
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">#</span>
              <input
                type="text"
                value={value.substring(1)}
                onChange={(e) => onChange(`#${e.target.value}`)}
                className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-md pl-6 pr-2 text-sm font-mono focus:border-primary focus:ring-primary outline-none"
                maxLength={6}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
