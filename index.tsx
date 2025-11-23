
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ModalProvider } from './context/ModalContext';
import { TooltipProvider } from './context/TooltipContext';
import { initMockDatabase } from './data/mockDataLayer';

// Inicializa a "API" Mockada com dados de teste se estiver vazia
initMockDatabase();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <NotificationProvider>
          <AuthProvider>
            <NavigationProvider>
              <ModalProvider>
                <App />
              </ModalProvider>
            </NavigationProvider>
          </AuthProvider>
        </NotificationProvider>
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>
);
