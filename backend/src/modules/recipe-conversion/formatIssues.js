/**
 * Format conversion issues for API + frontend (includes IngredientEvaluationV1 per issue).
 */

import {
  evaluationToIngredientEvaluationV1,
  ingredientEvaluationV1ToApiEnvelope,
} from "../../contracts/ingredientEvaluationV1.js";

/**
 * @param {object} evaluation - intelligence engine evaluation
 * @param {object} ctx
 */
export function formatConversionIssue(evaluation, ctx) {
  const v1 = evaluationToIngredientEvaluationV1(evaluation, { source: "recipe" });
  const substitutes = v1.substitutes || { best: null, alternatives: [] };
  const replacementId = substitutes.best?.slug || substitutes.alternatives?.[0]?.slug || null;

  const ranked_substitutes = [
    substitutes.best,
    ...(substitutes.alternatives || []),
  ]
    .filter(Boolean)
    .map((s, idx) => ({
      id: s.slug || s.name?.replace(/\s+/g, "_"),
      name: s.name,
      why_it_works: s.reason || "",
      rank_score: 100 - idx * 10,
    }))
    .filter((s) => s.id);

  return {
    ingredient_id: v1.base_ingredient?.slug || ctx.baseSlug || v1.ingredient,
    ingredient: ctx.matchedTerm || v1.base_ingredient?.display_name || v1.ingredient,
    matchedTerm: ctx.matchedTerm,
    status: v1.halal_status,
    verdict: v1.verdict,
    replacement_id: replacementId,
    replacement: replacementId || "Halal alternative needed",
    alternatives: ranked_substitutes.map((s) => s.id),
    ranked_substitutes,
    notes: v1.explanation || "",
    severity:
      v1.halal_status === "haram" ? "high" : v1.confidence.level === "low" ? "medium" : "low",
    confidence: v1.confidence.value,
    confidence_score: v1.confidence.score,
    confidence_level: v1.confidence.level,
    references: v1.references || [],
    warnings: v1.warnings || [],
    evaluation: v1,
    evaluation_api: ingredientEvaluationV1ToApiEnvelope(v1),
    wasReplaced: false,
  };
}
