/**
 * Deterministic halal rule engine constants.
 * Verdicts, confidence levels, category defaults, and hard overrides.
 */

/** Supported verdicts (final classification). */
export const VERDICTS = Object.freeze([
  "halal",
  "usually_halal",
  "conditional",
  "usually_haram",
  "haram",
]);

/** Supported confidence levels. */
export const CONFIDENCE_LEVELS = Object.freeze(["high", "medium", "low"]);

/** Base ingredient slug -> category for category-default rules. */
export const BASE_CATEGORIES = Object.freeze({
  // Animal byproducts (source often unknown)
  gelatin: "animal_byproduct",
  rennet: "animal_byproduct",
  enzymes: "animal_byproduct",
  lard: "pork",
  bacon: "pork",
  ham: "pork",
  pork: "pork",
  // Meat (conditional unless halal-certified)
  beef: "meat",
  chicken: "meat",
  lamb: "meat",
  meat: "meat",
  // Dairy
  cheese: "cheese",
  // Flavorings / extracts (often alcohol-based)
  vanilla_extract: "flavoring_extract",
  soy_sauce: "flavoring_extract",
  extract: "flavoring_extract",
  flavoring: "flavoring_extract",
  // Alcohol
  alcohol: "alcohol",
  wine: "alcohol",
  beer: "alcohol",
  liquor: "alcohol",
  // Plain plants (halal by default)
  rice: "plain_plant",
  wheat: "plain_plant",
  flour: "plain_plant",
  sugar: "plain_plant",
  salt: "plain_plant",
  oil: "plain_plant",
  vegetable: "plain_plant",
  fruit: "plain_plant",
  bean: "plain_plant",
  lentil: "plain_plant",
  potato: "plain_plant",
  tomato: "plain_plant",
  onion: "plain_plant",
  garlic: "plain_plant",
  herb: "plain_plant",
  spice: "plain_plant",
  water: "plain_plant",
});

/** Category -> default verdict and confidence when no override applies. */
export const CATEGORY_DEFAULTS = Object.freeze({
  plain_plant: { verdict: "halal", confidence: "high" },
  pork: { verdict: "haram", confidence: "high" },
  alcohol: { verdict: "haram", confidence: "high" },
  meat: { verdict: "conditional", confidence: "medium" },
  animal_byproduct: { verdict: "conditional", confidence: "medium" },
  cheese: { verdict: "conditional", confidence: "medium" },
  flavoring_extract: { verdict: "conditional", confidence: "medium" },
});

/** Default when base/category is unknown (rare). */
export const UNKNOWN_DEFAULT = Object.freeze({ verdict: "unknown", confidence: "low" });

/**
 * Hard overrides: modifier(s) force a verdict regardless of category.
 * Applied in order; first match wins.
 * Format: { when: (modifiers, baseCategory) => boolean, verdict, confidence }
 */
export const HARD_OVERRIDES = Object.freeze([
  {
    when: (modifiers) => modifiers.includes("pork"),
    verdict: "haram",
    confidence: "high",
    reason: "Pork and pork-derived ingredients are haram.",
  },
  {
    when: (modifiers, _category) => modifiers.includes("halal_certified"),
    verdict: "halal",
    confidence: "high",
    reason: "Halal-certified override.",
  },
  {
    when: (modifiers, category) =>
      modifiers.includes("plant") && ["animal_byproduct", "meat", "flavoring_extract"].includes(category),
    verdict: "halal",
    confidence: "high",
    reason: "Plant-based variant; no animal source.",
  },
  {
    when: (modifiers, category) =>
      modifiers.includes("alcohol_free") && category === "flavoring_extract",
    verdict: "halal",
    confidence: "high",
    reason: "Alcohol-free extract.",
  },
  {
    when: (modifiers) => modifiers.includes("alcohol_based"),
    verdict: "usually_haram",
    confidence: "high",
    reason: "Intoxicating alcohol as ingredient.",
  },
  {
    when: (modifiers) => modifiers.includes("wine"),
    verdict: "usually_haram",
    confidence: "high",
    reason: "Wine as ingredient is not permissible.",
  },
  {
    when: (modifiers) => modifiers.includes("alcohol"),
    verdict: "usually_haram",
    confidence: "high",
    reason: "Alcohol as ingredient is not permissible.",
  },
]);

/** Modifier detection patterns: order matters (more specific first). */
export const MODIFIER_PATTERNS = Object.freeze([
  { slug: "halal_certified", regex: /\b(halal\s*certified|certified\s*halal|zabiha)\b/i },
  { slug: "pork", regex: /\b(pork|pig|porcine)\b/i },
  { slug: "beef", regex: /\b(beef|bovine)\b/i },
  { slug: "plant", regex: /\b(plant|vegetable|agar|pectin|fruit|vegan|powder|bean\s*paste)\b/i },
  { slug: "alcohol_free", regex: /\b(alcohol\s*free|alcohol-free|non\s*alcoholic|without\s*alcohol)\b/i },
  { slug: "alcohol_based", regex: /\b(alcohol|ethanol|spirit)\b/i },
  { slug: "fermented_trace", regex: /\b(fermented|trace|naturally)\b/i },
]);

/** In-code base ingredient keywords (when DB has no match). Slug and category. Order matters: more specific first. */
export const BASE_KEYWORDS = Object.freeze([
  { slug: "vinegar", pattern: /\bvinegar\b/i, category: "flavoring_extract" },
  { slug: "gelatin", pattern: /\bgelatin(e)?\b/i, category: "animal_byproduct" },
  { slug: "vanilla_extract", pattern: /\bvanilla\s*extract\b/i, category: "flavoring_extract" },
  { slug: "vanilla_extract", pattern: /\bvanilla\b/i, category: "flavoring_extract" },
  { slug: "soy_sauce", pattern: /\bsoy\s*sauce\b/i, category: "flavoring_extract" },
  { slug: "rice", pattern: /\brice\b/i, category: "plain_plant" },
  { slug: "cheese", pattern: /\bcheese\b/i, category: "cheese" },
  { slug: "alcohol", pattern: /\b(alcohol|wine|beer|liquor|spirit)\b/i, category: "alcohol" },
  { slug: "pork", pattern: /\bpork\b/i, category: "pork" },
  { slug: "beef", pattern: /\bbeef\b/i, category: "meat" },
  { slug: "chicken", pattern: /\bchicken\b/i, category: "meat" },
  { slug: "flour", pattern: /\bflour\b/i, category: "plain_plant" },
  { slug: "sugar", pattern: /\bsugar\b/i, category: "plain_plant" },
  { slug: "flavoring", pattern: /\bflavoring\b/i, category: "flavoring_extract" },
  { slug: "enzyme", pattern: /\benzyme\b/i, category: "animal_byproduct" },
  { slug: "rennet", pattern: /\brennet\b/i, category: "animal_byproduct" },
]);
