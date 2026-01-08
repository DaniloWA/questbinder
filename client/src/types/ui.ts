import React from 'react';

// --- NAVIGATION ---
export type ViewState = 'login' | 'register' | 'dashboard' | 'create-character' | 'create-campaign' | 'game-session' | 'campaign-dashboard' | 'game-session-3d';

// --- THEME ---
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// --- NOTIFICATIONS ---
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
}

export type NotificationInput = Omit<Notification, 'id'>;

// --- MODALS ---
export type ModalVariant = 'default' | 'alert' | 'clean';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalOptions {
  title?: string;
  description?: string;
  variant?: ModalVariant;
  size?: ModalSize;
  /** Se true, clicar fora ou pressionar ESC não fecha o modal */
  preventOutsideClick?: boolean;
  /** Se true, esconde o botão X de fechar */
  hideCloseButton?: boolean;
  /** Se true, o fundo do modal será transparente */
  transparent?: boolean;
}

export interface ModalContextType {
  isOpen: boolean;
  openModal: (content: React.ReactNode, options?: ModalOptions) => void;
  closeModal: () => void;
}