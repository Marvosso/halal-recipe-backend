/**
 * AI Reasoning Layer (enhancement only).
 * Contract: AI never sets or overrides halal_status. Only generates explanations,
 * optional substitution suggestions, and OCR normalization.
 */

import { generateExplanation as generateExplanationFromService } from "./aiExplanationService.js";
import {
  getRankedSubstitutes,
  formatRankedSubstitutesForApi,
} from "./rankedSubstitutionsService.js";

/**
 * Generate a friendly explanation from a rule result (deterministic input only).
 * Uses AI explanation layer when available; falls back to template. Never changes status.
 * @param {object} ruleResult - { halal_status, verdict, notes, modifiers, confidence, warnings, base_slug, modifier_slug, ... }
 * @param {string|object} [localeOrOptions='en'] - locale string or { locale, references, useLLM }
 * @returns {Promise<string>}
 */
export async function generateExplanation(ruleResult, localeOrOptions = "en") {
  if (!ruleResult) return "";
  const options = typeof localeOrOptions === "string" ? { locale: localeOrOptions } : { ...localeOrOptions };
  return generateExplanationFromService(ruleResult, options);
}

/**
 * Rank recipe substitutions. Uses deterministic ranked service (halal filter + scoring).
 * Returns best pick + alternatives with name, score, reason, notes.
 * @param {object} ruleResult - { halal_status, alternatives, base_slug, normalizedInput }
 * @param {object} [recipeContext] - { recipeText, cuisine, format }
 * @param {string} [ingredientPhrase] - Original ingredient text for lookup (e.g. "white wine")
 * @returns {Promise<{ best: object | null, alternatives: Array<{ name, score, reason, notes }> }>}
 */
export async function rankSubstitutes(ruleResult, recipeContext = {}, ingredientPhrase = "") {
  const phrase =
    (ingredientPhrase && String(ingredientPhrase).trim()) ||
    ruleResult?.normalizedInput ||
    ruleResult?.base_slug ||
    "";
  const result = await getRankedSubstitutes(phrase, {
    recipeContext,
    userPreferences: {},
  });
  const formatted = formatRankedSubstitutesForApi(result);
  if (formatted.best || (formatted.alternatives && formatted.alternatives.length > 0)) {
    return formatted;
  }
  if (ruleResult && Array.isArray(ruleResult.alternatives) && ruleResult.alternatives.length > 0) {
    return {
      best: {
        name: ruleResult.alternatives[0],
        score: null,
        reason: "Halal alternative from rules.",
        notes: "",
      },
      alternatives: ruleResult.alternatives.slice(1, 5).map((name) => ({
        name,
        score: null,
        reason: "Halal alternative from rules.",
        notes: "",
      })),
    };
  }
  return { best: null, alternatives: [] };
}

/**
 * Normalize OCR ingredient line (optional AI) for better rule-engine matching.
 * Returns cleaned text only; status is always determined by the rule engine.
 * @param {string} ocrText - Raw line from OCR
 * @returns {Promise<string>}
 */
export async function normalizeIngredientOCR(ocrText) {
  if (!ocrText || typeof ocrText !== "string") return "";
  return ocrText.trim().replace(/\s+/g, " ");
}
