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
    name: "Aura of Corrosive Ash",
    category: "offensive",
    radius: 3,
    color: "#4ade80", // Green-400
    shape: "circle",
    targets: "enemies",
    trigger: "Início do turno",
    description: "1d6 ácido por turno. Criaturas afetadas têm -2m de movimento.",
    effects: [{ name: "Cinzas Corrosivas", description: "1d6 Ácido / -2m Movimento", modifiers: { speed: -2 } }]
  },
  {
    name: "Deep Terror Aura",
    category: "offensive",
    radius: 6,
    color: "#7f1d1d", // Red-900
    shape: "circle",
    targets: "enemies",
    trigger: "Entrada ou Início do turno",
    description: "Teste de Sabedoria (CD 8+Prof+Attr). Falha: Amedrontado por 1 turno.",
    effects: [{ name: "Terror Profundo", description: "Save WIS ou Amedrontado", conditions: ['frightened'] }]
  },

  // --- DEFENSIVE ---
  {
    name: "Ethereal Guardian Aura",
    category: "defensive",
    radius: 3,
    color: "#60a5fa", // Blue-400
    shape: "circle",
    targets: "allies",
    trigger: "Constante",
    description: "+1 CA para aliados. Primeiro ataque contra cada aliado tem desvantagem (1/rodada).",
    effects: [{ name: "Guardião Etéreo", description: "+1 CA / Desvantagem no 1º ataque recebido", modifiers: { ac: 1 } }]
  },
  {
    name: "Elemental Resistance Aura",
    category: "defensive",
    radius: 9,
    color: "#f472b6", // Pink-400
    shape: "circle",
    targets: "allies",
    trigger: "Constante",
    description: "Resistência a um elemento escolhido (Fogo, Frio, Ácido, etc).",
    effects: [{ name: "Resistência Elemental", description: "Resistência ao elemento escolhido" }]
  },
  {
    name: "Aura of Protection",
    category: "defensive",
    radius: 3,
    color: "#fbbf24", // Amber
    shape: "circle",
    targets: "allies",
    trigger: "Constante",
    description: "Aliados adicionam modificador de Carisma aos testes de resistência.",
    effects: [{ name: "Proteção (Carisma)", description: "+CHA em Saves" }]
  },
  {
    name: "Aura of Courage",
    category: "defensive",
    radius: 3,
    color: "#f59e0b", // Amber-600
    shape: "circle",
    targets: "allies",
    trigger: "Constante",
    description: "Aliados não podem ser amedrontados.",
    effects: [{ name: "Coragem", description: "Imune a Medo" }]
  },

  // --- SUPPORT ---
  {
    name: "Strategist's Aura",
    category: "support",
    radius: 6,
    color: "#3b82f6", // Blue-500
    shape: "circle",
    targets: "allies",
    trigger: "Constante",
    description: "Aliados ganham +1 em testes de ataque.",
    effects: [{ name: "Estrategista", description: "+1 Ataque" }]
  },
  {
    name: "Arcane Focus Aura",
    category: "support",
    radius: 6,
    color: "#8b5cf6", // Violet-500
    shape: "circle",
    targets: "allies",
    trigger: "Constante",
    description: "Aliados têm vantagem em testes de concentração.",
    effects: [{ name: "Foco Arcano", description: "Vantagem em Concentração" }]
  },
  {
    name: "Aura of Vitality",
    category: "support",
    radius: 9,
    color: "#34d399", // Emerald
    shape: "circle",
    targets: "allies",
    trigger: "Ação Bônus",
    description: "Cura 2d6 por ação em um alvo dentro da área.",
    effects: [{ name: "Vitalidade", description: "Pode ser curado (2d6)" }]
  },

  // --- CONTROL ---
  {
    name: "Temporal Slow Aura",
    category: "control",
    radius: 3,
    color: "#64748b", // Slate-500
    shape: "circle",
    targets: "enemies",
    trigger: "Entrada",
    description: "Criaturas têm -3m de movimento e não podem fazer Reações.",
    effects: [{ name: "Lentidão Temporal", description: "-3m Movimento / Sem Reações", modifiers: { speed: -3 } }]
  },
  {
    name: "Wind Gust Aura",
    category: "control",
    radius: 3,
    color: "#a1a1aa", // Zinc-400
    shape: "circle",
    targets: "enemies",
    trigger: "Entrada",
    description: "Criaturas que entram fazem teste de Força ou são empurradas 1,5m.",
    effects: [{ name: "Pancada de Vento", description: "Save STR ou Empurrão 1.5m" }]
  },
  {
    name: "Spirit Guardians",
    category: "control",
    radius: 4.5,
    color: "#f472b6", // Pink
    shape: "circle",
    targets: "enemies",
    trigger: "Entrada ou Início do turno",
    description: "Dano contínuo e redução de movimento para inimigos.",
    effects: [{ name: "Guardiões Espirituais", description: "Dano / Movimento Reduzido", modifiers: { speed: -0.5 } }]
  },

  // --- MONSTER / OTHER ---
  {
    name: "Fear Aura",
    category: "control",
    radius: 6,
    color: "#7f1d1d", // Red-900
    shape: "circle",
    targets: "enemies",
    trigger: "Entrada ou Início do turno",
    description: "Criaturas devem passar teste ou ficam amedrontadas.",
    effects: [{ name: "Medo", description: "Teste de Sabedoria ou Amedrontado", conditions: ['frightened'] }]
  },
  {
    name: "Fire Aura",
    category: "offensive",
    radius: 1.5,
    color: "#ef4444", // Red
    shape: "circle",
    targets: "all",
    trigger: "Entrada ou Início do turno",
    description: "Dano de fogo ao aproximar ou iniciar turno.",
    effects: [{ name: "Fogo", description: "Dano de Fogo" }]
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
