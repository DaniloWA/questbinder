/**
 * Unit Conversion Utilities
 * Helper functions for converting between D&D imperial units and metric
 */

/**
 * Convert feet to meters (rounded to 1 decimal place)
 * D&D standard: 5 feet ≈ 1.5 meters
 */
export function ftToM(feet: number | string | undefined): string {
  if (feet === undefined || feet === null) return '';
  const num = typeof feet === 'string' ? parseFloat(feet) : feet;
  if (isNaN(num)) return '';
  const meters = Math.round(num * 0.3 * 10) / 10;
  return `${meters}m`;
}

/**
 * Convert meters to feet (rounded)
 */
export function mToFt(meters: number | string | undefined): string {
  if (meters === undefined || meters === null) return '';
  const num = typeof meters === 'string' ? parseFloat(meters) : meters;
  if (isNaN(num)) return '';
  const feet = Math.round(num / 0.3);
  return `${feet} ft.`;
}
