/**
 * SmartSync - Connection Manager
 * 
 * Manages connection state and provides reactive connection status.
 */

import { socketService } from '../socketService';

// =============================================================================
// CONNECTION STATE
// =============================================================================

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface ConnectionStatus {
  state: ConnectionState;
  lastConnected: number | null;
  lastDisconnected: number | null;
  reconnectAttempts: number;
  latency: number;
  error?: string;
}

// =============================================================================
// CONNECTION MANAGER
// =============================================================================

type ConnectionListener = (status: ConnectionStatus) => void;

/**
 * ConnectionManager - Tracks connection state and provides reactive updates.
 */
export class ConnectionManager {
  private status: ConnectionStatus = {
    state: 'disconnected',
    lastConnected: null,
    lastDisconnected: null,
    reconnectAttempts: 0,
    latency: 0,
  };

  private listeners: Set<ConnectionListener> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime: number = 0;

  constructor() {
    this.setupSocketListeners();
  }

  /**
   * Setup socket event listeners for connection state.
   */
  private setupSocketListeners(): void {
    const socket = socketService as any;

    socket.on?.('connect', () => {
      this.updateStatus({
        state: 'connected',
        lastConnected: Date.now(),
        reconnectAttempts: 0,
        error: undefined,
      });
      this.startPingInterval();
    });

    socket.on?.('disconnect', (reason: string) => {
      this.updateStatus({
        state: 'disconnected',
        lastDisconnected: Date.now(),
        error: reason,
      });
      this.stopPingInterval();
    });

    socket.on?.('connect_error', (error: Error) => {
      this.updateStatus({
        state: 'error',
        error: error.message,
        reconnectAttempts: this.status.reconnectAttempts + 1,
      });
    });

    socket.on?.('reconnecting', () => {
      this.updateStatus({
        state: 'reconnecting',
        reconnectAttempts: this.status.reconnectAttempts + 1,
      });
    });
  }

  /**
   * Start ping interval for latency measurement.
   */
  private startPingInterval(): void {
    this.stopPingInterval();

    this.pingInterval = setInterval(() => {
      this.measureLatency();
    }, 5000);
  }

  /**
   * Stop ping interval.
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Measure current latency using cursor keep-alive as proxy.
   */
  private measureLatency(): void {
    const now = Date.now();
    this.lastPingTime = now;

    // Use cursor:keep_alive as a ping proxy
    (socketService as any).emit?.('cursor:keep_alive');

    // Estimate latency based on last successful message (simplified)
    // In production, you'd use actual ping/pong
    const estimatedLatency = Math.max(0, Date.now() - this.lastPingTime);
    this.updateStatus({ latency: estimatedLatency });
  }

  /**
   * Update connection status and notify listeners.
   */
  private updateStatus(partial: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...partial };
    this.notifyListeners();
  }

  /**
   * Notify all listeners of status change.
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getStatus());
      } catch (e) {
        console.error('[ConnectionManager] Listener error:', e);
      }
    }
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Get current connection status.
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Check if currently connected.
   */
  isConnected(): boolean {
    return this.status.state === 'connected';
  }

  /**
   * Subscribe to connection status changes.
   */
  subscribe(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    // Immediately notify of current state
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  /**
   * Wait for connection with timeout.
   */
  waitForConnection(timeoutMs: number = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isConnected()) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.subscribe((status) => {
        if (status.state === 'connected') {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Debug log connection state.
   */
  debug(): void {
    console.log('[ConnectionManager]', this.status);
  }
}

// Export singleton
export const connectionManager = new ConnectionManager();
