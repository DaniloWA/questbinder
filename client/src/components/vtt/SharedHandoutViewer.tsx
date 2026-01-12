
import React from 'react';
import { useGameSession } from '../../context/GameSessionContext';
import { Handout, HandoutTheme } from '../../types';
import { X } from 'lucide-react';
import { AccessGate } from '../AccessGate';
import { GameRole } from '../../types/acl';
import { useAccessControl } from '../../hooks/useAccessControl';

// Standard Markdown parser (simplified for brevity)
const markdownToHtml = (text: string) => {
  let html = text
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold font-fantasy mb-2 mt-4">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold font-fantasy mb-3 mt-5 border-b border-current pb-1">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold font-fantasy mb-4 text-center">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-current pl-4 italic my-4 opacity-80">$1</blockquote>')
    .replace(/\n/gim, '<br />');
  return html;
};

const THEME_CONTAINERS: Record<HandoutTheme, string> = {
  standard: 'bg-zinc-900 text-zinc-200 border-zinc-700 font-sans',
  parchment: 'bg-[#f4e4bc] text-[#4a3b22] border-[#d4c49c] font-serif shadow-[inset_0_0_60px_rgba(0,0,0,0.1)] bg-[url("https://www.transparenttextures.com/patterns/aged-paper.png")]',
  terminal: 'bg-black text-green-500 border-green-900 font-mono shadow-[inset_0_0_20px_rgba(0,255,0,0.1)]',
  arcane: 'bg-[#1a0b2e] text-purple-200 border-purple-900 font-fantasy shadow-[0_0_30px_rgba(168,85,247,0.3)]',
};

const HandoutContent: React.FC<{ handout: Handout; }> = ({ handout }) => {
  switch (handout.type) {
    case 'text':
      return (
        <div
          className="prose prose-sm md:prose-lg max-w-none leading-relaxed px-2"
          // Inline style override for prose colors based on theme context is hard with just classes, 
          // so we rely on text-current inheritance where possible in markdownToHtml
          dangerouslySetInnerHTML={{ __html: markdownToHtml(handout.content) }}
        />
      );
    case 'image':
      return (
        <img
          src={handout.content}
          alt={handout.name}
          className="max-w-full max-h-full object-contain rounded shadow-lg"
        />
      );
    case 'video_link':
      const videoId = handout.content.split('v=')[1]?.split('&')[0] || handout.content.split('youtu.be/')[1]?.split('?')[0];
      if (!videoId) return <p className="text-red-500">Link inválido.</p>;
      return (
        <div className="aspect-video w-full shadow-2xl">
          <iframe
            width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={handout.name} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
            className="rounded bg-black"
          ></iframe>
        </div>
      );
    default: return null;
  }
};

export const SharedHandoutViewer: React.FC = () => {
  const { activeHandout, unshareHandout, closeTriggeredHandout } = useGameSession();
  const { isGM } = useAccessControl();

  if (!activeHandout) return null;

  const handleClose = () => {
    const isGlobal = activeHandout.sharedWith.length > 0;
    if (isGlobal && isGM) unshareHandout();
    else closeTriggeredHandout();
  };

  const canClose = isGM || activeHandout.sharedWith.length === 0;
  const themeClass = THEME_CONTAINERS[activeHandout.theme || 'standard'];

  return (
    <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className={`relative w-full max-w-4xl h-full max-h-[85vh] flex flex-col rounded-xl shadow-2xl border-2 overflow-hidden ${themeClass}`}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-current/20 bg-black/10 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold leading-none">{activeHandout.name}</h2>
            {activeHandout.sharedWith.length === 0 && <span className="text-[10px] uppercase font-bold opacity-70 border border-current px-2 py-0.5 rounded">Gatilho</span>}
          </div>

          {canClose && (
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-black/10 transition-colors flex items-center gap-2 opacity-70 hover:opacity-100"
            >
              <AccessGate requireRole={GameRole.GM} mode="hide">
                {activeHandout.sharedWith.length > 0 && <span className="text-xs font-bold hidden md:inline">Parar de Compartilhar</span>}
              </AccessGate>
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 flex justify-center">
          <div className="w-full max-w-3xl">
            <HandoutContent handout={activeHandout} />
          </div>
        </div>

      </div>
    </div>
  );
};
