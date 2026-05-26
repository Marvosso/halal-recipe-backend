/**
 * Apply halal substitute replacements to recipe text (deterministic string replace).
 */

/**
 * @param {string} recipeText
 * @param {Array<{
 *   matchedTerm: string,
 *   ingredient_id: string,
 *   replacement_id: string|null,
 *   status: string,
 * }>} detectedIssues
 */
export function applyRecipeReplacements(recipeText, detectedIssues) {
  if (!recipeText || !detectedIssues?.length) {
    return { convertedText: recipeText || "", replacements: [], unresolved: [] };
  }

  let convertedText = recipeText;
  const replacements = [];
  const unresolved = [];

  for (const item of detectedIssues) {
    const ingredientId = item.ingredient_id;
    const replacementId = item.replacement_id;
    const status = item.status || "unknown";

    const hasReplacement =
      replacementId &&
      replacementId !== "Halal alternative needed" &&
      String(replacementId).trim() !== "";

    if (!hasReplacement) {
      unresolved.push({
        ingredient: ingredientId,
        status,
        matchedTerm: item.matchedTerm,
      });
      continue;
    }

    const replacementDisplay = String(replacementId).replace(/_/g, " ");
    const patterns = new Set([
      item.matchedTerm,
      ingredientId,
      ingredientId.replace(/_/g, " "),
      ingredientId.replace(/_/g, "-"),
    ]);

    let replaced = false;
    for (const pattern of patterns) {
      if (!pattern) continue;
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      if (regex.test(convertedText)) {
        convertedText = convertedText.replace(regex, replacementDisplay);
        replaced = true;
        break;
      }
    }

    if (replaced) {
      replacements.push({
        original: ingredientId,
        replacement: replacementId,
        status,
        matchedTerm: item.matchedTerm,
      });
    } else {
      unresolved.push({
        ingredient: ingredientId,
        status,
        matchedTerm: item.matchedTerm,
      });
    }
  }

  return { convertedText, replacements, unresolved };
}
