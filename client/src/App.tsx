import React from 'react';
import { useAuth } from './context/AuthContext';
import { useNavigation } from './context/NavigationContext';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { DashboardView } from './views/DashboardView';
import { CharacterCreateView } from './views/CharacterCreateView';
import { CampaignCreateView } from './views/CampaignCreateView';
import { GameSessionView } from './views/GameSessionView';
import { GameSessionView3D } from './views/GameSessionView3D';
import { CampaignDashboardView } from './views/CampaignDashboardView'; // Import new view
import { Loader2, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentView } = useNavigation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <Sparkles className="w-12 h-12 text-primary animate-bounce relative z-10" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse mt-6 font-fantasy tracking-widest">INVOCANDO O REINO...</p>
      </div>
    );
  }

  // Routing Logic
  let content;
  if (isAuthenticated) {
    switch (currentView) {
      case 'create-character':
        content = <CharacterCreateView />;
        break;
      case 'create-campaign':
        content = <CampaignCreateView />;
        break;
      case 'campaign-dashboard': // Add route handler
        content = <CampaignDashboardView />;
        break;
      case 'game-session':
        content = <GameSessionView />;
        break;
      case 'game-session-3d':
        content = <GameSessionView3D />;
        break;
      case 'dashboard':
      default:
        content = <DashboardView />;
        break;
    }
  } else {
    switch (currentView) {
      case 'register':
        content = <RegisterView />;
        break;
      case 'login':
      default:
        content = <LoginView />;
        break;
    }
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {content}
    </div>
  );
};

export default App;