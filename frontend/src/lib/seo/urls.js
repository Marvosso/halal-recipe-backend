import { SITE_URL } from "./constants.js";

/**
 * Path for ingredient SEO page.
 * @param {string} slug
 */
export function getIngredientPagePath(slug) {
  return `/is-${slug}-halal`;
}

/**
 * Canonical URL for ingredient page.
 * @param {string} slug
 */
export function getIngredientCanonicalUrl(slug) {
  return `${SITE_URL}${getIngredientPagePath(slug)}`;
}

/** Legacy paths → canonical ingredient paths (extend as needed) */
export const INGREDIENT_PATH_REDIRECTS = Object.freeze({});
