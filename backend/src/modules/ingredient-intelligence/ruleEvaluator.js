/**
 * Deterministic rule evaluation: modifier overrides → DB/inline rules → taxonomy defaults.
 */

import { UNKNOWN_DEFAULT } from "./constants.js";
import { getIngredientRule, getCategoryDefault } from "../../db/ingredientRepository.js";
import { applyModifierOverrides } from "./modifiers/overrides.js";
import { selectPrimaryModifier } from "./modifiers/priority.js";

export { applyModifierOverrides as applyHardOverrides } from "./modifiers/overrides.js";
export { selectPrimaryModifier } from "./modifiers/priority.js";

/**
 * @param {object} params
 */
export async function evaluateRules({
  baseSlug,
  category,
  modifierSlugs,
  taxonomyDefaults,
}) {
  const override = applyModifierOverrides(modifierSlugs, category);
  if (override) return override;

  if (baseSlug) {
    const primary = selectPrimaryModifier(modifierSlugs);
    const rule = await getIngredientRule(baseSlug, primary);
    if (rule) return rule;

    if (primary !== "unspecified") {
      const fallback = await getIngredientRule(baseSlug, "unspecified");
      if (fallback) return fallback;
    }
  }

  const catDefault = getCategoryDefault(category, taxonomyDefaults);
  let notes = catDefault.notes || "";
  if (category === "animal_byproduct" && !notes) {
    notes = "Source unknown; must be halal-certified if animal-derived.";
  }
  if (category === "flavoring_extract" && !notes) {
    notes = "Often alcohol-based; check label or use alcohol-free.";
  }
  if ((modifierSlugs.includes("rennet") || modifierSlugs.includes("enzyme")) && category === "cheese") {
    notes = notes || "Depends on rennet/enzyme source; verify halal or microbial.";
  }

  return {
    verdict: catDefault.verdict,
    confidence: catDefault.confidence,
    notes,
    alternatives: getStaticAlternatives(baseSlug, catDefault.verdict),
    ruleSource: "taxonomy_default",
  };
}

function getStaticAlternatives(baseSlug, verdict) {
  if (verdict === "halal") return [];
  const byBase = {
    gelatin: ["agar_agar", "halal_beef_gelatin", "pectin"],
    glycerin: ["plant_based_glycerin", "vegetable_glycerin"],
    vanilla_extract: ["alcohol_free_vanilla", "vanilla_powder", "vanilla_bean_paste"],
    soy_sauce: ["halal_certified_soy_sauce", "tamari_alcohol_free"],
  };
  return byBase[baseSlug] || [];
}
