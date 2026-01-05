
import { Server } from 'socket.io';
import * as db from './db.js';
import { createSocketUtils, validatePayload } from './socket/utils.js';
import { registerTokenHandlers } from './socket/handlers/tokenHandlers.js';
import { registerDrawingHandlers } from './socket/handlers/drawingHandlers.js';
import { registerChatHandlers } from './socket/handlers/chatHandlers.js';
import { registerSceneHandlers } from './socket/handlers/sceneHandlers.js';
import { registerHandoutHandlers } from './socket/handlers/handoutHandlers.js';
import { registerAudioHandlers } from './socket/handlers/audioHandlers.js';
import { registerMapHandlers } from './socket/handlers/mapHandlers.js';
import { registerCharacterHandlers } from './socket/handlers/characterHandlers.js';
import { registerCombatHandlers } from './socket/handlers/combatHandlers.js';
import { registerPermissionsHandlers } from './socket/handlers/permissionsHandlers.js';
import { registerAttackZoneHandlers } from './socket/handlers/attackZoneHandlers.js';

// In-memory store for player viewports: Map<campaignId, Map<userId, viewport>>
const playerViewports = new Map();

export const setupSocket = (server) => {
  const corsOrigins = [
    process.env.CORS_ORIGIN_1 || 'http://localhost:5173',
    process.env.CORS_ORIGIN_2 || 'http://127.0.0.1:5173'
  ];

  const io = new Server(server, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '20000'),
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000'),
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000'),
    maxHttpBufferSize: parseInt(process.env.WS_MAX_HTTP_BUFFER_SIZE || '20971520'), // 20MB
  });

  io.on('connection', (socket) => {
    console.log('[WS] Client connected:', socket.id);

    const client = {
      campaignId: null,
      userId: null,
      isGM: false,
      lastViewport: null, // Track last known viewport for this client
    };

    const utils = createSocketUtils(io, socket, client);

    // Log all incoming events
    socket.onAny((event, ...args) => {
      if (!ephemeralEvents.includes(event)) {
        console.log(`[WS] Listener received: ${event}`, args);
      }
    });



    socket.on('room:join', async (payload) => {
      try {
        const validation = validatePayload(payload, ['campaignId', 'userId']);
        if (!validation.valid) {
          console.warn('[WS] room:join validation failed:', validation.error);
          return socket.disconnect(true);
        }

        const { campaignId, userId } = payload;

        if (client.campaignId && client.campaignId !== campaignId) {
          socket.leave(client.campaignId);
        }

        socket.join(campaignId);
        client.campaignId = campaignId;
        client.userId = userId;

        const campaign = await db.getById('campaigns', campaignId);
        client.isGM = campaign?.ownerId === userId || campaign?.gms?.includes(userId) || false;

        const user = await db.getById('users', userId);
        const playerInfo = user || { id: userId, name: 'Unknown', color: '#ffffff', role: client.isGM ? 'gm' : 'player' };

        client.userName = playerInfo.name || 'Unknown';

        const role = client.isGM ? 'gm' : 'player';
        const playerPayload = { ...playerInfo, role };

        socket.to(campaignId).emit('player:join', { user: playerPayload });

        // Check for saved viewport and restore if exists
        const campaignViewports = playerViewports.get(campaignId);
        if (campaignViewports && campaignViewports.has(userId)) {
          const savedViewport = campaignViewports.get(userId);
          console.log(`[WS] Restoring viewport for ${userId}:`, savedViewport);
          socket.emit('viewport:restore', savedViewport);
        }

        const roomSize = io.sockets.adapter.rooms.get(campaignId)?.size || 0;
        console.log(`[WS] ${userId} joined campaign ${campaignId} | GM: ${client.isGM} | Players: ${roomSize}`);
      } catch (err) {
        console.error('[WS] room:join error:', err);
        socket.disconnect(true);
      }
    });



    const ephemeralEvents = ['token:drag', 'cursor:move', 'chat:reaction', 'cursor:click', 'viewport:update'];

    ephemeralEvents.forEach(event => {
      socket.on(event, (payload) => {
        try {
          if (!client.campaignId) return;

          // Track viewport updates for persistence
          if (event === 'viewport:update' && payload) {
            client.lastViewport = {
              x: payload.x,
              y: payload.y,
              zoom: payload.zoom,
              sceneId: payload.sceneId
            };
          }

          socket.to(client.campaignId).emit(event, { ...payload, userId: client.userId });
        } catch (err) {
          console.error(`[WS] ${event} error:`, err);
        }
      });
    });

    socket.on('gm:pull_view', (payload) => {
      console.log('[WS] Received gm:pull_view', { userId: client.userId, isGM: client.isGM, campaignId: client.campaignId, payload });

      if (!client.isGM) {
        console.warn('[WS] gm:pull_view rejected: User is not GM');
        return;
      }
      if (!client.campaignId) {
        console.warn('[WS] gm:pull_view rejected: No campaignId');
        return;
      }

      const { targetId, x, y, centerX, centerY, zoom } = payload;
      const forcePayload = { x, y, centerX, centerY, zoom };

      console.log(`[WS] Re-emitting gm:force_view to ${targetId === 'all' ? 'all' : 'targets'}`);

      if (targetId === 'all') {
        socket.to(client.campaignId).emit('gm:force_view', forcePayload);
      } else if (Array.isArray(targetId)) {
        socket.to(client.campaignId).emit('gm:force_view', { ...forcePayload, targets: targetId });
      } else {
        socket.to(client.campaignId).emit('gm:force_view', { ...forcePayload, targets: [targetId] });
      }
    });

    // Follow Mode Events
    socket.on('gm:toggle_follow', (payload) => {
      // payload: { active: boolean, targets: string[] | 'all' }
      if (!client.isGM) return;

      const { active, targets } = payload;
      // Emit to everyone so they know the mode status (for indicators)
      io.to(client.campaignId).emit('gm:follow_mode_change', { active, targets });
    });

    socket.on('gm:sync_view', (payload) => {
      // payload: { x, y, zoom, w, h, targets? } - actually targets should probably be stored in server state or passed every time?
      // For simplicity, let's assume the GM client passes the targets in the sync payload OR we broadcast to all and clients decide.
      // BUT, efficient networking suggests sending only to relevant.
      // HOWEVER, the `gm:toggle_follow` just updates state. The `gm:sync_view` is the continuous stream.
      // Let's modify the client to send `targets` in `gm:sync_view` too, or just broadcast to room and let clients filter.
      // Broadcasting to room is easiest for now. Clients can check if they are in the target list (which they know from gm:follow_mode_change).
      if (!client.isGM) return;

      socket.to(client.campaignId).emit('gm:viewport_sync', payload);
    });

    socket.on('gm:pull_view', (payload) => {
      console.log('[WS] Received gm:pull_view', { userId: client.userId, isGM: client.isGM, campaignId: client.campaignId, payload });

      if (!client.isGM) {
        console.warn('[WS] gm:pull_view rejected: User is not GM');
        return;
      }
      if (!client.campaignId) {
        console.warn('[WS] gm:pull_view rejected: No campaignId');
        return;
      }

      const { targetId, x, y, centerX, centerY, zoom } = payload;
      const forcePayload = { x, y, centerX, centerY, zoom };

      console.log(`[WS] Re-emitting gm:force_view to ${targetId === 'all' ? 'all' : 'targets'}`);

      if (targetId === 'all') {
        socket.to(client.campaignId).emit('gm:force_view', forcePayload);
      } else if (Array.isArray(targetId)) {
        socket.to(client.campaignId).emit('gm:force_view', { ...forcePayload, targets: targetId });
      } else {
        socket.to(client.campaignId).emit('gm:force_view', { ...forcePayload, targets: [targetId] });
      }
    });

    registerTokenHandlers(socket, client, utils);
    registerDrawingHandlers(socket, client, utils);
    registerChatHandlers(socket, client, utils);
    registerSceneHandlers(socket, client, utils);
    registerHandoutHandlers(socket, client, utils);
    registerAudioHandlers(socket, client, utils);
    registerMapHandlers(socket, client, utils);
    registerCharacterHandlers(socket, client, utils);
    registerCombatHandlers(socket, client, utils);
    registerPermissionsHandlers(socket, client, utils);
    registerAttackZoneHandlers(socket, client, utils);

    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
      if (client.campaignId && client.userId) {
        // Save viewport for later restoration
        if (client.lastViewport) {
          if (!playerViewports.has(client.campaignId)) {
            playerViewports.set(client.campaignId, new Map());
          }
          playerViewports.get(client.campaignId).set(client.userId, client.lastViewport);
          console.log(`[WS] Saved viewport for ${client.userId}:`, client.lastViewport);
        }

        // Emit leave with user name for notification
        io.to(client.campaignId).emit('player:leave', {
          userId: client.userId,
          userName: client.userName || 'Jogador'
        });
      }
    });
  });

  return io;
};
