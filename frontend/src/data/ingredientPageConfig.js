/**
 * SEO ingredient page config — single source of truth.
 * Top 25 rollout via data/seo/top25Ingredients.js + factory.
 */

import { buildIngredientPageMap } from "./seo/ingredientPageFactory.js";
import { TOP_25_INGREDIENT_DEFINITIONS } from "./seo/top25Ingredients.js";

export const INGREDIENT_PAGE_CONFIG = buildIngredientPageMap(TOP_25_INGREDIENT_DEFINITIONS);

/**
 * @param {string} slug
 */
export function getIngredientPageBySlug(slug) {
  if (!slug || typeof slug !== "string") return undefined;
  return INGREDIENT_PAGE_CONFIG[slug.trim().toLowerCase()];
}

/**
 * @returns {string[]}
 */
export function getIngredientPageSlugs() {
  return Object.keys(INGREDIENT_PAGE_CONFIG);
}

/**
 * All pages as sorted array (for hub, sitemap, manifest).
 * @returns {object[]}
 */
export function getAllIngredientPages() {
  return Object.values(INGREDIENT_PAGE_CONFIG).sort((a, b) =>
    (b.priority || 0) - (a.priority || 0)
  );
}
