import { socketService } from '../../../../services/socketService';
import { audioService } from '../../../../services/audioService';
import { AudioPlayPayload } from '../../../../types';
import { ListenerDeps, ListenerCleanup } from './types';


export const registerAudioListeners = ({
  state,
  show
}: ListenerDeps): ListenerCleanup => {

  const handleAudioPlay = (payload: AudioPlayPayload) => {
    if (!payload.url) return;

    audioService.playMusic(payload.url, payload.loop ?? true, payload.volume);

    if (!state.isGM) {
      show({
        type: 'info',
        message: '🎵 Mestre iniciou uma música',
        duration: 2000
      });
    }
  };

  const handleAudioPause = () => {
    audioService.pauseMusic();
  };

  const handleAudioStop = () => {
    audioService.stopMusic();
  };

  const handleAudioSfx = (payload: { url: string; action: 'start' | 'stop'; }) => {

    const isSfxCurrentlyLooping = audioService.getLoopingSfx().has(payload.url);
    const shouldStartSfx = payload.action === 'start' && !isSfxCurrentlyLooping;
    const shouldStopSfx = payload.action === 'stop' && isSfxCurrentlyLooping;

    if (shouldStartSfx) {
      audioService.toggleSfxLoop(payload.url);

      if (!state.isGM) {
        show({
          type: 'info',
          message: '🔊 Mestre ativou um efeito sonoro',
          duration: 2000
        });
      }
    } else if (shouldStopSfx) {
      audioService.toggleSfxLoop(payload.url);
    }
  };


  socketService.on('audio:play', handleAudioPlay);
  socketService.on('audio:pause', handleAudioPause);
  socketService.on('audio:stop', handleAudioStop);
  socketService.on('audio:sfx', handleAudioSfx);


  return () => {
    socketService.off('audio:play', handleAudioPlay);
    socketService.off('audio:pause', handleAudioPause);
    socketService.off('audio:stop', handleAudioStop);
    socketService.off('audio:sfx', handleAudioSfx);
  };
};
