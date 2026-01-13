export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  zoom: number;
  gridSize: number;
}

export interface AnimationState {
  startTime: number;
  duration: number;
  progress: number;
  easeProgress: number;
}

// Re-export types for easier imports in renderers
import { Token, Point, User, Ping } from '../../../../../types';
import { MapCanvasProps, DragState } from '../../types';
import { TokenAnimation } from '../useTokenLayer';

export type { Token, Point, User, MapCanvasProps, DragState, TokenAnimation, Ping };
