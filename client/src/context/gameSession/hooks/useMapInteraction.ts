import React from 'react';
import { GameSessionState, BooleanPermissionKey } from '../types';
import { socketService } from '../../../services/socketService';
import { Ping, Viewport } from '../../../types';

export const useMapInteraction = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  user: any,
  permissionHelper?: any // REGRA MILENAR
) => {
  const setViewport = (v: Partial<Viewport>) => setState(prev => ({ ...prev, viewport: { ...prev.viewport, ...v } }));

  const addPing = (x: number, y: number) => {
    if (!user) return;
    // REGRA MILENAR: Use PermissionHelper
    const canPing = permissionHelper ? permissionHelper.canAsGMOr('pingMap') : false;
    if (!canPing) return;

    // Use cursor settings with GM overrides check
    const override = (state.permissions?.cursorOverrides?.[user.id] || {}) as any;
    const cursorSettings = state.cursorSettings;

    const pingColor = override.pingColor || override.color || cursorSettings?.pingColor || cursorSettings?.color || '#fbbf24';
    const pingAnimation = override.pingAnimation || cursorSettings?.pingAnimation || 'radar';
    const displayName = override.name || cursorSettings?.name || user.name;

    const newPing: Ping = {
      id: Math.random().toString(36).substr(2, 9),
      x, y,
      color: pingColor,
      createdAt: Date.now(),
      userId: user.id,
      userName: displayName,
      animationStyle: pingAnimation
    };

    setState(prev => ({ ...prev, pings: [...prev.pings, newPing] }));
    socketService.emit('map:ping', {
      x, y,
      color: newPing.color,
      userId: user.id,
      userName: displayName,
      animationStyle: pingAnimation
    });

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
