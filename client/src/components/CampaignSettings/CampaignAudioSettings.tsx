import React, { useState, useRef } from 'react';
import { Campaign, Playlist, SoundEffect } from '../../types';
import { Button } from '../ui/Button';
import { SheetInput } from '../ui/SheetPrimitives';
import { Plus, Trash2, UploadCloud, Music, Volume2, Save, Loader2, Play, Pause } from 'lucide-react';
import { fileService } from '../../services/fileService';
import { useNotification } from '../../context/NotificationContext';
import { campaignService } from '../../services/campaignService';

interface CampaignAudioSettingsProps {
  campaign: Campaign;
  onUpdate: (campaign: Campaign) => void;
}

export const CampaignAudioSettings: React.FC<CampaignAudioSettingsProps> = ({ campaign, onUpdate }) => {
  const { show } = useNotification();
  const [playlists, setPlaylists] = useState<Playlist[]>(campaign.audioSettings.playlists || []);
  const [soundboard, setSoundboard] = useState<SoundEffect[]>(campaign.audioSettings.soundboard || []);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedCampaign = {
        ...campaign,
        audioSettings: {
          playlists,
          soundboard
        }
      };

      const res = await campaignService.update(campaign.id, {
        audioSettings: updatedCampaign.audioSettings
      });

      if (res.success) {
        show({ type: 'success', message: 'Configurações de áudio salvas!' });
        onUpdate(updatedCampaign);
      } else {
        show({ type: 'error', message: 'Erro ao salvar áudio.' });
      }
    } catch (error) {
      console.error(error);
      show({ type: 'error', message: 'Erro inesperado ao salvar.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'track' | 'sfx',
    index1: number,
    index2?: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadKey = `${type}-${index1}-${index2 ?? ''}`;
    setUploadingIndex(uploadKey);

    try {
      const response = await fileService.upload(file);
      if (response.success && response.data) {
        const url = response.data;
        if (type === 'track' && index2 !== undefined) {
          const newPlaylists = [...playlists];
          newPlaylists[index1].tracks[index2].url = url;
          setPlaylists(newPlaylists);
        } else if (type === 'sfx') {
          const newSfx = [...soundboard];
          newSfx[index1].url = url;
          setSoundboard(newSfx);
        }
        show({ type: 'success', message: 'Upload concluído!' });
      } else {
        show({ type: 'error', message: response.message || 'Erro no upload.' });
      }
    } catch (error) {
      show({ type: 'error', message: 'Erro ao fazer upload.' });
    } finally {
      setUploadingIndex(null);
    }
  };

  const togglePreview = (url: string) => {
    if (playingPreview === url) {
      audioRef.current?.pause();
      setPlayingPreview(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingPreview(url);
      } else {
        const audio = new Audio(url);
        audio.onended = () => setPlayingPreview(null);
        audioRef.current = audio;
        audio.play();
        setPlayingPreview(url);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-fantasy text-zinc-100">Gerenciador de Áudio</h2>
          <p className="text-zinc-400 mt-1">
            Configure playlists e efeitos sonoros para suas sessões.
          </p>
        </div>
        <Button size="lg" onClick={handleSave} disabled={isSaving} className="shadow-lg shadow-primary/20">
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Playlists Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-zinc-200 flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Playlists
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPlaylistName.trim()) return;
                setPlaylists([...playlists, { id: Date.now().toString(), name: newPlaylistName, tracks: [] }]);
                setNewPlaylistName('');
              }}
              className="flex gap-2"
            >
              <SheetInput
                variant="box"
                placeholder="Nova Playlist..."
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                className="w-40 h-9 text-sm"
              />
              <Button type="submit" size="sm" variant="outline"><Plus className="w-4 h-4" /></Button>
            </form>
          </div>

          <div className="space-y-4">
            {playlists.map((p, pIndex) => (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="bg-zinc-800/50 p-3 flex items-center justify-between border-b border-zinc-800">
                  <SheetInput
                    variant="ghost"
                    value={p.name}
                    onChange={e => {
                      const newPlaylists = [...playlists];
                      newPlaylists[pIndex].name = e.target.value;
                      setPlaylists(newPlaylists);
                    }}
                    className="font-bold text-zinc-200"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newPlaylists = [...playlists];
                        newPlaylists[pIndex].tracks.push({ name: 'Nova Faixa', url: '' });
                        setPlaylists(newPlaylists);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Faixa
                    </Button>
                    <button
                      onClick={() => setPlaylists(playlists.filter(pl => pl.id !== p.id))}
                      className="text-zinc-500 hover:text-red-400 p-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  {p.tracks.length === 0 && (
                    <p className="text-xs text-zinc-600 text-center py-4 italic">Nenhuma faixa nesta playlist</p>
                  )}
                  {p.tracks.map((t, tIndex) => {
                    const uploadKey = `track-${pIndex}-${tIndex}`;
                    const isUploading = uploadingIndex === uploadKey;
                    const isPreviewing = playingPreview === t.url;

                    return (
                      <div key={tIndex} className="flex gap-2 items-center bg-zinc-950/30 p-2 rounded-lg group hover:bg-zinc-950/50 transition-colors">
                        <button
                          onClick={() => t.url && togglePreview(t.url)}
                          disabled={!t.url}
                          className={`p-1.5 rounded-full ${isPreviewing ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'} transition-colors disabled:opacity-50`}
                        >
                          {isPreviewing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </button>

                        <div className="flex-1 space-y-1">
                          <SheetInput
                            variant="ghost"
                            placeholder="Nome da Faixa"
                            value={t.name}
                            onChange={e => {
                              const newPlaylists = [...playlists];
                              newPlaylists[pIndex].tracks[tIndex].name = e.target.value;
                              setPlaylists(newPlaylists);
                            }}
                            className="text-sm font-medium h-auto p-0"
                          />
                          <SheetInput
                            variant="ghost"
                            placeholder="URL do áudio (mp3, wav...)"
                            value={t.url}
                            onChange={e => {
                              const newPlaylists = [...playlists];
                              newPlaylists[pIndex].tracks[tIndex].url = e.target.value;
                              setPlaylists(newPlaylists);
                            }}
                            className="text-xs text-zinc-500 h-auto p-0 font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <input
                            type="file"
                            id={`up-${uploadKey}`}
                            className="hidden"
                            accept="audio/*"
                            onChange={(e) => handleFileUpload(e, 'track', pIndex, tIndex)}
                          />
                          <label
                            htmlFor={`up-${uploadKey}`}
                            className={`cursor-pointer p-2 rounded hover:bg-zinc-800 text-zinc-500 hover:text-primary transition-colors ${isUploading ? 'animate-pulse pointer-events-none' : ''}`}
                            title="Fazer upload de arquivo"
                          >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                          </label>
                          <button
                            onClick={() => {
                              const newPlaylists = [...playlists];
                              newPlaylists[pIndex].tracks.splice(tIndex, 1);
                              setPlaylists(newPlaylists);
                            }}
                            className="p-2 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                            title="Remover faixa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Soundboard Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-zinc-200 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-amber-500" />
              Soundboard (Efeitos)
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSoundboard([...soundboard, { id: Date.now().toString(), name: 'Novo Efeito', url: '' }])}
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar Efeito
            </Button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-4">
            <div className="space-y-2">
              {soundboard.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-8 italic">Nenhum efeito sonoro configurado</p>
              )}
              {soundboard.map((sfx, sfxIndex) => {
                const uploadKey = `sfx-${sfxIndex}-`;
                const isUploading = uploadingIndex === uploadKey;
                const isPreviewing = playingPreview === sfx.url;

                return (
                  <div key={sfx.id} className="flex gap-3 items-center bg-zinc-950/30 p-3 rounded-lg hover:bg-zinc-950/50 transition-colors">
                    <button
                      onClick={() => sfx.url && togglePreview(sfx.url)}
                      disabled={!sfx.url}
                      className={`p-2 rounded-lg ${isPreviewing ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'} transition-colors disabled:opacity-50`}
                    >
                      {isPreviewing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 space-y-1">
                      <SheetInput
                        variant="ghost"
                        placeholder="Nome do Efeito"
                        value={sfx.name}
                        onChange={e => {
                          const newSfx = [...soundboard];
                          newSfx[sfxIndex].name = e.target.value;
                          setSoundboard(newSfx);
                        }}
                        className="text-sm font-bold h-auto p-0"
                      />
                      <SheetInput
                        variant="ghost"
                        placeholder="URL do áudio..."
                        value={sfx.url}
                        onChange={e => {
                          const newSfx = [...soundboard];
                          newSfx[sfxIndex].url = e.target.value;
                          setSoundboard(newSfx);
                        }}
                        className="text-xs text-zinc-500 h-auto p-0 font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="file"
                        id={`up-${uploadKey}`}
                        className="hidden"
                        accept="audio/*"
                        onChange={(e) => handleFileUpload(e, 'sfx', sfxIndex)}
                      />
                      <label
                        htmlFor={`up-${uploadKey}`}
                        className={`cursor-pointer p-2 rounded hover:bg-zinc-800 text-zinc-500 hover:text-primary transition-colors ${isUploading ? 'animate-pulse pointer-events-none' : ''}`}
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      </label>
                      <button
                        onClick={() => setSoundboard(soundboard.filter(s => s.id !== sfx.id))}
                        className="p-2 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
