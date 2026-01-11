import { Aura, CombatEffect } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface AuraTemplate {
  name: string;
  radius: number;
  color: string;
  shape: 'circle' | 'square';
  targets: 'allies' | 'enemies' | 'all' | 'self';
  description?: string;
  category?: 'offensive' | 'defensive' | 'support' | 'control';
  trigger?: string;
  requirements?: string[];
  effects?: Partial<CombatEffect>[];
}

export const AURA_TEMPLATES: AuraTemplate[] = [
  // --- OFFENSIVE ---
  {
    name: "rules.aura.corrosiveAsh.name",
    category: "offensive",
    radius: 3,
    color: "#4ade80", // Green-400
    shape: "circle",
    targets: "enemies",
    trigger: "rules.aura.corrosiveAsh.trigger",
    description: "rules.aura.corrosiveAsh.desc",
    effects: [{ name: "rules.aura.corrosiveAsh.effectName", description: "rules.aura.corrosiveAsh.effectDesc", modifiers: { speed: -2 } }]
  },
  {
    name: "rules.aura.deepTerror.name",
    category: "offensive",
    radius: 6,
    color: "#7f1d1d", // Red-900
    shape: "circle",
    targets: "enemies",
    trigger: "rules.aura.deepTerror.trigger",
    description: "rules.aura.deepTerror.desc",
    effects: [{ name: "rules.aura.deepTerror.effectName", description: "rules.aura.deepTerror.effectDesc", conditions: ['frightened'] }]
  },

  // --- DEFENSIVE ---
  {
    name: "rules.aura.etherealGuardian.name",
    category: "defensive",
    radius: 3,
    color: "#60a5fa", // Blue-400
    shape: "circle",
    targets: "allies",
    trigger: "rules.aura.etherealGuardian.trigger",
    description: "rules.aura.etherealGuardian.desc",
    effects: [{ name: "rules.aura.etherealGuardian.effectName", description: "rules.aura.etherealGuardian.effectDesc", modifiers: { ac: 1 } }]
  },
  {
    name: "rules.aura.elementalResistance.name",
    category: "defensive",
    radius: 9,
    color: "#f472b6", // Pink-400
    shape: "circle",
    targets: "allies",
    trigger: "rules.aura.etherealGuardian.trigger", // Constant
    description: "rules.aura.elementalResistance.desc",
    effects: [{ name: "rules.aura.elementalResistance.effectName", description: "rules.aura.elementalResistance.effectDesc" }]
  },
  {
    name: "rules.aura.protection.name",
    category: "defensive",
    radius: 3,
    color: "#fbbf24", // Amber
    shape: "circle",
    targets: "allies",
    trigger: "rules.aura.etherealGuardian.trigger",
    description: "rules.aura.protection.desc",
    effects: [{ name: "rules.aura.protection.effectName", description: "rules.aura.protection.effectDesc" }]
  },
  {
    name: "rules.aura.courage.name",
    category: "defensive",
    radius: 3,
    color: "#f59e0b", // Amber-600
    shape: "circle",
    targets: "allies",
    trigger: "rules.aura.etherealGuardian.trigger",
    description: "rules.aura.courage.desc",
    effects: [{ name: "rules.aura.courage.effectName", description: "rules.aura.courage.effectDesc" }]
  },

  // --- SUPPORT ---
  {
    name: "rules.aura.strategist.name",
    category: "support",
    radius: 6,
    color: "#3b82f6", // Blue-500
    shape: "circle",
    targets: "allies",
    trigger: "rules.aura.etherealGuardian.trigger",
    description: "rules.aura.strategist.desc",
    effects: [{ name: "rules.aura.strategist.effectName", description: "rules.aura.strategist.effectDesc" }]
  },
  {
    name: "rules.aura.arcaneFocus.name",
    category: "support",
    radius: 6,
    color: "#8b5cf6", // Violet-500
    shape: "circle",
    targets: "allies",
    trigger: "rules.aura.etherealGuardian.trigger",
    description: "rules.aura.arcaneFocus.desc",
    effects: [{ name: "rules.aura.arcaneFocus.effectName", description: "rules.aura.arcaneFocus.effectDesc" }]
  },
  {
    name: "rules.aura.vitality.name",
    category: "support",
    radius: 9,
    color: "#34d399", // Emerald
    shape: "circle",
    targets: "allies",
    trigger: "rules.aura.vitality.trigger",
    description: "rules.aura.vitality.desc",
    effects: [{ name: "rules.aura.vitality.effectName", description: "rules.aura.vitality.effectDesc" }]
  },

  // --- CONTROL ---
  {
    name: "rules.aura.temporalSlow.name",
    category: "control",
    radius: 3,
    color: "#64748b", // Slate-500
    shape: "circle",
    targets: "enemies",
    trigger: "rules.aura.temporalSlow.trigger",
    description: "rules.aura.temporalSlow.desc",
    effects: [{ name: "rules.aura.temporalSlow.effectName", description: "rules.aura.temporalSlow.effectDesc", modifiers: { speed: -3 } }]
  },
  {
    name: "rules.aura.windGust.name",
    category: "control",
    radius: 3,
    color: "#a1a1aa", // Zinc-400
    shape: "circle",
    targets: "enemies",
    trigger: "rules.aura.temporalSlow.trigger",
    description: "rules.aura.windGust.desc",
    effects: [{ name: "rules.aura.windGust.effectName", description: "rules.aura.windGust.effectDesc" }]
  },
  {
    name: "rules.aura.spiritGuardians.name",
    category: "control",
    radius: 4.5,
    color: "#f472b6", // Pink
    shape: "circle",
    targets: "enemies",
    trigger: "rules.aura.deepTerror.trigger",
    description: "rules.aura.spiritGuardians.desc",
    effects: [{ name: "rules.aura.spiritGuardians.effectName", description: "rules.aura.spiritGuardians.effectDesc", modifiers: { speed: -0.5 } }]
  },

  // --- MONSTER / OTHER ---
  {
    name: "rules.aura.fear.name",
    category: "control",
    radius: 6,
    color: "#7f1d1d", // Red-900
    shape: "circle",
    targets: "enemies",
    trigger: "rules.aura.deepTerror.trigger",
    description: "rules.aura.fear.desc",
    effects: [{ name: "rules.aura.fear.effectName", description: "rules.aura.fear.effectDesc", conditions: ['frightened'] }]
  },
  {
    name: "rules.aura.fire.name",
    category: "offensive",
    radius: 1.5,
    color: "#ef4444", // Red
    shape: "circle",
    targets: "all",
    trigger: "rules.aura.deepTerror.trigger",
    description: "rules.aura.fire.desc",
    effects: [{ name: "rules.aura.fire.effectName", description: "rules.aura.fire.effectDesc" }]
  }
];

export const createAuraFromTemplate = (template: AuraTemplate): Aura => {
  return {
    id: uuidv4(),
    name: template.name,
    radius: template.radius,
    color: template.color,
    shape: template.shape,
    targets: template.targets,
    active: true,
    includedTokenIds: [],
    excludedTokenIds: [],
    description: template.description,
    category: template.category,
    trigger: template.trigger,
    requirements: template.requirements,
    effects: template.effects?.map(e => ({
      id: uuidv4(),
      name: e.name || 'Efeito',
      description: e.description,
      duration: { type: 'permanent', value: -1, remaining: -1 },
      modifiers: e.modifiers || {},
      conditions: e.conditions || []
    })) || []
  };
};
