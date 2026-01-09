
import React, { useState } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { CombatTrackerEnhanced } from './CombatTrackerEnhanced';
import { GameLog, ChatViewMode } from './GameLog';
import { PartyList } from './PartyList';
import { Users, Activity, Swords, X, ArrowLeftFromLine, ExternalLink, ArrowRightToLine } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { PopoutWindow } from '../ui/PopoutWindow';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from '../../i18n/TranslationContext';

// Internal component for content to be reused in both Docked and Popped-out states
const SidebarContent: React.FC<{
  activeTab: 'combat' | 'chat' | 'party';
  setActiveTab: (t: 'combat' | 'chat' | 'party') => void;
  onClose?: () => void;
  onPopout?: () => void;
  onDock?: () => void;
  isPoppedOut?: boolean;
}> = ({ activeTab, setActiveTab, onClose, onPopout, onDock, isPoppedOut }) => {
  const { chatMessages } = useGameSession();
  const { t } = useTranslation();
  // Chat view mode inside the sidebar is always 'sidebar' or 'fullscreen', actually inside the small container it behaves like sidebar
  const [chatMode, setChatMode] = useState<ChatViewMode>('sidebar');

  return (
    <div className="h-full flex flex-col bg-zinc-950/95 backdrop-blur-md border-l border-white/10 shadow-2xl w-full">
      {/* Header Tabs */}
      <div className="flex items-center justify-between p-2 border-b border-white/10 bg-zinc-900/80 shrink-0">
        <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-white/5">
          <Tooltip content={t('vtt.session.sidebar.tabHeader.chat.label')}>
            <button
              onClick={() => setActiveTab('chat')}
              className={`p-2 rounded-md transition-all relative ${activeTab === 'chat' ? 'bg-zinc-800 text-primary shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Activity className="w-4 h-4" />
              {chatMessages.length > 0 && activeTab !== 'chat' && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-zinc-900"></div>
              )}
            </button>
          </Tooltip>
          <Tooltip content={t('vtt.session.sidebar.tabHeader.combat.label')}>
            <button
              onClick={() => setActiveTab('combat')}
              className={`p-2 rounded-md transition-all ${activeTab === 'combat' ? 'bg-zinc-800 text-red-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Swords className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content={t('vtt.session.sidebar.tabHeader.party.label')}>
            <button
              onClick={() => setActiveTab('party')}
              className={`p-2 rounded-md transition-all ${activeTab === 'party' ? 'bg-zinc-800 text-green-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Users className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        <div className="flex gap-1">
          {/* Pop-out / Dock Buttons */}
          {!isPoppedOut && onPopout && (
            <Tooltip content={t('vtt.session.sidebar.popoutButton.tooltip')}>
              <button onClick={onPopout} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <ExternalLink className="w-4 h-4" />
              </button>
            </Tooltip>
          )}
          {isPoppedOut && onDock && (
            <Tooltip content={t('vtt.session.sidebar.dockButton.tooltip')}>
              <button onClick={onDock} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <ArrowRightToLine className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {/* Close Button (Only if not popped out OR if it handles close) */}
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
        <div className={`h-full w-full ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
          <GameLog onModeChange={setChatMode} />
        </div>

        {activeTab === 'combat' && <CombatTrackerEnhanced />}
        {activeTab === 'party' && <PartyList />}
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const { toggleRightSidebar } = useGameSession();
  const { show } = useNotification();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'combat' | 'chat' | 'party'>('chat');
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  const [wasBlocked, setWasBlocked] = useState(false);

  const handlePopout = () => {
    setWasBlocked(false);
    setIsPoppedOut(true);
  };

  const handleDock = () => {
    setIsPoppedOut(false);
  };

  const handlePopoutBlocked = () => {
    setWasBlocked(true);
    show({
      type: 'warning',
      title: t('vtt.session.sidebar.popupBlocked.warningBanner.title'),
      message: t('vtt.session.sidebar.popupBlocked.warningBanner.message'),
      duration: 6000,
    });
  };

  const handleRetryPopout = () => {
    // Clear blocked state and try again
    setWasBlocked(false);
    setIsPoppedOut(true);
  };

  if (isPoppedOut) {
    return (
      <>
        {/* Visual Placeholder in Main Window */}
        <div className="h-full flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-md border-l border-white/10 shadow-2xl w-full p-6 text-center">
          <ExternalLink className="w-12 h-12 text-zinc-700 mb-4" />
          <h3 className="text-zinc-400 font-bold mb-2">{t('vtt.session.sidebar.undockedPlaceholder.title')}</h3>
          <p className="text-sm text-zinc-600 mb-6">{t('vtt.session.sidebar.undockedPlaceholder.description')}</p>
          <button
            onClick={handleDock}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors text-sm font-bold"
          >
            <ArrowRightToLine className="w-4 h-4" /> {t('vtt.session.sidebar.undockedPlaceholder.redockButton.label')}
          </button>
          <button
            onClick={toggleRightSidebar}
            className="mt-6 flex items-center gap-2 px-4 py-2 text-zinc-600 hover:text-zinc-400 transition-colors text-xs"
          >
            <X className="w-3 h-3" /> {t('vtt.session.sidebar.undockedPlaceholder.closeSidebarButton.label')}
          </button>
        </div>

        {/* The Window Portal */}
        <PopoutWindow title={t('vtt.session.sidebar.popoutWindow.title')} onClose={handleDock} onBlocked={handlePopoutBlocked} width={400} height={700}>
          <SidebarContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onDock={handleDock}
            isPoppedOut={true}
          />
        </PopoutWindow>
      </>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Blocked Banner */}
      {wasBlocked && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 p-3 shrink-0">
          <div className="flex flex-col gap-2">
            <p className="text-amber-200 text-xs leading-relaxed">
              <strong>{t('vtt.session.sidebar.popupBlocked.warningBanner.title')}</strong> {t('vtt.session.sidebar.popupBlocked.warningBanner.message')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRetryPopout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded text-xs font-bold transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {t('vtt.session.sidebar.popupBlocked.retryButton.label')}
              </button>
              <button
                onClick={() => setWasBlocked(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
              >
                {t('vtt.session.sidebar.popupBlocked.closeButton.label')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sidebar Content */}
      <div className="flex-1 min-h-0">
        <SidebarContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={toggleRightSidebar}
          onPopout={handlePopout}
          isPoppedOut={false}
        />
      </div>
    </div>
  );
};
