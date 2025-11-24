
import { Token, MapScene, Viewport, Obstacle, LightConfig, Point, User, LightZone, AudioZone, MeasurementMetric, Character } from '../types';
import { calculateVisibilityPolygon, isPointInPolygon, calculateDistance } from './geometry';

export const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, scale: number, color: string = 'rgba(0, 0, 0, 0.7)') => {
    ctx.font = `bold ${14 / scale}px sans-serif`;
    const metrics = ctx.measureText(text);
    const pad = 6 / scale;
    const h = 20 / scale;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - metrics.width / 2 - pad, y - h / 2 - pad, metrics.width + pad * 2, h + pad * 2, 4 / scale);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
};

export const drawGrid = (
    ctx: CanvasRenderingContext2D,
    mapWidth: number,
    mapHeight: number,
    gridSize: number,
    color: string,
    alpha: number,
    zoom: number
) => {
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    for (let x = 0; x <= mapWidth; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, mapHeight); }
    for (let y = 0; y <= mapHeight; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(mapWidth, y); }
    ctx.stroke();
    ctx.globalAlpha = 1.0;
};

// Helper for Hex Color to RGBA
const hexToRgb = (hex: string) => {
    if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 };
    // Basic validation for hex format
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
        // Try 3 digit hex or return defaults
        if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
            const r = parseInt(hex[1] + hex[1], 16);
            const g = parseInt(hex[2] + hex[2], 16);
            const b = parseInt(hex[3] + hex[3], 16);
            return { r, g, b };
        }
        return { r: 255, g: 255, b: 255 };
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
};

export const drawLightingLayer = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scene: MapScene,
    tokens: Token[], // Using live tokens for position
    animations: Map<string, any>,
    viewport: Viewport,
    visionTokens: Token[], // Explicit list of tokens that see
    renderDarkness: boolean = true,
    playerVisionPolygons?: Point[][], // If provided, clips global lights to this union
    obstacles?: Obstacle[] // Optional: Filtered obstacles to use for lighting calculation
) => {
    const time = Date.now();
    const gridSize = scene.grid.size;

    ctx.save();
    // Reset Transform to cover full screen and clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Apply Viewport Transform to align with Map for drawing
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    const mapW = scene.grid.size * scene.grid.cols;
    const mapH = scene.grid.size * scene.grid.rows;

    // Create player vision clipping path if needed
    let playerVisionPath: Path2D | null = null;
    if (playerVisionPolygons && playerVisionPolygons.length > 0) {
        playerVisionPath = new Path2D();
        playerVisionPolygons.forEach(poly => {
            if (poly.length > 0) {
                playerVisionPath!.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) playerVisionPath!.lineTo(poly[i].x, poly[i].y);
                playerVisionPath!.closePath();
            }
        });
    }

    // --- STEP 1: DARKNESS LAYER (Visibility) ---

    if (renderDarkness) {
        const ambientLevel = Math.max(0, Math.min(1, scene.ambientLight ?? 1.0));
        const darknessAlpha = 1.0 - ambientLevel;

        // 1. Draw Ambient Darkness (The "Fog")
        ctx.fillStyle = `rgba(0, 0, 0, ${darknessAlpha})`;
        ctx.fillRect(0, 0, mapW, mapH);

        // 2. Cut holes for visibility (destination-out)
        ctx.globalCompositeOperation = 'destination-out';

        // Light Sources Collection
        const visionSources: { x: number, y: number, r: number, soft: boolean, isPersonal: boolean; }[] = [];

        // A. Custom Light Zones (act as light sources)
        if (scene.lightZones) {
            scene.lightZones.forEach(zone => {
                if (zone.hidden) return;
                if (zone.brightness <= 0.2) return; // Darkness zones handled separately

                // For global light zones, we clip to player vision if applicable
                ctx.save();
                if (playerVisionPath) ctx.clip(playerVisionPath);

                // Render the zone shape to cut darkness
                ctx.beginPath();
                if (zone.type === 'rect' && zone.rect) {
                    ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
                } else if (zone.type === 'polygon' && zone.points && zone.points.length > 0) {
                    ctx.moveTo(zone.points[0].x, zone.points[0].y);
                    for (let i = 1; i < zone.points.length; i++) ctx.lineTo(zone.points[i].x, zone.points[i].y);
                    ctx.closePath();
                }
                ctx.fillStyle = `rgba(0,0,0,${Math.min(1, zone.brightness)})`;
                ctx.fill();
                ctx.restore();
            });
        }

        // B. Tokens (Lights & Darkvision)
        tokens.forEach(t => {
            const anim = animations.get(t.id);
            let tx = t.x;
            let ty = t.y;

            if (anim) {
                const progress = Math.min(1, (time - anim.startTime) / anim.duration);
                const ease = 1 - Math.pow(1 - progress, 3);
                tx = anim.startX + (anim.targetX - anim.startX) * ease;
                ty = anim.startY + (anim.targetY - anim.startY) * ease;
            }

            if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;

            const cx = (tx + t.size / 2) * gridSize;
            const cy = (ty + t.size / 2) * gridSize;

            // 1. Active Lights (Global)
            if (t.light?.enabled) {
                let flicker = 1.0;
                if (t.light.animation === 'torch') {
                    const seed = parseFloat(t.id.replace(/\D/g, '') || '0');
                    flicker = 0.95 + Math.sin(time * 0.01 + seed) * 0.05 + Math.random() * 0.02;
                } else if (t.light.animation === 'pulse') {
                    flicker = 0.8 + (Math.sin(time * 0.003) + 1) * 0.1;
                }

                const r = Math.max(t.light.brightRadius || 0, t.light.dimRadius || 0) * gridSize * flicker;
                if (r > 0) visionSources.push({ x: cx, y: cy, r, soft: true, isPersonal: false });
            }

            // 2. Personal Vision Check
            const isControlled = visionTokens.some(vt => vt.id === t.id);

            if (isControlled) {
                if ((t.darkvisionRange || 0) > 0) {
                    const r = (t.darkvisionRange || 0) * gridSize;
                    visionSources.push({ x: cx, y: cy, r, soft: false, isPersonal: true });
                }
                const selfRadius = Math.max(gridSize * 0.6, (t.size * gridSize) * 0.6);
                visionSources.push({ x: cx, y: cy, r: selfRadius, soft: true, isPersonal: true });
            }
        });

        // Render sources to clear darkness
        visionSources.forEach(src => {
            if (src.r <= 0) return;

            // Use passed obstacles (already filtered) or fallback to scene.obstacles (filtering if player view implied)
            const obstaclesToUse = obstacles || (playerVisionPath ? scene.obstacles.filter(o => !o.hidden) : scene.obstacles);
            const poly = calculateVisibilityPolygon({ x: src.x, y: src.y }, obstaclesToUse, src.r);

            ctx.save();

            // Only clip GLOBAL lights to the player's FOV. Personal vision creates the FOV, so it's exempt.
            if (!src.isPersonal && playerVisionPath) {
                ctx.clip(playerVisionPath);
            }

            ctx.beginPath();
            if (poly.length > 0) {
                ctx.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
                ctx.closePath();
            }
            ctx.clip();

            try {
                const grad = ctx.createRadialGradient(src.x, src.y, src.r * 0.7, src.x, src.y, src.r);
                grad.addColorStop(0, 'rgba(0,0,0, 1)');
                grad.addColorStop(1, 'rgba(0,0,0, 0)');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(src.x, src.y, src.r, 0, Math.PI * 2);
                ctx.fill();
            } catch (e) {
                ctx.fillStyle = 'rgba(0,0,0,1)';
                ctx.fill();
            }
            ctx.restore();
        });

        // 3. Magical Darkness (Dark Zones)
        ctx.globalCompositeOperation = 'source-over';
        if (scene.lightZones) {
            scene.lightZones.forEach(zone => {
                if (zone.hidden) return;
                if (zone.brightness > 0.2) return;

                // Darkness zones should technically obscure vision even inside FOV, so no clipping needed (or maybe?)
                // Usually darkness blocks LOS, so it should be drawn on top. 
                // However, if it's outside FOV, we don't see it anyway because it's already black.
                // So drawing it is harmless, but we can optimize by clipping.
                // Let's keep it simple and draw it.

                ctx.beginPath();
                if (zone.type === 'rect' && zone.rect) {
                    ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
                } else if (zone.type === 'polygon' && zone.points && zone.points.length > 0) {
                    ctx.moveTo(zone.points[0].x, zone.points[0].y);
                    for (let i = 1; i < zone.points.length; i++) ctx.lineTo(zone.points[i].x, zone.points[i].y);
                    ctx.closePath();
                }
                ctx.fillStyle = `rgba(0,0,0, 0.95)`;
                ctx.fill();
            });
        }
    }

    // --- STEP 2: COLORED LIGHTS (Atmosphere) ---

    ctx.globalCompositeOperation = 'lighter'; // Additive blending for colored lights

    // A. Light Zones (Atmosphere)
    if (scene.lightZones) {
        scene.lightZones.forEach(zone => {
            if (zone.hidden) return;
            if (zone.brightness <= 0.2) return;
            if (!zone.color || zone.color === '#000000') return;

            ctx.save();
            if (playerVisionPath) ctx.clip(playerVisionPath);

            ctx.beginPath();
            if (zone.type === 'rect' && zone.rect) {
                ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
            } else if (zone.type === 'polygon' && zone.points && zone.points.length > 0) {
                ctx.moveTo(zone.points[0].x, zone.points[0].y);
                for (let i = 1; i < zone.points.length; i++) ctx.lineTo(zone.points[i].x, zone.points[i].y);
                ctx.closePath();
            }
            const rgb = hexToRgb(zone.color);
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
            ctx.fill();
            ctx.restore();
        });
    }

    // B. Token Lights
    tokens.forEach(t => {
        if (t.light?.enabled && t.light.color && t.light.color !== '#000000') {
            const anim = animations.get(t.id);
            let tx = t.x; let ty = t.y;
            if (anim) {
                const progress = Math.min(1, (time - anim.startTime) / anim.duration);
                const ease = 1 - Math.pow(1 - progress, 3);
                tx = anim.startX + (anim.targetX - anim.startX) * ease;
                ty = anim.startY + (anim.targetY - anim.startY) * ease;
            }
            if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;

            const cx = (tx + t.size / 2) * gridSize;
            const cy = (ty + t.size / 2) * gridSize;
            const config = t.light;

            let flicker = 1.0;
            if (config.animation === 'torch') {
                const seed = parseFloat(t.id.replace(/\D/g, '') || '0');
                flicker = 0.95 + Math.sin(time * 0.01 + seed + 100) * 0.05;
            }
            else if (config.animation === 'pulse') flicker = 0.8 + (Math.sin(time * 0.003) + 1) * 0.1;

            const maxRadius = Math.max(config.brightRadius || 0, config.dimRadius || 0) * gridSize * flicker;
            if (maxRadius <= 0.1) return;

            const obstaclesToUse = obstacles || (playerVisionPath ? scene.obstacles.filter(o => !o.hidden) : scene.obstacles);
            const poly = calculateVisibilityPolygon({ x: cx, y: cy }, obstaclesToUse, maxRadius);

            ctx.save();

            // Clip colored lights to player vision
            if (playerVisionPath) {
                ctx.clip(playerVisionPath);
            }

            ctx.beginPath();
            if (poly.length > 0) {
                ctx.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
                ctx.closePath();
            }
            ctx.clip();

            const rgb = hexToRgb(config.color);
            try {
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
                const intensity = (config.intensity || 0.5) * 0.6;
                grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity})`);
                grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
                ctx.fill();
            } catch (e) { }
            ctx.restore();
        }
    });

    ctx.restore();
};

// Define minimal interface for bar to avoid any
interface TokenBar {
    value: number;
    max: number;
    color?: string;
    visible: boolean;
}

export const drawToken = (
    ctx: CanvasRenderingContext2D,
    token: Token,
    gridSize: number,
    isSelected: boolean,
    viewportZoom: number,
    imageCache: { [src: string]: HTMLImageElement; },
    isGhost: boolean = false,
    linkedCharacter?: Character // NEW: Optional linked character
) => {
    // Calculate Pixel Coordinates
    const px = token.x * gridSize;
    const py = token.y * gridSize;
    const sizePx = token.size * gridSize;
    const halfSize = sizePx / 2;
    const cx = px + halfSize;
    const cy = py + halfSize;

    const isTopDown = token.shape === 'topdown';

    ctx.save();

    // 1. Transform Container (Translate + Rotate Token)
    ctx.translate(cx, cy);
    if (token.rotation) {
        ctx.rotate((token.rotation * Math.PI) / 180);
    }

    // 2. Shape Path Definition
    ctx.beginPath();
    const shape = token.shape || 'circle';
    const padding = 4 / viewportZoom; // Padding for border

    // Prevent negative radius error on high zoom-out
    const drawSize = Math.max(0.1, halfSize - padding);

    if (!isTopDown) {
        if (shape === 'square') {
            ctx.rect(-drawSize, -drawSize, drawSize * 2, drawSize * 2);
        } else if (shape === 'hex') {
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                const x = Math.cos(angle) * drawSize;
                const y = Math.sin(angle) * drawSize;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        } else {
            // Default Circle
            ctx.arc(0, 0, drawSize, 0, Math.PI * 2);
        }
    }

    // 3. Draw Content (Image or Text)
    if (token.displayMode === 'text' && token.textDetails) {
        // Background fill
        ctx.fillStyle = token.textDetails.backgroundColor;
        if (isGhost) ctx.globalAlpha = 0.6;
        if (!isTopDown) ctx.fill();

        // Text
        ctx.fillStyle = token.textDetails.textColor;
        const fontSize = drawSize * 0.8;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(token.textDetails.text || '?', 0, 0);
    } else {
        // Image Mode
        const tokenImage = imageCache[token.imgUrl];
        if (tokenImage?.complete) {
            ctx.save();

            // CLIP only if not topdown (or if we want a loose clip)
            // Top-down implies free-form PNG, so we don't clip to circle/square
            if (!isTopDown) {
                ctx.clip();
            }

            if (isGhost) {
                ctx.globalAlpha = 0.5;
                ctx.filter = 'grayscale(100%) brightness(150%)';
            }

            // Apply internal Image Transform (Pan & Rotate)
            // imageX/Y are -0.5 to 0.5 relative to sizePx
            const offsetX = (token.imageX || 0) * sizePx;
            const offsetY = (token.imageY || 0) * sizePx;

            ctx.translate(offsetX, offsetY);

            if (token.imageRotation) {
                ctx.rotate((token.imageRotation * Math.PI) / 180);
            }

            // Scale factor for the image itself
            const imgScale = token.scale || 1;
            const w = drawSize * 2 * imgScale;
            const h = drawSize * 2 * imgScale;

            ctx.drawImage(tokenImage, -w / 2, -h / 2, w, h);

            // Tint (Only for non-topdown, or we need a complex composite for PNG tinting)
            if (token.tint && !isTopDown) {
                ctx.fillStyle = token.tint;
                ctx.fill();
            }
            ctx.restore();
        } else {
            // Fallback
            if (!isTopDown) {
                ctx.fillStyle = '#333';
                ctx.fill();
            }
        }
    }

    // 5. Border (Selection or Custom)
    // For TopDown, we don't draw the custom border style, only selection ring
    if (!isTopDown) {
        const borderColor = isSelected ? '#22d3ee' : (token.border?.color || (token.ownerId ? '#3b82f6' : '#f43f5e'));
        const borderWidth = isSelected ? 4 : (token.border?.width || 3);

        ctx.strokeStyle = isGhost ? 'rgba(255, 255, 255, 0.3)' : borderColor;
        ctx.lineWidth = borderWidth / viewportZoom;
        if (isGhost) ctx.setLineDash([5 / viewportZoom, 5 / viewportZoom]);
        ctx.stroke();
    } else if (isSelected) {
        // Special Selection Ring for TopDown (at feet/base)
        ctx.beginPath();
        // Ellipse at the bottom
        ctx.ellipse(0, drawSize * 0.8, drawSize * 0.8, drawSize * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2 / viewportZoom;
        ctx.stroke();
    }

    // Restore to non-rotated context for UI elements
    ctx.restore();

    if (isGhost) return;

    // 6. Status Conditions
    if (token.conditions && token.conditions.length > 0) {
        const dotSize = 6 / viewportZoom;
        const gap = 2 / viewportZoom;
        const totalWidth = (token.conditions.length * dotSize) + ((token.conditions.length - 1) * gap);
        let startX = cx - totalWidth / 2 + dotSize / 2;
        const startY = py + (isTopDown ? sizePx : padding); // Move dots lower for TopDown? Or keep top? Keep top.

        const colorMap: Record<string, string> = { dead: '#ef4444', bloodied: '#dc2626', stunned: '#eab308', shielded: '#3b82f6', alert: '#f97316' };

        token.conditions.forEach((cond, i) => {
            ctx.beginPath();
            ctx.arc(startX + i * (dotSize + gap), py + padding + dotSize, dotSize, 0, Math.PI * 2);
            ctx.fillStyle = colorMap[cond] || '#ffffff';
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1 / viewportZoom;
            ctx.stroke();
        });
    }

    // 7. Bars (HP/Mana)
    // Use linked character stats if available, otherwise token bars
    const bar1 = linkedCharacter
        ? { value: linkedCharacter.hpCurrent, max: linkedCharacter.hpMax, visible: true, color: '#ef4444' }
        : token.bars?.bar1;

    const bar2 = linkedCharacter
        ? { value: (linkedCharacter as any).manaCurrent || 0, max: (linkedCharacter as any).manaMax || 0, visible: true, color: '#3b82f6' } // Casting to any as mana might be dynamic or missing in type
        : token.bars?.bar2;

    if (bar1 || bar2) {
        const barHeight = 6 / viewportZoom;
        const barWidth = sizePx * 0.8;
        const startX = cx - barWidth / 2;
        // For TopDown, push bars lower if needed, or keep standard
        let currentY = py + sizePx - barHeight - (4 / viewportZoom);

        const drawBar = (bar: TokenBar | undefined) => {
            if (!bar || !bar.visible || bar.max <= 0) return;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(startX, currentY, barWidth, barHeight);

            const fillPct = Math.max(0, Math.min(1, bar.value / bar.max));
            ctx.fillStyle = bar.color || '#ffffff';
            ctx.fillRect(startX, currentY, barWidth * fillPct, barHeight);

            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 1 / viewportZoom;
            ctx.strokeRect(startX, currentY, barWidth, barHeight);

            currentY -= (barHeight + 2 / viewportZoom);
        };

        // Draw Bar 2 (Bottom) then Bar 1 (Top)
        drawBar(bar2);
        drawBar(bar1);
    }
};

export const drawRuler = (
    ctx: CanvasRenderingContext2D,
    path: { x: number, y: number; }[],
    currentMousePos: { x: number, y: number; },
    gridSize: number,
    unitsPerSquare: number,
    zoom: number,
    overrideColor?: string,
    maxDistance?: number,
    metric: MeasurementMetric = 'chebyshev',
    showIntermediateLabels: boolean = false
) => {
    const fullPath = [...path, currentMousePos];
    if (fullPath.length < 2) return;

    const baseColor = overrideColor || '#fbbf24';
    const unit = unitsPerSquare === 1.5 ? 'm' : 'ft';

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let totalDist = 0;
    let isOverLimit = false;

    // Draw Segments individually to handle color changes based on limit
    for (let i = 1; i < fullPath.length; i++) {
        const p1 = fullPath[i - 1];
        const p2 = fullPath[i];

        // Calculate distance for this segment
        const p1Grid = { x: p1.x / gridSize, y: p1.y / gridSize };
        const p2Grid = { x: p2.x / gridSize, y: p2.y / gridSize };
        const gridDist = calculateDistance(p1Grid, p2Grid, metric);
        const segmentDist = gridDist * unitsPerSquare;

        // Determine color for this segment
        const currentSegmentColor = (maxDistance && totalDist >= maxDistance) ? '#ef4444' : baseColor;

        totalDist += segmentDist;

        // Draw Line
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        // Outer Stroke
        ctx.lineWidth = 5 / zoom;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.stroke();

        // Inner Stroke
        ctx.lineWidth = 3 / zoom;
        ctx.strokeStyle = currentSegmentColor;
        ctx.setLineDash([15 / zoom, 10 / zoom]);
        ctx.stroke();

        // Draw Point Dot at P2 (End of segment)
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, 4 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = currentSegmentColor;
        ctx.fill();
        ctx.stroke();

        // Re-stroke point outline
        ctx.lineWidth = 1 / zoom;
        ctx.strokeStyle = 'black';
        ctx.stroke();

        // Draw Intermediate Label if enabled and not the last point (last point gets main label)
        if (showIntermediateLabels && i < fullPath.length - 1) {
            drawLabel(ctx, `${totalDist.toFixed(1)}${unit}`, p2.x, p2.y - 15 / zoom, zoom, 'rgba(0,0,0,0.6)');
        }
    }

    // Check if final total is over limit to color the label
    if (maxDistance && totalDist > maxDistance) {
        isOverLimit = true;
    }

    const last = fullPath[fullPath.length - 1];
    const labelBg = isOverLimit ? 'rgba(239, 68, 68, 0.9)' : (overrideColor ? overrideColor.replace(')', ', 0.9)').replace('rgb', 'rgba') : 'rgba(251, 191, 36, 0.9)');

    let labelText = `${totalDist.toFixed(1)}${unit}`;
    if (maxDistance && isOverLimit) {
        labelText = `${totalDist.toFixed(1)}${unit} / ${maxDistance}${unit}`;
    }

    // Main Total Label at End
    drawLabel(ctx, labelText, last.x, last.y + 25 / zoom, zoom, labelBg);

    ctx.restore();
};

export const drawObstacles = (
    ctx: CanvasRenderingContext2D,
    obstacles: Obstacle[],
    isGM: boolean,
    zoom: number,
    highlightedId?: string,
    gmShowHidden: boolean = true
) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    obstacles.forEach(obstacle => {
        const isHidden = obstacle.hidden;

        if (!isGM && isHidden) return;
        if (isGM && isHidden && !gmShowHidden) return;

        // Base Styles
        if (isGM && isHidden) {
            ctx.setLineDash([5 / zoom, 5 / zoom]);
            ctx.globalAlpha = 0.5;
        } else if (!obstacle.blocksVision && isGM && obstacle.type === 'wall') {
            ctx.setLineDash([10 / zoom, 10 / zoom]);
        } else {
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
        }

        const isHighlighted = obstacle.id === highlightedId;
        if (isHighlighted) {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 15;
        } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }

        if (obstacle.type === 'wall') {
            // Standard Wall
            ctx.strokeStyle = isHighlighted ? '#ef4444' : 'rgba(255, 0, 255, 0.6)';
            ctx.lineWidth = (isHighlighted ? 6 : 4);

            if (obstacle.points.length > 1) {
                ctx.beginPath();
                ctx.moveTo(obstacle.points[0].x, obstacle.points[0].y);
                for (let i = 1; i < obstacle.points.length; i++) ctx.lineTo(obstacle.points[i].x, obstacle.points[i].y);
                if (!obstacle.open) ctx.closePath();
                ctx.stroke();
            }
        } else if (obstacle.type === 'door' || obstacle.type === 'window') {
            // Visual Door/Window Logic
            const p1 = obstacle.p1;
            const p2 = obstacle.p2;
            const isOpen = !obstacle.blocksMovement; // Assuming open = passable

            // Calculate geometry
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(angle);

            // Draw Base Frame (Wall gap)
            const frameColor = obstacle.type === 'door' ? '#8B4513' : '#475569'; // Brown for door, Slate for window
            const frameWidth = (isHighlighted ? 6 : 4);

            // Draw Frame Ends (Jambs)
            ctx.fillStyle = frameColor;
            const jambSize = 4;
            ctx.fillRect(-len / 2, -jambSize, jambSize, jambSize * 2); // Left Jamb
            ctx.fillRect(len / 2 - jambSize, -jambSize, jambSize, jambSize * 2); // Right Jamb

            if (obstacle.type === 'door') {
                const doorColor = isHighlighted ? '#ef4444' : '#A0522D'; // Sienna
                const doorThickness = 6;

                if (isOpen) {
                    // Draw Threshold (visual guide for clicking)
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(-len / 2, 0);
                    ctx.lineTo(len / 2, 0);
                    ctx.strokeStyle = isHighlighted ? '#ef4444' : 'rgba(0, 0, 0, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 4]);
                    ctx.stroke();
                    ctx.restore();

                    // Open Door: Draw rectangle swung open 90 degrees (or 45)
                    // Let's swing it 90 degrees relative to the wall
                    ctx.save();
                    ctx.translate(-len / 2 + jambSize, 0); // Pivot at left jamb
                    ctx.rotate(-Math.PI / 3); // Open 60 degrees

                    ctx.fillStyle = doorColor;
                    ctx.globalAlpha = 0.8;
                    ctx.fillRect(0, -doorThickness / 2, len - jambSize * 2, doorThickness);

                    // Draw arc to show swing path
                    ctx.beginPath();
                    ctx.arc(0, 0, len - jambSize * 2, 0, -Math.PI / 3, true);
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 3]);
                    ctx.stroke();

                    ctx.restore();
                } else {
                    // Closed Door: Solid rectangle filling the gap
                    ctx.fillStyle = doorColor;
                    ctx.fillRect(-len / 2 + jambSize, -doorThickness / 2, len - jambSize * 2, doorThickness);

                    // Door Knob
                    ctx.beginPath();
                    ctx.arc(-len / 4, 0, doorThickness / 2, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFD700'; // Gold
                    ctx.fill();
                }
            } else if (obstacle.type === 'window') {
                const glassColor = 'rgba(200, 240, 255, 0.6)';
                const frameThick = 2;

                // Window Frame (Top/Bottom lines)
                ctx.fillStyle = frameColor;
                ctx.fillRect(-len / 2, -frameThick * 2, len, frameThick); // Top
                ctx.fillRect(-len / 2, frameThick, len, frameThick); // Bottom

                if (isOpen) {
                    // Open Window: Slide one pane over the other? Or swing?
                    // Let's do a "swung open" look for clarity, similar to door but smaller
                    ctx.save();
                    ctx.translate(-len / 2, 0);
                    ctx.rotate(-Math.PI / 4); // 45 deg

                    ctx.fillStyle = glassColor;
                    ctx.strokeStyle = frameColor;
                    ctx.lineWidth = 1;
                    ctx.fillRect(0, -frameThick, len, frameThick * 2);
                    ctx.strokeRect(0, -frameThick, len, frameThick * 2);

                    ctx.restore();
                } else {
                    // Closed Window: Glass pane
                    ctx.fillStyle = glassColor;
                    ctx.fillRect(-len / 2 + jambSize, -frameThick, len - jambSize * 2, frameThick * 2);

                    // Cross bars (Muntins)
                    ctx.strokeStyle = frameColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, -frameThick);
                    ctx.lineTo(0, frameThick); // Vertical
                    ctx.stroke();
                }
            }

            ctx.restore();
        }

        // Reset styles
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    });
};

export const drawAudioZones = (
    ctx: CanvasRenderingContext2D,
    zones: AudioZone[],
    isGM: boolean,
    zoom: number
) => {
    if (!isGM) return;

    ctx.save();
    ctx.font = `bold ${16 / zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    zones.forEach(zone => {
        ctx.beginPath();
        if (zone.type === 'rect' && zone.rect) {
            ctx.rect(zone.rect.x, zone.rect.y, zone.rect.w, zone.rect.h);
        } else if (zone.type === 'polygon' && zone.points) {
            if (zone.points.length > 0) {
                ctx.moveTo(zone.points[0].x, zone.points[0].y);
                for (let i = 1; i < zone.points.length; i++) {
                    ctx.lineTo(zone.points[i].x, zone.points[i].y);
                }
                ctx.closePath();
            }
        }

        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([8 / zoom, 4 / zoom]);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.fill();

        // Find center to draw icon
        let cx = 0, cy = 0;
        if (zone.rect) {
            cx = zone.rect.x + zone.rect.w / 2;
            cy = zone.rect.y + zone.rect.h / 2;
        } else if (zone.points) {
            zone.points.forEach((p: Point) => { cx += p.x; cy += p.y; });
            cx /= zone.points.length;
            cy /= zone.points.length;
        }

        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.fillText('🎵', cx, cy);
    });

    ctx.restore();
};
