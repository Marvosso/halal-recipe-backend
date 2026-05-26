/**
 * Deterministic modifier override engine — priority-ordered verdict overrides.
 */

import {
  MODIFIER_EFFECT,
  MODIFIER_TAXONOMY,
  PLANT_OVERRIDE_CATEGORIES,
} from "./taxonomy.js";
import { OVERRIDE_RULE_PRIORITY } from "./priority.js";

/**
 * @typedef {object} OverrideResult
 * @property {string} verdict
 * @property {string} confidence
 * @property {string} notes
 * @property {string} ruleSource
 * @property {string} appliedOverrideId
 */

const OVERRIDE_HANDLERS = Object.freeze({
  pork: {
    id: "pork",
    when: (mods) => mods.includes("pork"),
    apply: () => ({
      verdict: "haram",
      confidence: "high",
      notes: "Pork and pork-derived ingredients are haram.",
    }),
  },
  wine: {
    id: "wine",
    when: (mods) => mods.includes("wine"),
    apply: () => ({
      verdict: "usually_haram",
      confidence: "high",
      notes: "Wine as an ingredient is not permissible.",
    }),
  },
  alcohol: {
    id: "alcohol",
    when: (mods) => mods.includes("alcohol") && !mods.includes("alcohol_free"),
    apply: () => ({
      verdict: "usually_haram",
      confidence: "high",
      notes: "Alcohol as an ingredient is not permissible.",
    }),
  },
  alcohol_based: {
    id: "alcohol_based",
    when: (mods) => mods.includes("alcohol_based"),
    apply: () => ({
      verdict: "usually_haram",
      confidence: "high",
      notes: "Alcohol-based ingredient; not permissible.",
    }),
  },
  halal_certified: {
    id: "halal_certified",
    when: (mods) => mods.includes("halal_certified"),
    apply: () => ({
      verdict: "halal",
      confidence: "high",
      notes: "Halal-certified source.",
    }),
  },
  alcohol_free: {
    id: "alcohol_free",
    when: (mods, category) =>
      mods.includes("alcohol_free") &&
      (category === "flavoring_extract" || category === "flavoring" || category === "fermentation_derived"),
    apply: () => ({
      verdict: "halal",
      confidence: "high",
      notes: "Alcohol-free; permissible.",
    }),
  },
  plant_based: {
    id: "plant_based",
    when: (mods, category) =>
      (mods.includes("plant") || mods.includes("plant_based")) &&
      PLANT_OVERRIDE_CATEGORIES.includes(category),
    apply: () => ({
      verdict: "halal",
      confidence: "high",
      notes: "Plant-based variant; no animal source.",
    }),
  },
});

/**
 * Apply highest-priority matching override.
 * @param {string[]} modifierSlugs - canonical slugs (after alias)
 * @param {string|null} category
 * @returns {OverrideResult|null}
 */
export function applyModifierOverrides(modifierSlugs, category) {
  const mods = modifierSlugs || [];
  const sortedIds = OVERRIDE_RULE_PRIORITY.map((r) => r.id);

  for (const id of sortedIds) {
    const handler = OVERRIDE_HANDLERS[id];
    if (!handler || !handler.when(mods, category)) continue;
    const result = handler.apply(mods, category);
    return {
      ...result,
      ruleSource: "hard_rule",
      appliedOverrideId: id,
    };
  }
  return null;
}

/**
 * Whether modifier set triggers an override halal/haram verdict (skips ambiguous DB path).
 * @param {string[]} modifierSlugs
 * @param {string|null} category
 */
export function hasVerdictOverride(modifierSlugs, category) {
  return applyModifierOverrides(modifierSlugs, category) != null;
}

/**
 * @param {string} slug
 * @returns {string}
 */
export function getModifierEffect(slug) {
  const entry = MODIFIER_TAXONOMY[slug] || MODIFIER_TAXONOMY[slug === "plant" ? "plant_based" : slug];
  return entry?.effect || MODIFIER_EFFECT.CONTEXT;
}
