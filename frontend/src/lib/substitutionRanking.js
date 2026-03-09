/**
 * Substitution ranking: score and sort substitutes by usefulness.
 * Formula: score = w1·flavor_similarity + w2·availability + w3·context_match
 */

import {
  getSubstituteEntries,
  getAvailabilityScore,
} from "../data/substitutionDatabase";

const WEIGHTS = {
  flavor: 0.4,
  availability: 0.35,
  context: 0.25,
};

/**
 * Compute context match score 0–100.
 * @param {string[]} substituteContexts - Substitute's cooking_context array
 * @param {string|string[]|undefined} recipeContext - Optional context hint(s) for the recipe
 */
function contextMatchScore(substituteContexts, recipeContext) {
  if (!recipeContext) return 100;
  const recipe = Array.isArray(recipeContext) ? recipeContext : [recipeContext];
  const normalizedRecipe = recipe.map((c) => String(c).toLowerCase().trim());
  const normalizedSub = (substituteContexts || []).map((c) => String(c).toLowerCase().trim());
  if (normalizedSub.length === 0) return 100;
  const match = normalizedSub.some((s) => normalizedRecipe.some((r) => r === s || s.includes(r) || r.includes(s)));
  return match ? 100 : 70;
}

/**
 * Score one substitute (0–100).
 * @param {Object} sub - { flavor_similarity, cooking_context, availability }
 * @param {string|string[]|undefined} recipeContext - Optional cooking context
 */
function scoreSubstitute(sub, recipeContext) {
  const flavor = Math.min(100, Math.max(0, Number(sub.flavor_similarity) || 0));
  const availability = getAvailabilityScore(sub.availability);
  const context = contextMatchScore(sub.cooking_context, recipeContext);
  return (
    WEIGHTS.flavor * flavor +
    WEIGHTS.availability * (availability / 100) * 100 +
    WEIGHTS.context * (context / 100) * 100
  );
}

/**
 * Get 3–5 ranked substitutes for an ingredient.
 * @param {string} ingredientId - e.g. "wine", "bacon", "gelatin", "white_wine"
 * @param {{ cookingContext?: string|string[], maxCount?: number }} options
 * @returns {Array<{ id: string, flavor_similarity: number, cooking_context: string[], availability: string, why_it_works: string, rank_score: number }>}
 */
export function getRankedSubstitutes(ingredientId, options = {}) {
  const { cookingContext, maxCount = 5 } = options || {};
  const entries = getSubstituteEntries(ingredientId);
  if (!entries.length) return [];

  const scored = entries.map((entry) => ({
    ...entry,
    rank_score: scoreSubstitute(entry, cookingContext),
  }));

  scored.sort((a, b) => (b.rank_score !== undefined && a.rank_score !== undefined ? b.rank_score - a.rank_score : 0));

  return scored.slice(0, Math.min(maxCount, 5));
}

/**
 * Ranking formula (for docs): 
 * rank_score = 0.40 × flavor_similarity + 0.35 × availability_score + 0.25 × context_match
 * (all inputs normalized 0–100; if no context provided, context_match = 100)
 */
export const RANKING_WEIGHTS = WEIGHTS;

export default getRankedSubstitutes;
