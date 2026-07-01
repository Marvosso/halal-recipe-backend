/**
 * Modifier taxonomy — detection patterns, effects, and match order.
 */

export const MODIFIER_EFFECT = Object.freeze({
  OVERRIDE_HALAL: "override_halal",
  OVERRIDE_HARAM: "override_haram",
  STRENGTHEN: "strengthen",
  WEAKEN: "weaken",
  CONTEXT: "context",
});

export const MODIFIER_TAXONOMY = Object.freeze({
  halal_certified: {
    displayName: "Halal-certified",
    effect: MODIFIER_EFFECT.OVERRIDE_HALAL,
    rules: [
      {
        id: "halal_certified_1",
        exact: [/\bhalal\s*certified\b/i, /\bcertified\s*halal\b/i, /\bzabiha\b/i, /\bhalal\s*cert\b/i],
        priority: 0,
      },
      {
        id: "halal_certified_2",
        exact: ["halal certified", "certified halal"],
        fuzzy: ["halal certifled", "certifled halal"],
        priority: 1,
      },
    ],
  },
  plant_based: {
    displayName: "Plant-based",
    effect: MODIFIER_EFFECT.OVERRIDE_HALAL,
    rules: [
      {
        id: "plant_based_1",
        exact: [
          /\bplant\s*based\b/i,
          /\bplant\s*derived\b/i,
          /\bvegetable\s*based\b/i,
          /\bvegan\b/i,
          /\bfrom\s*plants\b/i,
        ],
        priority: 0,
      },
      {
        id: "plant_based_2",
        exact: ["plant based", "plantbased", "plant derived"],
        fuzzy: ["plant basad"],
        priority: 1,
      },
    ],
  },
  pork: {
    displayName: "Pork",
    effect: MODIFIER_EFFECT.OVERRIDE_HARAM,
    rules: [
      {
        id: "pork_1",
        exact: [/\bpork\b/i, /\bpig\b/i, /\bporcine\b/i, /\bswine\b/i],
        fuzzy: ["porkk", "porc"],
        priority: 0,
      },
    ],
  },
  wine: {
    displayName: "Wine",
    effect: MODIFIER_EFFECT.OVERRIDE_HARAM,
    rules: [
      {
        id: "wine_1",
        exact: [/\b(?:red|white|cooking|rice)\s+wine\b/i, /\bwine\b(?!(\s*)?vinegar)/i],
        fuzzy: ["wne", "win"],
        priority: 0,
      },
    ],
  },
  alcohol: {
    displayName: "Alcohol",
    effect: MODIFIER_EFFECT.OVERRIDE_HARAM,
    rules: [
      {
        id: "alcohol_1",
        exact: [/\balcohol\b/i, /\bethanol\b/i, /\bspirit\b/i, /\bliquor\b/i],
        fuzzy: ["alchol", "alchohol"],
        priority: 0,
      },
    ],
  },
  bovine: {
    displayName: "Bovine",
    effect: MODIFIER_EFFECT.STRENGTHEN,
    rules: [
      {
        id: "bovine_1",
        exact: [/\bbovine\b/i],
        fuzzy: ["bovin"],
        priority: 0,
      },
    ],
  },
  enzyme: {
    displayName: "Enzyme",
    effect: MODIFIER_EFFECT.WEAKEN,
    rules: [
      {
        id: "enzyme_1",
        exact: [/\benzymes?\b/i, /\bmicrobial\s+enzyme\b/i, /\benzymatic\b/i],
        fuzzy: ["enzime"],
        priority: 0,
      },
    ],
  },
  rennet: {
    displayName: "Rennet",
    effect: MODIFIER_EFFECT.WEAKEN,
    rules: [
      {
        id: "rennet_1",
        exact: [/\brennet\b/i, /\bmicrobial\s+rennet\b/i, /\bvegetable\s+rennet\b/i],
        fuzzy: ["renet"],
        priority: 0,
      },
    ],
  },
  alcohol_free: {
    displayName: "Alcohol-free",
    effect: MODIFIER_EFFECT.OVERRIDE_HALAL,
    rules: [
      {
        id: "alcohol_free_1",
        exact: [
          /\balcohol\s*free\b/i,
          /\bnon\s*alcoholic\b/i,
          /\bwithout\s*alcohol\b/i,
          /\b0%\s*alcohol\b/i,
        ],
        priority: 0,
      },
    ],
  },
  alcohol_based: {
    displayName: "Alcohol-based",
    effect: MODIFIER_EFFECT.OVERRIDE_HARAM,
    rules: [
      {
        id: "alcohol_based_1",
        exact: [/\balcohol\s*based\b/i, /\balcohol\s*carrier\b/i],
        priority: 0,
      },
    ],
  },
  beef: {
    displayName: "Beef",
    effect: MODIFIER_EFFECT.STRENGTHEN,
    rules: [
      {
        id: "beef_1",
        exact: [/\bbeef\b/i],
        fuzzy: ["bef"],
        priority: 0,
      },
    ],
  },
  fermented: {
    displayName: "Fermented",
    effect: MODIFIER_EFFECT.CONTEXT,
    rules: [
      {
        id: "fermented_1",
        exact: [/\bfermented\b/i, /\bfermentation\b/i],
        fuzzy: ["fermentd"],
        priority: 0,
      },
    ],
  },
});

/** Detection order: more specific / verdict-critical modifiers first. */
export const MODIFIER_MATCH_ORDER = Object.freeze([
  "halal_certified",
  "alcohol_free",
  "plant_based",
  "pork",
  "wine",
  "alcohol_based",
  "alcohol",
  "bovine",
  "beef",
  "rennet",
  "enzyme",
  "fermented",
]);

/** Engine rule lookup: canonical slug for DB/inline rules. */
export const MODIFIER_SLUG_ALIAS = Object.freeze({
  plant_based: "plant",
});

/** Categories where plant_based forces halal override. */
export const PLANT_OVERRIDE_CATEGORIES = Object.freeze([
  "animal_byproduct",
  "meat",
  "animal_meat",
  "flavoring_extract",
  "flavoring",
  "additive",
]);
