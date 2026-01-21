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

    // Get all Current Attack Zones from state or cache is hard here without state access.
    // Ideally we would trust the bridge handles 'delete'.
    // The previous code iterated over `prev.attackZones` inside setState.
    // We can't do that easily without state access.
    // However, clean solution: The SERVER should emit individual delete events or handled by SyncQueue flush?
    // Actually the server handler broadcasts `attackZone:clear`.
    // If we can't access state here, we might need to keep setState OR trust that we don't need to iterate.
    // Wait, the previous code iterated `prev.attackZones` to call `notifySmartSync`.
    // If we remove setState callback, we lose access to `prev`.
    // BUT `notifySmartSync` is imperative.
    // We can use `setState` just to read? No, `setState` updater is async/batched.

    // BETTER APPROACH: SmartSync likely has the data in cache.
    // But this listener file doesn't import SmartSync directly, it uses helper.
    // Let's keep the setState pattern JUST for this complex case (Clear All), 
    // OR skip refactoring this specific handler if it's too complex.

    // Actually, `handleAttackZoneClear` logic is:
    // 1. Iterate all zones
    // 2. Notify SmartSync delete for each.
    // 3. Clear state.

    // If we just want to notify smartSync, we need the list of zones.
    // Use `setState` solely to access state for notification is fine, but we want to avoid the State Update part.
    // But `setState` must return a value.

    // Let's leave handleAttackZoneClear as is for now to avoid breakage, 
    // or refactor to use `smartSync.getAll('attackZone')` if we can import it.
    // Since we can't easily import `smartSync` (circular deps maybe?), keeping it is safer.

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
    // This is initial load/sync. Overwriting state is fine, but technically SmartSync should handle it.
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
