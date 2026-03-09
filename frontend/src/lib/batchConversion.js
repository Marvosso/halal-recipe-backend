/**
 * Batch recipe conversion: run halal conversion on multiple recipes and return a structured meal plan.
 */

import { convertRecipeWithJson } from "./convertRecipeJson";
import { parseMealPlanInput } from "./mealPlanParser";

/**
 * Single recipe result in the batch (one entry in the weekly plan).
 * @typedef {Object} BatchRecipeResult
 * @property {string} label - Day or recipe name (e.g. "Monday", "Recipe 1")
 * @property {string} originalText - Input recipe text
 * @property {string} convertedText - Halal-converted recipe text
 * @property {Object[]} issues - Ingredient issues (haram/conditional + substitutes)
 * @property {number} confidenceScore - 0–100
 * @property {string} [error] - Error message if conversion failed for this recipe
 */

/**
 * Result of batch conversion: structured weekly halal meal plan.
 * @typedef {Object} BatchConversionResult
 * @property {BatchRecipeResult[]} recipes - One result per parsed recipe (order preserved)
 * @property {number} total - Number of recipes converted
 * @property {number} withIssues - Count of recipes that had haram/conditional ingredients
 * @property {boolean} truncated - True if input was truncated to MAX_BATCH_RECIPES
 */

/**
 * Run halal conversion on each parsed recipe and return a structured weekly meal plan.
 * @param {string} mealPlanText - Raw input: meal plan with day headers, numbered list, or multiple recipes separated by blank lines
 * @param {Object} [userPreferences={}] - Halal settings (strictnessLevel, schoolOfThought)
 * @returns {Promise<BatchConversionResult>}
 */
export async function convertBatchRecipes(mealPlanText, userPreferences = {}) {
  const parsed = parseMealPlanInput(mealPlanText);
  const truncated = parsed.length >= 14; // MAX_BATCH_RECIPES

  const recipes = [];
  for (const { label, text } of parsed) {
    try {
      const result = await convertRecipeWithJson(text, userPreferences);
      recipes.push({
        label,
        originalText: result.originalText ?? text,
        convertedText: result.convertedText ?? text,
        issues: Array.isArray(result.issues) ? result.issues : [],
        confidenceScore:
          typeof result.confidenceScore === "number" && !Number.isNaN(result.confidenceScore)
            ? result.confidenceScore
            : 0,
      });
    } catch (err) {
      recipes.push({
        label,
        originalText: text,
        convertedText: text,
        issues: [],
        confidenceScore: 0,
        error: err?.message ?? "Conversion failed",
      });
    }
  }

  const withIssues = recipes.filter((r) => r.issues && r.issues.length > 0).length;

  return {
    recipes,
    total: recipes.length,
    withIssues,
    truncated,
  };
}

export { parseMealPlanInput, MAX_BATCH_RECIPES } from "./mealPlanParser";
