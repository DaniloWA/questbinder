import { Token, MapScene } from '../../types';

export class TokenService {
  /**
   * Calculates the effective vision range of a token based on its properties and scene settings.
   */
  static calculateVisionRange(token: Token, scene?: MapScene): number {
    // Basic vision range from token property
    let range = token.visionRange || 0;

    // If scene has global vision limits or modifiers, apply them here
    // For now, we return the token's intrinsic vision range
    return range;
  }

  /**
   * Determines if a specific user can control a token.
   */
  static canBeControlled(token: Token, userId: string | undefined, isGM: boolean): boolean {
    if (!userId) return false;
    if (isGM) return true;

    // Check ownership
    if (token.ownerId === userId) return true;

    // Check explicit control list
    if (token.controlledBy && token.controlledBy.includes(userId)) return true;

    return false;
  }

  /**
   * Calculates the grid position (column, row) for a token based on world coordinates.
   */
  static getGridPosition(token: Token, gridSize: number): { x: number, y: number; } {
    return {
      x: Math.floor(token.x),
      y: Math.floor(token.y)
    };
  }

  /**
   * Calculates the world coordinates from grid position.
   */
  static getWorldPosition(gridX: number, gridY: number, gridSize: number): { x: number, y: number; } {
    return {
      x: gridX * gridSize,
      y: gridY * gridSize
    };
  }
}
