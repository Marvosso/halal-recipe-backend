/**
 * Verdict + confidence display tokens (deterministic UI mapping).
 */

export const VERDICT_DISPLAY = {
  halal: {
    label: "Halal",
    summary: "Generally permissible",
    className: "halal",
    ariaLabel: "Halal — permissible",
  },
  usually_halal: {
    label: "Usually halal",
    summary: "Generally OK — verify source if unsure",
    className: "halal",
    ariaLabel: "Usually halal",
  },
  conditional: {
    label: "Conditional",
    summary: "Depends on source or processing",
    className: "conditional",
    ariaLabel: "Conditional — verify before use",
  },
  questionable: {
    label: "Conditional",
    summary: "Depends on source or processing",
    className: "conditional",
    ariaLabel: "Conditional — verify before use",
  },
  usually_haram: {
    label: "Usually not halal",
    summary: "Often problematic in commercial form",
    className: "haram",
    ariaLabel: "Usually not halal",
  },
  haram: {
    label: "Haram",
    summary: "Not permissible",
    className: "haram",
    ariaLabel: "Haram — not permissible",
  },
  unknown: {
    label: "Unknown",
    summary: "Not enough data — verify with a scholar",
    className: "unknown",
    ariaLabel: "Unknown — insufficient data",
  },
};

export const CONFIDENCE_DISPLAY = {
  high: { label: "High confidence", percentFallback: 90 },
  medium: { label: "Medium confidence", percentFallback: 65 },
  low: { label: "Low confidence", percentFallback: 35 },
};

/**
 * @param {string} verdict
 * @param {string} [halalStatus] - legacy collapsed status
 */
export function getVerdictDisplay(verdict, halalStatus) {
  const key = verdict || halalStatus || "unknown";
  return VERDICT_DISPLAY[key] || VERDICT_DISPLAY.unknown;
}

import { displayConfidencePercent } from "../../contracts/confidenceV1.js";

/**
 * Display-only: pass through canonical score (no UI adjustment).
 * @param {string} level
 * @param {number} [score]
 */
export function getConfidencePercent(level, score) {
  return displayConfidencePercent(level, score);
}

/**
 * @param {string} effect
 */
export function getModifierEffectLabel(effect) {
  const map = {
    override_halal: "Halal signal",
    override_haram: "Haram signal",
    strengthen: "Source context",
    weaken: "Verify source",
    context: "Context",
  };
  return map[effect] || "Context";
}
