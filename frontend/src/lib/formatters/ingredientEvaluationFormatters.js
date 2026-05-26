/**
 * Adapters from IngredientEvaluationV1 → share, SEO, brand lookup shapes.
 */

import { apiEnvelopeToIngredientEvaluationV1 } from "../../contracts/ingredientEvaluationV1.js";
import { getVerdictDisplay } from "../lookup/verdictDisplay.js";

/**
 * @param {import("../../contracts/ingredientEvaluationV1.js").IngredientEvaluationV1 | object} input - V1 or API envelope or UI model with .evaluation
 */
export function toIngredientEvaluationV1(input) {
  if (!input) return null;
  if (input.evaluation?.contract_version === "1") {
    return input.evaluation;
  }
  if (input.contract_version === "1" && input.ingredient && input.confidence?.level) {
    return input;
  }
  return apiEnvelopeToIngredientEvaluationV1(input);
}

/**
 * Share card builder input (from V1 or UI model).
 * @param {object} input
 * @param {string} [query]
 */
export function v1ToShareIngredientData(input, query = "") {
  const v1 = toIngredientEvaluationV1(input);
  if (!v1) return null;

  const display = getVerdictDisplay(v1.verdict, v1.halal_status);
  const topWarnings = (v1.warnings || []).slice(0, 2).map((w) => w.message);
  const subs = [v1.substitutes?.best, ...(v1.substitutes?.alternatives || [])]
    .filter(Boolean)
    .slice(0, 3)
    .map((s) => s.name);

  const modifierLabels = (v1.modifier_details || v1.modifiers || [])
    .map((m) => (typeof m === "string" ? m.replace(/_/g, " ") : m.display_name))
    .filter((name) => name && name !== "unspecified")
    .slice(0, 4);

  return {
    type: "ingredient",
    contract_version: "1",
    ingredientName:
      v1.base_ingredient?.display_name ||
      v1.query ||
      query ||
      "Ingredient",
    query: query || v1.query || "",
    verdict: v1.verdict,
    statusLabel: display.label,
    statusClass: display.className,
    statusSummary: display.summary,
    confidenceScore: v1.confidence.score ?? 0,
    confidenceLevel: v1.confidence.level,
    explanation: (v1.explanation || "").slice(0, 280),
    modifiers: modifierLabels,
    warnings: topWarnings,
    substitutes: subs,
  };
}

/**
 * Legacy quick-lookup API shape (brand flows) — subset of V1.
 * @param {import("../../contracts/ingredientEvaluationV1.js").IngredientEvaluationV1} v1
 */
export function v1ToLegacyQuickLookupShape(v1) {
  return {
    contract_version: "1",
    halal_status: v1.halal_status,
    confidence_level: v1.confidence.level,
    confidence_score: v1.confidence.score,
    short_explanation: v1.explanation,
    warnings: v1.warnings,
    references: v1.references,
    alternatives: [
      v1.substitutes?.best?.name,
      ...(v1.substitutes?.alternatives || []).map((s) => s.name),
    ].filter(Boolean),
  };
}

/**
 * Encode ingredient share URL payload from V1.
 * @param {object} input
 */
export function v1ToShareUrlPayload(input) {
  const data = v1ToShareIngredientData(input);
  if (!data) return null;
  return {
    type: "ingredient",
    contract_version: "1",
    ingredientName: data.ingredientName,
    query: data.query,
    statusLabel: data.statusLabel,
    statusClass: data.statusClass,
    statusSummary: data.statusSummary,
    confidenceScore: data.confidenceScore,
    modifiers: data.modifiers,
    warnings: data.warnings,
    substitutes: data.substitutes,
    verdict: data.verdict,
  };
}
