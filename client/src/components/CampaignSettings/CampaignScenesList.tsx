import React, { useState } from 'react';
import { Campaign, MapScene, Playlist, SoundEffect } from '../../types';
import { Button } from '../ui/Button';
import { Plus, Trash2, Map as MapIcon, Settings, Image as ImageIcon, Copy } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { campaignService } from '../../services/campaignService';
import { MapSettingsModal } from '../vtt/MapSettingsModal';
import { Modal } from '../ui/Modal';

interface CampaignScenesListProps {
  campaign: Campaign;
  onUpdate: (campaign: Campaign) => void;
  audioSettings: { playlists: Playlist[], soundboard: SoundEffect[]; };
}

export const CampaignScenesList: React.FC<CampaignScenesListProps> = ({ campaign, onUpdate, audioSettings }) => {
  const { show } = useNotification();
  const [editingScene, setEditingScene] = useState<MapScene | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleCreateScene = async () => {
    const newScene: MapScene = {
      id: crypto.randomUUID(),
      name: 'Nova Cena',
      imageUrl: '',
      grid: { size: 70, color: '#ffffff', alpha: 0.2, cols: 20, rows: 15, unitsPerSquare: 1.5 },
      ambientLight: 1.0,
      fogPath: '',
      obstacles: [],
      lightZones: [],
      audioZones: [],
      triggerZones: [],
      drawings: [],
      tokens: []
    };

    const updatedCampaign = {
      ...campaign,
      scenes: [...campaign.scenes, newScene]
    };

    try {
      const res = await campaignService.update(campaign.id, { scenes: updatedCampaign.scenes });
      if (res.success) {
        onUpdate(updatedCampaign);
        setEditingScene(newScene); // Open settings immediately
        show({ type: 'success', message: 'Cena criada!' });
      }
    } catch (error) {
      show({ type: 'error', message: 'Erro ao criar cena.' });
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (campaign.scenes.length <= 1) {
      show({ type: 'warning', message: 'A campanha deve ter pelo menos uma cena.' });
      return;
    }

    const updatedScenes = campaign.scenes.filter(s => s.id !== sceneId);
    // If deleting active scene, switch to first available
    let activeSceneId = campaign.activeSceneId;
    if (activeSceneId === sceneId) {
      activeSceneId = updatedScenes[0].id;
    }

    try {
      const res = await campaignService.update(campaign.id, {
        scenes: updatedScenes,
        activeSceneId
      });

      if (res.success) {
        onUpdate({ ...campaign, scenes: updatedScenes, activeSceneId });
        show({ type: 'success', message: 'Cena removida.' });
      }
    } catch (error) {
      show({ type: 'error', message: 'Erro ao remover cena.' });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUpdateScene = async (updates: Partial<MapScene>) => {
    if (!editingScene) return;

    const updatedScenes = campaign.scenes.map(s =>
      s.id === editingScene.id ? { ...s, ...updates } : s
    );

    try {
      const res = await campaignService.update(campaign.id, { scenes: updatedScenes });
      if (res.success) {
        onUpdate({ ...campaign, scenes: updatedScenes });
        setEditingScene(null);
        show({ type: 'success', message: 'Cena atualizada!' });
      }
    } catch (error) {
      show({ type: 'error', message: 'Erro ao atualizar cena.' });
    }
  };

  const handleSetActive = async (sceneId: string) => {
    try {
      const res = await campaignService.update(campaign.id, { activeSceneId: sceneId });
      if (res.success) {
        onUpdate({ ...campaign, activeSceneId: sceneId });
        show({ type: 'success', message: 'Cena ativa alterada.' });
      }
    } catch (error) {
      show({ type: 'error', message: 'Erro ao ativar cena.' });
    }
  };

  const handleDuplicateScene = async (scene: MapScene) => {
    const newScene: MapScene = {
      ...scene,
      id: crypto.randomUUID(),
      name: `${scene.name} (Cópia)`,
      tokens: [] // Don't copy tokens to avoid ID conflicts, or regenerate IDs (simpler to just empty for now)
    };

    const updatedCampaign = {
      ...campaign,
      scenes: [...campaign.scenes, newScene]
    };

    try {
      const res = await campaignService.update(campaign.id, { scenes: updatedCampaign.scenes });
      if (res.success) {
        onUpdate(updatedCampaign);
        show({ type: 'success', message: 'Cena duplicada!' });
      }
    } catch (error) {
      show({ type: 'error', message: 'Erro ao duplicar cena.' });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-fantasy text-zinc-100">Gerenciador de Mapas</h2>
          <p className="text-zinc-400 mt-1">
            Crie e configure as cenas da sua campanha.
          </p>
        </div>
        <Button size="lg" onClick={handleCreateScene} className="shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 mr-2" />
          Nova Cena
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaign.scenes.map(scene => {
          const isActive = campaign.activeSceneId === scene.id;
          return (
            <div
              key={scene.id}
              className={`group relative bg-zinc-900 border rounded-xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl ${isActive ? 'border-primary ring-1 ring-primary shadow-primary/10' : 'border-zinc-800 hover:border-zinc-600'}`}
            >
              <div className="aspect-video bg-zinc-950 relative overflow-hidden">
                {scene.imageUrl ? (
                  <img src={scene.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <MapIcon className="w-12 h-12 opacity-20" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
                    onClick={() => handleDuplicateScene(scene)}
                    title="Duplicar Cena"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-black/50 hover:bg-red-900/70 text-white hover:text-red-200 backdrop-blur-sm"
                    onClick={() => setIsDeleting(scene.id)}
                    title="Excluir Cena"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-lg text-white truncate">{scene.name}</h3>
                    {isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded-full">Ativa</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 flex items-center gap-2">
                    <span>{scene.grid.cols}x{scene.grid.rows}</span>
                    <span>•</span>
                    <span>{scene.tokens.length} Tokens</span>
                  </p>
                </div>
              </div>

              <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingScene(scene)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
                {!isActive && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleSetActive(scene.id)}
                  >
                    Ativar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editingScene && (
        <MapSettingsModal
          scene={editingScene}
          onClose={() => setEditingScene(null)}
          onSave={handleUpdateScene}
          audioSettings={audioSettings}
        />
      )}

      {/* Delete Confirmation */}
      {isDeleting && (
        <Modal
          isOpen={!!isDeleting}
          onClose={() => setIsDeleting(null)}
          title="Excluir Cena"
          variant="alert"
        >
          <div className="space-y-4">
            <p>Tem certeza que deseja excluir esta cena? Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsDeleting(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => handleDeleteScene(isDeleting)}>Excluir Definitivamente</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
