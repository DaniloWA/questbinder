import { Character } from '../../../types';

/**
 * List of tool prefixes that trigger the Precision Cursor.
 */
export const PRECISION_TOOLS = [
  'draw-',
  'fog-',
  'smart-',
  'freehand-wall',
  'measure-'
];

/**
 * Checks if the Precision Cursor should be enabled based on the active tool.
 */
export const shouldShowPrecisionCursor = (activeTool: string): boolean => {
  if (activeTool.startsWith('map-align')) return true;
  return PRECISION_TOOLS.some(prefix => activeTool.startsWith(prefix));
};

/**
 * Checks if the Local Cursor should be enabled.
 */
export const shouldShowLocalCursor = (
  isMouseOverVTT: boolean,
  hoveredTokenId: string | null,
  isTokenDragging: boolean,
  activeTool: string
): boolean => {
  if (!isMouseOverVTT) return false;
  if (hoveredTokenId) return false;
  if (isTokenDragging) return false;
  if (activeTool.startsWith('map-align')) return false;
  // If precision cursor is active, local cursor should be hidden
  if (PRECISION_TOOLS.some(prefix => activeTool.startsWith(prefix))) return false;
  return true;
};

/**
 * Determines the mode for the Precision Cursor.
 */
export const getPrecisionCursorMode = (activeTool: string): 'inspect' | 'drag' | '3point' | string => {
  if (activeTool === 'map-align') return 'inspect';
  if (activeTool.startsWith('map-align-')) return activeTool.replace('map-align-', '');
  // For other tools, the mode essentially doesn't matter as much or is handled by 'tool' prop
  return 'inspect';
};

/**
 * Calculates the health status string for the cursor.
 */
export const calculateHealthStatus = (
  currentUserId: string | undefined,
  campaignCharacters: Character[] | undefined
): 'healthy' | 'bloodied' | 'unconscious' => {
  if (!currentUserId || !campaignCharacters) return 'healthy';
  const char = campaignCharacters.find(c => c.ownerId === currentUserId);
  if (!char) return 'healthy';

  if (char.hpCurrent <= 0) return 'unconscious';
  if (char.hpCurrent <= (char.hpMax / 2)) return 'bloodied';
  return 'healthy';
};
