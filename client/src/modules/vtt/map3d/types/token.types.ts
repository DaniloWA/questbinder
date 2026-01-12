export type TokenDisplayMode = 'image' | 'color' | 'text';

// Condition types matching 2D VTT
export type Condition =
  | 'dead' | 'bloodied' | 'stunned' | 'shielded' | 'alert'
  | 'prone' | 'paralyzed' | 'unconscious' | 'poisoned'
  | 'blinded' | 'deafened' | 'frightened' | 'charmed'
  | 'invisible' | 'restrained' | 'grappled' | 'concentrating' | string;

export interface TokenBar {
  value: number;
  max: number;
  visible: boolean;
  color?: string;
}

export interface TokenLight {
  enabled: boolean;
  color: string;
  intensity: number;
  distance?: number;
  decay?: number;
  castShadow?: boolean;
  brightRadius?: number;
  dimRadius?: number;
}

export interface Token {
  id: string;
  name: string;
  imgUrl?: string;

  // Position
  x: number;
  y: number;
  z?: number;
  rotation?: number;

  size: number;

  displayMode?: TokenDisplayMode;
  color?: string;

  // Health & Status
  bars?: {
    bar1?: TokenBar;
    bar2?: TokenBar;
  };
  conditions?: Condition[];

  // Light
  light?: TokenLight;

  // Visibility & Ownership
  isVisibleToPlayers?: boolean;
  ownerId?: string;
  controlledBy?: string[];

  // Runtime state
  isSelected?: boolean;
}

