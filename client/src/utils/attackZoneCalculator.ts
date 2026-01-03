// utils/attackZoneCalculator.ts

import { Point, Obstacle, Token, GridOptions } from '../types/models';
import {
  AttackZoneConfig,
  AttackZoneResult,
  AttackZonePropagation
} from '../types/attackZone';
import {
  calculateVisibilityPolygon,
  isPointInPolygon,
  getIntersection
} from './geometry';

/**
 * Calcula a área afetada por uma zona de ataque, considerando obstáculos
 */
export const calculateAttackZone = (
  config: AttackZoneConfig,
  obstacles: Obstacle[],
  tokens: Token[],
  grid: GridOptions
): AttackZoneResult => {
  // 1. Calcular área teórica (sem obstáculos)
  const theoreticalArea = calculateTheoreticalArea(config, grid);

  // 2. Aplicar obstáculos baseado no tipo de propagação
  const affectedArea = applyObstacles(theoreticalArea, config, obstacles, grid);

  // 3. Determinar tokens afetados
  const { affectedTokens, blockedTokens } = determineAffectedTokens(
    affectedArea,
    config,
    tokens,
    obstacles,
    grid
  );

  // 4. Filtrar por targeting
  const validTargets = filterByTargeting(affectedTokens, config, tokens);

  // 5. Calcular estatísticas
  const stats = calculateStats(theoreticalArea, affectedArea, affectedTokens, blockedTokens);

  return {
    config,
    affectedArea,
    affectedTokens,
    validTargets,
    blockedTokens,
    stats,
  };
};

/**
 * Calcula a área teórica da zona (sem considerar obstáculos)
 */
const calculateTheoreticalArea = (
  config: AttackZoneConfig,
  grid: GridOptions
): Point[] => {
  const { shape, origin } = config;

  switch (shape) {
    case 'circle':
      return calculateCircleArea(origin, config.radius || 0, grid);

    case 'cone':
      return calculateConeArea(
        origin,
        config.length || 0,
        config.width || 0,
        config.direction || 0,
        config.angle || 53,
        grid
      );

    case 'line':
      return calculateLineArea(
        origin,
        config.length || 0,
        config.width || 1,
        config.direction || 0,
        grid
      );

    case 'square':
      return calculateSquareArea(origin, config.radius || 0, grid);

    case 'rectangle':
      return calculateRectangleArea(
        origin,
        config.length || 0,
        config.width || 0,
        config.direction || 0,
        grid
      );

    case 'polygon':
      return config.points || [];

    default:
      return [];
  }
};

/**
 * Calcula área circular
 */
const calculateCircleArea = (
  center: Point,
  radius: number,
  grid: GridOptions
): Point[] => {
  const points: Point[] = [];
  const segments = Math.max(32, Math.floor(radius * 8)); // Mais segmentos para círculos maiores

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = center.x + Math.cos(angle) * radius * grid.size;
    const y = center.y + Math.sin(angle) * radius * grid.size;
    points.push({ x, y });
  }

  return points;
};

/**
 * Calcula área de cone
 */
const calculateConeArea = (
  origin: Point,
  length: number,
  width: number,
  direction: number,
  angle: number,
  grid: GridOptions
): Point[] => {
  const points: Point[] = [origin];
  const lengthPx = length * grid.size;
  const halfAngle = (angle * Math.PI) / 180 / 2;

  // Número de pontos no arco
  const arcSegments = Math.max(16, Math.floor(length * 4));

  for (let i = 0; i <= arcSegments; i++) {
    const t = i / arcSegments;
    const currentAngle = direction - halfAngle + (halfAngle * 2 * t);
    const distance = lengthPx;

    const x = origin.x + Math.cos(currentAngle) * distance;
    const y = origin.y + Math.sin(currentAngle) * distance;
    points.push({ x, y });
  }

  return points;
};

/**
 * Calcula área de linha
 */
const calculateLineArea = (
  origin: Point,
  length: number,
  width: number,
  direction: number,
  grid: GridOptions
): Point[] => {
  const lengthPx = length * grid.size;
  const widthPx = width * grid.size;
  const halfWidth = widthPx / 2;

  // Direção perpendicular
  const perpDir = direction + Math.PI / 2;

  // 4 cantos do retângulo
  const endX = origin.x + Math.cos(direction) * lengthPx;
  const endY = origin.y + Math.sin(direction) * lengthPx;

  return [
    {
      x: origin.x + Math.cos(perpDir) * halfWidth,
      y: origin.y + Math.sin(perpDir) * halfWidth,
    },
    {
      x: endX + Math.cos(perpDir) * halfWidth,
      y: endY + Math.sin(perpDir) * halfWidth,
    },
    {
      x: endX - Math.cos(perpDir) * halfWidth,
      y: endY - Math.sin(perpDir) * halfWidth,
    },
    {
      x: origin.x - Math.cos(perpDir) * halfWidth,
      y: origin.y - Math.sin(perpDir) * halfWidth,
    },
  ];
};

/**
 * Calcula área quadrada
 */
const calculateSquareArea = (
  center: Point,
  radius: number,
  grid: GridOptions
): Point[] => {
  const size = radius * grid.size;
  const half = size / 2;

  return [
    { x: center.x - half, y: center.y - half },
    { x: center.x + half, y: center.y - half },
    { x: center.x + half, y: center.y + half },
    { x: center.x - half, y: center.y + half },
  ];
};

/**
 * Calcula área retangular
 */
const calculateRectangleArea = (
  origin: Point,
  length: number,
  width: number,
  direction: number,
  grid: GridOptions
): Point[] => {
  return calculateLineArea(origin, length, width, direction, grid);
};

/**
 * Aplica obstáculos à área baseado no tipo de propagação
 */
const applyObstacles = (
  theoreticalArea: Point[],
  config: AttackZoneConfig,
  obstacles: Obstacle[],
  grid: GridOptions
): Point[] => {
  const { propagation, respectsVision, origin } = config;

  // Se penetra paredes, retorna área teórica
  if (propagation === 'penetrating') {
    return theoreticalArea;
  }

  // Filtra apenas obstáculos que bloqueiam
  const blockingObstacles = obstacles.filter(obs =>
    obs.blocksVision || obs.blocksMovement
  );

  if (blockingObstacles.length === 0) {
    return theoreticalArea;
  }

  // Se respeita visão, usa algoritmo de visibilidade
  if (respectsVision && propagation === 'blocked') {
    const maxRadius = calculateMaxRadius(theoreticalArea, origin);
    const visibilityPolygon = calculateVisibilityPolygon(
      origin,
      blockingObstacles,
      maxRadius
    );

    // Intersecção entre área teórica e polígono de visibilidade
    return intersectPolygons(theoreticalArea, visibilityPolygon);
  }

  // Se é "spreading" (bola de fogo), tenta se espalhar ao redor
  if (propagation === 'spreading') {
    return calculateSpreadingArea(theoreticalArea, origin, blockingObstacles, grid);
  }

  // Padrão: bloqueado simples
  return clipPolygonByObstacles(theoreticalArea, blockingObstacles);
};

/**
 * Calcula raio máximo de um polígono a partir da origem
 */
const calculateMaxRadius = (polygon: Point[], origin: Point): number => {
  let maxDist = 0;
  for (const p of polygon) {
    const dist = Math.hypot(p.x - origin.x, p.y - origin.y);
    if (dist > maxDist) maxDist = dist;
  }
  return maxDist;
};

/**
 * Intersecção de dois polígonos (simplificado)
 */
const intersectPolygons = (poly1: Point[], poly2: Point[]): Point[] => {
  // Implementação simplificada: retorna pontos de poly1 que estão dentro de poly2
  // Para produção, usar biblioteca como martinez-polygon-clipping
  const result: Point[] = [];

  for (const p of poly1) {
    if (isPointInPolygon(p, poly2)) {
      result.push(p);
    }
  }

  // Se perdemos muitos pontos, adicionar pontos de poly2 que estão em poly1
  if (result.length < 3) {
    for (const p of poly2) {
      if (isPointInPolygon(p, poly1)) {
        result.push(p);
      }
    }
  }

  return result.length >= 3 ? result : poly1; // Fallback
};

/**
 * Recorta polígono por obstáculos
 */
const clipPolygonByObstacles = (
  polygon: Point[],
  obstacles: Obstacle[]
): Point[] => {
  // Implementação simplificada
  // Para produção completa, usar algoritmo de clipping como Sutherland-Hodgman

  // Por enquanto, remove pontos que estão dentro de obstáculos sólidos
  return polygon.filter(p => {
    for (const obs of obstacles) {
      if (obs.type === 'wall' && !obs.open) {
        if (isPointInPolygon(p, obs.points)) {
          return false;
        }
      }
    }
    return true;
  });
};

/**
 * Calcula área que se espalha ao redor de obstáculos (como bola de fogo)
 */
const calculateSpreadingArea = (
  theoreticalArea: Point[],
  origin: Point,
  obstacles: Obstacle[],
  grid: GridOptions
): Point[] => {
  // Algoritmo simplificado de flood-fill
  // Para cada ponto na borda teórica, verifica se há linha de visão
  // Se bloqueado, tenta "contornar" o obstáculo

  const result: Point[] = [];
  const radius = calculateMaxRadius(theoreticalArea, origin);

  // Amostragem de pontos ao redor da origem
  const samples = 64;
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * Math.PI * 2;
    let currentDist = 0;
    const step = grid.size / 4;

    while (currentDist < radius) {
      currentDist += step;
      const x = origin.x + Math.cos(angle) * currentDist;
      const y = origin.y + Math.sin(angle) * currentDist;
      const point = { x, y };

      // Verifica se há obstáculo bloqueando
      let blocked = false;
      for (const obs of obstacles) {
        if (obs.type === 'wall' && !obs.open) {
          if (isPointInPolygon(point, obs.points)) {
            blocked = true;
            break;
          }
        }
      }

      if (blocked) break;

      if (currentDist >= radius - step) {
        result.push(point);
      }
    }
  }

  return result.length >= 3 ? result : theoreticalArea;
};

/**
 * Determina quais tokens são afetados pela zona
 */
const determineAffectedTokens = (
  affectedArea: Point[],
  config: AttackZoneConfig,
  tokens: Token[],
  obstacles: Obstacle[],
  grid: GridOptions
): { affectedTokens: Token[]; blockedTokens: Token[]; } => {
  const affectedTokens: Token[] = [];
  const blockedTokens: Token[] = [];

  for (const token of tokens) {
    const tokenCenter = {
      x: token.x + (token.size * grid.size) / 2,
      y: token.y + (token.size * grid.size) / 2,
    };

    // Verifica se o centro do token está na área afetada
    const inArea = isPointInPolygon(tokenCenter, affectedArea);

    if (!inArea) continue;

    // Se a propagação é bloqueada, verifica linha de visão da origem ao token
    if (config.propagation === 'blocked' && config.respectsVision) {
      const hasLineOfSight = checkLineOfSight(
        config.origin,
        tokenCenter,
        obstacles
      );

      if (!hasLineOfSight) {
        blockedTokens.push(token);
        continue;
      }
    }

    affectedTokens.push(token);
  }

  return { affectedTokens, blockedTokens };
};

/**
 * Verifica linha de visão entre dois pontos
 */
const checkLineOfSight = (
  p1: Point,
  p2: Point,
  obstacles: Obstacle[]
): boolean => {
  for (const obs of obstacles) {
    if (!obs.blocksVision) continue;

    if (obs.type === 'wall') {
      const points = obs.points;
      const loopCount = obs.open ? points.length - 1 : points.length;

      for (let i = 0; i < loopCount; i++) {
        const w1 = points[i];
        const w2 = points[(i + 1) % points.length];
        if (getIntersection(p1, p2, w1, w2)) {
          return false;
        }
      }
    } else {
      if (getIntersection(p1, p2, obs.p1, obs.p2)) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Filtra tokens por tipo de targeting
 */
const filterByTargeting = (
  affectedTokens: Token[],
  config: AttackZoneConfig,
  allTokens: Token[]
): Token[] => {
  const { targeting, includeTokenIds, excludeTokenIds } = config;

  let filtered = [...affectedTokens];

  // Aplicar filtro de targeting
  if (targeting !== 'all' && targeting !== 'custom') {
    filtered = filtered.filter(token => {
      switch (targeting) {
        case 'allies':
          return token.disposition === 'friendly';
        case 'enemies':
          return token.disposition === 'hostile';
        case 'objects':
          return token.type === 'object';
        default:
          return true;
      }
    });
  }

  // Forçar inclusão
  if (includeTokenIds && includeTokenIds.length > 0) {
    const forcedTokens = allTokens.filter(t =>
      includeTokenIds.includes(t.id) && !filtered.find(ft => ft.id === t.id)
    );
    filtered.push(...forcedTokens);
  }

  // Forçar exclusão
  if (excludeTokenIds && excludeTokenIds.length > 0) {
    filtered = filtered.filter(t => !excludeTokenIds.includes(t.id));
  }

  return filtered;
};

/**
 * Calcula estatísticas da zona
 */
const calculateStats = (
  theoreticalArea: Point[],
  affectedArea: Point[],
  affectedTokens: Token[],
  blockedTokens: Token[]
): AttackZoneResult['stats'] => {
  const theoreticalAreaSize = calculatePolygonArea(theoreticalArea);
  const affectedAreaSize = calculatePolygonArea(affectedArea);

  return {
    totalArea: affectedAreaSize,
    tokenCount: affectedTokens.length,
    blockedCount: blockedTokens.length,
    coveragePercent: theoreticalAreaSize > 0
      ? (affectedAreaSize / theoreticalAreaSize) * 100
      : 100,
  };
};

/**
 * Calcula área de um polígono usando fórmula Shoelace
 */
const calculatePolygonArea = (polygon: Point[]): number => {
  if (polygon.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }

  return Math.abs(area / 2);
};

/**
 * Converte ponto do mundo para grid
 */
export const worldToGrid = (point: Point, grid: GridOptions): Point => {
  return {
    x: Math.floor(point.x / grid.size),
    y: Math.floor(point.y / grid.size),
  };
};

/**
 * Converte ponto do grid para mundo (centro da célula)
 */
export const gridToWorld = (point: Point, grid: GridOptions): Point => {
  return {
    x: point.x * grid.size + grid.size / 2,
    y: point.y * grid.size + grid.size / 2,
  };
};
