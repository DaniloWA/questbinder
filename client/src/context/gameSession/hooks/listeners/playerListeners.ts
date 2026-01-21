import { socketService } from '../../../../services/socketService';
import { CursorMovePayload, CursorPressingPayload, ViewportUpdatePayload, GMForceViewPayload, ViewportRestorePayload } from '../../../../types/socket';
import { notifySmartSync } from '../../syncHelpers';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for player-related events.
 * Updates React state AND notifies SmartSync cache for player entities.
 */
export const registerPlayerListeners = (deps: ListenerDeps): ListenerCleanup => {
  const { setState, user, show, setViewport, stateRef, t } = deps;

  // Handler: player:join
  const handlePlayerJoin = (payload: { user: any; }) => {
    // Notify SmartSync
    notifySmartSync({
      entityType: 'player',
      entityId: payload.user.id,
      changeType: 'create',
      data: payload.user
    });

    show({
      type: 'success',
      message: `${payload.user.name} entrou na sessão`,
      duration: 3000
    });

    // Re-broadcast Follow Mode for new player
    if (stateRef.current.isGM && stateRef.current.followMode.active) {
      socketService.emit('gm:toggle_follow', stateRef.current.followMode);
    }
  };

  // Handler: player:leave
  const handlePlayerLeave = (payload: { userId: string; userName?: string; }) => {
    const leavingPlayer = stateRef.current.players.find(p => p.id === payload.userId);
    const playerName = payload.userName || leavingPlayer?.name || 'Jogador';

    // Notify SmartSync
    notifySmartSync({
      entityType: 'player',
      entityId: payload.userId,
      changeType: 'delete',
      data: {}
    });

    // Immediate cleanup for cursor visuals (Ephemeral)
    if (deps.remoteCursorsRef?.current?.[payload.userId]) {
      delete deps.remoteCursorsRef.current[payload.userId];
    }

    show({
      type: 'error',
      message: `${playerName} saiu da sessão`,
      duration: 3000
    });
  };

  // Debounce for notifications
  const notificationDebounce = new Map<string, number>();
  const NOTIFICATION_DEBOUNCE_MS = 5000;

  // Handler: cursor:move (ephemeral - direct ref update)
  const handleCursorMove = (payload: CursorMovePayload) => {
    if (payload.userId === user?.id) return;

    if (deps.remoteCursorsRef) {
      const prev = deps.remoteCursorsRef.current[payload.userId];
      const now = Date.now();
      const lastNotification = notificationDebounce.get(payload.userId) || 0;

      if (payload.isAfk === true && (!prev || !prev.isAfk)) {
        if (payload.userName && (now - lastNotification > NOTIFICATION_DEBOUNCE_MS)) {
          notificationDebounce.set(payload.userId, now);
          show({
            type: 'warning',
            message: t('vtt.cursor.notifications.afk', { name: payload.userName }),
            duration: 3000
          });
        }
      }

      deps.remoteCursorsRef.current[payload.userId] = payload;
    }

    // Player auto-discovery
    const isKnownPlayer = stateRef.current.players.some(p => p.id === payload.userId);
    if (!isKnownPlayer && payload.userName) {
      const newPlayer = {
        id: payload.userId,
        name: payload.userName,
        avatarUrl: undefined,
        email: ''
      };

      setState(prev => ({
        ...prev,
        players: [...prev.players, newPlayer]
      }));

      notifySmartSync({
        entityType: 'player',
        entityId: payload.userId,
        changeType: 'create',
        data: newPlayer
      });
    }
  };

  // Handler: cursor:pressing (ephemeral)
  const handleCursorPressing = (payload: CursorPressingPayload) => {
    if (!payload.userId || payload.userId === user?.id) return;

    if (deps.remoteCursorsRef?.current[payload.userId]) {
      deps.remoteCursorsRef.current[payload.userId] = {
        ...deps.remoteCursorsRef.current[payload.userId],
        isClicking: payload.pressing
      };
    }
  };

  // Handler: me:afk_status
  const handleMyAfkStatus = (payload: { status: 'active' | 'afk' | 'warning', timeLeft?: number; }) => {
    setState(prev => ({
      ...prev,
      afkStatus: payload.status,
      afkTimeLeft: payload.timeLeft
    }));
  };

  // Handler: me:kicked
  const handleKicked = (payload: { reason: string, message: string, redirectTo: string; }) => {
    sessionStorage.setItem('kickMessage', payload.message);
    sessionStorage.setItem('kickReason', payload.reason);

    show({
      type: 'error',
      message: payload.message,
      duration: 5000
    });

    setTimeout(() => {
      window.location.href = payload.redirectTo;
    }, 500);
  };

  const handleViewportUpdate = (payload: ViewportUpdatePayload) => {
    if (payload.userId === user?.id) return;

    setState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === payload.userId
          ? { ...p, viewport: { x: payload.x, y: payload.y, zoom: payload.zoom, w: payload.w, h: payload.h } }
          : p
      )
    }));
  };


  const handleGMForceView = (payload: GMForceViewPayload) => {
    if (payload.targets && !payload.targets.includes(user?.id)) return;

    if (setViewport) {
      const { centerX, centerY, zoom, x, y } = payload;
      let newX = x;
      let newY = y;

      if (centerX !== undefined && centerY !== undefined) {
        newX = (window.innerWidth / 2) - (centerX * zoom);
        newY = (window.innerHeight / 2) - (centerY * zoom);
      }

      setViewport({ x: newX, y: newY, zoom });

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
    const wasActive = stateRef.current.followMode.active;
    const isChange = wasActive !== payload.active;

    setState(prev => ({ ...prev, followMode: payload }));

    const amIAffected = payload.active && (payload.targets === 'all' || (Array.isArray(payload.targets) && user?.id && payload.targets.includes(user.id)));

    if (isChange) {
      if (amIAffected) {
        show({ type: 'info', message: 'Modo Seguir Ativado: Você agora segue a visão do Mestre', duration: 4000 });
      } else if (!payload.active) {
        show({ type: 'info', message: 'Modo Seguir Desativado', duration: 3000 });
      }
    }
  };

  const handleGMViewportSync = (payload: GMForceViewPayload) => {
    const targets = payload.targets;
    if (!targets) return;

    const amITarget = (targets as any) === 'all' || (Array.isArray(targets) && user?.id && targets.includes(user.id));
    if (!amITarget) return;

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

  const handleError = (payload: { message: string; }) => {
    show({
      type: 'error',
      message: payload.message || 'Erro desconhecido no servidor',
      duration: 5000
    });
  };

  const handleViewportRestore = (payload: ViewportRestorePayload) => {
    if (setViewport && payload) {
      setViewport({ x: payload.x, y: payload.y, zoom: payload.zoom });
      show({
        type: 'success',
        message: 'Posição restaurada',
        duration: 2000
      });
    }
  };

  // Register listeners
  socketService.on('player:join', handlePlayerJoin);
  socketService.on('player:leave', handlePlayerLeave);
  socketService.on('cursor:move', handleCursorMove);
  socketService.on('cursor:pressing', handleCursorPressing);
  socketService.on('me:afk_status', handleMyAfkStatus);
  socketService.on('me:kicked', handleKicked);
  // socketService.on('player:update', handlePlayerUpdate); // Added for SmartSync support
  socketService.on('viewport:update', handleViewportUpdate); // Deprecated
  socketService.on('viewport:restore', handleViewportRestore);
  socketService.on('gm:force_view', handleGMForceView);
  socketService.on('gm:follow_mode_change', handleGMFollowModeChange);
  socketService.on('gm:viewport_sync', handleGMViewportSync);
  socketService.on('error', handleError);

  return () => {
    socketService.off('player:join', handlePlayerJoin);
    socketService.off('player:leave', handlePlayerLeave);
    socketService.off('cursor:move', handleCursorMove);
    socketService.off('cursor:pressing', handleCursorPressing);
    socketService.off('me:afk_status', handleMyAfkStatus);
    socketService.off('me:kicked', handleKicked);
    // socketService.off('player:update', handlePlayerUpdate);
    socketService.off('viewport:update', handleViewportUpdate);
    socketService.off('viewport:restore', handleViewportRestore);
    socketService.off('gm:force_view', handleGMForceView);
    socketService.off('gm:follow_mode_change', handleGMFollowModeChange);
    socketService.off('gm:viewport_sync', handleGMViewportSync);
    socketService.off('error', handleError);
  };
};
