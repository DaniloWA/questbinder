import { GameSessionState } from '../../types';
import { User, Viewport } from '../../../../types';
import { CursorMovePayload } from '../../../../types/socket';
import React from 'react';

// Dependencies passed to listener functions
export interface ListenerDeps {
  state: GameSessionState;
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>;
  user: User | null;
  show: (options: any) => void;
  setViewport?: (v: Partial<Viewport>) => void;
  stateRef: React.RefObject<GameSessionState>;
  remoteCursorsRef?: React.RefObject<Record<string, CursorMovePayload>>; // Optional for backward compatibility if needed, but we should make it required
  campaignId: string;
}


// Cleanup function returned by each listener registrar
export type ListenerCleanup = () => void;
