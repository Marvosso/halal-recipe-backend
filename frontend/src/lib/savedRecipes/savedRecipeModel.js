/**
 * Normalize saved recipe shapes from API, legacy recipes API, or localStorage.
 */

export function normalizeSavedRecipe(raw) {
  if (!raw || typeof raw !== "object") return null;

  const subs = raw.issues ?? raw.substitutionsUsed ?? raw.substitutions_used ?? [];

  return {
    id: raw.id,
    title: raw.title || "Untitled Recipe",
    original: raw.originalRecipe ?? raw.original_recipe ?? raw.original ?? "",
    converted: raw.convertedRecipe ?? raw.converted_recipe ?? raw.converted ?? "",
    savedAt: raw.savedAt ?? raw.createdAt ?? raw.created_at,
    issues: Array.isArray(subs) ? subs : [],
    confidenceScore: raw.confidenceScore ?? raw.confidence_score ?? 0,
    recipeKind: raw.recipeKind ?? raw.recipe_kind ?? "saved",
  };
}

export function buildSavePayload({ recipe, converted, confidence, issues, title }) {
  const originalText = (recipe || "").trim();
  const convertedText = (converted || "").trim();
  const titleFromRecipe = originalText.split(/\n/)[0]?.trim() || "Converted Recipe";
  const finalTitle =
    (title && title.trim()) ||
    (titleFromRecipe.length > 80 ? `${titleFromRecipe.slice(0, 77)}...` : titleFromRecipe);

  const substitutionsUsed = Array.isArray(issues)
    ? issues.map((issue) => ({
        ingredient: issue.ingredient ?? issue.haramIngredient ?? issue.normalizedName,
        replacement: issue.replacement ?? issue.replacement_id,
        alternatives: issue.alternatives ?? [],
        status: issue.status ?? issue.halal_status,
        notes: issue.notes ?? issue.explanation,
      }))
    : [];

  return {
    title: finalTitle,
    originalRecipe: originalText,
    convertedRecipe: convertedText,
    confidenceScore: confidence ?? 0,
    substitutionsUsed,
    issues: substitutionsUsed,
  };
}
