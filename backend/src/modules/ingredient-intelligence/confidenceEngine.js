/**
 * Confidence scoring — verdict separate; modifier-aware adjustments.
 */

import { confidenceLevelToScore, confidenceLevelToPercent } from "./verdictMapper.js";
import { adjustConfidenceForModifiers } from "./modifiers/confidence.js";

/**
 * @param {object} params
 */
export function computeConfidence({
  baseConfidence,
  matchQuality,
  aliasApplied = false,
  modifiers = [],
  modifierDetails = [],
  verdict = "unknown",
}) {
  let level = baseConfidence || "medium";

  if (verdict === "unknown" || matchQuality === "none") {
    level = "low";
  } else if (aliasApplied && level === "high") {
    level = "medium";
  } else if (matchQuality === "fuzzy" && level === "high") {
    level = "medium";
  }

  const { confidence_level, adjustments } = adjustConfidenceForModifiers({
    baseConfidence: level,
    modifierSlugs: modifiers,
    modifierDetails,
    verdict,
  });

  level = confidence_level;

  if (!["high", "medium", "low"].includes(level)) {
    level = "medium";
  }

  return {
    confidence_level: level,
    confidence: confidenceLevelToScore(level),
    confidence_score: confidenceLevelToPercent(level),
    confidence_adjustments: adjustments,
  };
}
