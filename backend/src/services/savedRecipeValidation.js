/**
 * Trust boundary for saved recipe payloads — clamp scores, cap issue count.
 */

import { clampConfidenceScore } from "../contracts/confidenceV1.js";

const MAX_ISSUES = 100;
const MAX_TEXT_LENGTH = 50000;

/**
 * @param {object} issue
 * @returns {object}
 */
function sanitizeIssue(issue) {
  if (!issue || typeof issue !== "object") return { ingredient: "unknown" };
  return {
    ingredient: String(issue.ingredient || issue.matchedTerm || "").slice(0, 200),
    ingredient_id: issue.ingredient_id ? String(issue.ingredient_id).slice(0, 80) : undefined,
    status: issue.status || issue.verdict || issue.halal_status || undefined,
    verdict: issue.verdict || undefined,
    halal_status: issue.halal_status || undefined,
    replacement_id: issue.replacement_id ? String(issue.replacement_id).slice(0, 80) : undefined,
    confidence_score:
      typeof issue.confidence_score === "number"
        ? clampConfidenceScore(issue.confidence_score)
        : undefined,
  };
}

/**
 * @param {object} payload - raw POST body fields
 * @returns {{ title: string, originalRecipe: string, convertedRecipe: string, confidenceScore: number, substitutionsUsed: object[], issues: object[] }}
 */
export function sanitizeSavedRecipePayload(payload) {
  const originalRecipe = String(payload.originalRecipe || "").slice(0, MAX_TEXT_LENGTH);
  const convertedRecipe = String(payload.convertedRecipe || "").slice(0, MAX_TEXT_LENGTH);
  const title = String(payload.title || "").slice(0, 200);

  const rawIssues = Array.isArray(payload.substitutionsUsed)
    ? payload.substitutionsUsed
    : Array.isArray(payload.issues)
      ? payload.issues
      : [];

  const substitutionsUsed = rawIssues.slice(0, MAX_ISSUES).map(sanitizeIssue);

  const confidenceScore = clampConfidenceScore(
    typeof payload.confidenceScore === "number" && !Number.isNaN(payload.confidenceScore)
      ? payload.confidenceScore
      : 0
  );

  return {
    title,
    originalRecipe,
    convertedRecipe,
    confidenceScore,
    substitutionsUsed,
    issues: substitutionsUsed,
  };
}
