import { socketService } from '../../../../services/socketService';
import { AttackZoneConfig } from '../../../../types/attackZone';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for attack zone events
 * - attackZone:add
 * - attackZone:update
 * - attackZone:remove
 * - attackZone:clear
 * - attackZone:syncResponse
 */
export const registerAttackZoneListeners = ({
  setState,
  user
}: ListenerDeps): ListenerCleanup => {

  // Handler: attackZone:add
  const handleAttackZoneAdd = (payload: { zone: AttackZoneConfig; userId?: string; }) => {
    console.log('[AttackZone Listener] Received attackZone:add', { payload, myUserId: user?.id });

    // Skip if we emitted this event (userId matches)
    if (payload.userId && payload.userId === user?.id) {
      console.log('[AttackZone Listener] Skipping own event');
      return;
    }

    console.log('[AttackZone Listener] Adding zone to state:', payload.zone.id);
    setState(prev => ({
      ...prev,
      attackZones: [...prev.attackZones.filter(z => z.id !== payload.zone.id), payload.zone]
    }));
  };

  // Handler: attackZone:update
  const handleAttackZoneUpdate = (payload: { zoneId: string; updates: Partial<AttackZoneConfig>; userId: string; }) => {
    if (payload.userId === user?.id) return;

    setState(prev => ({
      ...prev,
      attackZones: prev.attackZones.map(z =>
        z.id === payload.zoneId ? { ...z, ...payload.updates } : z
      )
    }));
  };

  // Handler: attackZone:remove
  const handleAttackZoneRemove = (payload: { zoneId: string; userId: string; }) => {
    if (payload.userId === user?.id) return;

    setState(prev => ({
      ...prev,
      attackZones: prev.attackZones.filter(z => z.id !== payload.zoneId)
    }));
  };

  // Handler: attackZone:clear
  const handleAttackZoneClear = (payload: { userId: string; }) => {
    if (payload.userId === user?.id) return;

    setState(prev => ({
      ...prev,
      attackZones: []
    }));
  };

  // Handler: attackZone:syncResponse - receives current zones when joining
  const handleAttackZoneSyncResponse = (payload: { zones: AttackZoneConfig[]; }) => {
    console.log('[AttackZone Listener] Received syncResponse with zones:', payload.zones?.length || 0);
    setState(prev => ({
      ...prev,
      attackZones: payload.zones || []
    }));
  };

  // Register listeners
  console.log('[AttackZone Listener] Registering attack zone listeners for user:', user?.id);
  socketService.on('attackZone:add', handleAttackZoneAdd);
  socketService.on('attackZone:update', handleAttackZoneUpdate);
  socketService.on('attackZone:remove', handleAttackZoneRemove);
  socketService.on('attackZone:clear', handleAttackZoneClear);
  socketService.on('attackZone:syncResponse', handleAttackZoneSyncResponse);

  // Request sync on registration (for late joiners)
  console.log('[AttackZone Listener] Requesting sync');
  socketService.emit('attackZone:sync', {});

  // Return cleanup function
  return () => {
    socketService.off('attackZone:add', handleAttackZoneAdd);
    socketService.off('attackZone:update', handleAttackZoneUpdate);
    socketService.off('attackZone:remove', handleAttackZoneRemove);
    socketService.off('attackZone:clear', handleAttackZoneClear);
    socketService.off('attackZone:syncResponse', handleAttackZoneSyncResponse);
  };
};
