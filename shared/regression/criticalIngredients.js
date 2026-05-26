/**
 * Critical ingredient regression fixtures — single source for backend + frontend tests.
 * Update deliberately when taxonomy/rules change (not on incidental AI explanation edits).
 */

export const CRITICAL_INGREDIENTS = Object.freeze([
  {
    id: "gelatin",
    query: "gelatin",
    expectVerdict: "conditional",
    expectHalalStatus: "conditional",
    minConfidenceScore: 25,
    maxConfidenceScore: 100,
    seoSlug: "gelatin",
  },
  {
    id: "soy_sauce",
    query: "soy sauce",
    expectVerdict: "conditional",
    expectHalalStatus: "conditional",
    minConfidenceScore: 25,
    maxConfidenceScore: 100,
    seoSlug: "soy-sauce",
  },
  {
    id: "vanilla_extract",
    query: "vanilla extract",
    expectVerdictOneOf: ["conditional", "usually_haram", "haram"],
    expectHalalStatusOneOf: ["conditional", "haram"],
    minConfidenceScore: 20,
    maxConfidenceScore: 100,
    seoSlug: "vanilla-extract",
  },
  {
    id: "cheese",
    query: "cheese",
    expectVerdict: "conditional",
    expectHalalStatus: "conditional",
    minConfidenceScore: 25,
    maxConfidenceScore: 100,
    seoSlug: "cheese",
  },
  {
    id: "marshmallow_gelatin",
    query: "marshmallows with gelatin",
    expectVerdictOneOf: ["conditional", "usually_haram", "haram"],
    expectHalalStatusOneOf: ["conditional", "haram"],
    minConfidenceScore: 20,
    maxConfidenceScore: 100,
    seoSlug: "marshmallow",
  },
  {
    id: "white_wine",
    query: "white wine",
    expectVerdictOneOf: ["haram", "usually_haram"],
    expectHalalStatus: "haram",
    minConfidenceScore: 50,
    maxConfidenceScore: 100,
    seoSlug: "wine",
  },
]);

/** Modifier parsing cases tied to critical ingredients */
export const CRITICAL_MODIFIER_CASES = Object.freeze([
  {
    phrase: "pork gelatin",
    expectModifierIncludes: ["pork"],
    expectBaseIncludes: "gelatin",
    expectVerdict: "haram",
  },
  {
    phrase: "halal-certified bovine gelatin",
    expectModifierIncludes: ["halal_certified", "bovine"],
    expectBaseIncludes: "gelatin",
    expectVerdict: "halal",
  },
  {
    phrase: "white wine",
    expectModifierIncludes: ["wine"],
    expectBaseIncludes: "wine",
    expectVerdictOneOf: ["haram", "usually_haram"],
  },
  {
    phrase: "alcohol-free vanilla extract",
    expectModifierIncludes: ["alcohol_free"],
    expectBaseIncludes: "vanilla",
  },
]);

/** OCR label snippets for scan regression */
export const CRITICAL_OCR_SNIPPETS = Object.freeze([
  {
    id: "multi_critical",
    rawText: "Ingredients: water, soy sauce, gelatin, natural vanilla extract",
    expectTokens: ["soy sauce", "gelatin", "vanilla extract"],
  },
  {
    id: "wine_line",
    rawText: "Contains white wine and cheese",
    expectVerdictFor: { "white wine": "haram", cheese: "conditional" },
  },
]);

/** Recipe conversion snippets */
export const CRITICAL_CONVERSION_RECIPES = Object.freeze([
  {
    id: "gelatin_dessert",
    text: "1 cup sugar, 2 tbsp gelatin, 1 tsp vanilla extract",
    expectIssueQueries: ["gelatin", "vanilla extract"],
  },
  {
    id: "wine_sauce",
    text: "Deglaze pan with 1/2 cup wine and 2 tbsp soy sauce",
    expectIssueQueries: ["soy sauce", "wine"],
  },
]);

/** Control — stable halal baseline */
export const CONTROL_HALAL = Object.freeze({
  query: "rice",
  expectVerdict: "halal",
  expectHalalStatus: "halal",
});
