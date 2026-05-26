/**
 * ConfidenceV1 — canonical confidence model (ingredient + recipe display).
 * Authority: ingredient-intelligence computeConfidence + recipeConfidence aggregate.
 * UI may clamp/bound for display only; must not apply preference or heuristic adjustments.
 */

export const CONFIDENCE_LEVELS = Object.freeze(["high", "medium", "low"]);

/** Level → default percent when score missing (deterministic defaults only). */
export const CONFIDENCE_LEVEL_DEFAULTS = Object.freeze({
  high: 85,
  medium: 65,
  low: 40,
});

/**
 * @param {number} score
 * @returns {number}
 */
export function clampConfidenceScore(score) {
  if (typeof score !== "number" || Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Display percent from canonical level + score (no strictness/madhab adjustment).
 * @param {string} level
 * @param {number} [score]
 */
export function displayConfidencePercent(level, score) {
  if (typeof score === "number" && !Number.isNaN(score)) {
    return clampConfidenceScore(score);
  }
  const lvl = CONFIDENCE_LEVELS.includes(level) ? level : "medium";
  return CONFIDENCE_LEVEL_DEFAULTS[lvl] ?? 50;
}

/**
 * @param {string} level
 * @param {number} [score]
 * @param {number} [value01]
 * @returns {{ level: string, score: number, value: number }}
 */
export function normalizeConfidence(level, score, value01) {
  const lvl = CONFIDENCE_LEVELS.includes(level) ? level : "medium";
  let sc =
    typeof score === "number" && !Number.isNaN(score) ? Math.round(score) : undefined;
  if (sc === undefined && typeof value01 === "number") {
    sc = Math.round(Math.max(0, Math.min(1, value01)) * 100);
  }
  if (sc === undefined) {
    sc = CONFIDENCE_LEVEL_DEFAULTS[lvl];
  }
  sc = clampConfidenceScore(sc);
  const value =
    typeof value01 === "number"
      ? Math.max(0, Math.min(1, value01))
      : sc / 100;
  return { level: lvl, score: sc, value };
}

/**
 * Map numeric score to level (for legacy envelopes missing level).
 * @param {number} score
 */
export function confidenceLevelFromScore(score) {
  const s = clampConfidenceScore(score);
  if (s >= 80) return "high";
  if (s >= 50) return "medium";
  return "low";
}
