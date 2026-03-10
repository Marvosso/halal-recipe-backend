/**
 * AI-assisted ranked substitutions for Halal Kitchen.
 * Returns 3–5 substitutes ranked by practical usefulness; only halal or conditionally acceptable.
 */

import { evaluateIngredient } from "./ingredientRuleEngine.js";
import {
  DEFAULT_WEIGHTS,
  SUBSTITUTE_SCORES,
  INGREDIENT_SCORE_KEY_ALIASES,
} from "./substituteScoringData.js";

const MIN_SUBSTITUTES = 3;
const MAX_SUBSTITUTES = 5;
const ALLOWED_STATUSES = new Set(["halal", "usually_halal", "conditional"]);

/** Recipe-style or component substitutes permitted when engine returns unknown. */
const PERMITTED_WHEN_UNKNOWN = new Set([
  "vinegar", "rice_vinegar", "grape_juice_plus_vinegar", "white_grape_juice_plus_vinegar",
  "agar_agar", "pectin", "halal_beef_gelatin", "chicken_or_vegetable_broth",
  "sugar_plus_rice_vinegar", "rice_vinegar_plus_sugar", "apple_juice_plus_vinegar", "halal_mirin",
  "non_alcoholic_wine", "grape_juice", "white_grape_juice", "cornstarch_slurry",
]);

/**
 * Scoring formula: weighted sum of factors (each 0–1).
 * score = w1*flavor + w2*texture + w3*context + w4*availability + w5*affordability
 * Weights: flavor 0.3, texture 0.25, cooking_context_fit 0.2, availability 0.15, affordability 0.1
 */
export function computeSubstituteScore(factors, weights = DEFAULT_WEIGHTS) {
  const f = factors || {};
  const w = weights;
  return (
    (Number(f.flavor_similarity) || 0.5) * w.flavor_similarity +
    (Number(f.texture_similarity) || 0.5) * w.texture_similarity +
    (Number(f.cooking_context_fit) || 0.5) * w.cooking_context_fit +
    (Number(f.availability) || 0.5) * w.availability +
    (Number(f.affordability) || 0.5) * w.affordability
  );
}

/**
 * Resolve ingredient phrase to key for SUBSTITUTE_SCORES (bacon, wine, white_wine, gelatin, mirin).
 */
function getScoreKey(ingredientSlugOrPhrase) {
  if (!ingredientSlugOrPhrase) return null;
  const normalized = String(ingredientSlugOrPhrase).toLowerCase().trim().replace(/\s+/g, "_");
  if (SUBSTITUTE_SCORES[normalized]) return normalized;
  if (INGREDIENT_SCORE_KEY_ALIASES[normalized]) return INGREDIENT_SCORE_KEY_ALIASES[normalized];
  if (normalized.includes("wine") && !normalized.includes("vinegar")) return normalized.includes("white") ? "white_wine" : "wine";
  if (normalized.includes("bacon")) return "bacon";
  if (normalized.includes("gelatin")) return "gelatin";
  if (normalized.includes("mirin")) return "mirin";
  return null;
}

/**
 * Check that a substitute is halal or conditionally acceptable (deterministic rule engine).
 * @param {string} substituteSlugOrName
 * @returns {Promise<boolean>}
 */
async function isSubstitutePermitted(substituteSlugOrName) {
  const result = await evaluateIngredient(substituteSlugOrName, {});
  const status = result.halal_status || result.verdict;
  if (ALLOWED_STATUSES.has(status)) return true;
  if (status === "unknown") {
    const normalized = String(substituteSlugOrName).toLowerCase().trim().replace(/\s+/g, "_");
    if (PERMITTED_WHEN_UNKNOWN.has(normalized)) return true;
  }
  return false;
}

/**
 * Get display name for a substitute (from scoring data or slug).
 */
function displayNameFor(slug, scoringEntry) {
  if (scoringEntry && scoringEntry.displayName) return scoringEntry.displayName;
  return (slug || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get ranked substitutes: 3–5 options, only halal/conditional, with best pick + alternatives.
 *
 * @param {string} ingredientPhrase - e.g. "bacon", "white wine", "gelatin", "mirin"
 * @param {object} [options] - { recipeContext: {}, userPreferences: {} }
 * @returns {Promise<{ best: { name, score, reason, notes } | null, alternatives: Array<{ name, score, reason, notes }> }>}
 */
export async function getRankedSubstitutes(ingredientPhrase, options = {}) {
  if (!ingredientPhrase || typeof ingredientPhrase !== "string") {
    return { best: null, alternatives: [] };
  }

  const trimmed = ingredientPhrase.trim();
  const ruleResult = await evaluateIngredient(trimmed, options.userPreferences || {});
  const candidatesFromRules = Array.isArray(ruleResult.alternatives) ? ruleResult.alternatives : [];

  const scoreKey = getScoreKey(trimmed) || getScoreKey(ruleResult.base_slug) || getScoreKey(ruleResult.normalizedInput);
  const scoringList = scoreKey && SUBSTITUTE_SCORES[scoreKey] ? SUBSTITUTE_SCORES[scoreKey] : [];

  const candidateSlugs = new Set(candidatesFromRules);
  scoringList.forEach((s) => candidateSlugs.add(s.slug));
  if (candidateSlugs.size === 0) return { best: null, alternatives: [] };

  const scored = [];
  for (const slug of candidateSlugs) {
    const permitted = await isSubstitutePermitted(slug);
    if (!permitted) continue;

    const entry = scoringList.find((e) => e.slug === slug) || {
      slug,
      displayName: displayNameFor(slug, null),
      flavor_similarity: 0.5,
      texture_similarity: 0.5,
      cooking_context_fit: 0.5,
      availability: 0.5,
      affordability: 0.5,
      reason: "Halal substitute; check recipe for best use.",
      notes: "",
    };

    const score = computeSubstituteScore(entry, DEFAULT_WEIGHTS);
    scored.push({
      name: displayNameFor(slug, entry),
      score: Math.round(score * 100) / 100,
      reason: entry.reason || "Practical halal alternative.",
      notes: entry.notes || "",
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, MAX_SUBSTITUTES);
  const best = top[0] || null;
  const alternatives = top.slice(1, MAX_SUBSTITUTES);

  return {
    best,
    alternatives,
    all: top,
  };
}

/**
 * Format for API: best pick plus 2–4 alternatives, each with name, score, reason, notes.
 * @param {object} result - From getRankedSubstitutes
 * @returns {{ best: object | null, alternatives: array }}
 */
export function formatRankedSubstitutesForApi(result) {
  const all = result.all || (result.best ? [result.best, ...(result.alternatives || [])] : result.alternatives || []);
  const best = all[0] || null;
  const alternatives = all.slice(1, MAX_SUBSTITUTES);
  return { best, alternatives };
}
