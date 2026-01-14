import { RenderContext } from './types';
import { getToolIcon } from '../../../../../constants/toolIcons'; // ../../../ from renderers matches ../../ from hooks? 
// Original: hooks/useMapRender.ts -> ../../constants/toolIcons
// renderers is hooks/renderers. So ../../../constants/toolIcons. Correct.

export const renderCursorOverlays = (
  ctx: CanvasRenderingContext2D,
  renderData: any, // { position, isContexting, activeTool, isAfk, isChatting }
  zoom: number
) => {
  const { position, isContexting, activeTool, isAfk, isChatting } = renderData;

  // Context Menu Indicator
  if (isContexting) {
    ctx.save();
    ctx.translate(position.x + 15 / zoom, position.y - 15 / zoom);
    ctx.scale(1 / zoom, 1 / zoom);

    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;

    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.strokeStyle = '#333333'; ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-4, 0, 1.5, 0, Math.PI * 2);
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.arc(4, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Active Tool
  if (activeTool && activeTool !== 'select' && activeTool !== 'pan' && activeTool !== 'combat') {
    ctx.save();
    ctx.translate(position.x + 15 / zoom, position.y + 15 / zoom);
    ctx.scale(1 / zoom, 1 / zoom);

    const iconChar = getToolIcon(activeTool);
    if (iconChar && iconChar !== '🔧') {
      ctx.font = '20px sans-serif';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 3;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconChar, 0, 0);
    } else if (activeTool === 'wand') {
      ctx.font = '20px sans-serif';
      ctx.fillText('✨', 0, 0);
    }
    ctx.restore();
  }

  // AFK
  if (isAfk) {
    ctx.save();
    ctx.translate(position.x, position.y - 50 / zoom);
    ctx.scale(1 / zoom, 1 / zoom);

    const time = Date.now();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.font = 'bold 32px sans-serif'; // Larger Zzz

    [0, 600, 1200].forEach((offset, i) => {
      const age = (time + offset) % 2000;
      const progress = age / 2000;
      const y = -progress * 30; // Float higher
      const alpha = 1 - progress;
      const x = Math.sin(progress * Math.PI * 2) * 10;
      const sizeC = 1 - (i * 0.2); // Vary size

      ctx.globalAlpha = alpha;
      ctx.font = `bold ${Math.max(16, 32 * sizeC)}px sans-serif`;
      ctx.fillText('Z', x, y);
    });
    ctx.restore();
  }



  // Status (Chat/Combat)
  if (isChatting || activeTool === 'combat') {
    ctx.save();
    ctx.translate(position.x - 15 / zoom, position.y - 15 / zoom);
    ctx.scale(1 / zoom, 1 / zoom);

    const statusIcon = isChatting ? '💬' : '⚔️';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 3;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(statusIcon, 0, 0);
    ctx.restore();
  }
};
