import React from 'react';
import { Eye } from 'lucide-react';

interface PullViewNotificationProps {
  show: boolean;
}

export const PullViewNotification: React.FC<PullViewNotificationProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
      <div className="bg-red-600/90 text-white px-8 py-4 rounded-xl shadow-2xl border-2 border-red-500/50 backdrop-blur-sm flex items-center gap-4">
        <div className="p-2 bg-white/20 rounded-full animate-pulse">
          <Eye className="w-8 h-8" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold uppercase tracking-wider">Atenção</h2>
          <p className="text-lg font-medium opacity-90">O Mestre puxou sua visão</p>
        </div>
      </div>
    </div>
  );
};
