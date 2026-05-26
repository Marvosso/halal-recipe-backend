/**
 * Deterministic Ingredient Intelligence Engine — authoritative classification.
 * Pipeline: normalize → alias → base → modifiers → rules → confidence → structured result.
 */

import { ENGINE_VERSION } from "./constants.js";
import { normalizePipeline } from "./normalize.js";
import { resolveAliases } from "./aliasResolver.js";
import { identifyBaseIngredient } from "./baseResolver.js";
import { detectModifiers } from "./modifierDetector.js";
import { evaluateRules } from "./ruleEvaluator.js";
import { computeConfidence } from "./confidenceEngine.js";
import { buildWarnings } from "./warningBuilder.js";
import { buildExplanation } from "./explanationTemplates.js";
import { verdictToLegacyStatus, confidenceLevelToScore } from "./verdictMapper.js";
import {
  getLookupAliases,
  getTaxonomyDefaults,
  getBaseSlugsForMatching,
} from "../../db/ingredientRepository.js";

/**
 * @typedef {object} IntelligenceEvaluation
 */

/**
 * Evaluate one ingredient phrase (deterministic only).
 * @param {string} ingredientPhrase
 * @param {object} [options]
 * @returns {Promise<IntelligenceEvaluation>}
 */
export async function evaluateIngredientIntelligence(ingredientPhrase, options = {}) {
  const { original, normalized, stripped } = normalizePipeline(ingredientPhrase);

  if (!normalized) {
    return buildEvaluation({
      query: original,
      normalized_query: "",
      resolved_query: "",
      baseSlug: null,
      category: null,
      modifiers: [],
      modifierObjects: [],
      modifierDetails: [],
      verdict: "unknown",
      confidence_level: "low",
      notes: "",
      alternatives: [],
      ruleSource: "unknown",
      matchQuality: "none",
      aliasApplied: false,
    });
  }

  const [dbAliases, taxonomyDefaults, dbBases] = await Promise.all([
    getLookupAliases(),
    getTaxonomyDefaults(),
    getBaseSlugsForMatching(),
  ]);

  const { resolved, aliasApplied, matchQuality: aliasMatch } = resolveAliases(stripped, dbAliases);
  const textForBase = resolved || stripped;

  const { baseSlug, category, displayName, matchQuality: baseMatch } = identifyBaseIngredient(
    textForBase,
    dbBases
  );

  const matchQuality =
    baseSlug == null ? "none" : aliasApplied ? "alias" : baseMatch;

  if (!baseSlug && !category) {
    return buildEvaluation({
      query: original,
      normalized_query: normalized,
      resolved_query: resolved,
      baseSlug: null,
      category: null,
      modifiers: ["unspecified"],
      modifierObjects: [],
      modifierDetails: [],
      verdict: "unknown",
      confidence_level: "low",
      notes: "",
      alternatives: [],
      ruleSource: "unknown",
      matchQuality: "none",
      aliasApplied,
    });
  }

  const { slugs, modifiers: modifierObjects, modifierDetails } = detectModifiers(
    textForBase,
    baseSlug
  );

  const ruleResult = await evaluateRules({
    baseSlug,
    category,
    modifierSlugs: slugs,
    taxonomyDefaults,
  });

  const {
    confidence_level,
    confidence,
    confidence_score,
    confidence_adjustments,
  } = computeConfidence({
    baseConfidence: ruleResult.confidence,
    matchQuality,
    aliasApplied,
    modifiers: slugs,
    modifierDetails: modifierDetails || [],
    verdict: ruleResult.verdict,
  });

  return buildEvaluation({
    query: original,
    normalized_query: normalized,
    resolved_query: resolved,
    baseSlug,
    category,
    baseDisplayName: displayName || (baseSlug ? baseSlug.replace(/_/g, " ") : null),
    modifiers: slugs,
    modifierObjects,
    modifierDetails,
    verdict: ruleResult.verdict,
    confidence_level,
    confidence,
    confidence_score,
    notes: ruleResult.notes || "",
    alternatives: ruleResult.alternatives || [],
    ruleSource: ruleResult.ruleSource || "taxonomy_default",
    matchQuality,
    aliasApplied,
    confidenceAdjustments: confidence_adjustments,
  });
}

function buildEvaluation(fields) {
  const {
    query,
    normalized_query,
    resolved_query,
    baseSlug,
    category,
    baseDisplayName,
    modifiers,
    modifierObjects,
    modifierDetails,
    verdict,
    confidence_level,
    confidence,
    confidence_score,
    notes,
    alternatives,
    ruleSource,
    matchQuality,
    aliasApplied,
    confidenceAdjustments = [],
  } = fields;

  const halal_status = verdictToLegacyStatus(verdict);
  const conf = confidence != null ? confidence : confidenceLevelToScore(confidence_level);
  const warnings = buildWarnings({ verdict, notes });
  const explanation = buildExplanation({
    verdict,
    baseDisplayName: baseDisplayName || baseSlug,
    category,
    modifiers,
    notes,
  });

  const substitutes = formatSubstitutes(alternatives);

  return {
    query,
    normalized_query,
    resolved_query,
    base_ingredient: baseSlug
      ? {
          slug: baseSlug,
          display_name: baseDisplayName || baseSlug.replace(/_/g, " "),
          category: category || "unknown",
        }
      : null,
    modifiers: modifierObjects || [],
    modifier_slugs: modifiers,
    modifierDetails: modifierDetails || [],
    verdict,
    confidence_level,
    confidence: conf,
    confidence_score: confidence_score ?? Math.round(conf * 100),
    halal_status,
    warnings,
    explanation,
    explanation_source: "template",
    references: [],
    substitutes,
    notes,
    alternatives,
    meta: {
      engine_version: ENGINE_VERSION,
      rule_source: ruleSource,
      match_quality: matchQuality,
      alias_applied: aliasApplied,
      confidence_adjustments: confidenceAdjustments,
      evaluated_at: new Date().toISOString(),
    },
    // Legacy fields for ingredientRuleEngine consumers
    normalizedInput: normalized_query,
    baseSlug,
    base_slug: baseSlug,
    category,
    modifier_slug: modifiers[0] || "unspecified",
    source: "rule_engine",
  };
}

function formatSubstitutes(alternatives) {
  if (!alternatives?.length) {
    return { best: null, alternatives: [] };
  }
  const items = alternatives.map((slug) => ({
    slug,
    name: String(slug).replace(/_/g, " "),
    score: null,
    reason: "Listed halal substitute for this ingredient.",
    notes: "",
  }));
  return {
    best: items[0],
    alternatives: items.slice(1),
  };
}
