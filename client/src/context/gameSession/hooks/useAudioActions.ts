import React from 'react';
import { GameSessionState } from '../types';
import { Playlist, SoundEffect, AudioZone } from '../../../types';
import { smartSync } from '../../../services/sync';

export const useAudioActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>, // Kept for signature compatibility if needed, but unused for logic
  campaignId: string,
  show: (notification: any) => void
) => {
  const updateAudioSettings = (settings: { playlists: Playlist[], soundboard: SoundEffect[]; }) => {
    // SmartSync handles Optimistic Update + Server Sync + Persistence
    smartSync.apply('campaign', campaignId, 'update', { audioSettings: settings });
    show({ type: 'success', message: 'Áudio sincronizado com o grupo.' });
  };

  const addAudioZones = (zones: Omit<AudioZone, 'id'>[]) => {
    if (!state.activeSceneId) return;
    const currentScene = state.scenes.find(s => s.id === state.activeSceneId);
    if (!currentScene) return;

    const newZones: AudioZone[] = zones.map(z => ({ ...z, id: Math.random().toString(36).substr(2, 9) }));
    const updatedAudioZones = [...(currentScene.audioZones || []), ...newZones];

    smartSync.apply('scene', state.activeSceneId, 'update', { audioZones: updatedAudioZones });
  };

  const updateAudioZone = (id: string, data: Partial<AudioZone>) => {
    if (!state.activeSceneId) return;
    const currentScene = state.scenes.find(s => s.id === state.activeSceneId);
    if (!currentScene) return;

    const updatedAudioZones = (currentScene.audioZones || []).map(z => z.id === id ? { ...z, ...data } : z);

    smartSync.apply('scene', state.activeSceneId, 'update', { audioZones: updatedAudioZones });
  };

  const removeAudioZone = (id: string) => {
    if (!state.activeSceneId) return;
    const currentScene = state.scenes.find(s => s.id === state.activeSceneId);
    if (!currentScene) return;

    const updatedAudioZones = (currentScene.audioZones || []).filter(z => z.id !== id);

    smartSync.apply('scene', state.activeSceneId, 'update', { audioZones: updatedAudioZones });
  };

  return {
    updateAudioSettings,
    addAudioZones,
    updateAudioZone,
    removeAudioZone
  };
};
