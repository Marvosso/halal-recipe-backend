/**
 * Affiliate provider configuration.
 * Supports multiple retailers; for now only Amazon is approved (single-provider mode).
 * When more programs are approved: set enabled: true and increase MAX_LINKS_PER_INGREDIENT.
 */

/** Product-fit categories for ranking (which retailers to show for which ingredients) */
export const PRODUCT_FIT = {
  PANTRY: 'pantry',       // Shelf-stable: Amazon, Thrive Market
  GROCERY: 'grocery',    // Mainstream grocery: Walmart, Target
  SPECIALTY: 'specialty', // Halal specialty: direct halal partners when available, else Amazon/Thrive
};

/**
 * Affiliate providers. Only enabled providers are used.
 * product_fit: array of categories this provider is preferred for (pantry | grocery | specialty).
 * sort_order: lower = higher priority when multiple providers match.
 */
export const AFFILIATE_PROVIDERS = {
  amazon: {
    id: 'amazon',
    name: 'amazon',
    display_name: 'Amazon',
    enabled: true,
    product_fit: [PRODUCT_FIT.PANTRY, PRODUCT_FIT.SPECIALTY],
    url_template: 'https://www.amazon.com/s?k={query}',
    affiliate_param: { key: 'tag', value: 'halalkitchen-20' },
    color_hex: '#FF9900',
    regions: ['US', 'CA', 'UK', 'DE', 'FR', 'IT', 'ES', 'AU'],
    sort_order: 1,
  },
  walmart: {
    id: 'walmart',
    name: 'walmart',
    display_name: 'Walmart',
    enabled: false,
    product_fit: [PRODUCT_FIT.GROCERY],
    url_template: 'https://www.walmart.com/search?q={query}',
    affiliate_param: null, // Set when Walmart Creator link available
    color_hex: '#0071CE',
    regions: ['US'],
    sort_order: 2,
  },
  target: {
    id: 'target',
    name: 'target',
    display_name: 'Target',
    enabled: false,
    product_fit: [PRODUCT_FIT.GROCERY],
    url_template: 'https://www.target.com/s?searchTerm={query}',
    affiliate_param: null,
    color_hex: '#CC0000',
    regions: ['US'],
    sort_order: 3,
  },
  thrivemarket: {
    id: 'thrivemarket',
    name: 'thrivemarket',
    display_name: 'Thrive Market',
    enabled: false,
    product_fit: [PRODUCT_FIT.PANTRY, PRODUCT_FIT.SPECIALTY],
    url_template: 'https://thrivemarket.com/search?q={query}',
    affiliate_param: null,
    color_hex: '#2E7D32',
    regions: ['US'],
    sort_order: 4,
  },
  // Future: direct halal grocery brand partners
  // halal_grocery: { id: 'halal_grocery', enabled: false, product_fit: [PRODUCT_FIT.SPECIALTY], ... },
};

/** Max purchase options per ingredient. Use 1 until more affiliate programs are approved; then set to 3. */
export const MAX_LINKS_PER_INGREDIENT = 1;

/**
 * Get only enabled providers.
 * @returns {Array<typeof AFFILIATE_PROVIDERS[keyof typeof AFFILIATE_PROVIDERS]>}
 */
export function getEnabledProviders() {
  return Object.values(AFFILIATE_PROVIDERS).filter((p) => p.enabled);
}

/**
 * Get provider by id.
 * @param {string} id
 * @returns {typeof AFFILIATE_PROVIDERS[keyof typeof AFFILIATE_PROVIDERS] | undefined}
 */
export function getProviderById(id) {
  return AFFILIATE_PROVIDERS[id];
}

/**
 * Check if a provider is available in region (from config).
 * @param {string} providerId
 * @param {string} countryCode
 * @returns {boolean}
 */
export function isProviderAvailableInRegion(providerId, countryCode) {
  const provider = getProviderById(providerId);
  if (!provider || !provider.regions) return false;
  return provider.regions.includes(countryCode);
}
