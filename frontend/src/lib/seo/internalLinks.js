import { VERDICT } from "../../data/seoVerdicts.js";
import { getIngredientPagePath } from "./urls.js";

/** Slugs grouped for related-link suggestions */
const VERDICT_CLUSTERS = Object.freeze({
  [VERDICT.HARAM]: [
    "bacon",
    "pork",
    "ham",
    "lard",
    "pepperoni",
    "alcohol",
    "wine",
    "beer",
  ],
  [VERDICT.USUALLY_HARAM]: ["gelatin", "collagen"],
  [VERDICT.CONDITIONAL]: [
    "soy-sauce",
    "cheese",
    "rennet",
    "vanilla-extract",
    "vanilla",
    "marshmallow",
    "glycerin",
    "whey",
    "fish-sauce",
    "oyster-sauce",
    "emulsifier",
    "beef",
    "chicken",
  ],
  [VERDICT.USUALLY_HALAL]: ["vinegar", "wine-vinegar"],
  [VERDICT.HALAL]: ["rice"],
});

/**
 * Suggest related ingredient slugs (same verdict cluster, excluding self).
 * @param {string} slug
 * @param {string} verdict
 * @param {string[]} allSlugs
 * @param {number} [limit]
 */
export function suggestRelatedIngredients(slug, verdict, allSlugs, limit = 3) {
  const cluster = VERDICT_CLUSTERS[verdict] || [];
  const related = cluster.filter((s) => s !== slug && allSlugs.includes(s));
  if (related.length >= limit) return related.slice(0, limit);

  const fallback = allSlugs.filter((s) => s !== slug && !related.includes(s));
  return [...related, ...fallback].slice(0, limit);
}

/**
 * Hub page sections for internal linking.
 * @param {Array<{ slug: string, ingredientName: string, verdict: string, title?: string }>} pages
 */
export function buildIngredientHubSections(pages) {
  const byVerdict = {
    haram: [],
    questionable: [],
    halal: [],
  };

  for (const p of pages) {
    const entry = {
      slug: p.slug,
      title: p.title || `Is ${p.ingredientName} Halal?`,
      path: getIngredientPagePath(p.slug),
    };
    if (p.verdict === VERDICT.HARAM || p.verdict === VERDICT.USUALLY_HARAM) {
      byVerdict.haram.push(entry);
    } else if (p.verdict === VERDICT.HALAL || p.verdict === VERDICT.USUALLY_HALAL) {
      byVerdict.halal.push(entry);
    } else {
      byVerdict.questionable.push(entry);
    }
  }

  return [
    { id: "not-permissible", label: "Usually not permissible", items: byVerdict.haram },
    { id: "check-verify", label: "Check or verify", items: byVerdict.questionable },
    { id: "generally-ok", label: "Generally permissible", items: byVerdict.halal },
  ].filter((s) => s.items.length > 0);
}

/**
 * Footer / hub featured links (highest intent).
 */
export const FEATURED_INGREDIENT_SLUGS = [
  "gelatin",
  "soy-sauce",
  "bacon",
  "vanilla-extract",
  "wine-vinegar",
  "cheese",
  "marshmallow",
  "pork",
];
