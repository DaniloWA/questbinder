import { socketService } from '../../../../services/socketService';
import { CursorMovePayload } from '../../../../types';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for player-related events
 * - player:join
 * - player:leave
 * - cursor:move
 * - error
 */
export const registerPlayerListeners = ({
  setState,
  user,
  show
}: ListenerDeps): ListenerCleanup => {

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
      type: 'info',
      message: `${payload.user.name} entrou na sessão`,
      duration: 3000
    });
  };

  // Handler: player:leave
  const handlePlayerLeave = (payload: { userId: string; }) => {
    setState(previousState => ({
      ...previousState,
      players: previousState.players.filter(
        player => player.id !== payload.userId
      )
    }));
  };

  // Handler: cursor:move
  const handleCursorMove = (payload: CursorMovePayload) => {
    if (payload.userId === user?.id) return;

    setState(previousState => ({
      ...previousState,
      remoteCursors: {
        ...previousState.remoteCursors,
        [payload.userId]: payload
      }
    }));
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

  // Register listeners
  socketService.on('player:join', handlePlayerJoin);
  socketService.on('player:leave', handlePlayerLeave);
  socketService.on('cursor:move', handleCursorMove);
  socketService.on('error', handleError);

  // Return cleanup function
  return () => {
    socketService.off('player:join', handlePlayerJoin);
    socketService.off('player:leave', handlePlayerLeave);
    socketService.off('cursor:move', handleCursorMove);
    socketService.off('error', handleError);
  };
};
