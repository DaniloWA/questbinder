import { io, Socket } from 'socket.io-client';
import { SocketEventType, SocketEventMap } from '../types/socket';

class RealSocketService {
  private socket: Socket | null = null;
  private queue: { event: string; payload: any; }[] = [];
  private userId: string | null = null;
  private campaignId: string | null = null;

  public connect(userId: string, campaignId: string): Promise<boolean> {
    this.userId = userId;
    this.campaignId = campaignId;

    // If socket exists (connected or connecting), just join room
    if (this.socket) {
      if (this.socket.connected) {
        this.socket.emit('room:join', { userId, campaignId });
        return Promise.resolve(true);
      }
      return Promise.resolve(true);
    }

    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    return new Promise((resolve) => {
      this.socket?.on('connect', () => {
        console.log('[WS] Connected to Server');
        if (this.userId && this.campaignId) {
          console.log('[WS] Emitting room:join with:', { userId: this.userId, campaignId: this.campaignId });
          this.socket?.emit('room:join', { userId: this.userId, campaignId: this.campaignId });
        }

        // Flush queue
        if (this.queue.length > 0) {
          console.log(`[WS] Flushing ${this.queue.length} queued events...`);
          this.queue.forEach(({ event, payload }) => {
            this.socket?.emit(event, payload);
          });
          this.queue = [];
        }

        resolve(true);
      });

      this.socket?.on('connect_error', (err) => {
        console.error('[WS] Connection Error:', err);
      });

      this.socket?.on('disconnect', (reason) => {
        console.warn('[WS] Disconnected:', reason);
      });
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[WS] Disconnected');
    }
  }

  public on<K extends keyof SocketEventMap>(event: K, handler: (payload: SocketEventMap[K]) => void) {
    if (!this.socket) return;
    this.socket.on(event, handler as any);
  }

  public off<K extends keyof SocketEventMap>(event: K, handler: (payload: SocketEventMap[K]) => void) {
    if (!this.socket) return;
    this.socket.off(event, handler as any);
  }

  public emit<K extends keyof SocketEventMap>(event: K, payload?: SocketEventMap[K]) {
    if (event != 'cursor:move') {
      console.log('[SOCKET] emit called:', event, payload);
    }

    if (!this.socket || !this.socket.connected) {
      console.warn(`[WS] Socket not connected. Queueing event: ${event}`);
      this.queue.push({ event, payload });
      return;
    }

    if (event != 'cursor:move') {
      console.log('[SOCKET] Emitting to server:', event);
    }

    this.socket.emit(event, payload);
  }
}

export const socketService = new RealSocketService();