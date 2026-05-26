/**
 * Modifier priority rules — override application order and primary modifier selection.
 */

import { MODIFIER_SLUG_ALIAS } from "./taxonomy.js";

/**
 * Override rules sorted by priority (higher number = evaluated first / wins).
 * Pork and intoxicants beat halal-cert on the same phrase only when pork is present;
 * halal_certified beats bovine/conditional defaults when both apply without pork.
 */
export const OVERRIDE_RULE_PRIORITY = Object.freeze([
  { id: "pork", priority: 100 },
  { id: "wine", priority: 95 },
  { id: "alcohol", priority: 90 },
  { id: "alcohol_based", priority: 88 },
  { id: "halal_certified", priority: 85 },
  { id: "alcohol_free", priority: 80 },
  { id: "plant_based", priority: 75 },
]);

/**
 * Primary modifier for (base + modifier) DB/inline rule lookup.
 * Most specific source modifier wins.
 */
export const PRIMARY_MODIFIER_PRIORITY = Object.freeze([
  "pork",
  "halal_certified",
  "alcohol_free",
  "alcohol_based",
  "wine",
  "alcohol",
  "plant_based",
  "plant",
  "bovine",
  "beef",
  "rennet",
  "enzyme",
  "fermented",
  "unspecified",
]);

/**
 * @param {string[]} modifierSlugs
 * @returns {string}
 */
export function selectPrimaryModifier(modifierSlugs) {
  const set = new Set(modifierSlugs || []);
  for (const slug of PRIMARY_MODIFIER_PRIORITY) {
    if (set.has(slug)) return slug;
  }
  return modifierSlugs?.[0] || "unspecified";
}

/**
 * Sort detected modifiers by override priority for display (highest first).
 * @param {Array<{ slug: string }>} modifiers
 */
export function sortModifiersByPriority(modifiers) {
  const rank = Object.fromEntries(
    OVERRIDE_RULE_PRIORITY.map((r, i) => [r.id, OVERRIDE_RULE_PRIORITY.length - i])
  );
  return [...modifiers].sort((a, b) => {
    const ra = rank[a.slug] ?? rank[MODIFIER_SLUG_ALIAS[a.slug]] ?? 0;
    const rb = rank[b.slug] ?? rank[MODIFIER_SLUG_ALIAS[b.slug]] ?? 0;
    return rb - ra;
  });
}
