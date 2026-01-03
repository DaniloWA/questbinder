import { GameSessionState, BooleanPermissionKey } from './types';
import { MapScene, Token, MapDrawing, Obstacle, Zone } from '../../types';
import { campaignService } from '../../services/campaignService';
import { socketService } from '../../services/socketService';

// --- Types ---
type SceneItem = Token | MapDrawing | Obstacle | Zone;
type SceneItemKey = 'tokens' | 'drawings' | 'obstacles' | 'lightZones' | 'audioZones' | 'triggerZones';

// --- Geometry Helpers ---

export const GeometryHelpers = {
  isPointInRect: (x: number, y: number, rect: { x: number, y: number, w: number, h: number; }) => {
    const x1 = Math.min(rect.x, rect.x + rect.w);
    const x2 = Math.max(rect.x, rect.x + rect.w);
    const y1 = Math.min(rect.y, rect.y + rect.h);
    const y2 = Math.max(rect.y, rect.y + rect.h);
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  },

  isPointInPolygon: (x: number, y: number, points: { x: number, y: number; }[]) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  },

  isTokenInZone: (token: Token, zone: Zone, gridSize: number) => {
    const tokenCenterX = (token.x * gridSize) + (token.size * gridSize / 2);
    const tokenCenterY = (token.y * gridSize) + (token.size * gridSize / 2);

    if (zone.type === 'rect' && zone.rect) {
      return GeometryHelpers.isPointInRect(tokenCenterX, tokenCenterY, zone.rect);
    } else if (zone.type === 'polygon' && zone.points) {
      return GeometryHelpers.isPointInPolygon(tokenCenterX, tokenCenterY, zone.points);
    }
    return false;
  }
};

// --- State Helpers ---

export const StateHelpers = {
  /**
   * Updates a specific scene in the state's scene list.
   */
  updateSceneInList: (scenes: MapScene[], sceneId: string, update: Partial<MapScene>): MapScene[] => {
    return scenes.map(s => s.id === sceneId ? { ...s, ...update } : s);
  },

  /**
   * Generic helper to add an item to a specific list within a scene.
   */
  addItemToSceneList: <T extends SceneItem>(
    scenes: MapScene[],
    sceneId: string,
    listKey: SceneItemKey,
    item: T
  ): MapScene[] => {
    return scenes.map(s => {
      if (s.id !== sceneId) return s;
      const list = s[listKey] as T[];
      // Prevent duplicates if id exists
      if (list.some((i: any) => i.id === item.id)) return s;
      return { ...s, [listKey]: [...list, item] };
    });
  },

  /**
   * Generic helper to remove an item from a specific list within a scene.
   */
  removeItemFromSceneList: (
    scenes: MapScene[],
    sceneId: string,
    listKey: SceneItemKey,
    itemId: string
  ): MapScene[] => {
    return scenes.map(s => {
      if (s.id !== sceneId) return s;
      const list = s[listKey] as any[];
      return { ...s, [listKey]: list.filter(i => i.id !== itemId) };
    });
  },

  /**
   * Generic helper to update an item in a specific list within a scene.
   */
  updateItemInSceneList: <T extends SceneItem>(
    scenes: MapScene[],
    sceneId: string,
    listKey: SceneItemKey,
    itemId: string,
    update: Partial<T>
  ): MapScene[] => {
    return scenes.map(s => {
      if (s.id !== sceneId) return s;
      const list = s[listKey] as T[];
      return {
        ...s,
        [listKey]: list.map((i: any) => i.id === itemId ? { ...i, ...update } : i)
      };
    });
  }
};

// --- Action Handlers ---

interface ActionOptions<T> {
  state: GameSessionState;
  setState: React.Dispatch<React.SetStateAction<GameSessionState>>;
  campaignId: string;
  user?: any;
  // REGRA MILENAR: Use PermissionHelper
  permissionHelper?: any; // Should be PermissionHelper type
  requiredPermission?: BooleanPermissionKey;
  isGMOnly?: boolean;

  // The action logic
  optimisticUpdate: (prevState: GameSessionState) => GameSessionState;
  socketEmit?: () => void;
  apiCall?: () => Promise<any>;

  // Validation
  validate?: () => boolean | string; // Return true if valid, or error message string
  onFailure?: (error: string) => void;
}

export const ActionHandlers = {
  /**
   * A generic handler for optimistic actions.
   * Encapsulates permission checking, optimistic state updates, API calls, and socket emission.
   */
  handleOptimisticAction: async <T>(options: ActionOptions<T>) => {
    const {
      state,
      setState,
      user,
      permissionHelper,
      requiredPermission,
      isGMOnly,
      optimisticUpdate,
      socketEmit,
      apiCall,
      validate,
      onFailure
    } = options;

    // 1. Validation
    if (validate) {
      const validationResult = validate();
      if (typeof validationResult === 'string') {
        if (onFailure) onFailure(validationResult);
        return;
      }
      if (validationResult === false) {
        if (onFailure) onFailure('Validation failed');
        return;
      }
    }

    // 2. Permission Check
    // REGRA MILENAR: Prefer PermissionHelper
    if (permissionHelper) {
      if (isGMOnly && !permissionHelper.isGameMaster()) {
        console.warn('[Action] Permission denied: GM only');
        return;
      }
      if (requiredPermission && !permissionHelper.canAsGMOr(requiredPermission)) {
        console.warn(`[Action] Permission denied: ${requiredPermission} required`);
        return;
      }
    } else if (isGMOnly && !state.isGM) {
      // Fallback for when permissionHelper is not passed (e.g. useSceneActions currently)
      // We should aim to pass permissionHelper everywhere, but for now this keeps it working.
      console.warn('[Action] Permission denied: GM only (fallback check)');
      return;
    }

    // 3. Optimistic Update
    const prevState = state;
    if (optimisticUpdate) {
      setState(prev => optimisticUpdate(prev));
    }

    // 4. API Call
    if (apiCall) {
      try {
        await apiCall();
      } catch (error) {
        console.error('[Action] API call failed:', error);
        // Revert state on failure
        setState(prevState);
        if (onFailure) onFailure('API call failed');
        return;
      }
    }

    // 5. Socket Emit
    if (socketEmit) {
      socketEmit();
    }
  }
};
