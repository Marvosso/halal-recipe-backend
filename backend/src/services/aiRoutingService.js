/**
 * AI routing — delegates explanation to ai-enhancement layer.
 */

import {
  isExplanationAIEnabled,
  isSubstitutesAIEnabled,
  isOCRCleanupAIEnabled,
  isFallbackAIEnabled,
} from "../config/aiFeatureFlags.js";
import {
  generateExplanationForEvaluation,
  ROUTE_INTENT,
} from "../modules/ai-enhancement/explanationService.js";
import { buildExplanationInput } from "../modules/ai-enhancement/contracts/explanationContract.js";
import { generateTemplateExplanation } from "../modules/ai-enhancement/templates/explanationTemplates.js";

export const ROUTE = ROUTE_INTENT;

export function logFallbackAI(reason, context = {}) {
  console.warn("[AI_ROUTING] Fallback:", JSON.stringify({ reason, ...context, at: new Date().toISOString() }));
}

export function resolveRoute(intent, context = {}) {
  const explanationOn = isExplanationAIEnabled();
  const substitutesOn = isSubstitutesAIEnabled();
  const ocrCleanupOn = isOCRCleanupAIEnabled();
  const fallbackOn = isFallbackAIEnabled();

  const flags = {
    useExplanationAI: false,
    useSubstitutesAI: false,
    useOCRCleanupAI: false,
    useFallbackAI: false,
  };

  switch (intent) {
    case ROUTE.SIMPLE_LOOKUP:
    case ROUTE.KNOWN_PAGE:
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

  void context;
  return flags;
}

/**
 * @param {object} ruleResult
 * @param {object} [options]
 */
export async function getExplanationWithCache(ruleResult, options = {}) {
  const {
    intent = ROUTE.SIMPLE_LOOKUP,
    locale = "en",
    references = [],
    useCache = intent === ROUTE.KNOWN_PAGE,
  } = options;

  const route = resolveRoute(intent, options.context || {});
  const evaluation = {
    query: ruleResult.normalizedInput,
    baseSlug: ruleResult.base_slug || ruleResult.baseSlug,
    category: ruleResult.category,
    modifier_slugs: ruleResult.modifiers || [],
    verdict: ruleResult.verdict || ruleResult.halal_status,
    halal_status: ruleResult.halal_status,
    confidence_level: ruleResult.confidence_level,
    warnings: ruleResult.warnings || [],
    notes: ruleResult.notes || "",
    references,
  };

  if (route.useExplanationAI) {
    try {
      const result = await generateExplanationForEvaluation(evaluation, {
        intent,
        locale,
        useCache,
      });
      return result.explanation;
    } catch (err) {
      if (route.useFallbackAI) logFallbackAI("explanation_failed", { error: err?.message });
    }
  }

  const input = buildExplanationInput(evaluation, { locale });
  return generateTemplateExplanation(input).explanation || ruleResult?.notes || "";
}

export function shouldUseOCRCleanupAI(intent, context = {}) {
  const route = resolveRoute(intent, context);
  if (intent === ROUTE.OCR_CLEANUP || intent === ROUTE.AMBIGUOUS_FALLBACK) {
    return (
      route.useOCRCleanupAI ||
      (context.ocrConfidence != null && context.ocrConfidence < 0.5 && route.useFallbackAI)
    );
  }
  return route.useOCRCleanupAI;
}

export function shouldUseSubstitutesAI(intent) {
  return resolveRoute(intent).useSubstitutesAI;
}
