/**
 * Halal Classification Service (hybrid architecture).
 * Orchestrates: deterministic rule engine → AI enhancement (explanation, ranked substitutes).
 * Final halal_status and confidence always come from rules; AI never overrides them.
 * AI routing: cheapest path first; explanation/substitutes/OCR cleanup gated by intent and feature flags.
 */

import { evaluateIngredient, normalizeIngredientText } from "./ingredientRuleEngine.js";
import { rankSubstitutes, normalizeIngredientOCR } from "./aiReasoningService.js";
import {
  ROUTE,
  resolveRoute,
  getExplanationWithCache,
  shouldUseOCRCleanupAI,
  shouldUseSubstitutesAI,
  logFallbackAI,
} from "./aiRoutingService.js";
import { getIngredientDetails } from "../utils/halalEngine.js";

/**
 * Structured classification result. All status/confidence from rules; explanation/substitutes may be AI-enhanced.
 * @typedef {object} HalalClassificationResult
 * @property {string} ingredient - Normalized or original ingredient phrase
 * @property {string[]} modifiers - Detected modifiers (e.g. ["pork"], ["alcohol_free"])
 * @property {string} halal_status - "halal" | "conditional" | "haram" | "unknown" (from rules only)
 * @property {number} confidence - 0–1, from rule engine (1 = definitive)
 * @property {string} explanation - Human-readable explanation (rule notes + optional AI)
 * @property {string[]} warnings - Non-empty when status is conditional or source unclear
 * @property {Array<{ ref_type: string, ref_text: string }>} references - Optional; from knowledge base when available
 * @property {{ best: object | null, alternatives: Array<{ name, score, reason, notes }> }} substitutes - Best pick + alternatives (score, reason, notes)
 */

/**
 * Build warnings from deterministic result (no AI). Used when status is conditional or notes suggest caution.
 */
function buildWarnings(ruleResult) {
  const w = [];
  if (ruleResult.halal_status === "conditional") {
    w.push("Source or preparation may affect permissibility; verify when possible.");
  }
  if (ruleResult.halal_status === "haram") {
    w.push("Not permissible; use a halal substitute.");
  }
  if (ruleResult.halal_status === "unknown") {
    w.push("Not in rule database; consult a scholar or certified source.");
  }
  if (ruleResult.verdict === "usually_haram") {
    w.push("Generally not permissible; avoid or substitute.");
  }
  if (ruleResult.notes && /check|verify|must be halal|certified/i.test(ruleResult.notes)) {
    w.push(ruleResult.notes);
  }
  return w;
}

/**
 * Classify one ingredient: rule engine first, then AI enhancement (explanation, ranked substitutes).
 * AI output consumes the deterministic result as input; final halal_status and confidence are never from AI.
 *
 * @param {string} ingredientPhrase - Raw ingredient text (e.g. "pork gelatin", "2 tbsp soy sauce")
 * @param {object} [options]
 * @param {object} [options.userPreferences] - Strictness, madhab for fallback engine
 * @param {boolean} [options.useOCRNormalization] - If true, run OCR cleanup before rule engine (gated by AI route)
 * @param {object} [options.recipeContext] - Optional context; when set, intent may be recipe_conversion
 * @param {string} [options.intent] - ROUTE.SIMPLE_LOOKUP | ROUTE.KNOWN_PAGE | ROUTE.RECIPE_CONVERSION | ROUTE.OCR_CLEANUP | ROUTE.AMBIGUOUS_FALLBACK
 * @param {number} [options.ocrConfidence] - For OCR path; low value may trigger fallback AI
 * @returns {Promise<HalalClassificationResult>}
 */
export async function classifyIngredient(ingredientPhrase, options = {}) {
  const {
    userPreferences = {},
    useOCRNormalization = false,
    recipeContext = {},
    intent: explicitIntent,
    ocrConfidence,
  } = options;

  const intent =
    explicitIntent ||
    (options.fromScan && ocrConfidence != null && ocrConfidence < 0.5 ? ROUTE.AMBIGUOUS_FALLBACK : null) ||
    (Object.keys(recipeContext || {}).length > 0 ? ROUTE.RECIPE_CONVERSION : ROUTE.SIMPLE_LOOKUP);

  const useOCRCleanup = useOCRNormalization && shouldUseOCRCleanupAI(intent, { ocrConfidence });

  let inputText = (ingredientPhrase && String(ingredientPhrase).trim()) || "";
  if (useOCRCleanup && inputText) {
    try {
      inputText = (await normalizeIngredientOCR(inputText)) || inputText;
    } catch (err) {
      if (resolveRoute(ROUTE.AMBIGUOUS_FALLBACK).useFallbackAI) {
        logFallbackAI("ocr_cleanup_failed", { intent, error: err?.message });
      }
    }
  }

  // 1. Deterministic rule engine (only source of status and confidence)
  const ruleResult = await evaluateIngredient(inputText, userPreferences);

  // 2. Warnings from rule result (deterministic)
  const warnings = buildWarnings(ruleResult);

  // 3. Explanation: cache-first for known page, else LLM or template per route
  const explanation = await getExplanationWithCache(
    { ...ruleResult, warnings },
    { intent, locale: "en", useCache: intent === ROUTE.KNOWN_PAGE, context: { ocrConfidence } }
  );

  // 4. Ranked substitutes only when route allows (deterministic scoring + halal filter)
  const substitutes = shouldUseSubstitutesAI(intent)
    ? await rankSubstitutes(ruleResult, recipeContext, inputText)
    : { best: null, alternatives: [] };

  const baseSlug = ruleResult.base_slug || ruleResult.baseSlug;

  // 5. References from knowledge base when base is resolved (optional)
  let references = [];
  if (baseSlug) {
    try {
      const displayName = baseSlug.replace(/_/g, " ");
      const details = getIngredientDetails(displayName, userPreferences);
      if (details && Array.isArray(details.references) && details.references.length > 0) {
        references = details.references.map((r) =>
          typeof r === "string" ? { ref_type: "general", ref_text: r } : { ref_type: r.ref_type || "general", ref_text: r.ref_text || r }
        );
      }
    } catch (_) {}
  }

  const normalizedQuery = inputText || ingredientPhrase;
  const baseIngredient = baseSlug ? baseSlug.replace(/_/g, " ") : "";

  return {
    normalized_query: normalizedQuery,
    base_ingredient: baseIngredient,
    ingredient: normalizedQuery,
    modifiers: ruleResult.modifiers || [ruleResult.modifier_slug || "unspecified"],
    modifierDetails: ruleResult.modifierDetails || [],
    verdict: ruleResult.verdict || ruleResult.halal_status,
    confidence_level: ruleResult.confidence_level || (ruleResult.confidence >= 0.8 ? "high" : ruleResult.confidence >= 0.4 ? "medium" : "low"),
    halal_status: ruleResult.halal_status,
    confidence: ruleResult.confidence != null ? ruleResult.confidence : 0.5,
    explanation: explanation || ruleResult.notes || "",
    warnings,
    references,
    substitutes,
  };
}

/**
 * Classify multiple ingredients (e.g. from a recipe). Same contract: status/confidence from rules only.
 * @param {string[]} ingredientPhrases
 * @param {object} [options] - Same as classifyIngredient
 * @returns {Promise<HalalClassificationResult[]>}
 */
export async function classifyIngredients(ingredientPhrases, options = {}) {
  if (!Array.isArray(ingredientPhrases)) return [];
  const results = await Promise.all(ingredientPhrases.map((p) => classifyIngredient(p, options)));
  return results;
}
