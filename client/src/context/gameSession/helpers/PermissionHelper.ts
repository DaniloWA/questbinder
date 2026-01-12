import { BooleanPermissionKey } from '../types';
import { SessionPermissions, Token, TokenHoverPermissions } from '../../../types';
import {
  SubscriptionTier,
  GameRole,
  PremiumFeatureKey,
  TierLimits,
  TIER_CONFIGS,
  ROLE_DEFAULTS,
  RoleCapabilities
} from '../../../types/acl';

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
  private tier: SubscriptionTier;
  private role: GameRole;
  private capabilities: RoleCapabilities;

  constructor(
    isGM: boolean,
    userId: string | null,
    permissions: SessionPermissions,
    tier: SubscriptionTier = SubscriptionTier.FREE,
    role: GameRole = GameRole.PLAYER
  ) {
    this.userId = userId;
    this.permissions = permissions;
    this.tier = tier;

    // Backward compatibility: If isGM is true, force GM role
    this.role = isGM ? GameRole.GM : role;
    this.isGM = this.role === GameRole.GM; // Derived source of truth

    this.capabilities = ROLE_DEFAULTS[this.role];
  }

  /**
   * Check if the current user is the Game Master
   */
  isGameMaster(): boolean {
    return this.isGM;
  }

  /**
   * Check if user has a specific boolean permission
   * 1. GM always returns true
   * 2. Spectators are blocked from interactive permissions
   * 3. User overrides take precedence
   * 4. Role capabilities act as a filter
   * 5. Default permissions
   */
  can(permission: BooleanPermissionKey): boolean {
    // 1. GM Override
    if (this.role === GameRole.GM) return true;

    if (!this.userId) return false;

    // 2. Spectator Global Restriction (Interactive permissions)
    if (this.role === GameRole.SPECTATOR) {
      const interactivePerms: BooleanPermissionKey[] = [
        'tokenMovement', 'tokenCreate', 'tokenEdit', 'tokenDelete',
        'doorControl', 'drawings', 'measure', 'fogReveal',
        'journalCreate', 'sheetEdit', 'initiativeRoll'
      ];
      if (interactivePerms.includes(permission)) return false;
    }

    // 3. User Specific Override
    const userOverrides = this.permissions.userOverrides?.[this.userId];
    const overrideValue = userOverrides?.[permission];

    if (overrideValue !== undefined) {
      return overrideValue;
    }

    // 4. Role Capability Filter (Optional - strict role enforcement)
    // Map permissions to capabilities if needed. For now, rely on defaults + role.

    // 5. Default/Global Permission
    return this.permissions[permission] ?? false;
  }

  /**
   * Check if user access to a Premium Feature based on Subscription Tier
   */
  canFeature(feature: PremiumFeatureKey): boolean {
    const tierConfig = TIER_CONFIGS[this.tier];
    return tierConfig.features.has(feature);
  }

  /**
   * Unified Access Check
   * Checks Permission OR Feature OR Role requirements
   */
  checkAccess(requirements: {
    permission?: BooleanPermissionKey;
    feature?: PremiumFeatureKey;
    role?: GameRole;
  }): { allowed: boolean; reason?: string; } {
    // 1. Role Check
    if (requirements.role && this.role !== requirements.role) {
      // GM has access to everything EXCEPT specific role checks (e.g. "Is Player")
      // Unless we decide GM satisfies all roles. For now, strict check.
      if (this.role !== GameRole.GM) {
        return { allowed: false, reason: `Requires ${requirements.role} role` };
      }
    }

    // 2. Feature/Tier Check
    if (requirements.feature && !this.canFeature(requirements.feature)) {
      return { allowed: false, reason: `Requires ${this.tier} tier or higher` };
    }

    // 3. Permission Check
    if (requirements.permission && !this.can(requirements.permission)) {
      return { allowed: false, reason: `Missing ${requirements.permission} permission` };
    }

    return { allowed: true };
  }

  canControlAnyToken(): boolean {
    return this.capabilities.canControlAnyToken || false;
  }

  canControlOwnTokens(): boolean {
    return this.capabilities.canControlOwnTokens || false;
  }

  canControlToken(token: Token): boolean {
    if (!token) return false;

    // 1. Universal Control (GM or equivalent)
    if (this.canControlAnyToken()) return true;

    // 2. Spectator/No Control Roles check
    if (!this.canControlOwnTokens()) return false;

    if (!this.userId) return false;

    // 3. Ownership/Control Check
    return token.ownerId === this.userId ||
      (token.controlledBy?.includes(this.userId) || false);
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
      'attackZoneCreate', 'attackZoneUse',
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
  static create(
    isGM: boolean,
    userId: string | null,
    permissions: SessionPermissions,
    tier: SubscriptionTier = SubscriptionTier.FREE,
    role: GameRole = GameRole.PLAYER
  ): PermissionHelper {
    return new PermissionHelper(isGM, userId, permissions, tier, role);
  }
}

/**
 * Factory function to create a PermissionHelper instance
 * Use this in hooks and components
 */
export const createPermissionHelper = (
  isGM: boolean,
  userId: string | null,
  permissions: SessionPermissions,
  tier: SubscriptionTier = SubscriptionTier.FREE,
  role: GameRole = GameRole.PLAYER
): PermissionHelper => {
  return PermissionHelper.create(isGM, userId, permissions, tier, role);
};
