/**
 * Preloaded ingredient suggestions for quick lookup.
 * Used for live search suggestions and to reduce typos / help discovery.
 */

/** 20 most commonly searched ingredients (preload order) */
export const COMMON_INGREDIENTS = [
  "rice",
  "gelatin",
  "soy sauce",
  "vanilla extract",
  "marshmallows",
  "bacon",
  "pork",
  "wine",
  "cheese",
  "worcestershire sauce",
  "rennet",
  "vinegar",
  "yeast",
  "beef",
  "chicken",
  "lamb",
  "fish",
  "honey",
  "parmesan",
  "cream",
];

const NORMALIZED_MAP = new Map(
  COMMON_INGREDIENTS.map((name) => [name.toLowerCase().trim(), name])
);

/**
 * Get display label for an ingredient (preserves preferred casing from COMMON_INGREDIENTS).
 * @param {string} key - Normalized or raw ingredient string
 * @returns {string}
 */
export function getSuggestionLabel(key) {
  const normalized = (key || "").toLowerCase().trim();
  return NORMALIZED_MAP.get(normalized) || key || "";
}

/**
 * Filter common ingredients by search query (prefix + contains).
 * Empty query returns all common ingredients (for "preload" / initial state).
 * @param {string} query - User input
 * @param {{ limit?: number }} options - Optional limit for number of suggestions
 * @returns {string[]} Sorted: prefix matches first, then contains, then rest; capped by limit
 */
export function getFilteredSuggestions(query, options = {}) {
  const limit = options.limit ?? 20;
  const q = (query || "").toLowerCase().trim();

  if (q === "") {
    return COMMON_INGREDIENTS.slice(0, limit);
  }

  const prefix = [];
  const contains = [];
  const other = [];

  for (const name of COMMON_INGREDIENTS) {
    const lower = name.toLowerCase();
    if (lower.startsWith(q)) {
      prefix.push(name);
    } else if (lower.includes(q)) {
      contains.push(name);
    } else {
      other.push(name);
    }
  }

  const combined = [...prefix, ...contains, ...other];
  return combined.slice(0, limit);
}

/**
 * Check if a suggestion list is the "preload" (no query) state.
 * @param {string} query
 * @returns {boolean}
 */
export function isPreloadSuggestions(query) {
  return !(query || "").trim();
}
