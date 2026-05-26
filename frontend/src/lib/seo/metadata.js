import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from "./constants.js";
import { getIngredientCanonicalUrl, getIngredientPagePath } from "./urls.js";

/**
 * Build Helmet-ready metadata from ingredient page config.
 * @param {object} config
 */
export function buildPageMetadata(config) {
  const slug = config.slug;
  const canonical = config.canonical || getIngredientCanonicalUrl(slug);
  const path = config.path || getIngredientPagePath(slug);
  const title = config.metaTitle || `${config.title || `Is ${config.ingredientName} Halal?`} | ${SITE_NAME}`;
  const description =
    config.metaDescription ||
    config.description ||
    config.rulingSummary ||
    `Learn whether ${config.ingredientName} is halal, what to check on labels, and halal alternatives.`;

  return {
    title,
    description,
    keywords: config.keywords || "",
    canonical,
    path,
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      image: config.ogImage || DEFAULT_OG_IMAGE,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: config.noindex ? "noindex, follow" : "index, follow",
    lastReviewed: config.lastReviewed,
  };
}

/**
 * Hub / index page metadata.
 */
export function buildHubMetadata() {
  return {
    title: `Is It Halal? Ingredient Guide (${SITE_NAME})`,
    description:
      "Browse 25+ ingredient halal guides: gelatin, soy sauce, bacon, vanilla extract, cheese, wine, and more. Use our quick lookup for any ingredient.",
    canonical: `${SITE_URL}/is-it-halal`,
    keywords: "is it halal, halal ingredients, haram ingredients, halal food guide",
  };
}
