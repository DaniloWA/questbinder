export type TokenDisplayMode = 'image' | 'color' | 'text';

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
  distance?: number; // Falloff distance in world units (Legacy optional)
  decay?: number;    // (Legacy optional)
  castShadow?: boolean; // (Legacy optional)
  // VTT specific
  brightRadius?: number; // In grid units
  dimRadius?: number;    // In grid units
}

export interface Token {
  id: string;
  name: string;
  imgUrl?: string;

  // Position
  x: number; // Grid X
  y: number; // Grid Y
  z?: number; // Elevation
  rotation?: number; // Degrees

  size: number; // Grid units

  displayMode?: TokenDisplayMode;
  color?: string; // Fallback or Tint

  bars?: {
    bar1?: TokenBar;
    bar2?: TokenBar;
  };

  light?: TokenLight;

  // Selection/UI state (runtime only, might be separated later)
  isSelected?: boolean;
}
