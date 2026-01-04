import React, { useState, useEffect } from 'react';
import { GameSessionState } from '../types';
import { INITIAL_STATE } from '../constants';
import { campaignService } from '../../../services/campaignService';
import { characterService } from '../../../services/characterService';
import { chatService } from '../../../services/chatService';
import { handoutService } from '../../../services/handoutService';
import { apiService } from '../../../services/apiService';
import { socketService } from '../../../services/socketService';
import { useAuth } from '../../AuthContext';
import { TokenTemplate } from '../../../types';

export const useGameState = (campaignId: string) => {
  const { user } = useAuth();
  const [state, setState] = useState<GameSessionState>(() => {
    const savedCursor = localStorage.getItem('qb_cursor_settings');
    const initialCursor = savedCursor ? JSON.parse(savedCursor) : {};
    return {
      ...INITIAL_STATE,
      cursorSettings: {
        color: initialCursor.color || '#fbbf24',
        name: initialCursor.name || user?.name || '',
        shape: initialCursor.shape || 'default'
      }
    };
  });
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);

  // Derived
  const activeScene = state.scenes.find(s => s.id === state.activeSceneId) || null;
  const sharedHandout = state.handouts.find(h => h.sharedWith?.length > 0 && (state.isGM || h.sharedWith?.includes(user?.id || ''))) || null;
  const triggeredHandout = state.handouts.find(h => h.id === state.triggeredHandoutId) || null;

  // Shared handout overrides trigger, but triggers can be active locally
  const activeHandout = sharedHandout || triggeredHandout;

  // Initial Load & Socket Connection
  useEffect(() => {
    let isMounted = true;
    if (campaignId && user) {
      const load = async () => {
        try {
          const res = await campaignService.getById(campaignId);
          if (!isMounted) return;

          if (res.success && res.data) {
            const c = res.data;
            setState(prev => ({
              ...prev,
              campaign: c,
              scenes: c.scenes,
              activeSceneId: c.activeSceneId,
              isGM: c.ownerId === user.id,
              audioSettings: c.audioSettings,
              permissions: c.permissions || prev.permissions
            }));

            // Parallel loads
            const [chars, msgs, handouts, players, tmpls] = await Promise.all([
              characterService.getByCampaign(campaignId),
              chatService.getMessages(campaignId),
              handoutService.getByCampaign(campaignId),
              campaignService.getPlayers(campaignId),
              apiService.get<TokenTemplate[]>('token_templates') // Load templates
            ]);

            if (!isMounted) return;

            setState(prev => ({
              ...prev,
              campaignCharacters: chars.data || [],
              chatMessages: msgs.data || [],
              handouts: handouts.data || [],
              players: players.data || [],
              templates: tmpls.data || []
            }));

            await socketService.connect(user.id, campaignId);

            // Setup connection listeners
            socketService.on('connect', () => {
              console.log('[GameState] Socket connected');
              setState(prev => ({ ...prev, isConnected: true }));
            });

            socketService.on('disconnect', () => {
              console.log('[GameState] Socket disconnected');
              setState(prev => ({ ...prev, isConnected: false }));
            });

            if (isMounted) {
              setState(prev => ({ ...prev, isConnected: true }));
            }
          }
        } finally {
          if (isMounted) {
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
      };
      load();
    }
    return () => {
      isMounted = false;
      socketService.disconnect();
    };
  }, [campaignId, user]);

  return {
    state,
    setState,
    isCompendiumOpen,
    setIsCompendiumOpen,
    activeScene,
    activeHandout,
    sharedHandout,
    triggeredHandout,
    user
  };
};