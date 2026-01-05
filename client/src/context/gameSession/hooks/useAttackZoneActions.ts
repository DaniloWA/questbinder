import { useCallback } from 'react';
import { socketService } from '../../../services/socketService';
import { AttackZoneConfig } from '../../../types/attackZone';
import React from 'react';
import { GameSessionState } from '../types';

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
  const addAttackZone = useCallback((zone: AttackZoneConfig) => {
    // Optimistic update - add locally immediately
    setState(prev => ({
      ...prev,
      attackZones: [...prev.attackZones.filter(z => z.id !== zone.id), zone]
    }));

    // Emit to server for broadcast
    socketService.emit('attackZone:add', { zone });
  }, [setState]);

  /**
   * Update an existing attack zone
   */
  const updateAttackZone = useCallback((zoneId: string, updates: Partial<AttackZoneConfig>) => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      attackZones: prev.attackZones.map(z =>
        z.id === zoneId ? { ...z, ...updates } : z
      )
    }));

    // Emit to server
    socketService.emit('attackZone:update', { zoneId, updates });
  }, [setState]);

  /**
   * Remove an attack zone
   */
  const removeAttackZone = useCallback((zoneId: string) => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      attackZones: prev.attackZones.filter(z => z.id !== zoneId)
    }));

    // Emit to server
    socketService.emit('attackZone:remove', { zoneId });
  }, [setState]);

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
