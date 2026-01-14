import { socketService } from '../../../../services/socketService';
import { CursorMovePayload, CursorPressingPayload, ViewportUpdatePayload, GMForceViewPayload, ViewportRestorePayload } from '../../../../types/socket';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for player-related events
 * - player:join
 * - player:leave
 * - cursor:move
 * - viewport:update
 * - gm:force_view
 * - error
 */
export const registerPlayerListeners = (deps: ListenerDeps): ListenerCleanup => {
  const { setState, user, show, setViewport, stateRef, t } = deps;

  // Handler: player:join
  const handlePlayerJoin = (payload: { user: any; }) => {
    setState(previousState => {
      const playerExists = previousState.players.some(
        player => player.id === payload.user.id
      );

      if (playerExists) return previousState;

      return {
        ...previousState,
        players: [...previousState.players, payload.user]
      };
    });

    show({
      type: 'success',
      message: `${payload.user.name} entrou na sessão`,
      duration: 3000
    });

    // If I am the GM and Follow Mode is active, re-broadcast the permission so the new player (and others) get the correct state
    // This fixes the issue where refreshing players lose the Follow Mode state
    if (stateRef.current.isGM && stateRef.current.followMode.active) {
      console.log('[WS] Re-broadcasting Follow Mode for new player');
      socketService.emit('gm:toggle_follow', stateRef.current.followMode);
    }
  };

  // Handler: player:leave
  const handlePlayerLeave = (payload: { userId: string; userName?: string; }) => {
    // Find player name before removing from state
    const leavingPlayer = stateRef.current.players.find(p => p.id === payload.userId);
    const playerName = payload.userName || leavingPlayer?.name || 'Jogador';

    setState(previousState => ({
      ...previousState,
      players: previousState.players.filter(
        player => player.id !== payload.userId
      )
    }));

    // Immediate Cleanup for Visuals
    if (deps.remoteCursorsRef && deps.remoteCursorsRef.current) {
      if (deps.remoteCursorsRef.current[payload.userId]) {
        delete deps.remoteCursorsRef.current[payload.userId];
      }
    }

    // Direct Engine Cleanup (Import cursorEngine?) 
    // We can't import the specific instance of cursorEngine used in useMapRenderer here easily without context.
    // However, cleaning the Ref should stop useMapRenderer from ticking it.
    // AND useMapRenderer's loop is: Object.values(cursorsToRender).forEach...
    // cursorsToRender = remoteCursorsRef.current
    // So removing it from the ref STOPS the rendering loop for that user immediately.

    // Show notification for player leaving
    show({
      type: 'error',
      message: `${playerName} saiu da sessão`,
      duration: 3000
    });
  };

  // Debounce map to prevent duplicate notifications
  const notificationDebounce = new Map<string, number>();
  const NOTIFICATION_DEBOUNCE_MS = 5000; // 5 seconds between same-user notifications

  // Handler: cursor:move
  // PERFORMANCE FIX: Removed setState call. React reads from ref directly via animation loop.
  const handleCursorMove = (payload: CursorMovePayload) => {
    if (payload.userId === user?.id) return;

    // Direct ref update ONLY - no React state update to avoid main thread blocking
    if (deps.remoteCursorsRef) {
      const prev = deps.remoteCursorsRef.current[payload.userId];
      const now = Date.now();
      const lastNotification = notificationDebounce.get(payload.userId) || 0;

      // AFK Notification Logic with debounce
      if (payload.isAfk && (!prev || !prev.isAfk)) {
        // Only show if we have a name AND debounce passed
        if (payload.userName && (now - lastNotification > NOTIFICATION_DEBOUNCE_MS)) {
          notificationDebounce.set(payload.userId, now);
          show({
            type: 'warning',
            message: t('vtt.cursor.notifications.afk', { name: payload.userName }),
            duration: 3000
          });
        }
      } else if (!payload.isAfk && prev?.isAfk) {
        if (payload.userName && (now - lastNotification > NOTIFICATION_DEBOUNCE_MS)) {
          notificationDebounce.set(payload.userId, now);
          show({
            type: 'success',
            message: t('vtt.cursor.notifications.active', { name: payload.userName }),
            duration: 2000
          });
        }
      }

      deps.remoteCursorsRef.current[payload.userId] = payload;
    }

    // Player auto-discovery (rare event, so setState is ok here)
    // Only call setState if this is a NEW player we haven't seen before
    const isKnownPlayer = stateRef.current.players.some(p => p.id === payload.userId);
    if (!isKnownPlayer && payload.userName) {
      console.log('[PlayerListeners] Auto-discovering player from cursor:', payload.userId, payload.userName);
      setState(prev => ({
        ...prev,
        players: [...prev.players, {
          id: payload.userId,
          name: payload.userName,
          avatarUrl: undefined,
          email: ''
        }]
      }));
    }
  };

  // Handler: cursor:pressing (unthrottled click state for visual feedback)
  // PERFORMANCE FIX: Removed setState call. React reads from ref directly.
  const handleCursorPressing = (payload: CursorPressingPayload) => {
    if (!payload.userId || payload.userId === user?.id) return;

    // Direct ref update ONLY
    if (deps.remoteCursorsRef?.current[payload.userId]) {
      deps.remoteCursorsRef.current[payload.userId] = {
        ...deps.remoteCursorsRef.current[payload.userId],
        isClicking: payload.pressing
      };
    }
  };

  // Handler: me:afk_status (Server notifying my own AFK state)
  const handleMyAfkStatus = (payload: { status: 'active' | 'afk' | 'warning', timeLeft?: number; }) => {
    console.log('[PlayerListeners] Received me:afk_status:', payload);
    setState(prev => ({
      ...prev,
      afkStatus: payload.status,
      afkTimeLeft: payload.timeLeft
    }));
  };

  const handleViewportUpdate = (payload: ViewportUpdatePayload) => {
    if (payload.userId === user?.id) return;
    setState(prev => ({
      ...prev,
      remoteViewports: {
        ...prev.remoteViewports,
        [payload.userId || 'unknown']: { x: payload.x, y: payload.y, zoom: payload.zoom, w: payload.w, h: payload.h }
      }
    }));
  };

  const handleGMForceView = (payload: GMForceViewPayload) => {
    console.log('[WS] Received gm:force_view', payload);
    if (payload.targets && !payload.targets.includes(user?.id)) {
      console.log('[WS] Ignoring gm:force_view: not in targets', { userId: user?.id, targets: payload.targets });
      return;
    }

    if (setViewport) {
      const { centerX, centerY, zoom, x, y } = payload;
      let newX = x;
      let newY = y;

      // Prefer Center-based sync if available (handles screen size differences)
      if (centerX !== undefined && centerY !== undefined) {
        newX = (window.innerWidth / 2) - (centerX * zoom);
        newY = (window.innerHeight / 2) - (centerY * zoom);
      }

      setViewport({ x: newX, y: newY, zoom });

      // Trigger Pull View Notification
      setState(prev => ({ ...prev, pullNotification: true }));
      setTimeout(() => {
        setState(prev => ({ ...prev, pullNotification: false }));
      }, 4000);

      show({
        type: 'info',
        message: 'GM puxou sua visão',
        duration: 3000
      });
    }
  };

  const handleGMFollowModeChange = (payload: { active: boolean; targets: string[] | 'all'; }) => {
    console.log('[WS] Received gm:follow_mode_change', payload);

    // Check for changes to avoid spamming toast (e.g. when re-broadcasting on join)
    const wasActive = stateRef.current.followMode.active;
    const isChange = wasActive !== payload.active;

    setState(prev => ({ ...prev, followMode: payload }));

    // Check if I am affected
    const amIAffected = payload.active && (payload.targets === 'all' || (Array.isArray(payload.targets) && user?.id && payload.targets.includes(user.id)));

    if (isChange) {
      if (amIAffected) {
        show({ type: 'info', message: 'Modo Seguir Ativado: Você agora segue a visão do Mestre', duration: 4000 });
      } else if (payload.active) {
        // Mode active but not for me
      } else {
        show({ type: 'info', message: 'Modo Seguir Desativado', duration: 3000 });
      }
    }
  };

  const handleGMViewportSync = (payload: GMForceViewPayload) => {
    // If payload has targets, use them. Otherwise fallback to state (backward compatibility)
    // Actually, relying on payload is safer for stateless/late-join clients.
    const targets = payload.targets;

    // If no targets specified in payload, ignore (or check local state if we want hybrid, but payload is better)
    if (!targets) return;

    const amITarget = (targets as any) === 'all' || (Array.isArray(targets) && user?.id && targets.includes(user.id));
    if (!amITarget) return;

    // Silent update
    if (setViewport) {
      const { centerX, centerY, zoom, x, y } = payload;
      let newX = x;
      let newY = y;
      if (centerX !== undefined && centerY !== undefined) {
        newX = (window.innerWidth / 2) - (centerX * zoom);
        newY = (window.innerHeight / 2) - (centerY * zoom);
      }
      setViewport({ x: newX, y: newY, zoom });
    }
  };

  // Handler: error
  const handleError = (payload: { message: string; }) => {
    console.warn('[WS] Error received:', payload);
    show({
      type: 'error',
      message: payload.message || 'Erro desconhecido no servidor',
      duration: 5000
    });
  };

  // Handler: viewport:restore - Restore saved viewport on reconnect
  const handleViewportRestore = (payload: ViewportRestorePayload) => {
    console.log('[WS] Restoring saved viewport:', payload);
    if (setViewport && payload) {
      setViewport({ x: payload.x, y: payload.y, zoom: payload.zoom });
      show({
        type: 'success',
        message: 'Posição restaurada',
        duration: 2000
      });
    }
  };

  // Register listeners (Cleaned up duplicates)
  socketService.on('player:join', handlePlayerJoin);
  socketService.on('player:leave', handlePlayerLeave);
  socketService.on('cursor:move', handleCursorMove);
  socketService.on('cursor:pressing', handleCursorPressing);
  socketService.on('me:afk_status', handleMyAfkStatus);
  socketService.on('viewport:update', handleViewportUpdate);
  socketService.on('viewport:restore', handleViewportRestore);
  socketService.on('gm:force_view', handleGMForceView);
  socketService.on('gm:follow_mode_change', handleGMFollowModeChange);
  socketService.on('gm:viewport_sync', handleGMViewportSync);
  socketService.on('error', handleError);

  // Return cleanup function
  return () => {
    socketService.off('player:join', handlePlayerJoin);
    socketService.off('player:leave', handlePlayerLeave);
    socketService.off('cursor:move', handleCursorMove);
    socketService.off('cursor:pressing', handleCursorPressing);
    socketService.off('viewport:update', handleViewportUpdate);
    socketService.off('viewport:restore', handleViewportRestore);
    socketService.off('gm:force_view', handleGMForceView);
    socketService.off('gm:follow_mode_change', handleGMFollowModeChange);
    socketService.off('gm:viewport_sync', handleGMViewportSync);
    socketService.off('error', handleError);
  };
};
