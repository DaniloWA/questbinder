import React from 'react';
import { GameSessionState, BooleanPermissionKey } from '../types';
import { socketService } from '../../../services/socketService';
import { Ping, Viewport } from '../../../types';

export const useMapInteraction = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  user: any,
  checkPermission: (perm: BooleanPermissionKey) => boolean
) => {
  const setViewport = (v: Partial<Viewport>) => setState(prev => ({ ...prev, viewport: { ...prev.viewport, ...v } }));

  const addPing = (x: number, y: number) => {
    if (!user) return;
    if (!state.isGM && !checkPermission('pingMap')) return;
    const newPing: Ping = {
      id: Math.random().toString(36).substr(2, 9),
      x, y,
      color: '#fbbf24',
      createdAt: Date.now(),
      userId: user.id
    };

    setState(prev => ({ ...prev, pings: [...prev.pings, newPing] }));
    socketService.emit('map:ping', { x, y, color: newPing.color, userId: user.id });

    setTimeout(() => {
      setState(prev => ({ ...prev, pings: prev.pings.filter(p => p.id !== newPing.id) }));
    }, 3000);
  };

  const setRulerSettings = (settings: any) => {
    setState(prev => ({ ...prev, rulerSettings: settings }));
  };

  return {
    setViewport,
    addPing,
    setRulerSettings
  };
};
