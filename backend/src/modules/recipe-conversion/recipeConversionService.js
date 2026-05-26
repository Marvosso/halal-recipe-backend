/**
 * Phase 3 — Server-authoritative recipe conversion via ingredient-intelligence.
 * Pipeline: detect phrases → evaluate each → replace text → score (no affiliate in service).
 */

import { lookupIngredientForRecipe } from "../../services/lookupService.js";
import { detectIngredientPhrasesInRecipe } from "./detectIngredientsInRecipe.js";
import { applyRecipeReplacements } from "./applyReplacements.js";
import {
  calculateRecipeConfidenceScore,
  CANONICAL_RECIPE_CONFIDENCE_OPTIONS,
} from "../../contracts/confidenceV1.js";
import { formatConversionIssue } from "./formatIssues.js";

export const RECIPE_CONVERSION_CONTRACT_VERSION = "1";
export const RECIPE_CONVERSION_PIPELINE = "ingredient_intelligence_v1";

const NEEDS_SUBSTITUTE = new Set([
  "haram",
  "usually_haram",
  "conditional",
  "unknown",
]);

/**
 * @param {string} recipeText
 * @param {object} [userPreferences]
 * @returns {Promise<object>}
 */
export async function convertRecipeWithIntelligence(recipeText, userPreferences = {}) {
  const trimmed = (recipeText && String(recipeText).trim()) || "";
  if (!trimmed) {
    return emptyResult("");
  }

  const detectStart = Date.now();
  const phrases = await detectIngredientPhrasesInRecipe(trimmed);
  const detectTime = Date.now() - detectStart;

  const evalStart = Date.now();
  const detectedIssues = [];

  for (const phrase of phrases) {
    const query = phrase.matchedTerm || phrase.baseSlug.replace(/_/g, " ");
    let evaluation;
    try {
      evaluation = await lookupIngredientForRecipe(query, { locale: "en" });
    } catch (err) {
      console.warn("[recipe-conversion] evaluate failed:", query, err.message);
      continue;
    }

    const status = evaluation.halal_status || evaluation.verdict;
    if (!NEEDS_SUBSTITUTE.has(status)) continue;

    const issue = formatConversionIssue(evaluation, {
      matchedTerm: phrase.matchedTerm,
      baseSlug: phrase.baseSlug,
    });
    detectedIssues.push(issue);
  }
  const evalTime = Date.now() - evalStart;

  const convertStart = Date.now();
  const { convertedText, replacements, unresolved } = applyRecipeReplacements(
    trimmed,
    detectedIssues
  );
  const convertTime = Date.now() - convertStart;

  const issues = detectedIssues.map((issue) => {
    const wasReplaced = replacements.some(
      (r) => r.original === issue.ingredient_id || r.matchedTerm === issue.matchedTerm
    );
    return { ...issue, wasReplaced };
  });

  const confidenceScore = calculateRecipeConfidenceScore(
    {
      detectedIssues: issues,
      replacements,
      unresolved,
    },
    CANONICAL_RECIPE_CONFIDENCE_OPTIONS
  );

  const scoreStart = Date.now();
  const scoreTime = Date.now() - scoreStart;

  console.log(
    `[PERF] convertRecipeWithIntelligence - detect: ${detectTime}ms, eval: ${evalTime}ms, convert: ${convertTime}ms, score: ${scoreTime}ms, issues: ${issues.length}`
  );

  return {
    contract_version: RECIPE_CONVERSION_CONTRACT_VERSION,
    pipeline: RECIPE_CONVERSION_PIPELINE,
    originalText: trimmed,
    convertedText,
    issues,
    confidenceScore,
    meta: {
      phrases_scanned: phrases.length,
      issues_found: issues.length,
      replacements: replacements.length,
      unresolved: unresolved.length,
      user_preferences: userPreferences,
    },
  };
}

function emptyResult(text) {
  return {
    contract_version: RECIPE_CONVERSION_CONTRACT_VERSION,
    pipeline: RECIPE_CONVERSION_PIPELINE,
    originalText: text,
    convertedText: text,
    issues: [],
    confidenceScore: 0,
    meta: {},
  };
}
