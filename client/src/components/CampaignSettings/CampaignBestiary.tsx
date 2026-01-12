import React, { useState, useEffect } from 'react';
import { TokenTemplate } from '../../types';
import { Button } from '../ui/Button';
import { BookOpen, Trash2, Search, Ghost } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { apiService } from '../../services/apiService';
import { SheetInput } from '../ui/SheetPrimitives';
import { Modal } from '../ui/Modal';

export const CampaignBestiary: React.FC = () => {
  const { show } = useNotification();
  const [templates, setTemplates] = useState<TokenTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.get<TokenTemplate>('token_templates');
      if (res.success && res.data) {
        setTemplates(res.data);
      }
    } catch (error) {
      console.error(error);
      show({ type: 'error', message: 'Erro ao carregar bestiário.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiService.delete('token_templates', id);
      if (res.success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        show({ type: 'success', message: 'Modelo removido.' });
      } else {
        show({ type: 'error', message: 'Erro ao remover modelo.' });
      }
    } catch (error) {
      show({ type: 'error', message: 'Erro ao remover modelo.' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-fantasy text-zinc-100">Bestiário</h2>
          <p className="text-zinc-400 mt-1">
            Gerencie os modelos de criaturas salvos.
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <SheetInput
            variant="box"
            placeholder="Buscar criatura..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-zinc-500 animate-pulse">
          Carregando bestiário...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-20 text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
          <Ghost className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Nenhuma criatura encontrada</p>
          <p className="text-sm">Crie tokens no VTT e salve-os como modelo para aparecerem aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(tpl => (
            <div key={tpl.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-4 hover:border-zinc-600 transition-colors group">
              <div className="relative shrink-0">
                {tpl.displayMode === 'text' ? (
                  <div
                    className="w-16 h-16 rounded-lg border border-white/10 shadow-inner flex items-center justify-center text-xl font-bold"
                    style={{
                      backgroundColor: tpl.textDetails?.backgroundColor || '#333',
                      color: tpl.textDetails?.textColor || '#fff'
                    }}
                  >
                    {tpl.textDetails?.text || '?'}
                  </div>
                ) : (
                  <img src={tpl.imgUrl} className="w-16 h-16 rounded-lg bg-zinc-950 object-cover border border-white/10 shadow-inner" />
                )}
                <div className="absolute -bottom-2 -right-2 bg-zinc-950 text-[10px] px-1.5 py-0.5 rounded border border-white/10 font-mono text-zinc-400 shadow-sm">
                  {tpl.size}x
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-zinc-200 truncate">{tpl.name}</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{tpl.type}</p>
                <div className="flex gap-2 mt-1">
                  {tpl.visionRange > 0 && (
                    <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 rounded border border-blue-900/50">
                      Visão {tpl.visionRange}m
                    </span>
                  )}
                  {tpl.hpMax && (
                    <span className="text-[10px] bg-red-900/30 text-red-400 px-1.5 rounded border border-red-900/50">
                      {tpl.hpMax} HP
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setDeletingId(tpl.id)}
                className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Excluir Modelo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {deletingId && (
        <Modal
          isOpen={!!deletingId}
          onClose={() => setDeletingId(null)}
          title="Excluir Modelo"
          variant="alert"
        >
          <div className="space-y-4">
            <p>Tem certeza que deseja excluir este modelo do bestiário? Tokens já criados não serão afetados.</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeletingId(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => handleDelete(deletingId)}>Excluir</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
