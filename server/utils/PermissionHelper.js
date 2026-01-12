/**
 * PermissionHelper - Server-side centralized permission checking
 * 
 * This is the SERVER equivalent of the client PermissionHelper.
 * ALL permission checks on the server MUST go through this helper.
 * 
 * REGRA MILENAR: Nenhuma verificação de permissão pode fugir deste helper!
 */

import * as db from '../db.js';
import { SubscriptionTier, GameRole, TIER_CONFIGS, ROLE_DEFAULTS } from './acl.js';

class PermissionHelper {
  constructor(client, campaign) {
    this.client = client;
    this.campaign = campaign;
    this.userId = client.userId;
    this.campaignId = client.campaignId;

    // SaaS & Role Info
    this.tier = client.subscriptionTier || SubscriptionTier.FREE;
    // If client.isGM is true, force role to GM, otherwise use client.gameRole or default to PLAYER
    this.role = client.isGM ? GameRole.GM : (client.gameRole || GameRole.PLAYER);

    // Derived for backward compatibility
    this.isGM = this.role === GameRole.GM;
  }

  /**
   * Check if the current user is the Game Master
   */
  isGameMaster() {
    return this.role === GameRole.GM;
  }

  /**
   * Role Capability Checks
   */
  canModifyGame() {
    return ROLE_DEFAULTS[this.role]?.canModifyGame || false;
  }

  canModifyPermissions() {
    return ROLE_DEFAULTS[this.role]?.canModifyPermissions || false;
  }

  canViewHidden() {
    return ROLE_DEFAULTS[this.role]?.canViewHidden || false;
  }

  canControlAnyToken() {
    return ROLE_DEFAULTS[this.role]?.canControlAnyToken || false;
  }

  canControlOwnTokens() {
    return ROLE_DEFAULTS[this.role]?.canControlOwnTokens || false;
  }

  /**
   * Check SaaS feature access
   */
  canFeature(featureKey) {
    const config = TIER_CONFIGS[this.tier];
    return config?.features.has(featureKey) || false;
  }

  // ... (can method remains the same) ...

  can(permission) {
    // 1. GM Bypass (or anyone with modifyGame capability?)
    // Strictly speaking, canModifyGame implies administrative rights, but checking isGM is safer for now.
    if (this.isGameMaster()) return true;

    // ... (rest of logical checks) ...
    // ...
    // 2. Spectator Restrictions
    if (this.role === GameRole.SPECTATOR) {
      // Block interactive permissions, allow only explicitly safe ones (like viewing)
      const allowedSpectatorPerms = ['allowSpectate', 'shareCursor', 'showRemoteViewports'];
      if (!allowedSpectatorPerms.includes(permission)) {
        return false;
      }
    }

    // ...
    if (!this.userId) return false;
    if (!this.campaign) return false;

    // 3. Role Capability Check (Platform Level)
    const roleCaps = ROLE_DEFAULTS[this.role];
    if (roleCaps && roleCaps.canModifyGame === false) {
      // If capabilities strict check needed
    }

    // 4. User Overrides
    const override = this.campaign.permissions?.userOverrides?.[this.userId]?.[permission];
    // 5. Default Campaign Permission
    const result = override !== undefined ? override : this.campaign.permissions?.[permission];
    return result || false;
  }

  /**
   * Universal Access Check (Tier + Role + Permission + Feature)
   */
  // ... (checkAccess remains same) ...

  checkAccess(requirements) {
    const { permission, feature, role } = requirements;

    // 1. Role Check
    if (role && this.role !== role) {
      if (this.role !== GameRole.GM) {
        return { allowed: false, reason: `Requires role: ${role}` };
      }
    }

    // 2. Feature Check (Tier)
    if (feature && !this.canFeature(feature)) {
      return { allowed: false, reason: `Requires feature: ${feature} (${this.tier})` };
    }

    // 3. Permission Check
    if (permission && !this.can(permission)) {
      return { allowed: false, reason: `Requires permission: ${permission}` };
    }

    return { allowed: true };
  }

  /**
   * Check if user can control a specific token
   * Uses ROLE_DEFAULTS capabilities: canControlAnyToken, canControlOwnTokens
   */
  canControlToken(token) {
    // 1. Universal Control (GM or equivalent)
    if (this.canControlAnyToken()) return true;

    // 2. Spectator/No Control Roles check
    // If role cannot control even own tokens, return false immediately
    if (!this.canControlOwnTokens()) return false;

    if (!this.userId) return false;

    // 3. Ownership/Control Check
    return token.ownerId === this.userId ||
      (token.controlledBy && token.controlledBy.includes(this.userId));
  }

  /**
   * Check if user can edit a specific token
   * Requires both token control AND tokenEdit permission
   */
  canEditToken(token) {
    if (this.isGameMaster()) return true;
    return this.canControlToken(token) && this.can('tokenEdit');
  }

  /**
   * Check if user can delete a specific token
   * Requires both token control AND tokenDelete permission
   */
  canDeleteToken(token) {
    if (this.isGameMaster()) return true;
    return this.canControlToken(token) && this.can('tokenDelete');
  }

  /**
   * Check if user can move a specific token
   * Requires both token control AND tokenMovement permission
   */
  canMoveToken(token) {
    if (this.isGameMaster()) return true;
    return this.canControlToken(token) && this.can('tokenMovement');
  }

  /**
   * Check if user can delete a specific drawing
   * GM can delete all drawings
   * Players can delete their own drawings if they have 'drawings' permission
   * Players can delete others' drawings if they have 'drawingDelete' permission
   */
  canDeleteDrawing(drawingUserId) {
    if (this.isGameMaster()) return true;
    if (!this.userId) return false;

    const isOwner = drawingUserId === this.userId;
    return (isOwner && this.can('drawings')) || (!isOwner && this.can('drawingDelete'));
  }

  /**
   * Check multiple permissions at once (AND logic)
   * Returns true only if user has ALL specified permissions
   */
  canAll(...permissions) {
    return permissions.every(perm => this.can(perm));
  }

  /**
   * Check multiple permissions at once (OR logic)
   * Returns true if user has ANY of the specified permissions
   */
  canAny(...permissions) {
    return permissions.some(perm => this.can(perm));
  }

  /**
   * Check if user can perform an action that requires GM or specific permission
   * Common pattern: isGM || hasPermission
   */
  canAsGMOr(permission) {
    return this.isGameMaster() || this.can(permission);
  }

  /**
   * Get all permissions for debugging/logging
   */
  getAllPermissions() {
    const result = {};
    const permissionKeys = [
      'tokenCreate', 'tokenEdit', 'tokenDelete', 'tokenMovement',
      'drawings', 'drawingDelete', 'fogReveal', 'doorControl',
      'pingMap', 'measure', 'diceRolling', 'sheetEdit', 'compendiumBrowse'
    ];

    permissionKeys.forEach(key => {
      result[key] = this.can(key);
    });

    return result;
  }

  /**
   * Require GM permission - throws error if not GM
   * Use this for GM-only actions
   */
  requireGM(action = 'this action') {
    if (!this.isGameMaster()) {
      throw new Error(`GM permission required for ${action}`);
    }
  }

  /**
   * Require specific permission - throws error if not allowed
   * Use this for permission-gated actions
   */
  requirePermission(permission, action = null) {
    if (!this.can(permission)) {
      const actionText = action || permission;
      throw new Error(`Permission '${permission}' required for ${actionText}`);
    }
  }

  /**
   * Static factory method to create PermissionHelper from client
   * Automatically fetches campaign if needed
   */
  static async create(client) {
    let campaign = null;

    if (client.campaignId) {
      try {
        campaign = await db.getById('campaigns', client.campaignId);
      } catch (error) {
        console.error('[PermissionHelper] Error fetching campaign:', error);
      }
    }

    return new PermissionHelper(client, campaign);
  }

  /**
   * Static factory method with pre-loaded campaign
   * Use this when you already have the campaign object
   */
  static createWithCampaign(client, campaign) {
    return new PermissionHelper(client, campaign);
  }
}

export default PermissionHelper;
