// drawBadge handles specific badge logic, but viewport grouping has specific "stacked" badges
// Let's modify canvasHelpers to export getContrastColor if needed or import from utils/colors

import { getContrastColor } from '../../../../../utils/colors';

import { User } from '../../../../../types';

export const renderRemoteViewports = (
  ctx: CanvasRenderingContext2D,
  remoteViewports: Record<string, { x: number, y: number, zoom: number, w: number, h: number; }>,
  remoteCursors: Record<string, any> | undefined,
  currentUserId: string | undefined, // or User | null
  permissions: any,
  isGM: boolean,
  zoom: number,
  players: User[] | undefined
) => {
  if (!remoteViewports) return;

  // Group viewports by proximity
  // Logic copied from original
  const groups: { [key: string]: string[]; } = {};
  const threshold = 50 / zoom;

  const visibleViewports = Object.entries(remoteViewports).filter(([uid, vp]) => {
    if (uid === currentUserId) return false;

    // Permission checks
    const remoteUserOverrides = permissions?.userOverrides?.[uid];
    const isSharing = remoteUserOverrides?.shareViewport !== undefined
      ? remoteUserOverrides.shareViewport
      : (permissions?.shareViewport ?? true);

    if (!isSharing && !isGM) return false;
    return isGM || permissions?.showRemoteViewports;
  });

  visibleViewports.forEach(([uid, vp]) => {
    let added = false;
    for (const key in groups) {
      const [otherUid] = groups[key];
      const otherVp = remoteViewports[otherUid];
      if (Math.abs(vp.x - otherVp.x) < threshold && Math.abs(vp.y - otherVp.y) < threshold) {
        groups[key].push(uid);
        added = true;
        break;
      }
    }
    if (!added) {
      groups[uid] = [uid];
    }
  });

  // Render groups
  Object.entries(groups).forEach(([leaderId, uids]) => {
    const vp = remoteViewports[leaderId];
    const wx = -vp.x / vp.zoom;
    const wy = -vp.y / vp.zoom;
    const ww = vp.w / vp.zoom;
    const wh = vp.h / vp.zoom;

    // Resolve Leader Color
    const cursor = remoteCursors ? remoteCursors[leaderId] : null;
    let color = cursor?.userColor;
    if (!color && players) {
      const p = players.find(u => u.id === leaderId);
      if (p) color = p.color;
    }
    color = color || '#808080';

    // Check if leader is AFK - apply fade to viewport
    const isAfk = cursor?.isAfk ?? false;

    ctx.save();
    ctx.globalAlpha = isAfk ? 0.25 : 1.0; // Fade when AFK
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([10 / zoom, 5 / zoom]);
    ctx.strokeRect(wx, wy, ww, wh);

    // Stacked Labels
    const fontSize = 12 / zoom;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const padding = 4 / zoom;
    let currentXOffset = 0;

    uids.forEach((uid) => {
      const uCursor = remoteCursors ? remoteCursors[uid] : null;

      let uName = uCursor?.userName;
      let uColor = uCursor?.userColor;

      // Fallback to players list if cursor data is missing
      if ((!uName || !uColor) && players) {
        const p = players.find(u => u.id === uid);
        if (p) {
          if (!uName) uName = p.name;
          if (!uColor) uColor = p.color;
        }
      }

      uName = uName || 'Player';
      uColor = uColor || '#808080';

      const textMetrics = ctx.measureText(uName);
      const tagW = textMetrics.width + padding * 2;
      const tagH = fontSize + padding * 2;

      // Position accumulating offset
      const tagX = wx + currentXOffset;

      // Update offset for next label
      currentXOffset += tagW + (5 / zoom);

      ctx.fillStyle = uColor;
      ctx.fillRect(tagX, wy, tagW, tagH);

      ctx.fillStyle = getContrastColor(uColor);
      ctx.textBaseline = 'top';
      ctx.fillText(uName, tagX + padding, wy + padding);
    });

    ctx.restore();
  });
};
