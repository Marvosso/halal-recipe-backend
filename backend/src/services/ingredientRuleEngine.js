/**
 * Deterministic halal rule engine (legacy export surface).
 * Delegates to Ingredient Intelligence Engine; preserves backward-compatible shape.
 */

import { evaluateIngredientIntelligence } from "../modules/ingredient-intelligence/engine.js";
import { normalizeIngredientText as normalizeText } from "../modules/ingredient-intelligence/normalize.js";
import { identifyBaseIngredient as identifyBase } from "../modules/ingredient-intelligence/baseResolver.js";
import { detectModifiers as detectMods } from "../modules/ingredient-intelligence/modifierDetector.js";
import { getBaseSlugsForMatching } from "../db/ingredientRepository.js";
import {
  CATEGORY_DEFAULTS,
  UNKNOWN_DEFAULT,
  VERDICTS,
  CONFIDENCE_LEVELS,
  BASE_CATEGORIES,
  BASE_KEYWORDS,
  HARD_OVERRIDES,
} from "../modules/ingredient-intelligence/constants.js";

export { normalizeText as normalizeIngredientText };

export async function identifyBaseIngredient(normalizedText) {
  const bases = await getBaseSlugsForMatching();
  const { baseSlug, category } = identifyBase(normalizedText, bases);
  return { baseSlug, category };
}

export function detectModifiers(normalizedText, baseSlug, options = {}) {
  const { slugs, modifierDetails } = detectMods(normalizedText, baseSlug, options);
  return { slugs, modifierDetails };
}

export { applyHardOverrides } from "../modules/ingredient-intelligence/ruleEvaluator.js";
export {
  VERDICTS,
  CONFIDENCE_LEVELS,
  BASE_CATEGORIES,
  BASE_KEYWORDS,
  CATEGORY_DEFAULTS,
  HARD_OVERRIDES,
  UNKNOWN_DEFAULT,
};

export function applyCategoryDefaults(category) {
  if (!category) return UNKNOWN_DEFAULT;
  return CATEGORY_DEFAULTS[category] || UNKNOWN_DEFAULT;
}

/**
 * @param {string} ingredientPhrase
 * @param {object} [userPreferences] - ignored in Phase 1 (no JSON fallback)
 */
export async function evaluateIngredient(ingredientPhrase, userPreferences = {}) {
  void userPreferences;
  const r = await evaluateIngredientIntelligence(ingredientPhrase);
  return {
    normalizedInput: r.normalized_query,
    baseSlug: r.baseSlug,
    category: r.category,
    modifiers: r.modifier_slugs,
    modifierDetails: r.modifierDetails,
    verdict: r.verdict,
    confidence_level: r.confidence_level,
    notes: r.notes,
    alternatives: r.alternatives,
    source: r.source,
    base_slug: r.base_slug,
    modifier_slug: r.modifier_slug,
    halal_status: r.halal_status,
    confidence: r.confidence,
  };
}
