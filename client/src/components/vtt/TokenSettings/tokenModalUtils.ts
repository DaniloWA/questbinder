/**
 * Token Modal Utilities
 * Shared utility functions and constants for TokenEditModal and related components
 */

import React from 'react';
import {
  Skull, Droplets, Zap, Shield, AlertTriangle, Ghost, Hand,
  Activity, EyeOff, Heart, Anchor, Moon, Lock, EarOff, Flame
} from 'lucide-react';
import { TokenEffect, TokenIdleAnimation, LightConfig } from '../../../types';

// --- Color Utilities ---

export const rgbaToHexAlpha = (color: string): { hex: string; alpha: number; } => {
  if (!color) return { hex: '#ffffff', alpha: 0.2 };
  if (color.startsWith('#')) return { hex: color.slice(0, 7), alpha: 1 };
  const parts = color.match(/[\d\.]+/g);
  if (!parts || parts.length < 3) return { hex: '#ffffff', alpha: 0.2 };
  const r = parseInt(parts[0]);
  const g = parseInt(parts[1]);
  const b = parseInt(parts[2]);
  const a = parts.length > 3 ? parseFloat(parts[3]) : 1;
  const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
  return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, alpha: a };
};

export const hexAlphaToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- D&D Utilities ---

export const calcMod = (score: number): number => Math.floor((score - 10) / 2);
export const fmtMod = (mod: number): string => (mod >= 0 ? `+${mod}` : `${mod}`);

// --- Condition Icons ---

export const CONDITION_ICONS: Record<string, React.ReactNode> = {
  'dead': React.createElement(Skull, { className: 'w-5 h-5' }),
  'bloodied': React.createElement(Droplets, { className: 'w-5 h-5' }),
  'stunned': React.createElement(Zap, { className: 'w-5 h-5' }),
  'shielded': React.createElement(Shield, { className: 'w-5 h-5' }),
  'alert': React.createElement(AlertTriangle, { className: 'w-5 h-5' }),
  'frightened': React.createElement(Ghost, { className: 'w-5 h-5' }),
  'grappled': React.createElement(Hand, { className: 'w-5 h-5' }),
  'prone': React.createElement(Activity, { className: 'w-5 h-5 transform rotate-90' }),
  'blinded': React.createElement(EyeOff, { className: 'w-5 h-5' }),
  'charmed': React.createElement(Heart, { className: 'w-5 h-5' }),
  'poisoned': React.createElement(Skull, { className: 'w-5 h-5' }),
  'restrained': React.createElement(Anchor, { className: 'w-5 h-5' }),
  'incapacitated': React.createElement(Shield, { className: 'w-5 h-5 opacity-50' }),
  'unconscious': React.createElement(Moon, { className: 'w-5 h-5' }),
  'invisible': React.createElement(Ghost, { className: 'w-5 h-5 opacity-50' }),
  'paralyzed': React.createElement(Zap, { className: 'w-5 h-5' }),
  'petrified': React.createElement(Lock, { className: 'w-5 h-5' }),
  'deafened': React.createElement(EarOff, { className: 'w-5 h-5' }),
  'exhausted': React.createElement(Activity, { className: 'w-5 h-5' }),
  'burning': React.createElement(Flame, { className: 'w-5 h-5' }),
  'bleeding': React.createElement(Droplets, { className: 'w-5 h-5' }),
};

// --- Object Presets ---

export interface ObjectPreset {
  id: string;
  labelKey: string;
  icon: string;
  light: Partial<LightConfig>;
  color: string;
  effect: TokenEffect;
  animation: TokenIdleAnimation;
}

export const OBJECT_PRESETS: ObjectPreset[] = [
  {
    id: 'torch',
    labelKey: 'vtt.tokens.editModal.object.presets.torch',
    icon: '🕯️',
    color: '#f59e0b',
    light: { enabled: true, brightRadius: 3, dimRadius: 6, color: '#ff9800', intensity: 0.8, animation: 'torch' as const },
    effect: 'none' as const,
    animation: 'breath' as const,
  },
  {
    id: 'lantern',
    labelKey: 'vtt.tokens.editModal.object.presets.lantern',
    icon: '🏮',
    color: '#facc15',
    light: { enabled: true, brightRadius: 6, dimRadius: 12, color: '#ffc107', intensity: 0.9, animation: 'torch' as const },
    effect: 'none' as const,
    animation: 'none' as const,
  },
  {
    id: 'campfire',
    labelKey: 'vtt.tokens.editModal.object.presets.campfire',
    icon: '🔥',
    color: '#ef4444',
    light: { enabled: true, brightRadius: 4.5, dimRadius: 9, color: '#ff5722', intensity: 1, animation: 'torch' as const },
    effect: 'burning' as const,
    animation: 'breath' as const,
  },
  {
    id: 'orb',
    labelKey: 'vtt.tokens.editModal.object.presets.magic_orb',
    icon: '🔮',
    color: '#a855f7',
    light: { enabled: true, brightRadius: 6, dimRadius: 15, color: '#9c27b0', intensity: 0.7, animation: 'pulse' as const },
    effect: 'ghostly' as const,
    animation: 'float' as const,
  },
  {
    id: 'chest',
    labelKey: 'vtt.tokens.editModal.object.presets.chest',
    icon: '📦',
    color: '#71717a',
    light: { enabled: false },
    effect: 'none' as const,
    animation: 'none' as const,
  },
  {
    id: 'door',
    labelKey: 'vtt.tokens.editModal.object.presets.door',
    icon: '🚪',
    color: '#71717a',
    light: { enabled: false },
    effect: 'none' as const,
    animation: 'none' as const,
  },
  {
    id: 'trap',
    labelKey: 'vtt.tokens.editModal.object.presets.trap',
    icon: '🕸️',
    color: '#71717a',
    light: { enabled: false },
    effect: 'none' as const,
    animation: 'none' as const,
  },
];

// --- Size Map for Monster Import ---

export const MONSTER_SIZE_MAP: Record<string, number> = {
  'Tiny': 0.5,
  'Small': 1,
  'Medium': 1,
  'Large': 2,
  'Huge': 3,
  'Gargantuan': 4,
};

// --- Animation Class Helpers ---

export const getIdleAnimationClass = (animation: TokenIdleAnimation): string => {
  switch (animation) {
    case 'breath': return 'token-anim-breath';
    case 'spin': return 'token-anim-spin';
    case 'float': return 'token-anim-float';
    case 'wobble': return 'token-anim-wobble';
    case 'none':
    default: return '';
  }
};

export const getEffectClass = (effect: TokenEffect): string => {
  switch (effect) {
    case 'ghostly': return 'token-effect-ghostly';
    case 'burning': return 'token-effect-burning';
    case 'frozen': return 'token-effect-frozen';
    case 'glitch': return 'token-effect-glitch';
    case 'outline': return 'token-effect-outline';
    default: return '';
  }
};
