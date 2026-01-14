import { socketService } from '../../../../services/socketService';
import { ListenerDeps, ListenerCleanup } from './types';

export const registerSystemListeners = (deps: ListenerDeps): ListenerCleanup => {
  const { show, setState } = deps;

  const handleNotification = (payload: { message: string, type: 'info' | 'success' | 'warning' | 'error'; }) => {
    if (show) {
      show({ message: payload.message, type: payload.type });
    }
  };

  const handleKickWarning = () => {
    // Could trigger a specific UI modal, but toast works for now
  };

  socketService.on('system:notification', handleNotification);

  return () => {
    socketService.off('system:notification', handleNotification);
  };
};
