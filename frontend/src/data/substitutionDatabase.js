/**
 * Substitution database: 3–5 substitutes per haram/conditional ingredient
 * with metadata for ranking: flavor_similarity, cooking_context, availability, why_it_works.
 *
 * Keys match halal_knowledge IDs (wine covers white_wine/red_wine via detection).
 */

const AVAILABILITY_SCORE = { high: 100, medium: 70, low: 40 };

/** @type {Record<string, Array<{ id: string, flavor_similarity: number, cooking_context: string[], availability: 'high'|'medium'|'low', why_it_works: string }>>} */
export const SUBSTITUTION_DB = {
  wine: [
    {
      id: "grape_juice_plus_vinegar",
      flavor_similarity: 85,
      cooking_context: ["sauces", "deglazing", "braising", "marinades"],
      availability: "high",
      why_it_works: "Grape juice plus a splash of vinegar mimics wine’s acidity and fruit; use ¾ cup juice + ¼ cup vinegar per cup of wine.",
    },
    {
      id: "non_alcoholic_wine",
      flavor_similarity: 95,
      cooking_context: ["sauces", "deglazing", "braising", "marinades", "general"],
      availability: "medium",
      why_it_works: "Alcohol-free wine keeps the same flavor profile without alcohol; swap 1:1 in recipes.",
    },
    {
      id: "chicken_stock_plus_apple_cider_vinegar",
      flavor_similarity: 55,
      cooking_context: ["sauces", "braising", "stews"],
      availability: "high",
      why_it_works: "Stock adds depth; a little vinegar adds tang. Good when you don’t need a fruity note.",
    },
    {
      id: "white_grape_juice",
      flavor_similarity: 70,
      cooking_context: ["sauces", "marinades", "poaching"],
      availability: "high",
      why_it_works: "Works well for white wine in poaching or light sauces; add a touch of vinegar if you want more acidity.",
    },
    {
      id: "vegetable_broth_plus_lemon",
      flavor_similarity: 50,
      cooking_context: ["soups", "stews", "vegetarian"],
      availability: "high",
      why_it_works: "Broth with lemon gives brightness and acidity without alcohol; best in vegetable-focused dishes.",
    },
  ],
  white_wine: [], // use wine as fallback in ranking
  red_wine: [],   // use wine as fallback in ranking

  bacon: [
    {
      id: "turkey_bacon",
      flavor_similarity: 75,
      cooking_context: ["breakfast", "sandwiches", "wraps", "salads", "general"],
      availability: "high",
      why_it_works: "Turkey bacon is widely available and halal; it crisps like pork bacon. Use 1:1; it’s leaner so a little oil can help.",
    },
    {
      id: "beef_bacon_halal",
      flavor_similarity: 90,
      cooking_context: ["breakfast", "sandwiches", "carbonara", "general"],
      availability: "medium",
      why_it_works: "Halal beef bacon is the closest in flavor and texture to pork bacon; look for halal-certified brands.",
    },
    {
      id: "smoked_turkey_bacon",
      flavor_similarity: 80,
      cooking_context: ["breakfast", "sandwiches", "salads", "general"],
      availability: "high",
      why_it_works: "Smoked turkey bacon adds a similar smoky note; use 1:1 in most recipes.",
    },
    {
      id: "halal_beef_pastrami",
      flavor_similarity: 65,
      cooking_context: ["sandwiches", "salads", "charcuterie"],
      availability: "medium",
      why_it_works: "Cured, sliced beef pastrami (halal) can stand in for bacon in sandwiches and salads when you want a salty, meaty bite.",
    },
    {
      id: "mushrooms_crispy",
      flavor_similarity: 45,
      cooking_context: ["vegetarian", "breakfast", "toppings"],
      availability: "high",
      why_it_works: "Sliced mushrooms fried until crispy give an umami, slightly smoky option for vegetarian dishes.",
    },
  ],

  gelatin: [
    {
      id: "agar_agar",
      flavor_similarity: 70,
      cooking_context: ["desserts", "jellies", "panna_cotta", "vegan"],
      availability: "high",
      why_it_works: "Agar agar is plant-based and sets at room temperature. Use about 2 tbsp powder per 1 tbsp gelatin; boil to activate.",
    },
    {
      id: "halal_beef_gelatin",
      flavor_similarity: 98,
      cooking_context: ["desserts", "marshmallows", "gummies", "general"],
      availability: "medium",
      why_it_works: "Halal-certified beef gelatin behaves like regular gelatin; use 1:1. Check for a trusted halal symbol.",
    },
    {
      id: "pectin",
      flavor_similarity: 55,
      cooking_context: ["jams", "jellies", "fruit_setting"],
      availability: "high",
      why_it_works: "Pectin is fruit-derived and ideal for jams and jellies; it doesn’t replace gelatin in mousses or marshmallows.",
    },
    {
      id: "chia_seeds",
      flavor_similarity: 40,
      cooking_context: ["puddings", "vegan", "thickening"],
      availability: "high",
      why_it_works: "Chia seeds gel when soaked and work in puddings and thickeners; not a direct swap for clear jellies.",
    },
    {
      id: "cornstarch_slurry",
      flavor_similarity: 35,
      cooking_context: ["sauces", "pies", "thickening"],
      availability: "high",
      why_it_works: "Cornstarch thickens sauces and some fillings; it doesn’t set like gelatin but is useful in non-set applications.",
    },
  ],
};

/** Availability string to numeric score for ranking */
export function getAvailabilityScore(availability) {
  if (typeof availability === "number") return Math.min(100, Math.max(0, availability));
  return AVAILABILITY_SCORE[availability] ?? 70;
}

/**
 * Resolve ingredient to a DB key (e.g. white_wine -> wine)
 */
export function getSubstitutionKey(ingredientId) {
  const id = (ingredientId || "").toLowerCase().trim().replace(/\s+/g, "_");
  if (SUBSTITUTION_DB[id] && SUBSTITUTION_DB[id].length > 0) return id;
  if (id === "white_wine" || id === "red_wine" || id === "cooking_wine") return "wine";
  return id;
}

/**
 * Get raw substitute entries for an ingredient (from DB or fallback empty)
 */
export function getSubstituteEntries(ingredientId) {
  const key = getSubstitutionKey(ingredientId);
  return SUBSTITUTION_DB[key] || [];
}

export default SUBSTITUTION_DB;
