// types/attackZone.ts

import { Point, Token } from './models';

/**
 * Tipo de forma da zona de ataque
 */
export type AttackZoneShape =
  | 'circle'      // Círculo/Esfera (ex: Bola de Fogo)
  | 'cone'        // Cone (ex: Burning Hands)
  | 'line'        // Linha (ex: Lightning Bolt)
  | 'square'      // Quadrado/Cubo
  | 'rectangle'   // Retângulo personalizado
  | 'polygon';    // Polígono customizado

/**
 * Tipo de propagação da zona
 */
export type AttackZonePropagation =
  | 'blocked'     // Bloqueado por paredes (padrão)
  | 'penetrating' // Penetra paredes
  | 'spreading';  // Se espalha ao redor de obstáculos

/**
 * Tipo de targeting
 */
export type AttackZoneTargeting =
  | 'all'         // Todos os tokens
  | 'allies'      // Apenas aliados
  | 'enemies'     // Apenas inimigos
  | 'objects'     // Apenas objetos
  | 'custom';     // Seleção manual

/**
 * Configuração de uma zona de ataque
 */
export interface AttackZoneConfig {
  // Identificação
  id: string;
  name: string;
  description?: string;

  // Forma e Dimensões
  shape: AttackZoneShape;
  isVisible?: boolean;       // Visibilidade (para GM esconder a zona)
  radius?: number;           // Para circle (em grid units)
  length?: number;           // Para line, rectangle (em grid units)
  width?: number;            // Para cone, rectangle (em grid units)
  angle?: number;            // Para cone (em graus)
  direction?: number;        // Direção em radianos (0 = direita)
  points?: Point[];          // Para polygon customizado

  // Origem
  origin: Point;             // Ponto de origem da zona
  sourceTokenId?: string;    // Token que originou (opcional)

  // Comportamento
  propagation: AttackZonePropagation;
  respectsVision: boolean;   // Se usa cálculo de visibilidade
  maxRange?: number;         // Alcance máximo da origem (para validação)

  // Targeting
  targeting: AttackZoneTargeting;
  includeTokenIds?: string[]; // Forçar inclusão de tokens específicos
  excludeTokenIds?: string[]; // Forçar exclusão de tokens específicos

  // Visual
  color: string;             // Cor da zona (rgba)
  opacity: number;           // Opacidade (0-1)
  borderColor?: string;      // Cor da borda
  borderWidth?: number;      // Largura da borda
  showAffectedTokens?: boolean; // Highlight nos tokens afetados
  affectedTokenColor?: string;  // Cor do highlight

  // Metadata
  damageFormula?: string;    // Ex: "8d6"
  damageType?: string;       // Ex: "fire", "cold", "thunder"
  saveType?: string;         // Ex: "dex", "con"
  saveDC?: number;           // DC do saving throw
  effectIds?: string[];      // IDs de efeitos a aplicar
}

/**
 * Resultado do cálculo de uma zona de ataque
 */
export interface AttackZoneResult {
  config: AttackZoneConfig;

  // Área afetada (polígono final considerando obstáculos)
  affectedArea: Point[];

  // Tokens dentro da zona
  affectedTokens: Token[];

  // Tokens que podem ser alvos (considerando targeting)
  validTargets: Token[];

  // Tokens bloqueados por obstáculos
  blockedTokens: Token[];

  // Estatísticas
  stats: {
    totalArea: number;        // Área em grid units²
    tokenCount: number;       // Total de tokens afetados
    blockedCount: number;     // Total de tokens bloqueados
    coveragePercent: number;  // % da área teórica coberta
  };
}

/**
 * Template de zona de ataque pré-configurada
 */
export interface AttackZoneTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: 'spell' | 'ability' | 'weapon' | 'environmental';

  // Configuração base
  defaultConfig: Partial<AttackZoneConfig>;

  // Campos customizáveis pelo usuário
  customizableFields: (keyof AttackZoneConfig)[];

  // Metadata para UI
  spellLevel?: number;
  schoolOfMagic?: string;
  source?: string; // Ex: "PHB p.241"
}

/**
 * Preset comum de zonas de ataque (D&D 5e)
 */
export const ATTACK_ZONE_PRESETS: AttackZoneTemplate[] = [
  {
    id: 'fireball',
    name: 'Bola de Fogo',
    description: 'Explosão de fogo em área de 20 pés de raio',
    category: 'spell',
    spellLevel: 3,
    schoolOfMagic: 'Evocação',
    defaultConfig: {
      shape: 'circle',
      radius: 4, // 20 pés = 4 quadrados
      propagation: 'spreading', // Fogo se espalha ao redor de cantos
      respectsVision: false,
      targeting: 'all',
      color: 'rgba(255, 100, 0, 0.4)',
      borderColor: 'rgba(255, 50, 0, 0.8)',
      borderWidth: 2,
      damageFormula: '8d6',
      damageType: 'fire',
      saveType: 'dex',
      saveDC: 15,
    },
    customizableFields: ['radius', 'saveDC', 'origin'],
  },
  {
    id: 'cone_of_cold',
    name: 'Cone de Frio',
    description: 'Cone de 60 pés de ar gélido',
    category: 'spell',
    spellLevel: 5,
    schoolOfMagic: 'Evocação',
    defaultConfig: {
      shape: 'cone',
      length: 12, // 60 pés
      width: 12,  // Largura na ponta
      angle: 53,  // ~53° para cone de D&D
      propagation: 'blocked',
      respectsVision: true,
      targeting: 'all',
      color: 'rgba(100, 200, 255, 0.3)',
      borderColor: 'rgba(50, 150, 255, 0.8)',
      borderWidth: 2,
      damageFormula: '8d8',
      damageType: 'cold',
      saveType: 'con',
      saveDC: 17,
    },
    customizableFields: ['direction', 'saveDC', 'origin'],
  },
  {
    id: 'lightning_bolt',
    name: 'Raio',
    description: 'Linha de 100 pés de eletricidade',
    category: 'spell',
    spellLevel: 3,
    schoolOfMagic: 'Evocação',
    defaultConfig: {
      shape: 'line',
      length: 20, // 100 pés
      width: 1,   // 5 pés de largura
      propagation: 'blocked',
      respectsVision: true,
      targeting: 'all',
      color: 'rgba(100, 100, 255, 0.4)',
      borderColor: 'rgba(200, 200, 255, 0.9)',
      borderWidth: 2,
      damageFormula: '8d6',
      damageType: 'lightning',
      saveType: 'dex',
      saveDC: 15,
    },
    customizableFields: ['direction', 'saveDC', 'origin'],
  },
  {
    id: 'burning_hands',
    name: 'Mãos Flamejantes',
    description: 'Cone de 15 pés de chamas',
    category: 'spell',
    spellLevel: 1,
    schoolOfMagic: 'Evocação',
    defaultConfig: {
      shape: 'cone',
      length: 3, // 15 pés
      width: 3,
      angle: 53,
      propagation: 'blocked',
      respectsVision: true,
      targeting: 'all',
      color: 'rgba(255, 150, 0, 0.4)',
      borderColor: 'rgba(255, 100, 0, 0.8)',
      borderWidth: 2,
      damageFormula: '3d6',
      damageType: 'fire',
      saveType: 'dex',
      saveDC: 13,
    },
    customizableFields: ['direction', 'saveDC', 'origin'],
  },
  {
    id: 'thunderwave',
    name: 'Onda Trovejante',
    description: 'Cubo de 15 pés de energia sônica',
    category: 'spell',
    spellLevel: 1,
    schoolOfMagic: 'Evocação',
    defaultConfig: {
      shape: 'square',
      radius: 3, // 15 pés = 3 quadrados
      propagation: 'blocked',
      respectsVision: false,
      targeting: 'all',
      color: 'rgba(150, 150, 255, 0.3)',
      borderColor: 'rgba(100, 100, 255, 0.8)',
      borderWidth: 2,
      damageFormula: '2d8',
      damageType: 'thunder',
      saveType: 'con',
      saveDC: 13,
    },
    customizableFields: ['direction', 'saveDC', 'origin'],
  },
];
