// utils/attackZoneRenderer.ts
// Refactored: Proper zoom scaling and improved visual feedback

import { Point } from '../types/models';
import { AttackZoneResult } from '../types/attackZone';

/**
 * Renderiza uma zona de ataque no canvas
 */
export const renderAttackZone = (
  ctx: CanvasRenderingContext2D,
  result: AttackZoneResult,
  options: {
    showAffectedTokens?: boolean;
    showBlockedTokens?: boolean;
    showStats?: boolean;
    isPreview?: boolean;
    gridSize?: number;
    zoom?: number;
  } = {}
) => {
  const { config, affectedArea, affectedTokens, blockedTokens } = result;
  const {
    showAffectedTokens = true,
    showBlockedTokens = true,
    showStats = false,
    isPreview = false,
    gridSize = 60,
    zoom = 1,
  } = options;

  // Fator de escala para linhas e elementos visuais
  const z = zoom;

  ctx.save();

  // 1. Renderizar área afetada
  if (affectedArea.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(affectedArea[0].x, affectedArea[0].y);
    for (let i = 1; i < affectedArea.length; i++) {
      ctx.lineTo(affectedArea[i].x, affectedArea[i].y);
    }
    ctx.closePath();

    // Preenchimento
    ctx.fillStyle = config.color;
    ctx.globalAlpha = config.opacity;
    ctx.fill();

    // Borda
    if (config.borderColor && config.borderWidth) {
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = (config.borderWidth || 2) / z;
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    // Efeito de preview (borda animada)
    if (isPreview) {
      const time = Date.now();
      const dashOffset = (time / 50) % 30;
      ctx.setLineDash([10 / z, 5 / z]);
      ctx.lineDashOffset = dashOffset;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2 / z;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.restore();

  // 2. Highlight em tokens afetados
  if (showAffectedTokens && config.showAffectedTokens) {
    for (const token of affectedTokens) {
      highlightToken(ctx, token, config.affectedTokenColor || 'rgba(0, 255, 0, 0.5)', false, gridSize, z);
    }
  }

  // 3. Highlight em tokens bloqueados
  if (showBlockedTokens) {
    for (const token of blockedTokens) {
      highlightToken(ctx, token, 'rgba(255, 0, 0, 0.3)', true, gridSize, z);
    }
  }

  // 4. Renderizar origem
  renderOrigin(ctx, config.origin, config.color, z);

  // 5. Renderizar direção (para cones e linhas)
  if (config.direction !== undefined && (config.shape === 'cone' || config.shape === 'line')) {
    renderDirection(ctx, config.origin, config.direction, (config.length || 0) * gridSize, z);
  }

  // 6. Renderizar estatísticas
  if (showStats) {
    renderStats(ctx, result, z);
  }
};

/**
 * Destaca um token respeitando sua forma (circle, square, hex, topdown)
 */
const highlightToken = (
  ctx: CanvasRenderingContext2D,
  token: any,
  color: string,
  isBlocked: boolean = false,
  gridSize: number = 60,
  zoom: number = 1
) => {
  ctx.save();

  const size = token.size * gridSize;
  const x = token.x * gridSize;
  const y = token.y * gridSize;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const padding = 5 / zoom;
  const shape = token.shape || 'circle';

  ctx.strokeStyle = color;
  ctx.lineWidth = (isBlocked ? 2 : 3) / zoom;
  ctx.globalAlpha = 0.8;

  if (isBlocked) {
    ctx.setLineDash([5 / zoom, 5 / zoom]);
  }

  ctx.beginPath();

  switch (shape) {
    case 'square':
      // Square highlight
      ctx.rect(x - padding, y - padding, size + padding * 2, size + padding * 2);
      break;

    case 'hex':
      // Hexagon highlight
      const hexRadius = size / 2 + padding;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2;
        const hx = centerX + Math.cos(angle) * hexRadius;
        const hy = centerY + Math.sin(angle) * hexRadius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      break;

    case 'circle':
    default:
      // Circle highlight (default)
      ctx.arc(centerX, centerY, size / 2 + padding, 0, Math.PI * 2);
      break;
  }

  ctx.stroke();
  ctx.setLineDash([]);

  // X vermelho para bloqueados
  if (isBlocked) {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 3 / zoom;
    const offset = size * 0.3;
    ctx.beginPath();
    ctx.moveTo(x + offset, y + offset);
    ctx.lineTo(x + size - offset, y + size - offset);
    ctx.moveTo(x + size - offset, y + offset);
    ctx.lineTo(x + offset, y + size - offset);
    ctx.stroke();
  }

  ctx.restore();
};

/**
 * Renderiza ponto de origem
 */
const renderOrigin = (
  ctx: CanvasRenderingContext2D,
  origin: Point,
  color: string,
  zoom: number = 1
) => {
  ctx.save();

  // Círculo externo pulsante
  const time = Date.now();
  const pulse = Math.sin(time * 0.003) * 0.3 + 0.7;

  ctx.beginPath();
  ctx.arc(origin.x, origin.y, (8 * pulse) / zoom, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6 * pulse;
  ctx.fill();

  // Círculo interno fixo
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 4 / zoom, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 1;
  ctx.fill();

  // Borda
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 / zoom;
  ctx.stroke();

  ctx.restore();
};

/**
 * Renderiza indicador de direção
 */
const renderDirection = (
  ctx: CanvasRenderingContext2D,
  origin: Point,
  direction: number,
  lengthPx: number,
  zoom: number = 1
) => {
  ctx.save();

  const arrowLength = Math.min(lengthPx, 100 / zoom);
  const endX = origin.x + Math.cos(direction) * arrowLength;
  const endY = origin.y + Math.sin(direction) * arrowLength;

  // Linha
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2 / zoom;
  ctx.setLineDash([5 / zoom, 5 / zoom]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ponta da seta
  const arrowSize = 10 / zoom;
  const angle1 = direction + Math.PI * 0.85;
  const angle2 = direction - Math.PI * 0.85;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX + Math.cos(angle1) * arrowSize, endY + Math.sin(angle1) * arrowSize);
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX + Math.cos(angle2) * arrowSize, endY + Math.sin(angle2) * arrowSize);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2 / zoom;
  ctx.stroke();

  ctx.restore();
};

/**
 * Renderiza estatísticas da zona
 */
const renderStats = (
  ctx: CanvasRenderingContext2D,
  result: AttackZoneResult,
  zoom: number = 1
) => {
  const { config, stats } = result;
  const { origin } = config;

  ctx.save();

  // Posição do painel de stats (acima da origem)
  const panelX = origin.x + 20 / zoom;
  const panelY = origin.y - 80 / zoom;
  const panelWidth = 180 / zoom;
  const panelHeight = 70 / zoom;

  // Fundo
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

  // Borda
  ctx.strokeStyle = config.borderColor || config.color;
  ctx.lineWidth = 2 / zoom;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

  // Texto
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${12 / zoom}px Inter, sans-serif`;
  ctx.textAlign = 'left';

  const padding = 8 / zoom;
  let textY = panelY + padding + 12 / zoom;

  ctx.fillText(`Alvos: ${stats.tokenCount}`, panelX + padding, textY);
  textY += 16 / zoom;
  ctx.fillText(`Bloqueados: ${stats.blockedCount}`, panelX + padding, textY);
  textY += 16 / zoom;
  ctx.fillText(`Cobertura: ${stats.coveragePercent.toFixed(0)}%`, panelX + padding, textY);

  ctx.restore();
};

/**
 * Renderiza múltiplas zonas com highlights empilhados
 * Quando um token é afetado por múltiplas zonas, cada uma adiciona um anel concêntrico
 */
export const renderAttackZones = (
  ctx: CanvasRenderingContext2D,
  results: AttackZoneResult[],
  options: {
    showAffectedTokens?: boolean;
    showBlockedTokens?: boolean;
    showStats?: boolean;
    gridSize?: number;
    zoom?: number;
  } = {}
) => {
  const {
    showAffectedTokens = true,
    showBlockedTokens = true,
    showStats = false,
    gridSize = 60,
    zoom = 1
  } = options;

  // Coletar todos os tokens afetados e suas cores por zona
  const tokenHighlights: Map<string, { token: any; colors: string[]; blockedBy: string[]; }> = new Map();

  for (const result of results) {
    const { config, affectedTokens, blockedTokens } = result;

    // Renderizar a zona em si (área, origem, direção, stats)
    renderAttackZoneShape(ctx, result, { gridSize, zoom, showStats, isPreview: false });

    // Coletar highlights se habilitado
    if (showAffectedTokens && config.showAffectedTokens) {
      for (const token of affectedTokens) {
        const existing = tokenHighlights.get(token.id) || { token, colors: [], blockedBy: [] };
        existing.colors.push(config.affectedTokenColor || 'rgba(0, 255, 0, 0.5)');
        tokenHighlights.set(token.id, existing);
      }
    }

    // Coletar tokens bloqueados
    if (showBlockedTokens) {
      for (const token of blockedTokens) {
        const existing = tokenHighlights.get(token.id) || { token, colors: [], blockedBy: [] };
        existing.blockedBy.push(config.id);
        tokenHighlights.set(token.id, existing);
      }
    }
  }

  // Renderizar highlights empilhados
  for (const [tokenId, data] of tokenHighlights) {
    const { token, colors, blockedBy } = data;

    // Renderizar cada camada de highlight (do maior para o menor)
    colors.forEach((color, index) => {
      highlightTokenStacked(ctx, token, color, index, colors.length, gridSize, zoom);
    });

    // Se está bloqueado por alguma zona, mostrar X
    if (blockedBy.length > 0) {
      highlightTokenBlocked(ctx, token, gridSize, zoom);
    }
  }
};

/**
 * Renderiza apenas a forma da zona (sem highlights de tokens)
 */
const renderAttackZoneShape = (
  ctx: CanvasRenderingContext2D,
  result: AttackZoneResult,
  options: {
    gridSize?: number;
    zoom?: number;
    showStats?: boolean;
    isPreview?: boolean;
  } = {}
) => {
  const { config, affectedArea } = result;
  const {
    gridSize = 60,
    zoom = 1,
    showStats = false,
    isPreview = false,
  } = options;

  const z = zoom;

  ctx.save();

  // 1. Renderizar área afetada
  if (affectedArea.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(affectedArea[0].x, affectedArea[0].y);
    for (let i = 1; i < affectedArea.length; i++) {
      ctx.lineTo(affectedArea[i].x, affectedArea[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = config.color;
    ctx.globalAlpha = config.opacity;
    ctx.fill();

    if (config.borderColor && config.borderWidth) {
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = (config.borderWidth || 2) / z;
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    if (isPreview) {
      const time = Date.now();
      const dashOffset = (time / 50) % 30;
      ctx.setLineDash([10 / z, 5 / z]);
      ctx.lineDashOffset = dashOffset;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2 / z;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.restore();

  // 2. Renderizar origem
  renderOrigin(ctx, config.origin, config.color, z);

  // 3. Renderizar direção
  if (config.direction !== undefined && (config.shape === 'cone' || config.shape === 'line')) {
    renderDirection(ctx, config.origin, config.direction, (config.length || 0) * gridSize, z);
  }

  // 4. Renderizar estatísticas
  if (showStats) {
    renderStats(ctx, result, z);
  }
};

/**
 * Destaca um token com highlight empilhado (camadas concêntricas)
 */
const highlightTokenStacked = (
  ctx: CanvasRenderingContext2D,
  token: any,
  color: string,
  layerIndex: number,
  totalLayers: number,
  gridSize: number = 60,
  zoom: number = 1
) => {
  ctx.save();

  const size = token.size * gridSize;
  const x = token.x * gridSize;
  const y = token.y * gridSize;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const shape = token.shape || 'circle';

  // Cada camada adiciona um offset de 3 pixels
  const baseOffset = 4 / zoom;
  const layerOffset = (layerIndex * 3) / zoom;
  const padding = baseOffset + layerOffset;

  // Largura da linha mais fina quando há múltiplas camadas
  const lineWidth = totalLayers > 1 ? 2 / zoom : 3 / zoom;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = 0.9;

  ctx.beginPath();

  switch (shape) {
    case 'square':
      ctx.rect(x - padding, y - padding, size + padding * 2, size + padding * 2);
      break;

    case 'hex':
      const hexRadius = size / 2 + padding;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2;
        const hx = centerX + Math.cos(angle) * hexRadius;
        const hy = centerY + Math.sin(angle) * hexRadius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      break;

    case 'circle':
    case 'topdown':
    default:
      ctx.arc(centerX, centerY, size / 2 + padding, 0, Math.PI * 2);
      break;
  }

  ctx.stroke();
  ctx.restore();
};

/**
 * Renderiza o X de bloqueado em um token
 */
const highlightTokenBlocked = (
  ctx: CanvasRenderingContext2D,
  token: any,
  gridSize: number = 60,
  zoom: number = 1
) => {
  ctx.save();

  const size = token.size * gridSize;
  const x = token.x * gridSize;
  const y = token.y * gridSize;

  ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.lineWidth = 3 / zoom;
  const offset = size * 0.3;

  ctx.beginPath();
  ctx.moveTo(x + offset, y + offset);
  ctx.lineTo(x + size - offset, y + size - offset);
  ctx.moveTo(x + size - offset, y + offset);
  ctx.lineTo(x + offset, y + size - offset);
  ctx.stroke();

  ctx.restore();
};

/**
 * Renderiza zona de preview
 */
export const renderPreviewZone = (
  ctx: CanvasRenderingContext2D,
  result: AttackZoneResult,
  options: {
    showAffectedTokens?: boolean;
    showBlockedTokens?: boolean;
    showStats?: boolean;
    gridSize?: number;
    zoom?: number;
  } = {}
) => {
  renderAttackZone(ctx, result, { ...options, isPreview: true });
};

/**
 * Renderiza grid de alcance (círculos concêntricos)
 */
export const renderRangeGrid = (
  ctx: CanvasRenderingContext2D,
  origin: Point,
  maxRange: number,
  gridSize: number,
  color: string = 'rgba(255, 255, 255, 0.2)',
  zoom: number = 1
) => {
  ctx.save();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([5 / zoom, 5 / zoom]);

  for (let i = 1; i <= maxRange; i++) {
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, i * gridSize, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.restore();
};

/**
 * Renderiza indicadores de ângulo (para cones)
 */
export const renderAngleIndicators = (
  ctx: CanvasRenderingContext2D,
  origin: Point,
  direction: number,
  angle: number,
  radius: number,
  zoom: number = 1
) => {
  ctx.save();

  const halfAngle = (angle * Math.PI) / 180 / 2;
  const angle1 = direction - halfAngle;
  const angle2 = direction + halfAngle;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([3 / zoom, 3 / zoom]);

  // Linha esquerda
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(
    origin.x + Math.cos(angle1) * radius,
    origin.y + Math.sin(angle1) * radius
  );
  ctx.stroke();

  // Linha direita
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(
    origin.x + Math.cos(angle2) * radius,
    origin.y + Math.sin(angle2) * radius
  );
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.restore();
};
