/**
 * Modifier parser — delegates to modular phrase parser (backward compatible exports).
 */

import {
  detectModifierMatches,
  parseIngredientPhrase,
  MODIFIER_SLUG_ALIAS,
} from "../modules/ingredient-intelligence/modifiers/index.js";

export { normalizeForMatching } from "../modules/ingredient-intelligence/normalize.js";

/**
 * @deprecated Use parseIngredientPhrase for base + modifiers.
 */
export function parseModifiers(inputText, options = {}) {
  const { normalizedText, modifiers } = detectModifierMatches(inputText, options);
  return { normalizedText, modifiers };
}

export function getModifierSlugs(inputText, options = {}) {
  const { modifiers } = detectModifierMatches(inputText, options);
  return modifiers.map((m) => MODIFIER_SLUG_ALIAS[m.slug] || m.slug);
}

export { parseIngredientPhrase, detectModifierMatches };
