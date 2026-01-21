// drawBadge handles specific badge logic, but viewport grouping has specific "stacked" badges
// Let's modify canvasHelpers to export getContrastColor if needed or import from utils/colors

import { getContrastColor } from '../../../../../utils/colors';
import { User } from '../../../../../types';

export const renderRemoteViewports = (
  ctx: CanvasRenderingContext2D,
  remoteCursors: Record<string, any> | undefined,
  remoteViewportsMap: Record<string, { x: number, y: number, zoom: number, w: number, h: number; }> | undefined,
  currentUserId: string | undefined,
  permissions: any,
  isGM: boolean,
  zoom: number,
  players: User[]
) => {
  if (!players || players.length === 0) return;

  // 1. Extract viewports from players array (Source of Truth)
  // We prioritize the 'players' Sync data, but can augment with 'remoteCursors' if needed
  const remoteViewports: Record<string, { x: number, y: number, zoom: number, w: number, h: number; }> = {};

  players.forEach(p => {
    // Skip current user (local viewport)
    if (p.id === currentUserId) return;

    // Check if player has a viewport synced (via User object OR legacy prop)
    const vpFromUser = p.viewport;
    const vpFromMap = remoteViewportsMap ? remoteViewportsMap[p.id] : undefined;
    const viewport = vpFromUser || vpFromMap;

    if (viewport) {
      remoteViewports[p.id] = {
        x: viewport.x,
        y: viewport.y,
        zoom: viewport.zoom,
        w: (viewport as any).w || 1920, // Default width if not synced
        h: (viewport as any).h || 1080  // Default height if not synced
      };
    }
  });

  // 2. Filter visible viewports based on Permissions
  const visibleViewports = Object.entries(remoteViewports).filter(([uid, vp]) => {
    // GM can always see everyone (unless specific override hides it?)
    // Usually GM sees all.
    if (isGM) return true;

    // For players, check if "Show Remote Viewports" is enabled globally
    if (!permissions?.showRemoteViewports) return false;

    // Check individual user connection sharing setting
    // We look at the remote user's permission override if they have opted out of sharing
    const remoteUserOverrides = permissions?.userOverrides?.[uid];
    const isSharing = remoteUserOverrides?.shareViewport !== undefined
      ? remoteUserOverrides.shareViewport
      : (permissions?.shareViewport ?? true); // Default to true if not specified

    return isSharing;
  });

  // 3. Group overlapping viewports
  const groups: { [key: string]: string[]; } = {};
  const threshold = 50 / zoom;

  visibleViewports.forEach(([uid, vp]) => {
    let added = false;
    for (const key in groups) {
      const [otherUid] = groups[key];
      const otherVp = remoteViewports[otherUid];
      // Check proximity
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

  // 4. Render Groups
  Object.entries(groups).forEach(([leaderId, uids]) => {
    const vp = remoteViewports[leaderId];

    // Convert World Coordinates to Screen Coordinates (Context is already transformed? No, context is standard, we must draw in World Coords?)
    // Wait, useMapRenderer sets up the context transform:
    // ctx.translate(effectiveViewport.x, effectiveViewport.y);
    // ctx.scale(effectiveViewport.zoom, effectiveViewport.zoom);
    //
    // However, the *remote viewport* data (p.viewport) tells us where THEY are looking in World Space (x, y).
    // The rectangle we want to draw represents their screen.
    // IF User A is at x=100, y=100, zoom=1.
    // Their screen covers [100, 100] to [100+w, 100+h] (roughly, technically x/y is usually top-left or center? Standard is usually top-left for viewports in 2D engines, but QuestBinder uses translation.
    // If viewport.x = -100, viewport.y = -100 (Translation), then the world origin (0,0) is at screen (100,100).
    // So the top-left of their screen in WORLD coordinates is: -viewport.x / viewport.zoom, -viewport.y / viewport.zoom

    const wx = -vp.x / vp.zoom;
    const wy = -vp.y / vp.zoom;
    const ww = vp.w / vp.zoom;
    const wh = vp.h / vp.zoom;

    // Resolve Leader Attributes
    const leaderPlayer = players.find(p => p.id === leaderId);
    const leaderCursor = remoteCursors ? remoteCursors[leaderId] : null;

    // Color: Specific Override > Cursor > Player Profile > Default
    const leaderOverrideV = permissions?.cursorOverrides?.[leaderId];
    let color = leaderOverrideV?.color || leaderCursor?.userColor || leaderPlayer?.color || '#808080';

    // AFK Check
    const isAfk = leaderCursor?.isAfk ?? false;

    ctx.save();

    // Draw Viewport Rect
    ctx.globalAlpha = isAfk ? 0.3 : 1.0;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([10 / zoom, 5 / zoom]);
    ctx.strokeRect(wx, wy, ww, wh);
    ctx.setLineDash([]); // Reset dash

    // Draw Labels (Stacked)
    const fontSize = 14 / zoom;
    ctx.font = `bold ${fontSize}px "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    const padding = 6 / zoom;
    let currentXOffset = 0;

    uids.forEach((uid) => {
      const uPlayer = players.find(p => p.id === uid);
      const uCursor = remoteCursors ? remoteCursors[uid] : null;
      const uOverride = permissions?.cursorOverrides?.[uid];

      // Name & Color resolution
      let uName = uOverride?.name || uCursor?.userName || uPlayer?.name || 'Player';
      let uColor = uOverride?.color || uCursor?.userColor || uPlayer?.color || '#808080';

      const textMetrics = ctx.measureText(uName);
      const tagW = textMetrics.width + (padding * 2);
      const tagH = fontSize + (padding * 1.5);

      const tagX = wx + currentXOffset;

      // Label Config
      const contrastColor = getContrastColor(uColor);

      // Shadow for better visibility
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;

      // Draw Label Background
      ctx.fillStyle = uColor;
      // Using simple rect for now, could use drawRoundedRect if imported
      ctx.fillRect(tagX, wy, tagW, tagH);

      // Draw Text
      ctx.shadowBlur = 0; // Reset shadow for text
      ctx.fillStyle = contrastColor;
      ctx.textBaseline = 'top';
      ctx.fillText(uName, tagX + padding, wy + (padding * 0.25));

      // Advance offset
      currentXOffset += tagW + (4 / zoom);
    });

    ctx.restore();
  });
};
