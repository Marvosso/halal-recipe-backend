import { convertRecipe } from "../utils/halalConverter.js";

/**
 * Service layer for recipe conversion
 * Handles input validation and error handling before calling converter
 */
export const convertService = async (recipe, userPreferences = {}) => {
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
    // Call the converter function with user preferences
    const result = convertRecipe(recipeText, userPreferences);
    const conversionTime = Date.now() - conversionStart;

    // Lightweight server-side timing log (console only)
    console.log(`[PERF] convertService - Conversion: ${conversionTime}ms, Issues: ${result.issues?.length || 0}`);

    // Ensure result has all required fields
    return {
      originalText: result.originalText || recipeText,
      convertedText: result.convertedText || recipeText,
      issues: Array.isArray(result.issues) ? result.issues : [],
      confidenceScore:
        typeof result.confidenceScore === "number"
          ? Math.max(0, Math.min(100, result.confidenceScore))
          : 0,
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
