/**
 * AI Enhancement Layer — public API (explanation only in this phase).
 */

export {
  EXPLANATION_INPUT_SCHEMA_VERSION,
  EXPLANATION_TONES,
  buildExplanationInput,
  buildExplanationCacheKey,
  parseExplanationOutput,
  sanitizeExplanationOutput,
} from "./contracts/explanationContract.js";

export {
  generateExplanationForEvaluation,
  enhanceEvaluationWithExplanation,
  ROUTE_INTENT,
} from "./explanationService.js";

export { generateTemplateExplanation } from "./templates/explanationTemplates.js";
export { getCachedExplanation, setCachedExplanation, clearExplanationMemoryCache } from "./cache/explanationCache.js";
