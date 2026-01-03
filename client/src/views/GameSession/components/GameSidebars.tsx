import React from 'react';
import { BookOpen, X, Trash2 } from 'lucide-react';
import { PartyList } from '../../../components/vtt/PartyList';
import { useGameSession } from '../../../context/GameSessionContext';
import { TokenTemplate } from '../../../types';

// Extract TokenLibrary to here or import it if it's already a component
// For now, I'll include the TokenLibrary implementation here as it was defined in GameSessionView
const TokenLibrary: React.FC<{
  templates: TokenTemplate[];
  onUseTemplate: (tpl: TokenTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onClose: () => void;
}> = ({ templates, onUseTemplate, onDeleteTemplate, onClose }) => {
  return (
    <div className="h-full flex flex-col bg-zinc-950/95 backdrop-blur-md border-r border-white/10 shadow-2xl">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-100">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-bold font-fantasy tracking-wide">Bestiário</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 text-zinc-600">
            <BookOpen className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm italic text-zinc-600">Grimório vazio.</p>
            <p className="text-xs mt-2 max-w-[150px]">Crie um token no mapa e salve-o como modelo para vê-lo aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-2 flex items-center gap-3 hover:border-primary/50 hover:bg-zinc-800 transition-all group cursor-grab active:cursor-grabbing shadow-sm" onClick={() => onUseTemplate(tpl)}>
                <div className="relative shrink-0">
                  {tpl.displayMode === 'text' ? (
                    <div
                      className="w-12 h-12 rounded-lg border border-white/10 shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: tpl.textDetails?.backgroundColor || '#333' }}
                    >
                      <span className="font-bold" style={{ color: tpl.textDetails?.textColor || '#fff' }}>
                        {tpl.textDetails?.text || '?'}
                      </span>
                    </div>
                  ) : (
                    <img src={tpl.imgUrl} className="w-12 h-12 rounded-lg bg-zinc-950 object-cover border border-white/10 shadow-inner" />
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-zinc-950 text-[9px] px-1.5 py-0.5 rounded border border-white/10 font-mono text-zinc-400">{tpl.size}x</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-zinc-200 group-hover:text-primary transition-colors">{tpl.name}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{tpl.visionRange > 0 ? `${tpl.visionRange}m Visão` : 'Cego'}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteTemplate(tpl.id); }}
                  className="p-2 hover:bg-destructive/20 text-zinc-600 hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface GameSidebarsProps {
  onUseTemplate: (tpl: TokenTemplate) => void;
}

export const GameSidebars: React.FC<GameSidebarsProps> = ({ onUseTemplate }) => {
  const session = useGameSession();

  return (
    <>
      <div className={`absolute top-0 left-0 bottom-0 z-20 w-80 transform transition-transform duration-300 ease-out ${session.ui.isLibraryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <TokenLibrary templates={session.templates} onUseTemplate={onUseTemplate} onDeleteTemplate={session.deleteTemplate} onClose={session.toggleLibrary} />
      </div>

      <div className={`absolute top-0 right-0 bottom-0 z-20 w-80 md:w-96 transform transition-transform duration-300 ease-out ${session.ui.isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <PartyList />
      </div>
    </>
  );
};
