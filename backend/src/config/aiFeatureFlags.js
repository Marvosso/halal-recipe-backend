/**
 * AI feature flags for Halal Kitchen.
 * Controls cost and reliability: cheapest path first; escalate only when necessary.
 * All flags are optional for non-critical paths; halal verdicts remain deterministic.
 */

const env = typeof process !== "undefined" && process.env ? process.env : {};

/**
 * Whether to use LLM for explanation generation (vs template fallback).
 * Default: true if OPENAI_API_KEY set, else false.
 */
export function isExplanationAIEnabled() {
  if (env.AI_EXPLANATION_ENABLED !== undefined) {
    return env.AI_EXPLANATION_ENABLED === "1" || env.AI_EXPLANATION_ENABLED === "true";
  }
  return !!env.OPENAI_API_KEY;
}

/**
 * Whether to use AI-assisted substitution ranking (scored substitutes).
 * Default: true (ranking is deterministic + data; no LLM required in current impl).
 */
export function isSubstitutesAIEnabled() {
  if (env.AI_SUBSTITUTES_ENABLED !== undefined) {
    return env.AI_SUBSTITUTES_ENABLED === "1" || env.AI_SUBSTITUTES_ENABLED === "true";
  }
  return true;
}

/**
 * Whether to use AI for OCR cleanup (normalize messy OCR text).
 * Default: false (current impl is trim/collapse only; set true when LLM cleanup is added).
 */
export function isOCRCleanupAIEnabled() {
  if (env.AI_OCR_CLEANUP_ENABLED !== undefined) {
    return env.AI_OCR_CLEANUP_ENABLED === "1" || env.AI_OCR_CLEANUP_ENABLED === "true";
  }
  return false;
}

/**
 * Whether to allow fallback to stronger AI path for ambiguous or failed cases.
 * When true, we may retry with LLM for explanation or OCR normalization after deterministic failure.
 */
export function isFallbackAIEnabled() {
  if (env.AI_FALLBACK_ENABLED !== undefined) {
    return env.AI_FALLBACK_ENABLED === "1" || env.AI_FALLBACK_ENABLED === "true";
  }
  return !!env.OPENAI_API_KEY;
}

/**
 * Get all flags as a read-only object (for logging/debug).
 */
export function getAIFeatureFlags() {
  return Object.freeze({
    explanation: isExplanationAIEnabled(),
    substitutes: isSubstitutesAIEnabled(),
    ocrCleanup: isOCRCleanupAIEnabled(),
    fallback: isFallbackAIEnabled(),
  });
}
