
import React, { useState } from 'react';
import { Handout, HandoutType } from '../../types';
import { X, FileText, Image, Youtube, Share2, Edit, Plus, Search, Zap, LayoutTemplate } from 'lucide-react';
import { useGameSession } from '../../context/GameSessionContext';
import { useNotification } from '../../context/NotificationContext';

interface HandoutTrayProps {
  isOpen: boolean;
  handouts: Handout[];
  onClose: () => void;
  onCreate: () => void;
  onEdit: (handout: Handout) => void;
  onShare: (handout: Handout) => void;
  onPreview: (handout: Handout) => void;
}

const ICON_MAP: Record<HandoutType, React.ReactNode> = {
  text: <FileText className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  video_link: <Youtube className="w-4 h-4" />,
};

export const HandoutTray: React.FC<HandoutTrayProps> = ({ isOpen, handouts, onClose, onCreate, onEdit, onShare, onPreview }) => {
  const { setDrawingTriggerZone, setActiveTool } = useGameSession();
  const { show } = useNotification();
  const [search, setSearch] = useState('');

  const filteredHandouts = handouts.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreateTrigger = (handout: Handout) => {
      setDrawingTriggerZone({ type: 'rect', p1: { x: 0, y: 0 }, handoutId: handout.id }); // Pre-load ID
      setActiveTool('draw-trigger-rect');
      show({ type: 'info', message: `Ferramenta de Gatilho selecionada para "${handout.name}". Desenhe no mapa.` });
      onClose();
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 left-0 bottom-0 z-40 w-80 bg-zinc-950 border-r border-zinc-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-bold font-fantasy flex items-center gap-2 text-zinc-100">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            Recursos
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-zinc-800 space-y-3">
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-primary outline-none"
                    placeholder="Buscar recurso..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <button onClick={onCreate} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-primary/10 border border-primary/30 rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                <Plus className="w-4 h-4" /> Novo Recurso
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {filteredHandouts.length === 0 ? (
            <div className="text-center p-8 text-zinc-600 italic text-sm">
              {search ? 'Nenhum resultado.' : 'Nenhum recurso criado.'}
            </div>
          ) : (
            filteredHandouts.map(handout => {
              const sharedCount = handout.sharedWith.length;
              return (
                <div key={handout.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 group transition-all hover:border-zinc-600 hover:bg-zinc-900">
                    <div 
                        className="flex items-center gap-3 cursor-pointer p-1"
                        onClick={() => onPreview(handout)}
                    >
                        <div className={`p-2 rounded text-zinc-300 border border-zinc-700 ${handout.theme === 'parchment' ? 'bg-[#f4e4bc] text-[#4a3b22]' : 'bg-zinc-800'}`}>
                            {ICON_MAP[handout.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-zinc-200 truncate">{handout.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-zinc-500 capitalize">{handout.theme || 'Standard'}</span>
                                {sharedCount > 0 && <span className="text-[9px] text-green-500 font-bold bg-green-950/30 px-1.5 rounded border border-green-900">LIVE</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between gap-1 mt-2 pt-2 border-t border-zinc-800/50">
                        <button onClick={() => handleCreateTrigger(handout)} className="px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 text-purple-400 hover:bg-purple-900/20 transition-colors" title="Criar Gatilho no Mapa">
                            <Zap className="w-3 h-3" /> Gatilho
                        </button>
                        <div className="flex gap-1">
                            <button onClick={() => onEdit(handout)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors" title="Editar">
                                <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onShare(handout)} className={`p-1.5 rounded transition-colors ${sharedCount > 0 ? 'text-primary bg-primary/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`} title="Compartilhar">
                                <Share2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
