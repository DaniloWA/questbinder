import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Notification } from '../../types';

interface ToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

// Consolidated Style Map
// We use standard colors for icons/borders to ensure visibility, 
// but relying on semantic bg-card for the container to match the theme perfectly.
const styleMap = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 shrink-0" />,
    borderColor: 'border-green-600 dark:border-green-500',
    titleColor: 'text-green-700 dark:text-green-400',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0" />,
    borderColor: 'border-red-600 dark:border-red-500',
    titleColor: 'text-red-700 dark:text-red-400',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />,
    borderColor: 'border-amber-600 dark:border-amber-500',
    titleColor: 'text-amber-700 dark:text-amber-400',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-500 shrink-0" />,
    borderColor: 'border-blue-600 dark:border-blue-500',
    titleColor: 'text-blue-700 dark:text-blue-400',
  },
};

export const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const { icon, borderColor, titleColor } = styleMap[notification.type];

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  return (
    <div
      role="alert"
      className={`
        w-full max-w-md md:max-w-lg rounded-r-lg shadow-xl pointer-events-auto flex overflow-hidden
        border-l-4 ${borderColor}
        bg-card text-card-foreground
        border-y border-r border-border
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="p-4 flex items-start gap-3 w-full">
        <div className="pt-0.5">{icon}</div>

        <div className="flex-1 min-w-0">
          {notification.title && (
            <p className={`text-sm font-bold mb-1 ${titleColor}`}>
              {notification.title}
            </p>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed break-words">
            {notification.message}
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 -mt-1 -mr-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Fechar</span>
        </button>
      </div>
    </div>
  );
};

// Container
interface ToastContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  notifications,
  onDismiss,
}) => {
  return (
    <div
      aria-live="assertive"
      // Z-Index 10000 ensures it sits above Modals (which usually use z-[9999])
      className="fixed inset-0 z-[10000] flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 gap-3"
    >
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
};