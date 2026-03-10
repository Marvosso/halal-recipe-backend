/**
 * Modifier taxonomy for Halal Kitchen ingredient evaluation.
 * Each modifier has: slug, displayName, effect on verdict, and matching rules (exact + optional fuzzy).
 * Rules are ordered by specificity; first match wins per modifier slug.
 */

/** Effect of a modifier on the base verdict. */
export const MODIFIER_EFFECT = Object.freeze({
  OVERRIDE_HALAL: "override_halal",   // Force halal (e.g. halal-certified, plant-based for byproducts)
  OVERRIDE_HARAM: "override_haram",   // Force haram (e.g. pork)
  STRENGTHEN: "strengthen",           // Increase confidence or shift toward halal/haram
  WEAKEN: "weaken",                   // Decrease confidence or shift toward conditional
  CONTEXT: "context",                  // Inform verdict (e.g. fermented, artificial)
});

/**
 * Modifier taxonomy: slug -> { displayName, effect, rules: [{ id, exact, fuzzy?, priority }] }
 * exact: array of strings or RegExp for word-boundary matching
 * fuzzy: optional array of strings for OCR/typo variants (matched after exact)
 * priority: lower = try first (more specific first)
 */
export const MODIFIER_TAXONOMY = Object.freeze({
  halal_certified: {
    displayName: "Halal-certified",
    effect: MODIFIER_EFFECT.OVERRIDE_HALAL,
    rules: [
      { id: "halal_certified_1", exact: [/\bhalal\s*certified\b/i, /\bcertified\s*halal\b/i, /\bzabiha\b/i], priority: 0 },
      { id: "halal_certified_2", exact: ["halal certified", "certified halal"], fuzzy: ["halal certifled", "certifled halal"], priority: 1 },
    ],
  },
  plant_based: {
    displayName: "Plant-based",
    effect: MODIFIER_EFFECT.OVERRIDE_HALAL,
    rules: [
      { id: "plant_based_1", exact: [/\bplant\s*based\b/i, /\bplant-based\b/i, /\bvegetable\b/i, /\bvegan\b/i, /\bagar\b/i, /\bpectin\b/i], priority: 0 },
      { id: "plant_based_2", exact: ["plant based", "plantbased"], fuzzy: ["plant basad", "vegetabl"], priority: 1 },
    ],
  },
  bovine: {
    displayName: "Bovine",
    effect: MODIFIER_EFFECT.STRENGTHEN,
    rules: [
      { id: "bovine_1", exact: [/\bbovine\b/i, /\bbeef\b/i], fuzzy: ["bovin", "bef"], priority: 0 },
    ],
  },
  pork: {
    displayName: "Pork",
    effect: MODIFIER_EFFECT.OVERRIDE_HARAM,
    rules: [
      { id: "pork_1", exact: [/\bpork\b/i, /\bpig\b/i, /\bporcine\b/i], fuzzy: ["porkk", "porc"], priority: 0 },
    ],
  },
  chicken: {
    displayName: "Chicken",
    effect: MODIFIER_EFFECT.STRENGTHEN,
    rules: [
      { id: "chicken_1", exact: [/\bchicken\b/i], fuzzy: ["chiken", "chickn"], priority: 0 },
    ],
  },
  beef: {
    displayName: "Beef",
    effect: MODIFIER_EFFECT.STRENGTHEN,
    rules: [
      { id: "beef_1", exact: [/\bbeef\b/i, /\bbovine\b/i], fuzzy: ["bef", "bovin"], priority: 0 },
    ],
  },
  alcohol: {
    displayName: "Alcohol",
    effect: MODIFIER_EFFECT.OVERRIDE_HARAM,
    rules: [
      { id: "alcohol_1", exact: [/\balcohol\b/i, /\bethanol\b/i, /\bspirit\b/i, /\bliquor\b/i], fuzzy: ["alchol", "alchohol"], priority: 0 },
    ],
  },
  wine: {
    displayName: "Wine",
    effect: MODIFIER_EFFECT.OVERRIDE_HARAM,
    rules: [
      { id: "wine_1", exact: [/\bwine\b/i], fuzzy: ["wne", "win"], priority: 0 },
    ],
  },
  fermented: {
    displayName: "Fermented",
    effect: MODIFIER_EFFECT.CONTEXT,
    rules: [
      { id: "fermented_1", exact: [/\bfermented\b/i, /\bfermentation\b/i], fuzzy: ["fermented", "fermentd"], priority: 0 },
    ],
  },
  artificial: {
    displayName: "Artificial",
    effect: MODIFIER_EFFECT.CONTEXT,
    rules: [
      { id: "artificial_1", exact: [/\bartificial\b/i, /\bsynthetic\b/i], fuzzy: ["artifical", "artficial"], priority: 0 },
    ],
  },
  natural_flavor: {
    displayName: "Natural flavor",
    effect: MODIFIER_EFFECT.CONTEXT,
    rules: [
      { id: "natural_flavor_1", exact: [/\bnatural\s*flavor\b/i, /\bnatural\s*flavour\b/i, /\bnatural\s*flavouring\b/i], priority: 0 },
      { id: "natural_flavor_2", exact: ["natural flavor", "natural flavour"], fuzzy: ["natural falvor"], priority: 1 },
    ],
  },
  enzyme: {
    displayName: "Enzyme",
    effect: MODIFIER_EFFECT.CONTEXT,
    rules: [
      { id: "enzyme_1", exact: [/\benzyme\b/i, /\benzymes\b/i], fuzzy: ["enzime", "enzime"], priority: 0 },
    ],
  },
  rennet: {
    displayName: "Rennet",
    effect: MODIFIER_EFFECT.CONTEXT,
    rules: [
      { id: "rennet_1", exact: [/\brennet\b/i], fuzzy: ["rennet", "renet"], priority: 0 },
    ],
  },
  // Legacy / aliases for backward compatibility
  alcohol_free: {
    displayName: "Alcohol-free",
    effect: MODIFIER_EFFECT.OVERRIDE_HALAL,
    rules: [
      { id: "alcohol_free_1", exact: [/\balcohol\s*free\b/i, /\balcohol-free\b/i, /\bnon\s*alcoholic\b/i, /\bwithout\s*alcohol\b/i], priority: 0 },
    ],
  },
  alcohol_based: {
    displayName: "Alcohol-based",
    effect: MODIFIER_EFFECT.OVERRIDE_HARAM,
    rules: [
      { id: "alcohol_based_1", exact: [/\balcohol\s*based\b/i, /\balcohol\b/i, /\bethanol\b/i], priority: 0 },
    ],
  },
});

/** Order to apply modifier rules (more specific / higher-priority modifiers first). */
export const MODIFIER_MATCH_ORDER = Object.freeze([
  "halal_certified",
  "alcohol_free",
  "plant_based",
  "pork",
  "wine",
  "alcohol",
  "alcohol_based",
  "bovine",
  "beef",
  "chicken",
  "rennet",
  "enzyme",
  "natural_flavor",
  "fermented",
  "artificial",
]);

/** Normalize slug for backward compat: plant_based -> plant where engine expects "plant". */
export const MODIFIER_SLUG_ALIAS = Object.freeze({
  plant_based: "plant",
});
