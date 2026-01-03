
import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tooltip } from './Tooltip';
import { LucideIcon, Info, ChevronDown, Check, MoreVertical } from 'lucide-react';

// --- CONTAINER ---

interface SheetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const SheetCard = forwardRef<HTMLDivElement, SheetCardProps>(
  ({ className = '', children, noPadding = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-zinc-900/60 border border-zinc-800 rounded-lg shadow-sm overflow-hidden w-full ${noPadding ? '' : 'p-3 md:p-4'} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SheetCard.displayName = 'SheetCard';

// --- HEADER / TITLE ---

interface SheetHeaderProps {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  onToggle?: () => void;
  isCollapsed?: boolean;
}

export const SheetHeader: React.FC<SheetHeaderProps> = ({ title, icon: Icon, action, className = '', onToggle, isCollapsed }) => (
  <div 
    className={`flex items-center justify-between mb-3 pb-2 border-b border-white/5 select-none ${onToggle ? 'cursor-pointer hover:text-white group' : ''} ${className}`}
    onClick={onToggle}
  >
    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 group-hover:text-zinc-200 transition-colors truncate">
      {Icon && <Icon className="w-3.5 h-3.5 text-primary shrink-0" />}
      <span className="truncate">{title}</span>
    </h3>
    <div className="flex items-center gap-2 shrink-0">
      {action}
      {onToggle && (
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
      )}
    </div>
  </div>
);

// --- LABEL ---

interface SheetLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  tooltip?: string;
  icon?: React.ReactNode;
}

export const SheetLabel: React.FC<SheetLabelProps> = ({ children, className = '', tooltip, icon, ...props }) => {
  const content = (
    <label
      className={`text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-1.5 mb-1 select-none truncate w-full ${className}`}
      {...props}
    >
      {icon}
      <span className="truncate">{children}</span>
      {tooltip && <Info className="w-3 h-3 opacity-50 hover:opacity-100 transition-opacity cursor-help shrink-0" />}
    </label>
  );

  if (tooltip) {
    return <Tooltip content={tooltip} position="top">{content}</Tooltip>;
  }

  return content;
};

// --- INPUT ---

interface SheetInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'standard' | 'ghost' | 'title' | 'table' | 'box';
  align?: 'left' | 'center' | 'right';
  label?: string;
  tooltip?: string;
}

export const SheetInput = forwardRef<HTMLInputElement, SheetInputProps>(
  ({ className = '', variant = 'standard', align = 'left', label, tooltip, ...props }, ref) => {
    
    const variants = {
      standard: 'border-b border-zinc-700 bg-transparent px-2 py-1 focus:border-primary font-medium text-zinc-200 focus:bg-white/5',
      ghost: 'border-transparent bg-transparent px-2 py-1 focus:border-primary/50 font-medium hover:bg-white/5 rounded',
      title: 'border-b border-zinc-700 bg-transparent px-1 py-1 text-lg md:text-xl font-fantasy font-bold focus:border-primary text-white',
      table: 'border-none bg-transparent px-2 py-0.5 w-full focus:ring-1 focus:ring-primary rounded-sm text-xs text-zinc-300',
      box: 'border border-zinc-700 bg-zinc-950/50 rounded-md px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary text-zinc-200'
    };

    const alignments = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    const inputElement = (
      <input
        ref={ref}
        className={`
          w-full outline-none transition-all duration-200 placeholder:text-zinc-600
          disabled:opacity-50 disabled:cursor-not-allowed min-w-0
          ${variants[variant]}
          ${alignments[align]}
          ${className}
        `}
        {...props}
      />
    );

    if (label) {
      return (
        <div className="w-full flex flex-col overflow-hidden">
          <SheetLabel tooltip={tooltip}>{label}</SheetLabel>
          {inputElement}
        </div>
      );
    }

    return inputElement;
  }
);
SheetInput.displayName = 'SheetInput';

// --- TEXTAREA ---

interface SheetTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const SheetTextArea = forwardRef<HTMLTextAreaElement, SheetTextAreaProps>(
  ({ className = '', label, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col h-full overflow-hidden">
        {label && <SheetLabel icon={icon}>{label}</SheetLabel>}
        <textarea
          ref={ref}
          className={`
            flex-1 w-full bg-zinc-900/50 border border-zinc-700 rounded-md p-2 text-xs md:text-sm text-zinc-300
            resize-none outline-none focus:ring-1 focus:ring-primary focus:border-primary
            transition-all duration-200 custom-scrollbar placeholder:text-zinc-700
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);
SheetTextArea.displayName = 'SheetTextArea';

// --- SELECT (CUSTOM) ---

export interface SheetSelectOption {
  label: string;
  value: string;
}

interface SheetSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SheetSelectOption[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  variant?: 'standard' | 'ghost' | 'box';
}

export const SheetSelect: React.FC<SheetSelectProps> = ({
  label,
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Selecione...',
  disabled = false,
  variant = 'standard'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      
      // Check vertical space
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = Math.min(options.length * 36, 240); // Approx height
      
      let top = rect.bottom + window.scrollY;
      
      // If not enough space below, flip up
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          top = rect.top + window.scrollY - dropdownHeight;
      }

      setCoords({
        top: top,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  const variantClasses = {
    standard: 'border-b border-zinc-700 py-1 px-2',
    ghost: 'border-transparent py-1 px-2 hover:bg-white/5 rounded',
    box: 'border border-zinc-700 bg-zinc-950/50 rounded-md px-3 py-1.5'
  };

  return (
    <div className="w-full min-w-0">
      {label && <SheetLabel>{label}</SheetLabel>}
      <div
        ref={triggerRef}
        onClick={toggleOpen}
        className={`
          relative w-full pr-6 cursor-pointer
          font-medium text-xs md:text-sm transition-colors select-none truncate text-zinc-200
          ${variantClasses[variant]}
          ${isOpen && variant === 'standard' ? 'border-primary' : ''}
          ${isOpen && variant === 'box' ? 'ring-1 ring-primary border-primary' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <span className={`block truncate ${!value ? 'text-zinc-600' : ''}`}>
          {value ? selectedLabel : placeholder}
        </span>
        <ChevronDown className={`absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-[9999] bg-zinc-900 border border-zinc-700 rounded-md shadow-xl overflow-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: '240px'
            }}
          >
            {options.length === 0 ? (
                <div className="p-2 text-xs text-zinc-500 italic text-center">Nenhuma opção.</div>
            ) : (
                options.map((option) => (
                <div
                    key={option.value}
                    onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    }}
                    className={`
                    px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors
                    ${option.value === value ? 'text-primary bg-primary/5 font-medium' : 'text-zinc-300'}
                    `}
                >
                    <span className="truncate">{option.label}</span>
                    {option.value === value && <Check className="w-3 h-3 shrink-0" />}
                </div>
                ))
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

// --- STAT BLOCK ---

interface SheetStatBlockProps {
  label: string;
  value: string | number;
  onChange?: (value: string) => void;
  icon?: React.ReactNode;
  tooltip?: string;
  editable?: boolean;
  className?: string;
}

export const SheetStatBlock: React.FC<SheetStatBlockProps> = ({
  label,
  value,
  onChange,
  icon,
  tooltip,
  editable = true,
  className = ''
}) => {
  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 flex flex-col items-center justify-center relative overflow-hidden group ${className}`}>
      <SheetLabel icon={icon} tooltip={tooltip} className="justify-center text-[9px] mb-0.5 w-full text-center">{label}</SheetLabel>
      {editable && onChange ? (
        <input
          type={typeof value === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-center font-bold text-lg md:text-xl text-zinc-200 outline-none w-full px-1 py-0 m-0 leading-none focus:text-white"
        />
      ) : (
        <span className="font-bold text-lg md:text-xl text-zinc-200 leading-none">{value}</span>
      )}
    </div>
  );
};

// --- LIST ITEM ---

interface SheetListItemProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SheetListItem: React.FC<SheetListItemProps> = ({ children, actions, className = '' }) => {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all group ${className}`}>
      {children}
      {actions && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
          {actions}
        </div>
      )}
    </div>
  );
};
