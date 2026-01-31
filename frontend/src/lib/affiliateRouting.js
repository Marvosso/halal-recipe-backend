/**
 * Affiliate Link Routing Logic
 * Determines which platforms to show based on region and ingredient type
 */

import { 
  detectUserRegion, 
  isInstacartAvailable, 
  isAmazonAvailable, 
  isThriveMarketAvailable 
} from './regionDetection';

/**
 * Categorize ingredient type
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {string} - 'fresh', 'pantry', 'specialty', 'unknown'
 */
function categorizeIngredient(ingredientId) {
  if (!ingredientId) return 'unknown';

  const ingredient = ingredientId.toLowerCase();
  
  // Fresh ingredients (perishable, need local delivery)
  const freshIngredients = [
    'turkey_bacon', 'halal_beef', 'halal_chicken', 'halal_lamb',
    'fresh_herbs', 'vegetables', 'fruits', 'dairy', 'eggs'
  ];
  
  // Pantry goods (shelf-stable, can ship)
  const pantryIngredients = [
    'agar_agar', 'grape_juice', 'vanilla_extract', 'spices',
    'flour', 'sugar', 'oil', 'vinegar', 'canned', 'dried'
  ];
  
  // Specialty items (may need specific sourcing)
  const specialtyIngredients = [
    'halal_gelatin', 'halal_cheese', 'halal_parmesan'
  ];

  if (freshIngredients.some(fresh => ingredient.includes(fresh))) {
    return 'fresh';
  }
  
  if (pantryIngredients.some(pantry => ingredient.includes(pantry))) {
    return 'pantry';
  }
  
  if (specialtyIngredients.some(spec => ingredient.includes(spec))) {
    return 'specialty';
  }

  return 'unknown';
}

/**
 * Select platforms based on region and ingredient type
 * 
 * Decision Logic:
 * 1. If Instacart available + fresh ingredient → Prefer Instacart
 * 2. If Instacart available + pantry → Show Instacart + Amazon
 * 3. If no Instacart → Show Amazon
 * 4. If pantry + US → Show Thrive Market
 * 5. Always include Amazon as fallback if available
 * 
 * @param {string} ingredientId - Normalized ingredient ID
 * @param {string} countryCode - User's country code
 * @param {string} zipCode - Optional zip code
 * @returns {Promise<Array<string>>} - Array of platform names in priority order
 */
export async function selectAffiliatePlatforms(ingredientId, countryCode = 'US', zipCode = null) {
  const ingredientType = categorizeIngredient(ingredientId);
  const platforms = [];
  
  // Check platform availability
  const instacartAvailable = await isInstacartAvailable(countryCode, zipCode);
  const amazonAvailable = isAmazonAvailable(countryCode);
  const thriveAvailable = isThriveMarketAvailable(countryCode);

  // Decision Logic

  // 1. Fresh ingredients → Prefer Instacart (local delivery)
  if (ingredientType === 'fresh') {
    if (instacartAvailable) {
      platforms.push('instacart');
    }
    if (amazonAvailable) {
      platforms.push('amazon'); // Fallback
    }
    return platforms.slice(0, 3); // Max 3
  }

  // 2. Pantry goods → Show multiple options
  if (ingredientType === 'pantry') {
    // If Instacart available, include it (convenience)
    if (instacartAvailable) {
      platforms.push('instacart');
    }
    
    // Always include Amazon (widest selection)
    if (amazonAvailable) {
      platforms.push('amazon');
    }
    
    // Thrive Market only for pantry + US
    if (thriveAvailable && ingredientType === 'pantry') {
      platforms.push('thrivemarket');
    }
    
    return platforms.slice(0, 3); // Max 3
  }

  // 3. Specialty items → Amazon + Instacart (if available)
  if (ingredientType === 'specialty') {
    if (amazonAvailable) {
      platforms.push('amazon');
    }
    if (instacartAvailable) {
      platforms.push('instacart');
    }
    return platforms.slice(0, 3);
  }

  // 4. Unknown → Default to Amazon, then Instacart
  if (amazonAvailable) {
    platforms.push('amazon');
  }
  if (instacartAvailable) {
    platforms.push('instacart');
  }

  return platforms.slice(0, 3); // Max 3
}

/**
 * Route affiliate links based on region and ingredient
 * Filters and prioritizes affiliate links from conversion result
 * 
 * @param {Array} affiliateLinks - All affiliate links from conversion
 * @param {string} ingredientId - Normalized ingredient ID
 * @param {string} countryCode - User's country code
 * @param {string} zipCode - Optional zip code
 * @returns {Promise<Array>} - Filtered and prioritized affiliate links (max 3)
 */
export async function routeAffiliateLinks(affiliateLinks = [], ingredientId, countryCode = 'US', zipCode = null) {
  if (!affiliateLinks || affiliateLinks.length === 0) {
    return [];
  }

  // Get preferred platforms for this ingredient and region
  const preferredPlatforms = await selectAffiliatePlatforms(ingredientId, countryCode, zipCode);

  // Filter links to preferred platforms
  const filteredLinks = affiliateLinks.filter(link => 
    preferredPlatforms.includes(link.platform?.name || link.platform)
  );

  // Sort by platform priority
  const platformPriority = {};
  preferredPlatforms.forEach((platform, index) => {
    platformPriority[platform] = index;
  });

  const sortedLinks = filteredLinks.sort((a, b) => {
    const platformA = a.platform?.name || a.platform || '';
    const platformB = b.platform?.name || b.platform || '';
    
    // Featured links first
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    
    // Then by platform priority
    const priorityA = platformPriority[platformA] ?? 99;
    const priorityB = platformPriority[platformB] ?? 99;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Then by click count
    return (b.click_count || 0) - (a.click_count || 0);
  });

  return sortedLinks.slice(0, 3); // Max 3 links
}

/**
 * Auto-detect region and route affiliate links
 * Convenience function that combines detection and routing
 * 
 * @param {Array} affiliateLinks - All affiliate links from conversion
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {Promise<Array>} - Filtered and prioritized affiliate links
 */
export async function autoRouteAffiliateLinks(affiliateLinks = [], ingredientId) {
  const region = await detectUserRegion();
  return routeAffiliateLinks(affiliateLinks, ingredientId, region.countryCode, region.zipCode);
}
