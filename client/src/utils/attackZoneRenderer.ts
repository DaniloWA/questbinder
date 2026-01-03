// utils/attackZoneRenderer.ts

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
  } = {}
) => {
  const { config, affectedArea, affectedTokens, blockedTokens } = result;
  const {
    showAffectedTokens = true,
    showBlockedTokens = true,
    showStats = false,
    isPreview = false,
    gridSize = 60,
  } = options;

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
      ctx.lineWidth = config.borderWidth;
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    // Efeito de preview (borda animada)
    if (isPreview) {
      ctx.setLineDash([10, 5]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.restore();

  // 2. Highlight em tokens afetados
  if (showAffectedTokens && config.showAffectedTokens) {
    for (const token of affectedTokens) {
      highlightToken(ctx, token, config.affectedTokenColor || 'rgba(0, 255, 0, 0.5)', false, gridSize);
    }
  }

  // 3. Highlight em tokens bloqueados
  if (showBlockedTokens) {
    for (const token of blockedTokens) {
      highlightToken(ctx, token, 'rgba(255, 0, 0, 0.3)', true, gridSize);
    }
  }

  // 4. Renderizar origem
  renderOrigin(ctx, config.origin, config.color);

  // 5. Renderizar direção (para cones e linhas)
  if (config.direction !== undefined && (config.shape === 'cone' || config.shape === 'line')) {
    renderDirection(ctx, config.origin, config.direction, config.length || 0);
  }

  // 6. Renderizar estatísticas
  if (showStats) {
    renderStats(ctx, result);
  }
};

/**
 * Destaca um token
 */
const highlightToken = (
  ctx: CanvasRenderingContext2D,
  token: any,
  color: string,
  isBlocked: boolean = false,
  gridSize: number = 60
) => {
  ctx.save();

  const size = token.size * gridSize;
  const x = token.x * gridSize; // Token x is in grid units
  const y = token.y * gridSize; // Token y is in grid units

  // Círculo ao redor do token
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 5, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = isBlocked ? 2 : 3;
  ctx.globalAlpha = 0.8;

  if (isBlocked) {
    ctx.setLineDash([5, 5]);
  }

  ctx.stroke();
  ctx.setLineDash([]);

  // X vermelho para bloqueados
  if (isBlocked) {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 3;
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
  color: string
) => {
  ctx.save();

  // Círculo externo pulsante
  const time = Date.now();
  const pulse = Math.sin(time * 0.003) * 0.3 + 0.7;

  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 8 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6 * pulse;
  ctx.fill();

  // Círculo interno fixo
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 1;
  ctx.fill();

  // Borda
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
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
  length: number
) => {
  ctx.save();

  const arrowLength = Math.min(length * 60, 100); // Limita tamanho da seta
  const endX = origin.x + Math.cos(direction) * arrowLength;
  const endY = origin.y + Math.sin(direction) * arrowLength;

  // Linha
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ponta da seta
  const arrowSize = 10;
  const angle1 = direction + Math.PI * 0.85;
  const angle2 = direction - Math.PI * 0.85;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX + Math.cos(angle1) * arrowSize, endY + Math.sin(angle1) * arrowSize);
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX + Math.cos(angle2) * arrowSize, endY + Math.sin(angle2) * arrowSize);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
};

/**
 * Renderiza estatísticas da zona
 */
const renderStats = (
  ctx: CanvasRenderingContext2D,
  result: AttackZoneResult
) => {
  const { config, stats } = result;
  const { origin } = config;

  ctx.save();

  // Posição do painel de stats (acima da origem)
  const panelX = origin.x + 20;
  const panelY = origin.y - 80;
  const panelWidth = 180;
  const panelHeight = 70;

  // Fundo
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

  // Borda
  ctx.strokeStyle = config.borderColor || config.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

  // Texto
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'left';

  const padding = 8;
  let textY = panelY + padding + 12;

  ctx.fillText(`Alvos: ${stats.tokenCount}`, panelX + padding, textY);
  textY += 16;
  ctx.fillText(`Bloqueados: ${stats.blockedCount}`, panelX + padding, textY);
  textY += 16;
  ctx.fillText(`Cobertura: ${stats.coveragePercent.toFixed(0)}%`, panelX + padding, textY);

  ctx.restore();
};

/**
 * Renderiza múltiplas zonas
 */
export const renderAttackZones = (
  ctx: CanvasRenderingContext2D,
  results: AttackZoneResult[],
  options: {
    showAffectedTokens?: boolean;
    showBlockedTokens?: boolean;
    showStats?: boolean;
    gridSize?: number;
  } = {}
) => {
  for (const result of results) {
    renderAttackZone(ctx, result, { ...options, isPreview: false });
  }
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
  color: string = 'rgba(255, 255, 255, 0.2)'
) => {
  ctx.save();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

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
  radius: number
) => {
  ctx.save();

  const halfAngle = (angle * Math.PI) / 180 / 2;
  const angle1 = direction - halfAngle;
  const angle2 = direction + halfAngle;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

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
