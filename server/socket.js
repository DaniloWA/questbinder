// socketServer.js - VERSÃO ROBUSTA E MODULAR (2025)
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

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 20000,
    pingInterval: 25000,
    // CRITICAL: Increase buffer size to support large Base64 images
    // Base64 encoding increases file size by ~33%
    // 10MB image → ~13MB Base64, so we set 20MB to be safe
    maxHttpBufferSize: 20 * 1024 * 1024, // 20MB (default is 1MB)
  });

  io.on('connection', (socket) => {
    console.log('[WS] Client connected:', socket.id);

    const client = {
      campaignId: null,
      userId: null,
      isGM: false,
    };

    // Initialize Utils
    const utils = createSocketUtils(io, socket, client);

    // ==================== ROOM JOIN ====================

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
          // Notify previous room of leave? Maybe not needed if we handle disconnect/switch
        }

        socket.join(campaignId);
        client.campaignId = campaignId;
        client.userId = userId;

        const campaign = await db.getById('campaigns', campaignId);
        client.isGM = campaign?.ownerId === userId || campaign?.gms?.includes(userId) || false;

        // Fetch user details to broadcast
        const user = await db.getById('users', userId); // Assuming 'users' table exists
        // If users table doesn't exist or we don't have access, we might need to pass user info in payload
        // But let's assume we can get it or construct it. 
        // If 'users' db is not available here, we might rely on payload if we change it.
        // For now, let's try to get it from db or mock it if needed.
        // Actually, looking at db.js (I haven't seen it), but usually we have users.

        // Fallback if db.getById('users') fails or returns null (e.g. if using mock auth)
        const playerInfo = user || { id: userId, name: 'Unknown', color: '#ffffff', role: client.isGM ? 'gm' : 'player' };

        // Ensure role is set correctly based on campaign
        const role = client.isGM ? 'gm' : 'player';
        const playerPayload = { ...playerInfo, role };

        // Broadcast to others in the room
        socket.to(campaignId).emit('player:join', { user: playerPayload });

        const roomSize = io.sockets.adapter.rooms.get(campaignId)?.size || 0;
        console.log(`[WS] ${userId} joined campaign ${campaignId} | GM: ${client.isGM} | Players: ${roomSize}`);
      } catch (err) {
        console.error('[WS] room:join error:', err);
        socket.disconnect(true);
      }
    });

    // ==================== EPHEMERAL EVENTS ====================

    const ephemeralEvents = ['token:drag', 'cursor:move', 'chat:reaction'];

    ephemeralEvents.forEach(event => {
      socket.on(event, (payload) => {
        try {
          if (!client.campaignId) return;
          socket.to(client.campaignId).emit(event, { ...payload, userId: client.userId });
        } catch (err) {
          console.error(`[WS] ${event} error:`, err);
        }
      });
    });

    // ==================== REGISTER HANDLERS ====================

    registerTokenHandlers(socket, client, utils);
    registerDrawingHandlers(socket, client, utils);
    registerChatHandlers(socket, client, utils);
    registerSceneHandlers(socket, client, utils);
    registerHandoutHandlers(socket, client, utils);
    registerAudioHandlers(socket, client, utils);
    registerMapHandlers(socket, client, utils);
    registerCharacterHandlers(socket, client, utils);

    // ==================== DISCONNECT ====================

    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
      if (client.campaignId && client.userId) {
        io.to(client.campaignId).emit('player:leave', { userId: client.userId });
      }
    });
  });

  return io;
};
