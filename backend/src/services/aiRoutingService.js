/**
 * AI routing for Halal Kitchen: cheapest reliable path first, escalate only when necessary.
 * Routes: simple lookup → deterministic + optional explanation; known page → cached explanation;
 * recipe conversion → AI substitution ranking; OCR cleanup → AI when enabled; ambiguous/failed → fallback AI.
 */

import {
  isExplanationAIEnabled,
  isSubstitutesAIEnabled,
  isOCRCleanupAIEnabled,
  isFallbackAIEnabled,
} from "../config/aiFeatureFlags.js";
import { generateExplanation as generateExplanationFromService } from "./aiExplanationService.js";
import { buildExplanationInput, templateFallbackExplanation } from "./aiExplanationService.js";

// ---------------------------------------------------------------------------
// Route intents (caller passes one of these)
// ---------------------------------------------------------------------------

export const ROUTE = Object.freeze({
  SIMPLE_LOOKUP: "simple_lookup",           // Single ingredient lookup → rules only, optional explanation
  KNOWN_PAGE: "known_page",                 // Known ingredient page → deterministic + cached explanation
  RECIPE_CONVERSION: "recipe_conversion",    // Recipe conversion → AI-assisted substitution ranking
  OCR_CLEANUP: "ocr_cleanup",               // OCR ingredient cleanup → AI cleanup after OCR
  AMBIGUOUS_FALLBACK: "ambiguous_fallback",  // Very ambiguous or failed OCR → stronger AI path
});

// ---------------------------------------------------------------------------
// Explanation cache (in-memory, keyed by rule-result fingerprint)
// ---------------------------------------------------------------------------

const EXPLANATION_CACHE_MAX = 500;
const explanationCache = new Map();
const cacheKeyOrder = [];

function explanationCacheKey(ruleResult) {
  if (!ruleResult) return null;
  const base = ruleResult.base_slug || ruleResult.normalizedInput || "";
  const status = ruleResult.halal_status || ruleResult.verdict || "";
  const mods = Array.isArray(ruleResult.modifiers) ? ruleResult.modifiers : [];
  const mod = mods.slice().sort().join(",");
  const notes = (ruleResult.notes || "").slice(0, 80);
  return `exp:${base}:${status}:${mod}:${notes}`;
}

function getCachedExplanation(key) {
  if (!key) return undefined;
  const entry = explanationCache.get(key);
  if (!entry) return undefined;
  return entry.text;
}

function setCachedExplanation(key, text) {
  if (!key || !text) return;
  if (explanationCache.size >= EXPLANATION_CACHE_MAX && !explanationCache.has(key)) {
    const oldest = cacheKeyOrder.shift();
    if (oldest) explanationCache.delete(oldest);
  }
  explanationCache.set(key, { text, at: Date.now() });
  if (!cacheKeyOrder.includes(key)) cacheKeyOrder.push(key);
}

// ---------------------------------------------------------------------------
// Fallback AI usage logging
// ---------------------------------------------------------------------------

const FALLBACK_LOG_PREFIX = "[AI_ROUTING] Fallback AI used:";

export function logFallbackAI(reason, context = {}) {
  const payload = { reason, ...context, at: new Date().toISOString() };
  console.warn(FALLBACK_LOG_PREFIX, JSON.stringify(payload));
}

// ---------------------------------------------------------------------------
// Route resolution: intent + context → which AI features to use
// ---------------------------------------------------------------------------

/**
 * Resolve which AI features to use for this request.
 * @param {string} intent - One of ROUTE.*
 * @param {object} [context] - { ocrConfidence, recipeContext, fromCache }
 * @returns {{ useExplanationAI: boolean, useSubstitutesAI: boolean, useOCRCleanupAI: boolean, useFallbackAI: boolean }}
 */
export function resolveRoute(intent, context = {}) {
  const flags = {
    useExplanationAI: false,
    useSubstitutesAI: false,
    useOCRCleanupAI: false,
    useFallbackAI: false,
  };

  const explanationOn = isExplanationAIEnabled();
  const substitutesOn = isSubstitutesAIEnabled();
  const ocrCleanupOn = isOCRCleanupAIEnabled();
  const fallbackOn = isFallbackAIEnabled();

  switch (intent) {
    case ROUTE.SIMPLE_LOOKUP:
      flags.useExplanationAI = explanationOn;
      flags.useSubstitutesAI = substitutesOn;
      break;
    case ROUTE.KNOWN_PAGE:
      flags.useExplanationAI = explanationOn;
      flags.useSubstitutesAI = substitutesOn;
      break;
    case ROUTE.RECIPE_CONVERSION:
      flags.useExplanationAI = explanationOn;
      flags.useSubstitutesAI = substitutesOn;
      break;
    case ROUTE.OCR_CLEANUP:
      flags.useOCRCleanupAI = ocrCleanupOn;
      break;
    case ROUTE.AMBIGUOUS_FALLBACK:
      flags.useExplanationAI = explanationOn;
      flags.useSubstitutesAI = substitutesOn;
      flags.useOCRCleanupAI = ocrCleanupOn;
      flags.useFallbackAI = fallbackOn;
      break;
    default:
      flags.useExplanationAI = explanationOn;
      flags.useSubstitutesAI = substitutesOn;
  }

  return flags;
}

/**
 * Get explanation: cache first for known-page path, then LLM or template per route.
 * On LLM failure, use template and optionally log fallback.
 * @param {object} ruleResult - From rule engine
 * @param {object} [options] - { intent, locale, references, useCache }
 * @returns {Promise<string>}
 */
export async function getExplanationWithCache(ruleResult, options = {}) {
  const { intent = ROUTE.SIMPLE_LOOKUP, locale = "en", references = [], useCache = true } = options;
  const route = resolveRoute(intent, options.context || {});

  const cacheKey = useCache ? explanationCacheKey(ruleResult) : null;
  if (cacheKey) {
    const cached = getCachedExplanation(cacheKey);
    if (cached) return cached;
  }

  const useLLM = route.useExplanationAI;
  const input = buildExplanationInput(ruleResult, { references });

  if (useLLM) {
    try {
      const text = await generateExplanationFromService(ruleResult, {
        locale,
        references,
        useLLM: true,
      });
      if (text) {
        if (cacheKey) setCachedExplanation(cacheKey, text);
        return text;
      }
    } catch (err) {
      console.warn("[AI_ROUTING] Explanation LLM failed, using template:", err?.message);
      if (route.useFallbackAI) logFallbackAI("explanation_llm_failed", { intent, error: err?.message });
    }
  }

  const templateText = templateFallbackExplanation(input) || ruleResult?.notes || "";
  if (templateText && cacheKey) setCachedExplanation(cacheKey, templateText);
  return templateText;
}

/**
 * Should we use AI for OCR cleanup for this request?
 * @param {string} intent
 * @param {object} [context] - { ocrConfidence }
 * @returns {boolean}
 */
export function shouldUseOCRCleanupAI(intent, context = {}) {
  const route = resolveRoute(intent, context);
  if (intent === ROUTE.OCR_CLEANUP || intent === ROUTE.AMBIGUOUS_FALLBACK) {
    return route.useOCRCleanupAI || (context.ocrConfidence != null && context.ocrConfidence < 0.5 && route.useFallbackAI);
  }
  return route.useOCRCleanupAI;
}

/**
 * Should we use AI-assisted substitution ranking?
 * @param {string} intent
 * @returns {boolean}
 */
export function shouldUseSubstitutesAI(intent) {
  return resolveRoute(intent).useSubstitutesAI;
}
