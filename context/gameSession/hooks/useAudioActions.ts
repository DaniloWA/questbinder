import React from 'react';
import { GameSessionState } from '../types';
import { campaignService } from '../../../services/campaignService';
import { socketService } from '../../../services/socketService';
import { Playlist, SoundEffect, AudioZone } from '../../../types';

export const useAudioActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  campaignId: string,
  show: (notification: any) => void
) => {
  const updateAudioSettings = (settings: { playlists: Playlist[], soundboard: SoundEffect[]; }) => {
    setState(prev => ({ ...prev, audioSettings: settings }));
    campaignService.update(campaignId, { audioSettings: settings });
    socketService.emit('campaign:update', { changes: { audioSettings: settings } });
    show({ type: 'success', message: 'Áudio sincronizado com o grupo.' });
  };

  const addAudioZones = (zones: Omit<AudioZone, 'id'>[]) => {
    if (!state.activeSceneId) return;
    const newZones: AudioZone[] = zones.map(z => ({ ...z, id: Math.random().toString(36).substr(2, 9) }));
    const updatedScenes = state.scenes.map(s => s.id === state.activeSceneId ? {
      ...s,
      audioZones: [...(s.audioZones || []), ...newZones]
    } : s);
    setState(prev => ({ ...prev, scenes: updatedScenes }));

    campaignService.update(campaignId, { scenes: updatedScenes });
    socketService.emit('scene:update', { id: state.activeSceneId, changes: { audioZones: updatedScenes.find(s => s.id === state.activeSceneId)?.audioZones } });
  };

  const updateAudioZone = (id: string, data: Partial<AudioZone>) => {
    if (!state.activeSceneId) return;
    const updatedScenes = state.scenes.map(s => s.id === state.activeSceneId ? {
      ...s,
      audioZones: (s.audioZones || []).map(z => z.id === id ? { ...z, ...data } : z)
    } : s);
    setState(prev => ({ ...prev, scenes: updatedScenes }));

    campaignService.update(campaignId, { scenes: updatedScenes });
    socketService.emit('scene:update', { id: state.activeSceneId, changes: { audioZones: updatedScenes.find(s => s.id === state.activeSceneId)?.audioZones } });
  };

  const removeAudioZone = (id: string) => {
    if (!state.activeSceneId) return;
    const updatedScenes = state.scenes.map(s => s.id === state.activeSceneId ? {
      ...s,
      audioZones: (s.audioZones || []).filter(z => z.id !== id)
    } : s);
    setState(prev => ({ ...prev, scenes: updatedScenes }));

    campaignService.update(campaignId, { scenes: updatedScenes });
    socketService.emit('scene:update', { id: state.activeSceneId, changes: { audioZones: updatedScenes.find(s => s.id === state.activeSceneId)?.audioZones } });
  };

  return {
    updateAudioSettings,
    addAudioZones,
    updateAudioZone,
    removeAudioZone
  };
};
