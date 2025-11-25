import { GameSessionState } from '../../types';
import React from 'react';

// Dependencies passed to listener functions
export interface ListenerDeps {
  state: GameSessionState;
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>;
  campaignId: string;
  user: any;
  show: (notification: any) => void;
}

// Cleanup function returned by each listener registrar
export type ListenerCleanup = () => void;
