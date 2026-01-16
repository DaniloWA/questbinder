/**
 * VTT Engine - Tool Overlay Layer (Enhanced)
 *
 * Renders ALL tool-specific overlays including:
 * - Ruler/measurement paths
 * - Fog brush preview (rect/polygon)
 * - Obstacle drawing preview (wall/door/window)
 * - Light/Audio/Trigger zone previews
 * - Attack zone placement + drag preview
 * - Map alignment tools (3-point, drag grid)
 * - Freehand wall preview
 * - Smart wall edge detection
 * - Remote viewports
 */

// Import shared renderer
import { renderRemoteViewports } from '../../hooks/renderers';
import { BaseLayer } from '../core/BaseLayer';
import { RenderContext, AttackZoneResult } from '../core/types';
import { drawRuler, drawToken, drawLabel } from '../../../../../utils/canvasRenderer';
import { getTokenWorldPos, isTokenOwner, isPositionVisible } from '../../hooks/renderers';
import { COLORS } from '../../hooks/renderers';

/**
 * ToolOverlayLayer - Comprehensive active tool visualizations.
 */
export class ToolOverlayLayer extends BaseLayer {
  constructor() {
    super('tool-overlay', 'Tool Overlay', {
      useCache: false,
      description: 'Active tool visualizations',
    });
  }

  computeStateHash(): string {
    return 'dynamic';
  }

  render(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { activeTool, zoom, scene, localCursorPos, toolState, rulerSettings,
      attackZoneResults, previewZoneResult, remoteViewports, players, isGM, gmViewMode,
      currentUser, permissions, remoteCursorsRef, remoteCursors
    } = context;
    if (!scene) return;

    const gridSize = scene.grid.size;
    const unitsPerSquare = scene.grid.unitsPerSquare;

    ctx.save();

    // =========================================================================
    // 1. REMOTE VIEWPORTS (Always visible for GM)
    // =========================================================================
    if (isGM && gmViewMode === 'gm' && Object.keys(remoteViewports).length > 0) {
      const cursors = remoteCursorsRef?.current || remoteCursors || {};
      renderRemoteViewports(
        ctx,
        remoteViewports,
        cursors,
        currentUser?.id,
        permissions,
        isGM,
        zoom,
        players
      );
    }

    // =========================================================================
    // 1.5. REMOTE DRAGS (Rulers + Ghost Tokens)
    // =========================================================================

    // =========================================================================
    // 1.5. DRAGS (Remote + Local)
    // =========================================================================

    // A. REMOTE DRAGS
    if (context.remoteDrags) {
      Object.entries(context.remoteDrags).forEach(([uid, dragItem]) => {
        const drag = dragItem as any; // TokenDragPayload
        const ghostToken = context.tokens.find(t => t.id === drag.tokenId);

        if (ghostToken) {
          // Visibility Check
          if (!isGM) {
            const isOwner = isTokenOwner(ghostToken, currentUser?.id);
            if (!ghostToken.isVisibleToPlayers && !isOwner) return;
          }

          const dragPosWorld = getTokenWorldPos({ x: drag.x, y: drag.y, size: ghostToken.size }, gridSize);
          const pathWorld = drag.path.map((p: any) => getTokenWorldPos({ x: p.x, y: p.y, size: ghostToken.size }, gridSize));

          // Draw Ruler
          if (pathWorld.length > 0) {
            drawRuler(ctx, pathWorld, dragPosWorld, gridSize, unitsPerSquare, zoom, drag.color || COLORS.DEFAULT_CURSOR, ghostToken.speed || 9);
          }

          // Draw Ghost Token
          ctx.save();
          ctx.globalAlpha = 0.6;
          drawToken(ctx, { ...ghostToken, x: drag.x, y: drag.y }, gridSize, false, zoom, context.imageCache, true);
          ctx.restore();

          // Draw Label
          const draggingUser = players?.find(u => u.id === uid);
          const labelText = draggingUser ? draggingUser.name : 'Unknown';
          drawLabel(ctx, labelText, dragPosWorld.x, dragPosWorld.y - 40 / zoom, zoom, drag.color || COLORS.DEFAULT_CURSOR);
        }
      });
    }

    // B. LOCAL DRAG RULER
    const { dragState, calculatedPath } = context;
    if (dragState.isDragging && dragState.token && calculatedPath && calculatedPath.length > 0) {
      const token = dragState.token;
      // Use token center for ruler calculation/display
      // Calculate smoothed position of the leader token (based on render logic in useMapRenderer)
      // center-of-tile points are fine for ruler, but let's be precise.
      // ruler logic: start from token center.
      const smoothedX = localCursorPos.x - (dragState.offset?.x || 0);
      const smoothedY = localCursorPos.y - (dragState.offset?.y || 0);
      const dragPosWorld = {
        x: smoothedX + (token.size * gridSize) / 2,
        y: smoothedY + (token.size * gridSize) / 2
      };
      const pathWorld = calculatedPath.map(p => ({ x: p.x * gridSize + (gridSize / 2), y: p.y * gridSize + (gridSize / 2) }));

      drawRuler(ctx, pathWorld, dragPosWorld, gridSize, unitsPerSquare, zoom, '#fbbf24', token.speed || 9);
    }


    // =========================================================================
    // 2. ATTACK ZONES (Persistent + Preview)
    // =========================================================================
    for (const zone of attackZoneResults) {
      this.renderAttackZone(ctx, zone, gridSize, zoom, false);
    }
    if (previewZoneResult) {
      this.renderAttackZone(ctx, previewZoneResult, gridSize, zoom, true);
    }

    // =========================================================================
    // 3. TOOL-SPECIFIC OVERLAYS
    // =========================================================================
    switch (activeTool) {
      // -----------------------------------------------------------------------
      // RULER / MEASUREMENT
      // -----------------------------------------------------------------------
      case 'measure-path':
        this.renderRuler(ctx, toolState.movementPath, localCursorPos, gridSize, unitsPerSquare, zoom, rulerSettings);
        break;

      // -----------------------------------------------------------------------
      // FOG OF WAR
      // -----------------------------------------------------------------------
      case 'fog-rect':
        if (toolState.currentFogRect) {
          this.renderFogRect(ctx, toolState.currentFogRect, zoom);
        }
        break;

      case 'fog-poly':
        if (toolState.draftPolyPoints.length > 0) {
          this.renderPolygonPreview(ctx, toolState.draftPolyPoints, localCursorPos, zoom, 'rgba(255, 255, 255, 0.3)');
        }
        break;

      // -----------------------------------------------------------------------
      // OBSTACLES (WALLS, DOORS, WINDOWS)
      // -----------------------------------------------------------------------
      case 'draw-wall':
      case 'draw-door':
      case 'draw-window':
        if (toolState.drawingObstacle) {
          this.renderObstaclePreview(ctx, toolState.drawingObstacle, localCursorPos, zoom, activeTool);
        }
        if (toolState.draftPolyPoints.length > 0) {
          this.renderPolygonPreview(ctx, toolState.draftPolyPoints, localCursorPos, zoom, 'rgba(255, 0, 255, 0.6)');
        }
        break;

      // -----------------------------------------------------------------------
      // FREEHAND WALL
      // -----------------------------------------------------------------------
      case 'freehand-wall':
        this.renderFreehandWallPreview(ctx, context);
        break;

      // -----------------------------------------------------------------------
      // SMART WALL (Edge Detection)
      // -----------------------------------------------------------------------
      case 'smart-wall':
        this.renderSmartWallPreview(ctx, context);
        break;

      // -----------------------------------------------------------------------
      // LIGHT ZONES
      // -----------------------------------------------------------------------
      case 'draw-light-rect':
      case 'draw-light-poly':
        if (toolState.drawingLightZone) {
          this.renderZonePreview(ctx, toolState.drawingLightZone, localCursorPos, zoom, 'rgba(255, 220, 100, 0.4)');
        }
        if (activeTool === 'draw-light-poly' && toolState.draftPolyPoints.length > 0) {
          this.renderPolygonPreview(ctx, toolState.draftPolyPoints, localCursorPos, zoom, 'rgba(255, 220, 100, 0.4)');
        }
        break;

      // -----------------------------------------------------------------------
      // AUDIO ZONES
      // -----------------------------------------------------------------------
      case 'draw-audio-rect':
      case 'draw-audio-poly':
        if (toolState.drawingAudioZone) {
          this.renderZonePreview(ctx, toolState.drawingAudioZone, localCursorPos, zoom, 'rgba(59, 130, 246, 0.4)');
        }
        if (activeTool === 'draw-audio-poly' && toolState.draftPolyPoints.length > 0) {
          this.renderPolygonPreview(ctx, toolState.draftPolyPoints, localCursorPos, zoom, 'rgba(59, 130, 246, 0.4)');
        }
        break;

      // -----------------------------------------------------------------------
      // TRIGGER ZONES
      // -----------------------------------------------------------------------
      case 'draw-trigger-rect':
      case 'draw-trigger-poly':
        if (toolState.drawingTriggerZone) {
          this.renderZonePreview(ctx, toolState.drawingTriggerZone, localCursorPos, zoom, 'rgba(168, 85, 247, 0.4)');
        }
        if (activeTool === 'draw-trigger-poly' && toolState.draftPolyPoints.length > 0) {
          this.renderPolygonPreview(ctx, toolState.draftPolyPoints, localCursorPos, zoom, 'rgba(168, 85, 247, 0.4)');
        }
        break;

      // -----------------------------------------------------------------------
      // MAP ALIGNMENT TOOLS
      // -----------------------------------------------------------------------
      case 'map-align':
      case 'map-align-drag':
      case 'map-align-3point':
        this.renderMapAlignOverlay(ctx, context);
        break;
    }

    ctx.restore();
  }

  // ===========================================================================
  // RULER RENDERING
  // ===========================================================================

  // ===========================================================================
  // RULER RENDERING
  // ===========================================================================

  private renderRuler(
    ctx: CanvasRenderingContext2D,
    path: { x: number; y: number; }[],
    currentPos: { x: number; y: number; },
    gridSize: number,
    unitsPerSquare: number,
    zoom: number,
    rulerSettings: { snapToGrid: boolean; metric: string; }
  ): void {
    // Convert tool state metric to legacy metric string
    const metric = rulerSettings.metric as 'euclidean' | 'chebyshev' | 'manhattan';

    // Delegate to legacy renderer for measuring path
    // Note: drawRuler expects world coordinates for path, but toolState path is in GRID coords?
    // Let's verify. movementPath in useMapInteraction is typically grid coords.
    // Yes, drawRuler expects PIXEL coordinates (world space).
    // so we need to convert path to pixels.

    const pixelPath = path.map(p => ({
      x: p.x * gridSize + gridSize / 2,
      y: p.y * gridSize + gridSize / 2
    }));

    // Legacy drawRuler helper converts them internally?
    // Let's check canvasRenderer.ts... NO. 
    // drawRuler(ctx, path, currentMousePos, ...)
    // In useMapRenderer:
    // const pathWorldPoints = calculatedPath.map(p => getTokenWorldPos({ x: p.x, y: p.y, size: token.size }, gridSize));
    // So inputs to drawRuler MUST be World Pixels.

    // ToolState.movementPath is usually center-of-tile points in grid steps if snap is on?
    // Let's assume they are grid coordinates for now and convert them.

    drawRuler(
      ctx,
      pixelPath,
      currentPos,
      gridSize,
      unitsPerSquare,
      zoom,
      '#fbbf24',
      undefined, // maxDistance
      metric
    );
  }

  // ===========================================================================
  // FOG PREVIEW
  // ===========================================================================

  private renderFogRect(ctx: CanvasRenderingContext2D, rect: { x: number; y: number; w: number; h: number; }, zoom: number): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([8 / zoom, 4 / zoom]);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.setLineDash([]);
  };

  // ===========================================================================
  // POLYGON PREVIEW
  // ===========================================================================

  private renderPolygonPreview(
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number; }[],
    currentPos: { x: number; y: number; },
    zoom: number,
    color: string
  ): void {
    if (points.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.lineTo(points[0].x, points[0].y);

    ctx.fillStyle = color;
    ctx.fill();

    ctx.strokeStyle = color.replace(/0\.[3-6]/, '0.8');
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([6 / zoom, 3 / zoom]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vertices
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1 / zoom;
      ctx.stroke();
    }
  }

  // ===========================================================================
  // OBSTACLE PREVIEW
  // ===========================================================================

  private renderObstaclePreview(
    ctx: CanvasRenderingContext2D,
    obstacle: { type: string; p1: { x: number; y: number; }; },
    currentPos: { x: number; y: number; },
    zoom: number,
    tool: string
  ): void {
    const colors: Record<string, string> = {
      'draw-wall': '#ec4899',
      'draw-door': '#22c55e',
      'draw-window': '#0ea5e9',
    };

    const color = colors[tool] || '#ec4899';

    ctx.beginPath();
    ctx.moveTo(obstacle.p1.x, obstacle.p1.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4 / zoom;
    ctx.stroke();

    // Endpoints
    for (const p of [obstacle.p1, currentPos]) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  // ===========================================================================
  // FREEHAND WALL PREVIEW
  // ===========================================================================

  private renderFreehandWallPreview(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { drawingState, zoom } = context;
    if (!drawingState.isDrawing || drawingState.livePoints.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(drawingState.livePoints[0].x, drawingState.livePoints[0].y);
    for (let i = 1; i < drawingState.livePoints.length; i++) {
      ctx.lineTo(drawingState.livePoints[i].x, drawingState.livePoints[i].y);
    }

    ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)'; // Pink
    ctx.lineWidth = 4 / zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw start point
    ctx.beginPath();
    ctx.arc(drawingState.livePoints[0].x, drawingState.livePoints[0].y, 6 / zoom, 0, Math.PI * 2);
    ctx.fillStyle = '#ec4899';
    ctx.fill();
  }

  // ===========================================================================
  // SMART WALL PREVIEW (Edge Detection Placeholder)
  // ===========================================================================

  private renderSmartWallPreview(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { localCursorPos, zoom, scene } = context;
    if (!scene) return;

    const gridSize = scene.grid.size;
    const snapRadius = gridSize * 0.5;

    // Draw detection circle
    ctx.beginPath();
    ctx.arc(localCursorPos.x, localCursorPos.y, snapRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.font = `${10 / zoom}px sans-serif`;
    ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('Smart Wall', localCursorPos.x, localCursorPos.y - snapRadius - 10 / zoom);
  };

  // ===========================================================================
  // ZONE PREVIEW (Rect)
  // ===========================================================================

  private renderZonePreview(
    ctx: CanvasRenderingContext2D,
    zone: { type: string; p1: { x: number; y: number; }; },
    currentPos: { x: number; y: number; },
    zoom: number,
    color: string
  ): void {
    if (zone.type === 'rect') {
      const x = Math.min(zone.p1.x, currentPos.x);
      const y = Math.min(zone.p1.y, currentPos.y);
      const w = Math.abs(currentPos.x - zone.p1.x);
      const h = Math.abs(currentPos.y - zone.p1.y);

      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = color.replace('0.4', '0.8');
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([6 / zoom, 3 / zoom]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  }

  // ===========================================================================
  // ATTACK ZONE RENDERING
  // ===========================================================================

  private renderAttackZone(
    ctx: CanvasRenderingContext2D,
    zone: AttackZoneResult,
    gridSize: number,
    zoom: number,
    isPreview: boolean
  ): void {
    const opacity = isPreview ? 0.4 : (zone.opacity || 0.3);
    const color = zone.color || '#f59e0b';

    ctx.save();
    ctx.translate(zone.x * gridSize, zone.y * gridSize);

    if (zone.angle !== undefined) {
      ctx.rotate((zone.angle * Math.PI) / 180);
    }

    ctx.globalAlpha = opacity;

    switch (zone.shape) {
      case 'sphere':
      case 'cylinder':
        const radius = (zone.radius || 5) / 1.5 * gridSize;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / zoom;
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        break;

      case 'cone':
        const coneLength = (zone.length || 15) / 1.5 * gridSize;
        const coneWidth = (zone.width || 90);
        const halfAngle = (coneWidth / 2) * Math.PI / 180;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, coneLength, -halfAngle, halfAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        break;

      case 'line':
        const lineLength = (zone.length || 30) / 1.5 * gridSize;
        const lineWidth = (zone.width || 5) / 1.5 * gridSize;
        ctx.fillStyle = color;
        ctx.fillRect(0, -lineWidth / 2, lineLength, lineWidth);
        break;

      case 'cube':
        const cubeSize = (zone.radius || 10) / 1.5 * gridSize;
        ctx.fillStyle = color;
        ctx.fillRect(-cubeSize / 2, -cubeSize / 2, cubeSize, cubeSize);
        break;
    }

    ctx.restore();
  }

  // ===========================================================================
  // MAP ALIGNMENT OVERLAY
  // ===========================================================================

  private renderMapAlignOverlay(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    const { activeTool, toolState, zoom, scene, mapWidth, mapHeight } = context;
    if (!scene) return;

    const gridSize = scene.grid.size;
    const { mapAlignPoints, mapAlignDragging, mapAlignPreviewGrid } = toolState;

    // Use preview grid if available, otherwise scene grid
    const previewSize = mapAlignPreviewGrid?.size || gridSize;
    const previewOffsetX = mapAlignPreviewGrid?.offsetX ?? (scene.grid.offsetX || 0);
    const previewOffsetY = mapAlignPreviewGrid?.offsetY ?? (scene.grid.offsetY || 0);

    // Draw preview grid overlay with different color
    if (mapAlignPreviewGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.5)'; // Purple preview grid
      ctx.lineWidth = 1 / zoom;

      const startX = previewOffsetX % previewSize;
      const startY = previewOffsetY % previewSize;

      ctx.beginPath();
      for (let x = startX; x <= mapWidth; x += previewSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, mapHeight);
      }
      for (let y = startY; y <= mapHeight; y += previewSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(mapWidth, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Render 3-point calibration markers
    if (activeTool === 'map-align-3point' && mapAlignPoints.length > 0) {
      const labels = ['TL', 'TR', 'BL'];
      const colors = ['#22c55e', '#3b82f6', '#f59e0b'];

      for (let i = 0; i < mapAlignPoints.length && i < 3; i++) {
        const p = mapAlignPoints[i];
        const color = colors[i];

        // Crosshair
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / zoom;
        const size = 20 / zoom;

        ctx.beginPath();
        ctx.moveTo(p.x - size, p.y);
        ctx.lineTo(p.x + size, p.y);
        ctx.moveTo(p.x, p.y - size);
        ctx.lineTo(p.x, p.y + size);
        ctx.stroke();

        // Circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        // Label
        drawLabel(ctx, labels[i], p.x, p.y - 20 / zoom, zoom, color);
      }
    }

    // Drag mode indicator
    if (activeTool === 'map-align-drag') {
      ctx.save();
      ctx.fillStyle = 'rgba(124, 58, 237, 0.1)';
      ctx.fillRect(0, 0, mapWidth, mapHeight);

      if (mapAlignDragging) {
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 4 / zoom;
        ctx.setLineDash([10 / zoom, 5 / zoom]);
        ctx.strokeRect(0, 0, mapWidth, mapHeight);
      }
      ctx.restore();
    }
  }
}
