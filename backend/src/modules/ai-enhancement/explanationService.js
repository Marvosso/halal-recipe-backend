/**
 * AI Explanation Service — augments deterministic evaluations with prose only.
 * Never modifies verdict, confidence, or halal_status.
 */

import { isExplanationAIEnabled, isFallbackAIEnabled } from "../../config/aiFeatureFlags.js";
import {
  buildExplanationInput,
  buildExplanationCacheKey,
} from "./contracts/explanationContract.js";
import { fillUserPrompt } from "./prompts/explanationPrompts.js";
import { generateTemplateExplanation } from "./templates/explanationTemplates.js";
import { getCachedExplanation, setCachedExplanation } from "./cache/explanationCache.js";
import { generateExplanationWithOpenAI } from "./providers/openaiProvider.js";

export const ROUTE_INTENT = Object.freeze({
  SIMPLE_LOOKUP: "simple_lookup",
  KNOWN_PAGE: "known_page",
  RECIPE_CONVERSION: "recipe_conversion",
  SEO: "seo",
  OCR_CLEANUP: "ocr_cleanup",
  AMBIGUOUS_FALLBACK: "ambiguous_fallback",
});

/**
 * @typedef {object} ExplanationEnhancementResult
 * @property {string} explanation
 * @property {string} explanation_source - 'ai' | 'template' | 'deterministic_template'
 * @property {string} tone
 * @property {boolean} cached
 * @property {boolean} uncertainty_acknowledged
 */

/**
 * Generate explanation for a completed deterministic evaluation.
 * @param {object} evaluation - Full result from evaluateIngredientIntelligence (unchanged)
 * @param {object} [options]
 * @param {string} [options.intent]
 * @param {string} [options.locale]
 * @param {boolean} [options.useCache]
 * @param {boolean} [options.forceTemplate] - skip LLM (tests / cost control)
 * @returns {Promise<ExplanationEnhancementResult>}
 */
export async function generateExplanationForEvaluation(evaluation, options = {}) {
  const {
    intent = ROUTE_INTENT.SIMPLE_LOOKUP,
    locale = "en",
    useCache = intent === ROUTE_INTENT.KNOWN_PAGE || intent === ROUTE_INTENT.SEO,
    forceTemplate = false,
  } = options;

  const input = buildExplanationInput(evaluation, { locale });
  const cacheKey = useCache ? buildExplanationCacheKey(input) : null;

  if (cacheKey) {
    const cached = await getCachedExplanation(cacheKey);
    if (cached?.explanation) {
      return {
        explanation: cached.explanation,
        explanation_source: cached.source || "ai",
        tone: cached.tone || "neutral",
        cached: true,
        uncertainty_acknowledged: Boolean(cached.uncertainty_acknowledged),
      };
    }
  }

  const useAI = !forceTemplate && shouldUseAIForIntent(intent);

  if (useAI) {
    const userPrompt = fillUserPrompt(input);
    const aiOutput = await generateExplanationWithOpenAI(userPrompt, options);

    if (aiOutput?.explanation) {
      const result = {
        explanation: aiOutput.explanation,
        explanation_source: "ai",
        tone: aiOutput.tone,
        cached: false,
        uncertainty_acknowledged: aiOutput.uncertainty_acknowledged,
      };
      if (cacheKey) {
        await setCachedExplanation(cacheKey, { ...result, locale, source: "ai" });
      }
      return result;
    }

    if (isFallbackAIEnabled()) {
      console.warn("[ai-explanation] LLM unavailable, using template fallback", { intent });
    }
  }

  const template = generateTemplateExplanation(input);
  const result = {
    explanation: template.explanation,
    explanation_source: "template",
    tone: template.tone,
    cached: false,
    uncertainty_acknowledged: template.uncertainty_acknowledged,
  };

  if (cacheKey) {
    await setCachedExplanation(cacheKey, { ...result, locale, source: "template" });
  }

  return result;
}

function shouldUseAIForIntent(intent) {
  if (!isExplanationAIEnabled()) return false;
  return true;
}

/**
 * Apply explanation layer to evaluation — returns shallow copy; verdict fields unchanged.
 * @param {object} evaluation
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export async function enhanceEvaluationWithExplanation(evaluation, options = {}) {
  if (!evaluation) return evaluation;

  const priorVerdict = evaluation.verdict;
  const priorStatus = evaluation.halal_status;
  const priorConfidence = evaluation.confidence_level;

  const enhancement = await generateExplanationForEvaluation(evaluation, options);

  const enhanced = {
    ...evaluation,
    explanation: enhancement.explanation,
    explanation_source: enhancement.explanation_source,
    meta: {
      ...evaluation.meta,
      explanation_tone: enhancement.tone,
      explanation_cached: enhancement.cached,
      uncertainty_acknowledged: enhancement.uncertainty_acknowledged,
    },
  };

  assertVerdictUnchanged(evaluation, enhanced, priorVerdict, priorStatus, priorConfidence);

  return enhanced;
}

function assertVerdictUnchanged(before, after, verdict, status, confidence) {
  if (after.verdict !== verdict || after.halal_status !== status) {
    console.error("[ai-explanation] GUARDRAIL: verdict mutated — reverting");
    after.verdict = verdict;
    after.halal_status = status;
  }
  if (after.confidence_level !== confidence) {
    after.confidence_level = confidence;
  }
}
