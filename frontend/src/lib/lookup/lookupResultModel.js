/**
 * Lookup result mapping — delegates to IngredientEvaluationV1 contract.
 * @deprecated mapClientToLookupResult — use server lookup only (Phase 1).
 */

import { evaluationToIngredientEvaluationV1 } from "../../contracts/ingredientEvaluationV1.js";
import { apiEnvelopeToUiModel } from "./evaluationUiModel.js";

/**
 * Normalize API lookup response → UI model (via canonical V1).
 * @param {object} api - POST /api/lookup body (includes contract_version)
 * @param {string} query
 */
export function mapApiToLookupResult(api, query) {
  return apiEnvelopeToUiModel(api, query);
}

/**
 * @deprecated Phase 2 — client engine path removed from production UI.
 * @param {object} hkm
 * @param {string} query
 */
export function mapClientToLookupResult(hkm, query) {
  console.warn(
    "[lookupResultModel] mapClientToLookupResult is deprecated; use POST /api/lookup."
  );
  const statusMap = {
    halal: "halal",
    haram: "haram",
    conditional: "conditional",
    questionable: "conditional",
    unknown: "unknown",
  };
  const status = statusMap[hkm.status] || "unknown";
  const verdict =
    status === "halal"
      ? "halal"
      : status === "haram"
        ? "haram"
        : status === "conditional"
          ? "conditional"
          : "unknown";

  const v1 = evaluationToIngredientEvaluationV1({
    query,
    normalized_query: query.toLowerCase().replace(/\s+/g, "_"),
    verdict,
    halal_status: status,
    confidence_level: hkm.confidenceLevel || "medium",
    confidence_score: hkm.confidenceScore ?? hkm.confidencePercentage,
    confidence: hkm.confidence,
    modifiers: (hkm.modifiers || []).map((slug) => ({
      slug,
      display_name: slug.replace(/_/g, " "),
    })),
    warnings:
      hkm.status === "unknown"
        ? [
            {
              message:
                "Insufficient data — please verify with a certified source or scholar.",
              severity: "high",
            },
          ]
        : [],
    explanation: hkm.explanation || hkm.simpleExplanation || hkm.notes || "",
    substitutes: {
      best: hkm.alternatives?.[0]
        ? {
            slug: String(hkm.alternatives[0]).toLowerCase().replace(/\s+/g, "_"),
            name: String(hkm.alternatives[0]),
          }
        : null,
      alternatives: (hkm.alternatives || []).slice(1).map((name) => ({
        slug: String(name).toLowerCase().replace(/\s+/g, "_"),
        name: String(name),
      })),
    },
    references: hkm.references || [],
  });

  const ui = apiEnvelopeToUiModel(
    {
      contract_version: "1",
      query,
      ingredient: v1.ingredient,
      verdict: v1.verdict,
      halal_status: v1.halal_status,
      confidence_level: v1.confidence.level,
      confidence_score: v1.confidence.score,
      modifiers: v1.modifiers,
      modifier_details: v1.modifier_details,
      warnings: v1.warnings,
      explanation: v1.explanation,
      references: v1.references,
      substitutes: v1.substitutes,
      base_ingredient_detail: v1.base_ingredient,
    },
    query
  );
  ui.source = "client";
  return ui;
}
