/**
 * Deterministic ingredient intelligence constants.
 * Verdict hierarchy, confidence levels, taxonomy, hard overrides, in-code fallbacks.
 */

export const ENGINE_VERSION = "1.0.0";

export const VERDICTS = Object.freeze([
  "halal",
  "usually_halal",
  "conditional",
  "usually_haram",
  "haram",
  "unknown",
]);

export const CONFIDENCE_LEVELS = Object.freeze(["high", "medium", "low"]);

/** In-code aliases when DB unavailable (longest match applied in resolver). */
export const INLINE_ALIASES = Object.freeze([
  { alias: "soy sause", target: "soy sauce", misspelling: true },
  { alias: "marshmellow", target: "marshmallow", misspelling: true },
  { alias: "gelatn", target: "gelatin", misspelling: true },
  { alias: "gelatine", target: "gelatin", misspelling: false },
  { alias: "vanila extract", target: "vanilla extract", misspelling: true },
  { alias: "parm", target: "cheese", misspelling: false },
]);

export const BASE_CATEGORIES = Object.freeze({
  gelatin: "animal_byproduct",
  rennet: "animal_byproduct",
  enzymes: "animal_byproduct",
  lard: "pork",
  bacon: "pork",
  ham: "pork",
  pork: "pork",
  beef: "meat",
  chicken: "meat",
  lamb: "meat",
  meat: "meat",
  cheese: "cheese",
  vanilla_extract: "flavoring_extract",
  soy_sauce: "flavoring_extract",
  extract: "flavoring_extract",
  flavoring: "flavoring_extract",
  alcohol: "alcohol",
  wine: "alcohol",
  beer: "alcohol",
  liquor: "alcohol",
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
  marshmallow: "processed_plant",
  vinegar: "fermentation_derived",
  glycerin: "animal_byproduct",
  glycerine: "animal_byproduct",
});

export const CATEGORY_DEFAULTS = Object.freeze({
  plain_plant: { verdict: "halal", confidence: "high" },
  natural_plant: { verdict: "halal", confidence: "high" },
  processed_plant: { verdict: "usually_halal", confidence: "medium" },
  pork: { verdict: "haram", confidence: "high" },
  alcohol: { verdict: "haram", confidence: "high" },
  meat: { verdict: "conditional", confidence: "medium" },
  animal_meat: { verdict: "conditional", confidence: "medium" },
  animal_byproduct: { verdict: "conditional", confidence: "medium" },
  cheese: { verdict: "conditional", confidence: "medium" },
  flavoring_extract: { verdict: "conditional", confidence: "medium" },
  fermentation_derived: { verdict: "conditional", confidence: "medium" },
  flavoring: { verdict: "conditional", confidence: "medium" },
  additive: { verdict: "conditional", confidence: "low" },
  synthetic: { verdict: "conditional", confidence: "low" },
});

export const UNKNOWN_DEFAULT = Object.freeze({ verdict: "unknown", confidence: "low" });

export const HARD_OVERRIDES = Object.freeze([
  {
    when: (modifiers) => modifiers.includes("pork"),
    verdict: "haram",
    confidence: "high",
    reason: "Pork and pork-derived ingredients are haram.",
    ruleSource: "hard_rule",
  },
  {
    when: (modifiers) => modifiers.includes("halal_certified"),
    verdict: "halal",
    confidence: "high",
    reason: "Halal-certified override.",
    ruleSource: "hard_rule",
  },
  {
    when: (modifiers, category) =>
      (modifiers.includes("plant") || modifiers.includes("plant_based")) &&
      ["animal_byproduct", "meat", "flavoring_extract"].includes(category),
    verdict: "halal",
    confidence: "high",
    reason: "Plant-based variant; no animal source.",
    ruleSource: "hard_rule",
  },
  {
    when: (modifiers, category) =>
      modifiers.includes("alcohol_free") && category === "flavoring_extract",
    verdict: "halal",
    confidence: "high",
    reason: "Alcohol-free extract.",
    ruleSource: "hard_rule",
  },
  {
    when: (modifiers) => modifiers.includes("alcohol_based"),
    verdict: "usually_haram",
    confidence: "high",
    reason: "Intoxicating alcohol as ingredient.",
    ruleSource: "hard_rule",
  },
  {
    when: (modifiers) => modifiers.includes("wine"),
    verdict: "usually_haram",
    confidence: "high",
    reason: "Wine as ingredient is not permissible.",
    ruleSource: "hard_rule",
  },
  {
    when: (modifiers) => modifiers.includes("alcohol"),
    verdict: "usually_haram",
    confidence: "high",
    reason: "Alcohol as ingredient is not permissible.",
    ruleSource: "hard_rule",
  },
]);

export const BASE_KEYWORDS = Object.freeze([
  { slug: "vinegar", pattern: /\bvinegar\b/i, category: "fermentation_derived" },
  { slug: "glycerin", pattern: /\bglycerin(e)?\b/i, category: "animal_byproduct" },
  { slug: "gelatin", pattern: /\bgelatin(e)?\b/i, category: "animal_byproduct" },
  { slug: "vanilla_extract", pattern: /\bvanilla\s*extract\b/i, category: "flavoring_extract" },
  { slug: "vanilla_extract", pattern: /\bvanilla\b/i, category: "flavoring_extract" },
  { slug: "soy_sauce", pattern: /\bsoy\s*sauce\b/i, category: "flavoring_extract" },
  { slug: "rice", pattern: /\brice\b/i, category: "plain_plant" },
  { slug: "cheese", pattern: /\bcheese\b/i, category: "cheese" },
  { slug: "marshmallow", pattern: /\bmarshmallow\b/i, category: "processed_plant" },
  { slug: "alcohol", pattern: /\b(alcohol|wine|beer|liquor|spirit)\b/i, category: "alcohol" },
  { slug: "bacon", pattern: /\bbacon\b/i, category: "pork" },
  { slug: "pork", pattern: /\bpork\b/i, category: "pork" },
  { slug: "beef", pattern: /\bbeef\b/i, category: "meat" },
  { slug: "chicken", pattern: /\bchicken\b/i, category: "meat" },
  { slug: "flour", pattern: /\bflour\b/i, category: "plain_plant" },
  { slug: "sugar", pattern: /\bsugar\b/i, category: "plain_plant" },
  { slug: "flavoring", pattern: /\bflavoring\b/i, category: "flavoring_extract" },
  { slug: "enzyme", pattern: /\benzyme\b/i, category: "animal_byproduct" },
  { slug: "rennet", pattern: /\brennet\b/i, category: "animal_byproduct" },
]);

/** Longest-match phrases for recipe detection (aligns with modifier/engine wine handling). */
export const RECIPE_DETECTION_PHRASES = Object.freeze([
  { term: "white wine", baseSlug: "wine" },
  { term: "red wine", baseSlug: "wine" },
  { term: "cooking wine", baseSlug: "wine" },
  { term: "rice wine", baseSlug: "wine" },
  { term: "wine", baseSlug: "wine" },
  { term: "vanilla extract", baseSlug: "vanilla_extract" },
  { term: "soy sauce", baseSlug: "soy_sauce" },
]);

export const INLINE_RULES = Object.freeze({
  gelatin: {
    unspecified: { verdict: "conditional", confidence: "medium", notes: "Source unknown; must be halal-certified if animal-derived.", alternatives: ["agar_agar", "halal_beef_gelatin", "pectin"] },
    pork: { verdict: "haram", confidence: "high", notes: "Pork-derived gelatin is not permissible.", alternatives: ["agar_agar", "halal_beef_gelatin", "pectin"] },
    beef: { verdict: "conditional", confidence: "medium", notes: "Permissible only if from zabiha/halal-certified beef.", alternatives: ["agar_agar", "halal_beef_gelatin", "pectin"] },
    bovine: { verdict: "conditional", confidence: "medium", notes: "Permissible only if from zabiha/halal-certified beef.", alternatives: ["agar_agar", "halal_beef_gelatin", "pectin"] },
    halal_certified: { verdict: "halal", confidence: "high", notes: "Halal-certified source.", alternatives: ["agar_agar", "pectin"] },
    plant: { verdict: "halal", confidence: "high", notes: "Plant-based; no animal source.", alternatives: [] },
    plant_based: { verdict: "halal", confidence: "high", notes: "Plant-based; no animal source.", alternatives: [] },
  },
  soy_sauce: {
    unspecified: { verdict: "conditional", confidence: "medium", notes: "Naturally contains trace alcohol from fermentation; many scholars allow.", alternatives: ["halal_certified_soy_sauce", "tamari_alcohol_free"] },
    fermented: { verdict: "conditional", confidence: "medium", notes: "Trace alcohol from fermentation; verify certification.", alternatives: ["halal_certified_soy_sauce", "tamari_alcohol_free"] },
    fermented_trace: { verdict: "conditional", confidence: "medium", notes: "Trace alcohol from fermentation; many scholars allow.", alternatives: ["halal_certified_soy_sauce", "tamari_alcohol_free"] },
    halal_certified: { verdict: "halal", confidence: "high", notes: "Certified halal or alcohol-free.", alternatives: [] },
    alcohol_free: { verdict: "halal", confidence: "high", notes: "No alcohol; permissible.", alternatives: [] },
  },
  vanilla_extract: {
    unspecified: { verdict: "conditional", confidence: "medium", notes: "Often alcohol-based; check label or use alcohol-free.", alternatives: ["alcohol_free_vanilla", "vanilla_powder", "vanilla_bean_paste"] },
    alcohol_based: { verdict: "usually_haram", confidence: "high", notes: "Alcohol as carrier; prefer alcohol-free.", alternatives: ["alcohol_free_vanilla", "vanilla_powder", "vanilla_bean_paste"] },
    alcohol_free: { verdict: "halal", confidence: "high", notes: "Alcohol-free vanilla is permissible.", alternatives: [] },
    plant: { verdict: "halal", confidence: "high", notes: "Vanilla powder or bean; no alcohol carrier.", alternatives: [] },
    plant_based: { verdict: "halal", confidence: "high", notes: "Vanilla powder or bean; no alcohol carrier.", alternatives: [] },
  },
  rice: {
    unspecified: { verdict: "halal", confidence: "high", notes: "Plain plant; permissible.", alternatives: [] },
  },
  glycerin: {
    unspecified: { verdict: "conditional", confidence: "medium", notes: "Source may be animal or plant; verify.", alternatives: ["vegetable_glycerin", "plant_based_glycerin"] },
    plant: { verdict: "halal", confidence: "high", notes: "Plant-based glycerin; permissible.", alternatives: [] },
    plant_based: { verdict: "halal", confidence: "high", notes: "Plant-based glycerin; permissible.", alternatives: [] },
    pork: { verdict: "haram", confidence: "high", notes: "Pork-derived glycerin is not permissible.", alternatives: ["vegetable_glycerin"] },
  },
});
