import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ViewState } from '../types';

interface NavigationContextType {
  currentView: ViewState;
  params?: Record<string, any>;
  navigateTo: (view: ViewState, params?: Record<string, any>) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode; }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [params, setParams] = useState<Record<string, any> | undefined>(undefined);

  // Handle URL routing on load
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/join/')) {
      const campaignId = path.split('/')[2];
      if (campaignId) {
        // Store intended destination if not logged in, or navigate directly
        // For now, we'll set the params and let the App component decide based on auth
        setParams({ id: campaignId, action: 'join' });
        // We don't change view here immediately because AuthContext needs to check login status first
        // Ideally, we'd have a 'join-campaign' view or handle this in App.tsx
        // But let's map it to 'campaign-dashboard' for now if we assume user will login
        setCurrentView('campaign-dashboard');
      }
    }
  }, []);

  const navigateTo = (view: ViewState, newParams?: Record<string, any>) => {
    setCurrentView(view);
    setParams(newParams);
    // Optional: Update URL bar for better UX (pushState)
    // window.history.pushState({}, '', view === 'dashboard' ? '/' : `/${view}`);
  };

  return (
    <NavigationContext.Provider value={{ currentView, params, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};