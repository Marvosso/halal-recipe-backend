/**
 * Factory for config-driven SEO ingredient pages.
 */

import { VERDICT } from "../seoVerdicts.js";
import { SITE_URL, SEO_LAST_MOD_DEFAULT } from "../../lib/seo/constants.js";
import { getIngredientCanonicalUrl, getIngredientPagePath } from "../../lib/seo/urls.js";
import { suggestRelatedIngredients } from "../../lib/seo/internalLinks.js";

const DEFAULT_SCHOLARLY = [
  "Muslims are instructed to eat halal and avoid what is clearly forbidden (e.g. Qur'an 2:173, 5:3).",
  "When ingredients are doubtful, many scholars recommend caution and verifying labels or certification.",
  "Rulings can differ by madhab and product—consult a qualified scholar for personal guidance.",
];

/**
 * @param {object} def
 * @param {string[]} [allSlugs] - for auto related ingredients
 */
export function createIngredientPage(def, allSlugs = []) {
  const slug = def.slug;
  const ingredientName = def.ingredientName;
  const title = def.title || `Is ${ingredientName} Halal?`;
  const path = getIngredientPagePath(slug);
  const canonical = def.canonical || getIngredientCanonicalUrl(slug);
  const verdict = def.verdict || VERDICT.CONDITIONAL;
  const lookup = def.quickLookupIngredient || ingredientName.toLowerCase();

  const relatedIngredients =
    def.relatedIngredients ||
    (allSlugs.length ? suggestRelatedIngredients(slug, verdict, allSlugs, 3) : []);

  const metaDescription =
    def.metaDescription ||
    `${title.replace("?", "")}? ${def.rulingSummary || ""}`.slice(0, 160);

  return {
    slug,
    path,
    priority: def.priority ?? 0.85,
    changefreq: def.changefreq || "monthly",
    metaTitle: def.metaTitle || `${title} | Halal Kitchen`,
    metaDescription,
    canonical,
    keywords:
      def.keywords ||
      `is ${ingredientName.toLowerCase()} halal, ${slug.replace(/-/g, " ")} halal, halal ingredients`,
    title,
    description:
      def.description ||
      def.rulingSummary ||
      `Guide to whether ${ingredientName} is halal for Muslim consumers.`,
    ingredientName,
    quickLookupIngredient: lookup,
    verdict,
    rulingSummary: def.rulingSummary,
    lastReviewed: def.lastReviewed || SEO_LAST_MOD_DEFAULT,
    warnings: def.warnings || [],
    whyExplanation: def.whyExplanation,
    scholarlyBasis: def.scholarlyBasis?.length ? def.scholarlyBasis : DEFAULT_SCHOLARLY,
    islamicEvidence: def.islamicEvidence || [],
    halalAlternatives: def.halalAlternatives || [],
    relatedIngredients,
    relatedConversions: def.relatedConversions || [{ title: "Convert a recipe", path: "/app" }],
    faq: def.faq || [],
  };
}

/**
 * @param {object[]} definitions
 * @returns {Record<string, object>}
 */
export function buildIngredientPageMap(definitions) {
  const slugs = definitions.map((d) => d.slug);
  const pages = definitions.map((d) => createIngredientPage(d, slugs));
  return Object.fromEntries(pages.map((p) => [p.slug, p]));
}
