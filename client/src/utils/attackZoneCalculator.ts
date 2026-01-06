// utils/attackZoneCalculator.ts
// Refactored: Proper obstacle blocking using ray-casting

import { Point, Obstacle, Token, GridOptions } from '../types/models';
import {
  AttackZoneConfig,
  AttackZoneResult,
} from '../types/attackZone';
import {
  getIntersection,
  isPointInPolygon
} from './geometry';

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Calcula a área afetada por uma zona de ataque, considerando obstáculos
 */
export const calculateAttackZone = (
  config: AttackZoneConfig,
  obstacles: Obstacle[],
  tokens: Token[],
  grid: GridOptions
): AttackZoneResult => {
  // 1. Calcular área teórica (sem obstáculos) - tudo em PIXELS
  const theoreticalArea = calculateTheoreticalArea(config, grid);

  // 2. Aplicar obstáculos usando ray-casting apropriado
  const affectedArea = applyObstaclesRayCast(theoreticalArea, config, obstacles, grid);

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

// ============================================================================
// THEORETICAL AREA CALCULATION
// All functions expect origin in WORLD PIXELS, dimensions in GRID UNITS
// ============================================================================

/**
 * Calcula a área teórica da zona (sem considerar obstáculos)
 * config.origin está em PIXELS DE MUNDO
 * config.radius/length/width estão em UNIDADES DE GRID
 */
const calculateTheoreticalArea = (
  config: AttackZoneConfig,
  grid: GridOptions
): Point[] => {
  const { shape, origin } = config;

  switch (shape) {
    case 'circle':
      return calculateCircleArea(origin, (config.radius || 0) * grid.size, 48);

    case 'cone':
      return calculateConeArea(
        origin,
        (config.length || 0) * grid.size,
        config.direction || 0,
        config.angle || 53,
        24
      );

    case 'line':
      return calculateLineArea(
        origin,
        (config.length || 0) * grid.size,
        (config.width || 1) * grid.size,
        config.direction || 0
      );

    case 'square':
      return calculateSquareArea(origin, (config.radius || 0) * grid.size);

    case 'rectangle':
      return calculateLineArea(
        origin,
        (config.length || 0) * grid.size,
        (config.width || 0) * grid.size,
        config.direction || 0
      );

    case 'polygon':
      return config.points || [];

    default:
      return [];
  }
};

/**
 * Calcula área circular
 * @param center Centro em pixels de mundo
 * @param radiusPx Raio em pixels
 * @param segments Número de segmentos para aproximar o círculo
 */
const calculateCircleArea = (
  center: Point,
  radiusPx: number,
  segments: number = 48
): Point[] => {
  const points: Point[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: center.x + Math.cos(angle) * radiusPx,
      y: center.y + Math.sin(angle) * radiusPx
    });
  }

  return points;
};

/**
 * Calcula área de cone
 * @param origin Vértice do cone em pixels de mundo
 * @param lengthPx Comprimento em pixels
 * @param direction Direção em radianos
 * @param angleDeg Ângulo de abertura em graus
 * @param segments Número de segmentos no arco
 */
const calculateConeArea = (
  origin: Point,
  lengthPx: number,
  direction: number,
  angleDeg: number,
  segments: number = 24
): Point[] => {
  const points: Point[] = [origin]; // Começa no vértice
  const halfAngle = (angleDeg * Math.PI) / 180 / 2;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const currentAngle = direction - halfAngle + (halfAngle * 2 * t);
    points.push({
      x: origin.x + Math.cos(currentAngle) * lengthPx,
      y: origin.y + Math.sin(currentAngle) * lengthPx
    });
  }

  return points;
};

/**
 * Calcula área de linha/retângulo
 * @param origin Ponto inicial em pixels de mundo
 * @param lengthPx Comprimento em pixels
 * @param widthPx Largura em pixels
 * @param direction Direção em radianos
 */
const calculateLineArea = (
  origin: Point,
  lengthPx: number,
  widthPx: number,
  direction: number
): Point[] => {
  const halfWidth = widthPx / 2;
  const perpDir = direction + Math.PI / 2;

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
 * Calcula área quadrada centrada
 * @param center Centro em pixels de mundo
 * @param halfSizePx Metade do lado em pixels (radius * gridSize)
 */
const calculateSquareArea = (
  center: Point,
  halfSizePx: number
): Point[] => {
  return [
    { x: center.x - halfSizePx, y: center.y - halfSizePx },
    { x: center.x + halfSizePx, y: center.y - halfSizePx },
    { x: center.x + halfSizePx, y: center.y + halfSizePx },
    { x: center.x - halfSizePx, y: center.y + halfSizePx },
  ];
};

// ============================================================================
// OBSTACLE APPLICATION - RAY-CASTING APPROACH
// ============================================================================

/**
 * Extrai todos os segmentos de linha dos obstáculos que bloqueiam
 */
const extractBlockingSegments = (obstacles: Obstacle[]): { p1: Point; p2: Point; }[] => {
  const segments: { p1: Point; p2: Point; }[] = [];

  for (const obs of obstacles) {
    // Só considera obstáculos que bloqueiam visão ou movimento
    if (!obs.blocksVision && !obs.blocksMovement) continue;

    if (obs.type === 'wall') {
      // Wall = polygon/polyline obstacle with multiple points
      // 'open' significa polilinha (não fecha loop), mas ainda bloqueia!
      const points = obs.points;
      if (points.length >= 2) {
        // Adicionar todos os segmentos entre pontos consecutivos
        for (let i = 0; i < points.length - 1; i++) {
          segments.push({ p1: points[i], p2: points[i + 1] });
        }
        // Se não é "open", adiciona o segmento que fecha o polígono
        if (!obs.open && points.length > 2) {
          segments.push({ p1: points[points.length - 1], p2: points[0] });
        }
      }
    } else if (obs.type === 'door' || obs.type === 'window') {
      // Door/Window = line obstacle with p1, p2
      // Portas/janelas abertas não bloqueiam (passáveis)
      const isOpen = !obs.blocksMovement; // blocksMovement=false significa porta aberta
      if (!isOpen) {
        segments.push({ p1: obs.p1, p2: obs.p2 });
      }
    }
  }

  return segments;
};

/**
 * Encontra a distância até o primeiro obstáculo ao longo de um raio
 * @returns Distância em pixels, ou Infinity se não há bloqueio
 */
const raycastToObstacles = (
  origin: Point,
  direction: number,
  maxDistance: number,
  segments: { p1: Point; p2: Point; }[]
): number => {
  const farPoint: Point = {
    x: origin.x + Math.cos(direction) * maxDistance * 1.1,
    y: origin.y + Math.sin(direction) * maxDistance * 1.1
  };

  let closestDist = Infinity;

  for (const seg of segments) {
    const intersection = getIntersection(origin, farPoint, seg.p1, seg.p2);
    if (intersection) {
      const dist = Math.hypot(intersection.x - origin.x, intersection.y - origin.y);
      if (dist < closestDist && dist > 0.5) { // Evita auto-interseção
        closestDist = dist;
      }
    }
  }

  return closestDist;
};

/**
 * Aplica obstáculos à área teórica usando ray-casting
 * Para cada ponto da área, traça um raio da origem até o ponto
 * Se o raio cruzar um obstáculo, move o ponto para a interseção
 */
const applyObstaclesRayCast = (
  theoreticalArea: Point[],
  config: AttackZoneConfig,
  obstacles: Obstacle[],
  grid: GridOptions
): Point[] => {
  const { propagation, origin } = config;

  // Se penetra paredes, retorna área teórica
  if (propagation === 'penetrating') {
    return theoreticalArea;
  }

  const blockingSegments = extractBlockingSegments(obstacles);

  if (blockingSegments.length === 0) {
    return theoreticalArea;
  }

  // Para formas radiais (circle, cone, square centrado), usar ray-casting por ângulo
  if (config.shape === 'circle' || config.shape === 'cone' ||
    (config.shape === 'square' && isOriginAtCenter(origin, theoreticalArea))) {
    return applyObstaclesRadial(origin, theoreticalArea, blockingSegments, config.shape, grid);
  }

  // Para line/rectangle, usar clipping por segmento
  return applyObstaclesLinear(origin, theoreticalArea, blockingSegments);
};

/**
 * Verifica se a origem está aproximadamente no centro da área
 */
const isOriginAtCenter = (origin: Point, area: Point[]): boolean => {
  if (area.length === 0) return false;

  const cx = area.reduce((sum, p) => sum + p.x, 0) / area.length;
  const cy = area.reduce((sum, p) => sum + p.y, 0) / area.length;

  const dist = Math.hypot(origin.x - cx, origin.y - cy);
  return dist < 10; // Tolerância de 10 pixels
};

/**
 * Aplica obstáculos para formas radiais (circle, cone)
 * Usa ray-casting denso para criar contorno preciso
 */
const applyObstaclesRadial = (
  origin: Point,
  theoreticalArea: Point[],
  segments: { p1: Point; p2: Point; }[],
  shape: string,
  grid: GridOptions
): Point[] => {
  // Determinar ângulos de início e fim baseado na forma
  let startAngle = 0;
  let endAngle = Math.PI * 2;
  let maxRadius = 0;

  // Calcular raio máximo da área teórica
  for (const p of theoreticalArea) {
    const dist = Math.hypot(p.x - origin.x, p.y - origin.y);
    if (dist > maxRadius) maxRadius = dist;
  }

  // Para cone, determinar ângulos a partir dos pontos
  if (shape === 'cone' && theoreticalArea.length >= 3) {
    // O primeiro ponto é a origem, os demais são o arco
    const angles = theoreticalArea.slice(1).map(p =>
      Math.atan2(p.y - origin.y, p.x - origin.x)
    );
    startAngle = Math.min(...angles);
    endAngle = Math.max(...angles);

    // Normalizar para evitar problemas de wrap-around
    if (endAngle - startAngle > Math.PI) {
      // Os ângulos cruzam o -π/π boundary
      const positives = angles.filter(a => a >= 0);
      const negatives = angles.filter(a => a < 0);
      if (positives.length > 0 && negatives.length > 0) {
        startAngle = Math.min(...positives);
        endAngle = Math.max(...negatives) + Math.PI * 2;
      }
    }
  }

  // Número de raios baseado na circunferência
  const numRays = Math.max(48, Math.ceil((endAngle - startAngle) * maxRadius / 10));
  const result: Point[] = [];

  // Para cone, adicionar origem primeiro
  if (shape === 'cone') {
    result.push({ ...origin });
  }

  for (let i = 0; i <= numRays; i++) {
    const t = i / numRays;
    const angle = startAngle + (endAngle - startAngle) * t;

    // Distância teórica para este ângulo
    const theoreticalDist = getRadiusAtAngle(origin, theoreticalArea, angle, maxRadius);

    // Distância até obstáculo mais próximo
    const obstacleDist = raycastToObstacles(origin, angle, maxRadius * 1.5, segments);

    // Usar a menor das duas distâncias
    const finalDist = Math.min(theoreticalDist, obstacleDist);

    if (finalDist > 1) { // Evitar pontos muito próximos da origem
      result.push({
        x: origin.x + Math.cos(angle) * finalDist,
        y: origin.y + Math.sin(angle) * finalDist
      });
    }
  }

  // Garantir que temos pontos suficientes para formar um polígono
  return result.length >= 3 ? result : theoreticalArea;
};

/**
 * Obtém o raio da área teórica para um dado ângulo
 */
const getRadiusAtAngle = (
  origin: Point,
  area: Point[],
  angle: number,
  maxRadius: number
): number => {
  // Criar um ponto muito distante na direção do ângulo
  const farPoint: Point = {
    x: origin.x + Math.cos(angle) * maxRadius * 2,
    y: origin.y + Math.sin(angle) * maxRadius * 2
  };

  let closestDist = maxRadius;

  // Verificar interseção com cada edge do polígono teórico
  for (let i = 0; i < area.length; i++) {
    const j = (i + 1) % area.length;
    const intersection = getIntersection(origin, farPoint, area[i], area[j]);
    if (intersection) {
      const dist = Math.hypot(intersection.x - origin.x, intersection.y - origin.y);
      if (dist < closestDist && dist > 0.5) {
        closestDist = dist;
      }
    }
  }

  return closestDist;
};

/**
 * Aplica obstáculos para formas lineares (line, rectangle)
 * Usa clipping por edge - corta as arestas do polígono nos obstáculos
 */
const applyObstaclesLinear = (
  origin: Point,
  theoreticalArea: Point[],
  segments: { p1: Point; p2: Point; }[]
): Point[] => {
  if (theoreticalArea.length < 3) return theoreticalArea;

  const result: Point[] = [];

  // Para cada aresta do polígono, verificar interseções
  for (let i = 0; i < theoreticalArea.length; i++) {
    const p1 = theoreticalArea[i];
    const p2 = theoreticalArea[(i + 1) % theoreticalArea.length];

    // Encontrar todas as interseções nesta aresta
    const edgeIntersections: { point: Point; t: number; }[] = [];

    for (const seg of segments) {
      const intersection = getIntersectionWithT(p1, p2, seg.p1, seg.p2);
      if (intersection) {
        edgeIntersections.push(intersection);
      }
    }

    // Ordenar interseções pelo parâmetro t (posição na aresta)
    edgeIntersections.sort((a, b) => a.t - b.t);

    // Verificar se p1 está dentro ou fora da área bloqueada
    const p1Blocked = isPointBlockedBySegments(origin, p1, segments);

    if (!p1Blocked) {
      result.push(p1);
    }

    // Adicionar pontos de interseção (entrada/saída de zonas bloqueadas)
    for (const inter of edgeIntersections) {
      result.push(inter.point);
    }
  }

  // Garantir que o polígono tem pontos suficientes
  return result.length >= 3 ? result : theoreticalArea;
};

/**
 * Verifica se há linha de visão entre origem e ponto
 */
const isPointBlockedBySegments = (
  origin: Point,
  target: Point,
  segments: { p1: Point; p2: Point; }[]
): boolean => {
  for (const seg of segments) {
    if (getIntersection(origin, target, seg.p1, seg.p2)) {
      return true;
    }
  }
  return false;
};

/**
 * Versão de getIntersection que também retorna o parâmetro t
 */
const getIntersectionWithT = (
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): { point: Point; t: number; } | null => {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (d === 0) return null;

  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const u = -((p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x)) / d;

  if (t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999) {
    return {
      point: { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) },
      t
    };
  }
  return null;
};

// ============================================================================
// TOKEN DETECTION
// ============================================================================

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

  // Only extract blocking segments if we need to check line of sight
  const shouldCheckLineOfSight = config.propagation !== 'penetrating';
  const blockingSegments = shouldCheckLineOfSight ? extractBlockingSegments(obstacles) : [];

  for (const token of tokens) {
    // Converter posição do token de grid para pixels
    const tokenCenterX = token.x * grid.size + (token.size * grid.size) / 2;
    const tokenCenterY = token.y * grid.size + (token.size * grid.size) / 2;
    const tokenCenter = { x: tokenCenterX, y: tokenCenterY };

    // Verifica se o centro do token está na área afetada
    const inArea = isPointInPolygon(tokenCenter, affectedArea);

    if (!inArea) continue;

    // Para 'penetrating', não verifica linha de visão - atravessa tudo
    // Para 'blocked' e 'spreading', verifica se há obstáculo entre origem e token
    if (shouldCheckLineOfSight && blockingSegments.length > 0) {
      const hasLineOfSight = !isRayBlocked(config.origin, tokenCenter, blockingSegments);

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
 * Verifica se um raio entre dois pontos é bloqueado por algum segmento
 */
const isRayBlocked = (
  p1: Point,
  p2: Point,
  segments: { p1: Point; p2: Point; }[]
): boolean => {
  for (const seg of segments) {
    if (getIntersection(p1, p2, seg.p1, seg.p2)) {
      return true;
    }
  }
  return false;
};

// ============================================================================
// TARGETING FILTER
// ============================================================================

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

// ============================================================================
// STATISTICS
// ============================================================================

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

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

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
