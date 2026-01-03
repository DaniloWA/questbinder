import * as db from '../../db.js';

export const registerAudioHandlers = (socket, client, utils) => {
  console.log('[audio] handlers registered');
  const { requireGM, safeBroadcast } = utils;

  // Audio events are ephemeral (no DB persistence needed for play/pause state usually)
  // But we broadcast them to everyone in the room

  socket.on('audio:play', requireGM((payload) => {
    console.log('[audio:play] Broadcasting music play:', payload.url);
    safeBroadcast('audio:play', payload);
  }));

  socket.on('audio:pause', requireGM(() => {
    console.log('[audio:pause] Broadcasting music pause');
    safeBroadcast('audio:pause', {});
  }));

  socket.on('audio:stop', requireGM(() => {
    console.log('[audio:stop] Broadcasting stop all audio');
    safeBroadcast('audio:stop', {});
  }));

  socket.on('audio:sfx', requireGM((payload) => {
    console.log('[audio:sfx] Broadcasting SFX toggle:', payload.url, payload.action);
    safeBroadcast('audio:sfx', payload);
  }));
};

