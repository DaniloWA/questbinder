/**
 * PermissionHelper - Server-side centralized permission checking
 * 
 * This is the SERVER equivalent of the client PermissionHelper.
 * ALL permission checks on the server MUST go through this helper.
 * 
 * REGRA MILENAR: Nenhuma verificação de permissão pode fugir deste helper!
 */

import * as db from '../db.js';

class PermissionHelper {
  constructor(client, campaign) {
    this.client = client;
    this.campaign = campaign;
    this.isGM = client.isGM;
    this.userId = client.userId;
    this.campaignId = client.campaignId;
  }

  /**
   * Check if the current user is the Game Master
   */
  isGameMaster() {
    return this.isGM === true;
  }

  /**
   * Check if user has a specific boolean permission
   * GM always returns true
   * Checks user overrides first, then falls back to global permission
   */
  can(permission) {
    if (this.isGM) return true;
    if (!this.userId) return false;
    if (!this.campaign) return false;

    const override = this.campaign.permissions?.userOverrides?.[this.userId]?.[permission];
    return override !== undefined ? override : this.campaign.permissions?.[permission] || false;
  }

  /**
   * Check if user can control a specific token
   * GM can control all tokens
   * Players can control tokens they own or are controlled by them
   */
  canControlToken(token) {
    if (this.isGM) return true;
    if (!this.userId) return false;

    return token.ownerId === this.userId ||
      (token.controlledBy && token.controlledBy.includes(this.userId));
  }

  /**
   * Check if user can edit a specific token
   * Requires both token control AND tokenEdit permission
   */
  canEditToken(token) {
    if (this.isGM) return true;
    return this.canControlToken(token) && this.can('tokenEdit');
  }

  /**
   * Check if user can delete a specific token
   * Requires both token control AND tokenDelete permission
   */
  canDeleteToken(token) {
    if (this.isGM) return true;
    return this.canControlToken(token) && this.can('tokenDelete');
  }

  /**
   * Check if user can move a specific token
   * Requires both token control AND tokenMovement permission
   */
  canMoveToken(token) {
    if (this.isGM) return true;
    return this.canControlToken(token) && this.can('tokenMovement');
  }

  /**
   * Check if user can delete a specific drawing
   * GM can delete all drawings
   * Players can delete their own drawings if they have 'drawings' permission
   * Players can delete others' drawings if they have 'drawingDelete' permission
   */
  canDeleteDrawing(drawingUserId) {
    if (this.isGM) return true;
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
    return this.isGM || this.can(permission);
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
    if (!this.isGM) {
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
