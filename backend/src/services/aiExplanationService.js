/**
 * Backward-compatible facade — delegates to modules/ai-enhancement.
 */

import { buildExplanationInput } from "../modules/ai-enhancement/contracts/explanationContract.js";
import {
  SYSTEM_PROMPT,
  USER_PROMPT_TEMPLATE,
  fillUserPrompt,
} from "../modules/ai-enhancement/prompts/explanationPrompts.js";
import { generateTemplateExplanation } from "../modules/ai-enhancement/templates/explanationTemplates.js";
import { generateExplanationForEvaluation } from "../modules/ai-enhancement/explanationService.js";
import { generateExplanationWithOpenAI } from "../modules/ai-enhancement/providers/openaiProvider.js";

export const EXPLANATION_INPUT_KEYS = [
  "ingredient_name",
  "modifiers",
  "halal_status",
  "confidence",
  "warnings",
  "references",
  "notes",
];

export { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, fillUserPrompt };
export function templateFallbackExplanation(input) {
  return generateTemplateExplanation(input).explanation;
}

export { buildExplanationInput };

/**
 * @param {object} ruleResult
 * @param {object} [options]
 */
export async function generateExplanation(ruleResult, options = {}) {
  const { useLLM = true, references = [], locale = "en" } =
    typeof options === "string" ? { locale: options } : options;

  const evaluation = ruleResultToEvaluationShape(ruleResult, references);
  const result = await generateExplanationForEvaluation(evaluation, {
    locale,
    forceTemplate: !useLLM,
    useCache: false,
  });
  return result.explanation;
}

function ruleResultToEvaluationShape(ruleResult, references = []) {
  return {
    query: ruleResult.normalizedInput,
    baseSlug: ruleResult.base_slug || ruleResult.baseSlug,
    base_ingredient: ruleResult.base_slug
      ? { slug: ruleResult.base_slug, display_name: ruleResult.base_slug.replace(/_/g, " ") }
      : null,
    category: ruleResult.category,
    modifier_slugs: ruleResult.modifiers || [ruleResult.modifier_slug],
    verdict: ruleResult.verdict || ruleResult.halal_status,
    halal_status: ruleResult.halal_status,
    confidence_level: ruleResult.confidence_level,
    confidence_score:
      ruleResult.confidence != null ? Math.round(ruleResult.confidence * 100) : undefined,
    warnings: ruleResult.warnings || [],
    notes: ruleResult.notes || "",
    references,
    explanation: ruleResult.notes || "",
  };
}

export async function callOpenAIForExplanation(_systemPrompt, userPrompt, options = {}) {
  const out = await generateExplanationWithOpenAI(userPrompt, options);
  return out?.explanation || null;
}

export function fillPromptTemplate(input) {
  return fillUserPrompt(input);
}
