/**
 * Recipe-level confidence — single canonical aggregate (conversion workflows).
 * Combines per-ingredient canonical confidence_score with replacement outcomes.
 */

import { clampConfidenceScore } from "./confidenceV1.js";

/** Canonical recipe confidence profile (intelligence pipeline). */
export const CANONICAL_RECIPE_CONFIDENCE_OPTIONS = Object.freeze({
  emptyScore: 100,
  allowFullReplacementBoost: false,
});

/** Legacy halalConverter.js profile — rollback only. */
export const LEGACY_RECIPE_CONFIDENCE_OPTIONS = Object.freeze({
  emptyScore: null,
  allowFullReplacementBoost: true,
});

const HARAMISH = new Set([
  "haram",
  "usually_haram",
  "conditional",
  "unknown",
  "questionable",
]);

/**
 * @param {object} issue
 */
function issueStatus(issue) {
  return (
    issue.status ||
    issue.halal_status ||
    issue.verdict ||
    "unknown"
  ).toLowerCase();
}

function issueConfidenceScore(issue) {
  if (typeof issue.confidence_score === "number" && !Number.isNaN(issue.confidence_score)) {
    return issue.confidence_score;
  }
  if (typeof issue.confidenceScore === "number" && !Number.isNaN(issue.confidenceScore)) {
    return issue.confidenceScore;
  }
  if (typeof issue.confidence === "number" && issue.confidence <= 1) {
    return Math.round(issue.confidence * 100);
  }
  return 50;
}

/**
 * @param {object} input
 * @param {Array} [input.detectedIssues]
 * @param {Array} [input.issues]
 * @param {Array} [input.originalIngredients]
 * @param {Array} input.replacements
 * @param {Array} input.unresolved
 * @param {object} [options]
 * @param {number|null} [options.emptyScore=100] - null for legacy halalConverter empty detection
 * @param {boolean} [options.allowFullReplacementBoost=false] - legacy demo boost when all haram replaced
 */
export function calculateRecipeConfidenceScore(
  { detectedIssues, issues, originalIngredients, replacements = [], unresolved = [] },
  options = {}
) {
  const issueList = detectedIssues || issues || originalIngredients || [];
  const { emptyScore = 100, allowFullReplacementBoost = false } = options;

  if (!issueList.length) {
    return emptyScore === null ? null : clampConfidenceScore(emptyScore);
  }

  const haramish = issueList.filter((i) => HARAMISH.has(issueStatus(i)));

  if (haramish.length === 0) {
    return 100;
  }

  const unresolvedHaram = unresolved.filter(
    (u) => issueStatus(u) === "haram"
  ).length;
  const unresolvedConditional = unresolved.filter((u) => {
    const s = issueStatus(u);
    return s === "conditional" || s === "questionable";
  }).length;

  const replaced = replacements.length;
  const total = haramish.length;

  let score = 100;
  score -= unresolvedHaram * 18;
  score -= unresolvedConditional * 10;
  score -= Math.max(0, total - replaced) * 8;

  const avgConf =
    haramish.reduce((sum, i) => sum + issueConfidenceScore(i), 0) / total;
  score = Math.round(score * 0.7 + avgConf * 0.3);

  if (allowFullReplacementBoost) {
    const totalHaram = issueList.filter((i) => issueStatus(i) === "haram").length;
    const replacedHaram = replacements.filter((r) => issueStatus(r) === "haram").length;
    if (totalHaram > 0 && replacedHaram === totalHaram && unresolvedHaram === 0) {
      score = 100;
    }
  }

  return clampConfidenceScore(score);
}
