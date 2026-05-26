/**
 * Verdict hierarchy ↔ legacy halal_status for existing UI.
 */

/**
 * @param {string} verdict
 * @returns {"halal"|"conditional"|"haram"|"unknown"}
 */
export function verdictToLegacyStatus(verdict) {
  switch (verdict) {
    case "halal":
    case "usually_halal":
      return "halal";
    case "haram":
    case "usually_haram":
      return "haram";
    case "conditional":
      return "conditional";
    default:
      return "unknown";
  }
}

/**
 * @param {string} confidenceLevel
 * @returns {number} 0–1
 */
export function confidenceLevelToScore(confidenceLevel) {
  switch (confidenceLevel) {
    case "high":
      return 1.0;
    case "medium":
      return 0.6;
    case "low":
      return 0.3;
    default:
      return 0.3;
  }
}

/**
 * @param {string} confidenceLevel
 * @returns {number} 0–100 for UI
 */
export function confidenceLevelToPercent(confidenceLevel) {
  return Math.round(confidenceLevelToScore(confidenceLevel) * 100);
}
