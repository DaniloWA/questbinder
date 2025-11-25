import { socketService } from '../../../../services/socketService';
import { audioService } from '../../../../services/audioService';
import { AudioPlayPayload } from '../../../../types';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for audio-related events
 * - audio:play
 * - audio:pause
 * - audio:stop
 * - audio:sfx
 */
export const registerAudioListeners = ({
  state,
  show
}: ListenerDeps): ListenerCleanup => {

  // Handler: audio:play
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

  // Handler: audio:pause
  const handleAudioPause = () => {
    audioService.pauseMusic();
  };

  // Handler: audio:stop
  const handleAudioStop = () => {
    audioService.stopMusic();
  };

  // Handler: audio:sfx
  const handleAudioSfx = (payload: { url: string; action: 'start' | 'stop'; }) => {
    console.log('[WS] Received audio:sfx:', payload.url, payload.action);

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

  // Register listeners
  socketService.on('audio:play', handleAudioPlay);
  socketService.on('audio:pause', handleAudioPause);
  socketService.on('audio:stop', handleAudioStop);
  socketService.on('audio:sfx', handleAudioSfx);

  // Return cleanup function
  return () => {
    socketService.off('audio:play', handleAudioPlay);
    socketService.off('audio:pause', handleAudioPause);
    socketService.off('audio:stop', handleAudioStop);
    socketService.off('audio:sfx', handleAudioSfx);
  };
};
