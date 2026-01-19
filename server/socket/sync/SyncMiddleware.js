export class SyncMiddleware {
  /**
   * Check for version conflict.
   * Returns true if there is a conflict.
   * 
   * @param {number} clientVersion - Version sent by client
   * @param {number} serverVersion - Current server version (defaults to 0)
   */
  static hasConflict(clientVersion, serverVersion = 0) {
    if (!clientVersion && clientVersion !== 0) return false; // Legacy/No version
    return serverVersion > clientVersion;
  }

  /**
   * Calculate next version.
   * 
   * @param {number} currentVersion 
   */
  static nextVersion(currentVersion = 0) {
    return (currentVersion || 0) + 1;
  }

  /**
   * Create acknowledgement payload.
   * 
   * @param {string} changeId 
   * @param {number} newVersion 
   */
  static createAck(changeId, newVersion) {
    return {
      type: 'sync:ack',
      changeId,
      version: newVersion,
      timestamp: Date.now()
    };
  }

  /**
   * Create reject payload.
   * 
   * @param {string} changeId 
   * @param {number} serverVersion 
   * @param {object} serverData 
   */
  static createReject(changeId, serverVersion, serverData) {
    return {
      type: 'sync:reject',
      changeId,
      version: serverVersion,
      data: serverData,
      timestamp: Date.now()
    };
  }
}
