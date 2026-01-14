import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification, NotificationInput } from '../types';
import { ToastContainer } from '../components/ui/Toast';

interface NotificationContextType {
  notifications: Notification[];
  show: (input: NotificationInput) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode; }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const show = useCallback((input: NotificationInput) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = input.duration || 15000;

    const newNotification: Notification = { ...input, id, duration };

    setNotifications((prev) => [...prev, newNotification]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }, [dismiss]);

  return (
    <NotificationContext.Provider value={{ notifications, show, dismiss }}>
      {children}
      <ToastContainer notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};