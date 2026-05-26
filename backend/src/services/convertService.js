import { convertRecipe } from "../utils/halalConverter.js";
import { convertRecipeWithIntelligence } from "../modules/recipe-conversion/index.js";
import { isServerRecipeConversionEnabled } from "../config/consolidationFlags.js";
import { clampConfidenceScore } from "../contracts/confidenceV1.js";

/**
 * Service layer for recipe conversion
 * Handles input validation and error handling before calling converter
 * @param {string} recipe
 * @param {object} [options] - userId, isPremium, madhab, strictness, etc.
 */
export const convertService = async (recipe, options = {}) => {
  // Defensive checks for input
  if (recipe === null || recipe === undefined) {
    return {
      originalText: "",
      convertedText: "",
      issues: [],
      confidenceScore: 0,
    };
  }

  // Convert to string if not already
  const recipeText = typeof recipe === "string" ? recipe : String(recipe);

  // Empty string check
  if (recipeText.trim() === "") {
    return {
      originalText: "",
      convertedText: "",
      issues: [],
      confidenceScore: 0,
    };
  }

  try {
    const conversionStart = Date.now();
    const { userId, isPremium, ...userPreferences } = options;
    const result = isServerRecipeConversionEnabled()
      ? await convertRecipeWithIntelligence(recipeText, userPreferences)
      : convertRecipe(recipeText, userPreferences);
    const conversionTime = Date.now() - conversionStart;

    console.log(
      `[PERF] convertService - ${isServerRecipeConversionEnabled() ? "intelligence" : "legacy"}: ${conversionTime}ms, Issues: ${result.issues?.length || 0}`
    );

    return {
      originalText: result.originalText || recipeText,
      convertedText: result.convertedText || recipeText,
      issues: Array.isArray(result.issues) ? result.issues : [],
      confidenceScore:
        typeof result.confidenceScore === "number"
          ? clampConfidenceScore(result.confidenceScore)
          : 0,
      contract_version: result.contract_version,
      pipeline: result.pipeline,
      meta: result.meta,
      ...(userId != null ? { userId } : {}),
      ...(isPremium != null ? { isPremium } : {}),
    };
  } catch (error) {
    console.error("[PERF] convertService - Error:", error);
    // Return safe fallback on error
    return {
      originalText: recipeText,
      convertedText: recipeText,
      issues: [],
      confidenceScore: 0,
    };
  }
};

// Stubs for premium routes (convert.js calls these)
convertService.getAdvancedSubstitutions = async () => ({ alternatives: [] });
convertService.generateShoppingList = async () => ({ items: [] });

export default convertService;
