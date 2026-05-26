/**
 * Modifier detection system — public API.
 */

export {
  MODIFIER_EFFECT,
  MODIFIER_TAXONOMY,
  MODIFIER_MATCH_ORDER,
  MODIFIER_SLUG_ALIAS,
  PLANT_OVERRIDE_CATEGORIES,
} from "./taxonomy.js";

export {
  OVERRIDE_RULE_PRIORITY,
  PRIMARY_MODIFIER_PRIORITY,
  selectPrimaryModifier,
  sortModifiersByPriority,
} from "./priority.js";

export { applyModifierOverrides, hasVerdictOverride, getModifierEffect } from "./overrides.js";

export { adjustConfidenceForModifiers, maxConfidenceLevel } from "./confidence.js";

export {
  detectModifierMatches,
  extractBasePhrase,
  parseIngredientPhrase,
} from "./phraseParser.js";
