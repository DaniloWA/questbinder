import { socketService } from '../../../../services/socketService';
import { AttackZoneConfig } from '../../../../types/attackZone';
import { notifySmartSync } from '../../syncHelpers';
import { ListenerDeps, ListenerCleanup } from './types';

/**
 * Registers listeners for attack zone events.
 * All handlers update React state AND notify SmartSync cache.
 */
export const registerAttackZoneListeners = ({
  setState,
  user
}: ListenerDeps): ListenerCleanup => {

  // Handler: attackZone:add
  const handleAttackZoneAdd = (payload: { zone: AttackZoneConfig; userId?: string; }) => {
    // Skip if we emitted this event
    if (payload.userId && payload.userId === user?.id) {
      return;
    }

    setState(prev => ({
      ...prev,
      attackZones: [...prev.attackZones.filter(z => z.id !== payload.zone.id), payload.zone]
    }));

    notifySmartSync({
      entityType: 'attackZone',
      entityId: payload.zone.id,
      changeType: 'create',
      data: payload.zone
    });
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

    notifySmartSync({
      entityType: 'attackZone',
      entityId: payload.zoneId,
      changeType: 'update',
      data: payload.updates
    });
  };

  // Handler: attackZone:remove
  const handleAttackZoneRemove = (payload: { zoneId: string; userId: string; }) => {
    if (payload.userId === user?.id) return;

    setState(prev => ({
      ...prev,
      attackZones: prev.attackZones.filter(z => z.id !== payload.zoneId)
    }));

    notifySmartSync({
      entityType: 'attackZone',
      entityId: payload.zoneId,
      changeType: 'delete',
      data: {}
    });
  };

  // Handler: attackZone:clear
  const handleAttackZoneClear = (payload: { userId: string; }) => {
    if (payload.userId === user?.id) return;

    // Get all zone IDs before clearing for cache notification
    setState(prev => {
      // Notify SmartSync for each zone being deleted
      prev.attackZones.forEach(zone => {
        notifySmartSync({
          entityType: 'attackZone',
          entityId: zone.id,
          changeType: 'delete',
          data: {}
        });
      });

      return {
        ...prev,
        attackZones: []
      };
    });
  };

  // Handler: attackZone:syncResponse - receives current zones when joining
  const handleAttackZoneSyncResponse = (payload: { zones: AttackZoneConfig[]; }) => {
    setState(prev => ({
      ...prev,
      attackZones: payload.zones || []
    }));

    // Hydrate cache with all zones
    (payload.zones || []).forEach(zone => {
      notifySmartSync({
        entityType: 'attackZone',
        entityId: zone.id,
        changeType: 'create',
        data: zone
      });
    });
  };

  // Register listeners
  socketService.on('attackZone:add', handleAttackZoneAdd);
  socketService.on('attackZone:update', handleAttackZoneUpdate);
  socketService.on('attackZone:remove', handleAttackZoneRemove);
  socketService.on('attackZone:clear', handleAttackZoneClear);
  socketService.on('attackZone:syncResponse', handleAttackZoneSyncResponse);

  // Request sync on registration (for late joiners)
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
