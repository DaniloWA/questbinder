import React from 'react';
import { GameSessionState, BooleanPermissionKey } from '../types';
import { socketService } from '../../../services/socketService';
import { Ping, Viewport } from '../../../types';
import { smartSync } from '../../../services/sync';

export const useMapInteraction = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>,
  user: any,
  permissionHelper?: any // REGRA MILENAR
) => {
  const setViewport = (v: Partial<Viewport>) => setState(prev => ({ ...prev, viewport: { ...prev.viewport, ...v } }));

  // Broadcast viewport changes
  React.useEffect(() => {
    if (!state.isConnected || !user) return;

    const handler = setTimeout(() => {
      socketService.emit('viewport:update', {
        x: state.viewport.x,
        y: state.viewport.y,
        zoom: state.viewport.zoom,
        w: window.innerWidth,
        h: window.innerHeight
      });
    }, 100); // 100ms debounce


    return () => clearTimeout(handler);
  }, [state.viewport, state.isConnected, user]);

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

  const pullView = (targetId: string | 'all', panX: number, panY: number, zoom: number) => {
    if (!state.isGM) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const centerX = (-panX + w / 2) / zoom;
    const centerY = (-panY + h / 2) / zoom;
    socketService.emit('gm:pull_view', { targetId, centerX, centerY, zoom });
  };

  const toggleFollowMode = (active: boolean, targets: string[] | 'all' = 'all') => {
    if (!permissionHelper?.isGameMaster()) return;
    setState(prev => ({ ...prev, followMode: { active, targets } }));
    socketService.emit('gm:toggle_follow', { active, targets });
  };

  // React to viewport changes for Follow Mode
  React.useEffect(() => {
    if (!state.isGM || !state.isConnected || !state.followMode?.active) return;

    socketService.emit('gm:sync_view', {
      centerX: (-state.viewport.x + window.innerWidth / 2) / state.viewport.zoom,
      centerY: (-state.viewport.y + window.innerHeight / 2) / state.viewport.zoom,
      zoom: state.viewport.zoom,
      x: state.viewport.x,
      y: state.viewport.y,
      w: window.innerWidth,
      h: window.innerHeight,
      targets: state.followMode.targets // Include targets in sync payload
    });
  }, [state.viewport, state.followMode, state.isGM, state.isConnected]);

  const setWandSettings = (settings: any) => {
    setState(prev => ({ ...prev, wandSettings: settings }));
  };

  return {
    setViewport,
    addPing,
    setRulerSettings,
    setWandSettings,
    pullView,
    toggleFollowMode
  };
};
