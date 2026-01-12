import { GameSessionState } from '../../types';
import { User, Viewport } from '../../../../types';
import React from 'react';

// Dependencies passed to listener functions
export interface ListenerDeps {
  state: GameSessionState;
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>;
  user: User | null;
  show: (options: any) => void;
  setViewport?: (v: Partial<Viewport>) => void;
  stateRef: React.MutableRefObject<GameSessionState>;
  campaignId: string;
}


// Cleanup function returned by each listener registrar
export type ListenerCleanup = () => void;
