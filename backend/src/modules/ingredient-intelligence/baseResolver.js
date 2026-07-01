/**
 * Base ingredient identification after normalization and alias resolution.
 */

import { BASE_CATEGORIES, BASE_KEYWORDS } from "./constants.js";

/**
 * @param {string} resolvedText
 * @param {string[]} [dbBaseSlugs]
 * @returns {{ baseSlug: string|null, category: string|null, displayName: string|null, matchQuality: "exact"|"fuzzy"|"none" }}
 */
export function identifyBaseIngredient(resolvedText, dbBaseSlugs = []) {
  const t = (resolvedText || "").replace(/\s+/g, " ").trim();
  if (!t) {
    return { baseSlug: null, category: null, displayName: null, matchQuality: "none" };
  }

  const tCompact = t.replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  const slugCandidate = t.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  if (BASE_CATEGORIES[slugCandidate]) {
    return {
      baseSlug: slugCandidate,
      category: BASE_CATEGORIES[slugCandidate],
      displayName: t,
      matchQuality: "exact",
    };
  }

  for (const base of dbBaseSlugs) {
    const baseNorm = base.replace(/_/g, " ");
    const baseCompact = base.replace(/_/g, "");
    if (t.includes(baseNorm) || tCompact.includes(baseCompact)) {
      return {
        baseSlug: base,
        category: BASE_CATEGORIES[base] ?? "animal_byproduct",
        displayName: baseNorm,
        matchQuality: "exact",
      };
    }
  }

  for (const { slug, pattern, category } of BASE_KEYWORDS) {
    if (pattern.test(t)) {
      return {
        baseSlug: slug,
        category,
        displayName: slug.replace(/_/g, " "),
        matchQuality: "exact",
      };
    }
  }

  return { baseSlug: null, category: null, displayName: null, matchQuality: "none" };
}
