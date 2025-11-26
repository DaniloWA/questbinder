import { BooleanPermissionKey } from '../types';
import { SessionPermissions, Token, TokenHoverPermissions } from '../../../types';

/**
 * PermissionHelper - Centralized permission checking system
 * 
 * This helper provides a single source of truth for all permission-related checks.
 * It handles GM status, user overrides, and default permissions consistently.
 */
export class PermissionHelper {
  private isGM: boolean;
  private userId: string | null;
  private permissions: SessionPermissions;

  constructor(isGM: boolean, userId: string | null, permissions: SessionPermissions) {
    this.isGM = isGM;
    this.userId = userId;
    this.permissions = permissions;
  }

  /**
   * Check if the current user is the Game Master
   */
  isGameMaster(): boolean {
    return this.isGM;
  }

  /**
   * Check if user has a specific boolean permission
   * GM always returns true
   * Checks user overrides first, then falls back to global permission
   */
  can(permission: BooleanPermissionKey): boolean {
    if (this.isGM) return true;
    if (!this.userId) return false;

    const userOverrides = this.permissions.userOverrides?.[this.userId];
    const overrideValue = userOverrides?.[permission];

    return (overrideValue !== undefined ? overrideValue : this.permissions[permission]) as boolean;
  }

  /**
   * Check if user can control a specific token
   * GM can control all tokens
   * Players can control tokens they own or are controlled by them
   */
  canControlToken(token: Token): boolean {
    if (!token) return false;
    if (this.isGM) return true;
    if (!this.userId) return false;

    return token.controlledBy?.includes(this.userId) || false;
  }

  /**
   * Check if user can edit a specific token
   * Requires both token control AND tokenEdit permission
   */
  canEditToken(token: Token): boolean {
    if (this.isGM) return true;
    return this.canControlToken(token) && this.can('tokenEdit');
  }

  /**
   * Check if user can delete a specific token
   * Requires both token control AND tokenDelete permission
   */
  canDeleteToken(token: Token): boolean {
    if (this.isGM) return true;
    return this.canControlToken(token) && this.can('tokenDelete');
  }

  /**
   * Check if user can move a specific token
   * Requires both token control AND tokenMovement permission
   */
  canMoveToken(token: Token): boolean {
    if (this.isGM) return true;
    return this.canControlToken(token) && this.can('tokenMovement');
  }

  /**
   * Check if user can see a specific token
   * GM can see all tokens
   * Players can see visible tokens or tokens they control
   */
  canSeeToken(token: Token): boolean {
    if (this.isGM) return true;
    return token.isVisibleToPlayers || this.canControlToken(token);
  }

  /**
   * Check if user can see specific token hover information
   * Uses TokenHoverPermissions system
   */
  canSeeTokenHoverField(
    token: Token,
    field: keyof TokenHoverPermissions['pc'] | keyof TokenHoverPermissions['npc'] | keyof TokenHoverPermissions['object'],
    tokenHoverPermissions?: TokenHoverPermissions
  ): boolean {
    // GM and controllers always see everything
    if (this.isGM || this.canControlToken(token)) return true;

    // If hover is globally disabled, return false
    if (tokenHoverPermissions?.enabled === false) return false;

    // If no permissions defined, default to show everything (backward compatibility)
    if (!tokenHoverPermissions) return true;

    // Check based on token type
    const tokenPerms = tokenHoverPermissions[token.type];
    if (!tokenPerms) return true;

    // Type-safe field check
    if (field in tokenPerms) {
      return (tokenPerms as any)[field] === true;
    }

    return false;
  }

  /**
   * Check if user can delete a specific drawing
   * GM can delete all drawings
   * Players can delete their own drawings if they have 'drawings' permission
   * Players can delete others' drawings if they have 'drawingDelete' permission
   */
  canDeleteDrawing(drawingUserId: string): boolean {
    if (this.isGM) return true;
    if (!this.userId) return false;

    const isOwner = drawingUserId === this.userId;
    return (isOwner && this.can('drawings')) || (!isOwner && this.can('drawingDelete'));
  }

  /**
   * Check multiple permissions at once (AND logic)
   * Returns true only if user has ALL specified permissions
   */
  canAll(...permissions: BooleanPermissionKey[]): boolean {
    return permissions.every(perm => this.can(perm));
  }

  /**
   * Check multiple permissions at once (OR logic)
   * Returns true if user has ANY of the specified permissions
   */
  canAny(...permissions: BooleanPermissionKey[]): boolean {
    return permissions.some(perm => this.can(perm));
  }

  /**
   * Get a permission wrapper function for UI components
   * Useful for hiding/showing UI elements based on permissions
   */
  createPermissionChecker(permission: BooleanPermissionKey): () => boolean {
    return () => this.can(permission);
  }

  /**
   * Check if user can perform an action that requires GM or specific permission
   * Common pattern: isGM || hasPermission
   */
  canAsGMOr(permission: BooleanPermissionKey): boolean {
    return this.isGM || this.can(permission);
  }

  /**
   * Get all permissions for debugging/logging
   */
  getAllPermissions(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    const permissionKeys: BooleanPermissionKey[] = [
      // Interação Básica
      'tokenMovement', 'doorControl', 'drawings', 'measure', 'pingMap', 'diceRolling',
      // Gestão de Tokens
      'tokenCreate', 'tokenEdit', 'tokenDelete',
      // Ferramentas Avançadas
      'fogReveal',
      // Novas Permissões (Total Control)
      'compendiumBrowse', 'bestiaryBrowse', 'journalCreate', 'sheetEdit', 'initiativeRoll',
      'drawingDelete', 'drawingClear',
      // Privacidade
      'shareCursor', 'allowSpectate'
    ];

    permissionKeys.forEach(key => {
      result[key] = this.can(key);
    });

    return result;
  }

  /**
   * Create a new instance with updated permissions
   * Useful for reactive updates
   */
  static create(isGM: boolean, userId: string | null, permissions: SessionPermissions): PermissionHelper {
    return new PermissionHelper(isGM, userId, permissions);
  }
}

/**
 * Factory function to create a PermissionHelper instance
 * Use this in hooks and components
 */
export const createPermissionHelper = (
  isGM: boolean,
  userId: string | null,
  permissions: SessionPermissions
): PermissionHelper => {
  return PermissionHelper.create(isGM, userId, permissions);
};
