import React, { useState, useEffect } from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { useTranslation } from '../../i18n/TranslationContext';

export const AfkOverlay: React.FC = () => {
  const { afkStatus, afkTimeLeft } = useGameSession();
  const { t } = useTranslation();

  // Local countdown state - decrements every second
  const [displayTime, setDisplayTime] = useState<number>(0);

  // Sync with server value when it changes
  useEffect(() => {
    if (afkTimeLeft !== undefined && afkTimeLeft > 0) {
      setDisplayTime(afkTimeLeft);
    }
  }, [afkTimeLeft]);

  // Countdown effect - decrements every second
  useEffect(() => {
    if (afkStatus !== 'warning' || displayTime <= 0) return;

    const timer = setInterval(() => {
      setDisplayTime(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [afkStatus, displayTime]);

  // Client-side Failsafe: If timer reaches 0 and server hasn't kicked us (e.g. socket lag), force redirect.
  // Redirects to the campaign lobby (/join/:id) so they can easily rejoin.
  useEffect(() => {
    if (afkStatus === 'warning' && displayTime === 0) {
      const timeout = setTimeout(() => {
        // console.warn('[AfkOverlay] Kick timer expired and no server event received. Forcing redirect.');
        const pathParts = window.location.pathname.split('/');
        const campaignId = pathParts[2]; // /campaign/[id]/game

        if (campaignId) {
          sessionStorage.setItem('kickMessage', t('vtt.cursor.afk.fallback_kick'));
          sessionStorage.setItem('kickReason', 'afk');
          window.location.href = `/join/${campaignId}`;
        } else {
          window.location.href = '/dashboard';
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [afkStatus, displayTime]);

  // console.log('[AfkOverlay] Render:', { afkStatus, afkTimeLeft, displayTime });

  if (!afkStatus || afkStatus === 'active') return null;

  const isWarning = afkStatus === 'warning';
  const timeToShow = isWarning ? displayTime : 0;

  return (
    <div className={`fixed inset-0 z-[9999] pointer-events-none flex items-start justify-center pt-24 transition-opacity duration-300 ${isWarning ? 'bg-red-900/20' : 'bg-yellow-900/10'}`}>
      <div className={`pointer-events-auto max-w-md w-full mx-4 p-6 rounded-lg shadow-2xl border-2 backdrop-blur-md transform transition-all duration-300 animate-in fade-in slide-in-from-top-4
        ${isWarning
          ? 'bg-red-950/90 border-red-500 text-red-100'
          : 'bg-yellow-950/90 border-yellow-500 text-yellow-100'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`text-4xl ${isWarning ? 'animate-pulse' : ''}`}>
            {isWarning ? '⚠️' : '💤'}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">
              {isWarning
                ? (t('vtt.cursor.afk.warning_title') || 'Inatividade Detectada!')
                : (t('vtt.cursor.afk.title') || 'Você está Ausente')
              }
            </h3>
            <p className="text-sm opacity-90">
              {isWarning
                ? (t('vtt.cursor.afk.warning_desc', { seconds: timeToShow }) || `Você será desconectado em ${timeToShow} segundos.`)
                : (t('vtt.cursor.afk.desc') || 'Mexa o mouse ou interaja com a tela para retornar.')
              }
            </p>
          </div>
        </div>

        {isWarning && (
          <div className="mt-4 w-full bg-red-900/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(timeToShow / 180) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
