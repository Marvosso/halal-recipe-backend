import { buildSharePayload } from "../shareUtils.js";

/**
 * Build share payload for recipe conversion cards.
 */
export function buildRecipeShareData({ recipe = "", converted = "", issues = [], confidence = 0 }) {
  const base = buildSharePayload({
    recipeTitle: recipe,
    issues,
    convertedSnippet: converted,
  });

  const swaps = (issues || [])
    .filter((i) => i?.ingredient || i?.ingredient_id)
    .slice(0, 6)
    .map((i) => ({
      from: i.ingredient || i.ingredient_id,
      to: i.replacement || i.replacement_id || "halal alternative",
    }));

  return {
    type: "recipe",
    title: base.title,
    haram: base.haram,
    replacements: base.replacements,
    snippet: base.snippet,
    swaps,
    confidenceScore: Math.round(confidence || 0),
    issueCount: (issues || []).length,
  };
}
