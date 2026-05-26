/**
 * Modifier detection — base ingredient + modifiers with priority and effects.
 */

import {
  parseIngredientPhrase,
  sortModifiersByPriority,
  getModifierEffect,
  MODIFIER_SLUG_ALIAS,
} from "./modifiers/index.js";

/**
 * @param {string} text
 * @param {string|null} baseSlug
 * @param {{ fuzzy?: boolean }} [options]
 */
export function detectModifiers(text, baseSlug, options = {}) {
  const parsed = parseIngredientPhrase(text, {
    fuzzy: options.fuzzy !== false,
    normalize: false,
  });

  const lower = (text || parsed.normalizedText).toLowerCase();
  if (baseSlug === "vanilla_extract" && /\b(powder|bean\s*paste)\b/i.test(lower)) {
    const hasPlant = parsed.modifiers.some((m) => m.slug === "plant_based");
    if (!hasPlant) {
      parsed.modifiers.push({
        slug: "plant_based",
        displayName: "Plant-based",
        effect: getModifierEffect("plant_based"),
        ruleId: "vanilla_powder_bean",
        matchedText: lower.match(/\b(powder|bean\s*paste)\b/i)?.[0] || "powder",
        matchType: "exact",
      });
      if (!parsed.modifierSlugs.includes("plant")) {
        parsed.modifierSlugs.push("plant");
      }
    }
  }

  const sorted = sortModifiersByPriority(parsed.modifiers);

  const modifierObjects = parsed.modifierSlugs.map((slug) => {
    const detail = sorted.find((m) => (MODIFIER_SLUG_ALIAS[m.slug] || m.slug) === slug);
    return {
      slug,
      display_name: detail?.displayName || slug.replace(/_/g, " "),
      effect: detail?.effect || getModifierEffect(slug),
      matched_text: detail?.matchedText,
      match_type: detail?.matchType,
    };
  });

  return {
    slugs: parsed.modifierSlugs,
    modifiers: modifierObjects,
    modifierDetails: sorted,
    basePhrase: parsed.basePhrase,
    normalizedText: parsed.normalizedText,
  };
}

export { parseIngredientPhrase } from "./modifiers/index.js";
