/**
 * Affiliate link routing – provider-agnostic.
 * Ranks retailers by product fit (pantry → Amazon/Thrive; grocery → Walmart/Target; specialty → halal partners).
 * Uses config for enabled providers only; no hardcoded retailer in UI.
 */

import {
  getEnabledProviders,
  getProviderById,
  isProviderAvailableInRegion,
  MAX_LINKS_PER_INGREDIENT,
  PRODUCT_FIT,
} from '../config/affiliateProviderConfig.js';

/**
 * Categorize ingredient for product-fit ranking.
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {string} - 'pantry' | 'grocery' | 'specialty' | 'unknown'
 */
export function categorizeIngredient(ingredientId) {
  if (!ingredientId) return 'unknown';

  const ingredient = ingredientId.toLowerCase();

  const pantryIngredients = [
    'agar_agar', 'grape_juice', 'vanilla_extract', 'spices', 'flour', 'sugar',
    'oil', 'vinegar', 'canned', 'dried', 'halal_vanilla_extract', 'white_wine_vinegar_halal',
  ];
  const groceryIngredients = [
    'turkey_bacon', 'halal_beef_bacon', 'beef_bacon', 'halal_beef', 'halal_chicken',
    'halal_lamb', 'fresh_herbs', 'vegetables', 'fruits', 'dairy', 'eggs',
  ];
  const specialtyIngredients = [
    'halal_gelatin', 'halal_cheese', 'halal_parmesan', 'halal_gelatin',
  ];

  if (pantryIngredients.some((p) => ingredient.includes(p))) return PRODUCT_FIT.PANTRY;
  if (groceryIngredients.some((g) => ingredient.includes(g))) return PRODUCT_FIT.GROCERY;
  if (specialtyIngredients.some((s) => ingredient.includes(s))) return PRODUCT_FIT.SPECIALTY;

  return 'unknown';
}

/**
 * Select provider IDs to show based on product fit and region.
 * Pantry → Amazon, Thrive Market. Grocery → Walmart, Target. Specialty → Amazon, Thrive (future: halal partners).
 * @param {string} ingredientId - Normalized ingredient ID
 * @param {string} countryCode - User's country code
 * @returns {string[]} - Provider ids in priority order (max MAX_LINKS_PER_INGREDIENT)
 */
export function selectAffiliateProviders(ingredientId, countryCode = 'US') {
  const productFit = categorizeIngredient(ingredientId);
  const enabled = getEnabledProviders();

  const inRegion = enabled.filter((p) => isProviderAvailableInRegion(p.id, countryCode));
  const withFit = inRegion.filter((p) =>
    p.product_fit && (p.product_fit.includes(productFit) || p.product_fit.includes(PRODUCT_FIT.SPECIALTY))
  );

  const providersToConsider = withFit.length > 0 ? withFit : inRegion;
  const sorted = [...providersToConsider].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));

  return sorted.slice(0, MAX_LINKS_PER_INGREDIENT).map((p) => p.id);
}

/**
 * Route and rank affiliate links: filter to enabled providers in region, match product fit, sort, limit to 3.
 * @param {Array} affiliateLinks - Raw links (each has platform object or platform id)
 * @param {string} ingredientId - Normalized ingredient ID
 * @param {string} countryCode - User's country code
 * @returns {Array} - Filtered and sorted links (max 3)
 */
export async function routeAffiliateLinks(affiliateLinks = [], ingredientId, countryCode = 'US') {
  if (!affiliateLinks || affiliateLinks.length === 0) return [];

  const preferredIds = selectAffiliateProviders(ingredientId, countryCode);

  const getPlatformId = (link) => link.platform?.id || link.platform?.name || link.platform;

  const filtered = affiliateLinks.filter((link) => {
    const id = getPlatformId(link);
    const provider = id ? getProviderById(id) : null;
    return provider && provider.enabled && preferredIds.includes(id);
  });

  const priority = {};
  preferredIds.forEach((id, index) => {
    priority[id] = index;
  });

  const sorted = [...filtered].sort((a, b) => {
    const idA = getPlatformId(a);
    const idB = getPlatformId(b);
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return (priority[idA] ?? 99) - (priority[idB] ?? 99);
  });

  return sorted.slice(0, MAX_LINKS_PER_INGREDIENT);
}

/**
 * Auto-detect region and route affiliate links.
 */
export async function autoRouteAffiliateLinks(affiliateLinks = [], ingredientId) {
  const { detectUserRegion } = await import('./regionDetection');
  const region = await detectUserRegion();
  return routeAffiliateLinks(affiliateLinks, ingredientId, region.countryCode);
}
