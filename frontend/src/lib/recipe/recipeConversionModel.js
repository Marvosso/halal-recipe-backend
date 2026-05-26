/**
 * Map server POST /convert response → UI issue shape (Phase 3).
 */

import { apiEnvelopeToIngredientEvaluationV1 } from "../../contracts/ingredientEvaluationV1.js";

function resolveIssueV1(issue) {
  if (
    issue.evaluation?.contract_version === "1" &&
    issue.evaluation.confidence?.level != null
  ) {
    return issue.evaluation;
  }
  if (issue.evaluation_api) {
    return apiEnvelopeToIngredientEvaluationV1(issue.evaluation_api);
  }
  return null;
}

/**
 * @param {object} issue - server conversion issue
 */
export function mapServerIssueToUi(issue) {
  if (!issue || typeof issue !== "object") return issue;

  const v1 = resolveIssueV1(issue);
  const baseSlug = v1?.base_ingredient?.slug || null;
  const displayName =
    v1?.base_ingredient?.display_name ||
    issue.ingredient ||
    issue.matchedTerm ||
    v1?.ingredient;

  return {
    ...issue,
    ingredient_id: issue.ingredient_id || baseSlug || issue.ingredient,
    ingredient: issue.ingredient || issue.matchedTerm || displayName,
    status: issue.status || v1?.halal_status,
    verdict: issue.verdict || v1?.verdict,
    replacement_id: issue.replacement_id || issue.replacement,
    replacement: issue.replacement || issue.replacement_id,
    ranked_substitutes: issue.ranked_substitutes || [],
    alternatives: issue.alternatives || [],
    notes: issue.notes || v1?.explanation || "",
    explanation: issue.notes || v1?.explanation || "",
    confidence: issue.confidence ?? v1?.confidence?.value,
    confidence_score: issue.confidence_score ?? v1?.confidence?.score,
    confidence_level: issue.confidence_level ?? v1?.confidence?.level,
    references: issue.references || v1?.references || [],
    warnings: issue.warnings || v1?.warnings || [],
    evaluation: v1 || issue.evaluation,
    wasReplaced: Boolean(issue.wasReplaced),
  };
}

/**
 * @param {object} data - POST /convert JSON body
 */
export function mapServerConversionResponse(data) {
  const issues = Array.isArray(data?.issues) ? data.issues.map(mapServerIssueToUi) : [];

  return {
    originalText: data?.originalText || "",
    convertedText: data?.convertedText || "",
    issues,
    confidenceScore:
      typeof data?.confidenceScore === "number" && !Number.isNaN(data.confidenceScore)
        ? data.confidenceScore
        : 0,
    contractVersion: data?.contract_version,
    pipeline: data?.pipeline,
    meta: data?.meta || {},
  };
}
