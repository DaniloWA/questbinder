import { Obstacle, Point, GridOptions } from '../types';
import { getIntersection, isPointInPolygon } from './geometry';

interface Node {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to end
  f: number; // Total cost
  parent: Node | null;
}

/**
 * Verifica se o segmento de linha entre p1 e p2 colide com algum obstáculo bloqueador de movimento.
 */
const isSegmentBlocked = (p1: Point, p2: Point, obstacles: Obstacle[]): boolean => {
  for (const obs of obstacles) {
    if (!obs.blocksMovement) continue;

    // Se for invisível e GM, talvez queiramos ignorar? 
    // Por padrão pathfinding respeita física, então bloqueia mesmo se invisivel.

    if (obs.type === 'wall') {
      // Verifica colisão com todas as arestas do polígono
      const points = obs.points;
      for (let i = 0; i < points.length; i++) {
        const w1 = points[i];
        const w2 = points[(i + 1) % points.length];
        
        // Não fechar se for 'open' e for o ultimo segmento
        if (obs.open && i === points.length - 1) continue;

        if (getIntersection(p1, p2, w1, w2)) return true;
      }
    } else {
      // Obstáculo de linha (Porta/Janela)
      if (getIntersection(p1, p2, obs.p1, obs.p2)) return true;
    }
  }
  return false;
};

/**
 * Verifica se um ponto está dentro de um obstáculo sólido
 */
const isPointBlocked = (p: Point, obstacles: Obstacle[]): boolean => {
    for (const obs of obstacles) {
        if (!obs.blocksMovement) continue;
        if (obs.type === 'wall' && !obs.open) {
            if (isPointInPolygon(p, obs.points)) return true;
        }
    }
    return false;
}

/**
 * Algoritmo A* para encontrar caminho no Grid
 */
export const findPath = (
  startGrid: Point,
  endGrid: Point,
  grid: GridOptions,
  obstacles: Obstacle[]
): Point[] => {
  // Se inicio == fim, retorna apenas o fim
  if (startGrid.x === endGrid.x && startGrid.y === endGrid.y) return [startGrid];

  const gridSize = grid.size;
  
  // Helper para converter Grid -> World Center
  const toWorld = (gx: number, gy: number) => ({
    x: gx * gridSize + gridSize / 2,
    y: gy * gridSize + gridSize / 2
  });

  // Verifica se o destino é válido (não está DENTRO de uma parede sólida)
  const endWorld = toWorld(endGrid.x, endGrid.y);
  if (isPointBlocked(endWorld, obstacles)) {
      // Se o destino é inválido, tentamos retornar apenas uma linha reta visual 
      // ou paramos no último ponto válido. Por enquanto, retornamos array vazio ou direto para indicar falha visual.
      return [startGrid, endGrid]; 
  }

  const openList: Node[] = [];
  const closedList: Set<string> = new Set();

  const startNode: Node = { x: startGrid.x, y: startGrid.y, g: 0, h: 0, f: 0, parent: null };
  openList.push(startNode);

  // Limite de iterações para evitar travar o navegador em mapas gigantes ou complexos
  let iterations = 0;
  const MAX_ITERATIONS = 3000; 

  while (openList.length > 0) {
    iterations++;
    if (iterations > MAX_ITERATIONS) return [startGrid, endGrid]; // Fallback para linha reta se demorar demais

    // Pega o node com menor F
    openList.sort((a, b) => a.f - b.f);
    const currentNode = openList.shift()!;
    const currentKey = `${currentNode.x},${currentNode.y}`;

    // Chegou no destino?
    if (currentNode.x === endGrid.x && currentNode.y === endGrid.y) {
      const path: Point[] = [];
      let curr: Node | null = currentNode;
      while (curr) {
        path.push({ x: curr.x, y: curr.y });
        curr = curr.parent;
      }
      return path.reverse();
    }

    closedList.add(currentKey);

    // Vizinhos (8 direções)
    const neighbors = [
      { x: 0, y: -1, cost: 1 }, // N
      { x: 0, y: 1, cost: 1 },  // S
      { x: -1, y: 0, cost: 1 }, // W
      { x: 1, y: 0, cost: 1 },  // E
      { x: -1, y: -1, cost: 1.5 }, // NW
      { x: 1, y: -1, cost: 1.5 },  // NE
      { x: -1, y: 1, cost: 1.5 },  // SW
      { x: 1, y: 1, cost: 1.5 },   // SE
    ];

    const currentWorld = toWorld(currentNode.x, currentNode.y);

    for (const n of neighbors) {
      const nx = currentNode.x + n.x;
      const ny = currentNode.y + n.y;
      const nKey = `${nx},${ny}`;

      // Verifica limites do grid (opcional, assumindo mapa infinito ou bounds do grid config)
      if (nx < 0 || ny < 0 || nx >= grid.cols || ny >= grid.rows) continue;

      if (closedList.has(nKey)) continue;

      // Verifica Colisão (Parede entre centro da celula atual e centro da vizinha)
      const neighborWorld = toWorld(nx, ny);
      
      // Otimização: Se for diagonal, verificar se as cardinais adjacentes estão bloqueadas ("espremer" entre paredes)
      // Isso evita passar por quinas impossíveis
      if (n.cost === 1.5) {
          const w1 = toWorld(currentNode.x + n.x, currentNode.y);
          const w2 = toWorld(currentNode.x, currentNode.y + n.y);
          // Se passar perto de uma quina bloqueada, bloqueia a diagonal (regra opcional, mas boa para VTT)
          if (isPointBlocked(w1, obstacles) || isPointBlocked(w2, obstacles)) continue;
      }

      if (isSegmentBlocked(currentWorld, neighborWorld, obstacles)) continue;
      if (isPointBlocked(neighborWorld, obstacles)) continue;

      const gScore = currentNode.g + n.cost;
      
      const existingNode = openList.find(node => node.x === nx && node.y === ny);

      if (!existingNode) {
        // Heurística: Distância Diagonal (Chebyshev/Octile) ou Euclidiana
        const dx = Math.abs(nx - endGrid.x);
        const dy = Math.abs(ny - endGrid.y);
        // Octile distance standard for grid with diagonals
        const h = (dx + dy) + (1.5 - 2) * Math.min(dx, dy);

        openList.push({
          x: nx,
          y: ny,
          g: gScore,
          h: h,
          f: gScore + h,
          parent: currentNode
        });
      } else if (gScore < existingNode.g) {
        existingNode.g = gScore;
        existingNode.f = gScore + existingNode.h;
        existingNode.parent = currentNode;
      }
    }
  }

  // Se não achou caminho (fechado por paredes), retorna linha reta para feedback visual de "bloqueado"
  return [startGrid, endGrid];
};