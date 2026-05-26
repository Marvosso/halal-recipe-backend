/**
 * Ingredient lookup orchestration — deterministic engine + optional AI explanation layer.
 * All verdict paths should go through lookupIngredientEvaluation / lookupIngredient.
 */

import { evaluateIngredientIntelligence } from "../modules/ingredient-intelligence/engine.js";
import { enhanceEvaluationWithExplanation, ROUTE_INTENT } from "../modules/ai-enhancement/index.js";
import { isExplanationAIEnabled } from "../config/aiFeatureFlags.js";
import {
  apiEnvelopeToIngredientEvaluationV1,
  evaluationToIngredientEvaluationV1,
  ingredientEvaluationV1ToApiEnvelope,
} from "../contracts/ingredientEvaluationV1.js";

/**
 * Core evaluation — engine + optional AI explanation (no API envelope).
 * Used by lookup API, recipe conversion, and scan pipelines.
 *
 * @param {string} query
 * @param {object} [options]
 * @param {string} [options.source] - typed | ocr | recipe | seo
 * @param {string} [options.locale]
 * @param {boolean} [options.useAiExplanation] - default true for typed lookup
 * @returns {Promise<object>} intelligence engine evaluation
 */
export async function lookupIngredientEvaluation(query, options = {}) {
  const trimmed = (query && String(query).trim()) || "";
  if (!trimmed) {
    const err = new Error("query is required");
    err.code = "invalid_query";
    throw err;
  }

  let evaluation = await evaluateIngredientIntelligence(trimmed, options);

  const useAi =
    options.useAiExplanation !== false && isExplanationAIEnabled();
  if (useAi) {
    evaluation = await enhanceEvaluationWithExplanation(evaluation, {
      intent: sourceToIntent(options.source),
      locale: options.locale || "en",
      useCache: options.source === "seo" || options.source === "known_page",
    });
  }

  return evaluation;
}

/**
 * Deterministic recipe-context evaluation (no AI explanation layer).
 * @param {string} query
 * @param {object} [options]
 */
export async function lookupIngredientForRecipe(query, options = {}) {
  return lookupIngredientEvaluation(query, {
    source: "recipe",
    locale: options.locale || "en",
    useAiExplanation: false,
    ...options,
  });
}

/**
 * @param {string} query
 * @param {object} [options]
 * @param {string} [options.source] - typed | ocr | recipe | seo
 * @param {string} [options.locale]
 */
export async function lookupIngredient(query, options = {}) {
  const evaluation = await lookupIngredientEvaluation(query, options);
  return toApiResponse(evaluation, options);
}

function sourceToIntent(source) {
  if (source === "seo" || source === "known_page") return ROUTE_INTENT.KNOWN_PAGE;
  if (source === "recipe") return ROUTE_INTENT.RECIPE_CONVERSION;
  return ROUTE_INTENT.SIMPLE_LOOKUP;
}

/**
 * @param {object} evaluation
 * @param {object} [options]
 */
export function toApiResponse(evaluation, options = {}) {
  const v1 = evaluationToIngredientEvaluationV1(evaluation, {
    source: options.source || "typed",
    locale: options.locale || "en",
  });
  return {
    ...ingredientEvaluationV1ToApiEnvelope(v1),
    pipeline: "lookup_v1",
    source: options.source || "typed",
  };
}

/**
 * Canonical V1 object (for internal services, scan, tests).
 * @param {object} evaluation
 * @param {object} [options]
 */
export function toIngredientEvaluationV1(evaluation, options = {}) {
  return evaluationToIngredientEvaluationV1(evaluation, options);
}

/**
 * Map lookup response to legacy classify-ingredient shape.
 * @param {object} apiResponse
 */
export function toLegacyClassifyShape(apiResponse) {
  const v1 = apiEnvelopeToIngredientEvaluationV1(apiResponse);
  return {
    contract_version: v1.contract_version,
    normalized_query: v1.ingredient,
    base_ingredient: v1.base_ingredient?.display_name || "",
    ingredient: v1.ingredient,
    modifiers: v1.modifiers,
    modifierDetails: v1.modifier_details,
    verdict: v1.verdict,
    confidence_level: v1.confidence.level,
    halal_status: v1.halal_status,
    confidence: v1.confidence.value,
    explanation: v1.explanation,
    warnings: v1.warnings,
    references: v1.references,
    substitutes: v1.substitutes,
  };
}
