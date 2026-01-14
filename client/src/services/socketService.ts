import { io, Socket } from 'socket.io-client';
import { SocketEventMap } from '../types/socket';

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
    // Use env variable, or derive from current location (for production same-origin)
    const wsUrl = import.meta.env.VITE_WS_URL || window.location.origin || 'http://localhost:3001';
    const reconnectionAttempts = import.meta.env.VITE_WS_RECONNECTION_ATTEMPTS === 'Infinity'
      ? Infinity
      : parseInt(import.meta.env.VITE_WS_RECONNECTION_ATTEMPTS || '10');
    const reconnectionDelay = parseInt(import.meta.env.VITE_WS_RECONNECTION_DELAY || '1000');
    const reconnectionDelayMax = parseInt(import.meta.env.VITE_WS_RECONNECTION_DELAY_MAX || '5000');

    console.log('[WS] Connecting to:', wsUrl);

    this.socket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts,
      reconnectionDelay,
      reconnectionDelayMax,
    });

    return new Promise((resolve) => {
      this.socket?.on('connect', () => {
        console.log('[WS] Connected to Server');
        if (this.userId && this.campaignId) {
          this.socket?.emit('room:join', { userId: this.userId, campaignId: this.campaignId });
        }

        if (this.queue.length > 0) {
          this.queue.forEach(({ event, payload }) => {
            this.socket?.emit(event, payload);
          });
          this.queue = [];
        }

        resolve(true);
      });

      this.socket?.onAny((event, ...args) => {
        if (event !== 'cursor:move' && event !== 'token:drag') {
          console.log(`[WS] Listener received: ${event}`, args);
        }
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
    if (!this.socket || !this.socket.connected) {
      this.queue.push({ event, payload });
      return;
    }
    if (event != 'cursor:move' && event != 'token:drag' && event != 'cursor:keep_alive') {
      console.log('[WS] Emitting:', event, payload);
    }
    this.socket.emit(event, payload);
  }
}

export const socketService = new RealSocketService();