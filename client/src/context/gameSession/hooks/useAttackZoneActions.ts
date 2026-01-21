import { useCallback } from 'react';
import { socketService } from '../../../services/socketService';
import { AttackZoneConfig } from '../../../types/attackZone';
import React from 'react';
import { GameSessionState } from '../types';
import { smartSync } from '../../../services/sync';

/**
 * Hook for attack zone actions that emit to WebSocket
 * Attack zones are ephemeral - not persisted to DB
 */
export const useAttackZoneActions = (
  state: GameSessionState,
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>
) => {

  /**
   * Add an attack zone and broadcast to other clients
   */
  /* import { smartSync } from '../../../services/sync'; // Need to add import first */

  const addAttackZone = useCallback((zone: AttackZoneConfig) => {
    // SmartSync handles optimistic update and broadcasting
    smartSync.apply('attackZone', zone.id, 'create', zone);
  }, []);

  /**
   * Update an existing attack zone
   */
  const updateAttackZone = useCallback((zoneId: string, updates: Partial<AttackZoneConfig>) => {
    smartSync.apply('attackZone', zoneId, 'update', updates);
  }, []);

  /**
   * Remove an attack zone
   */
  const removeAttackZone = useCallback((zoneId: string) => {
    smartSync.apply('attackZone', zoneId, 'delete', {});
  }, []);

  /**
   * Clear all attack zones
   */
  const clearAttackZones = useCallback(() => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      attackZones: []
    }));

    // Emit to server
    socketService.emit('attackZone:clear', {});
  }, [setState]);

  return {
    addAttackZone,
    updateAttackZone,
    removeAttackZone,
    clearAttackZones
  };
};
