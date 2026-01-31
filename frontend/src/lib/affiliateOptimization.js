/**
 * Affiliate Revenue Optimization
 * Ethical strategies to increase CTR without harming trust
 */

/**
 * Get optimal number of affiliate links for ingredient
 * Based on ingredient type and user context
 * 
 * @param {string} ingredientType - 'fresh', 'pantry', 'specialty', 'unknown'
 * @param {string} regionCode - User's region code
 * @returns {number} - Optimal number of links (1-3)
 */
export function getOptimalLinkCount(ingredientType, regionCode = 'US') {
  // Fresh ingredients: 2 links (fast decision needed)
  if (ingredientType === 'fresh') {
    return 2;
  }
  
  // Pantry goods: 3 links (more time to compare)
  if (ingredientType === 'pantry') {
    return 3;
  }
  
  // Specialty items: 2-3 links (high intent, quality matters)
  if (ingredientType === 'specialty') {
    return 3;
  }
  
  // Default: 2 links (balance)
  return 2;
}

/**
 * Get contextual messaging for affiliate link
 * More helpful, less salesy
 * 
 * @param {Object} link - Affiliate link object
 * @param {string} ingredientName - Ingredient name
 * @param {string} ingredientType - Ingredient type
 * @returns {string} - Contextual button text
 */
export function getContextualLinkText(link, ingredientName, ingredientType) {
  const platform = link.platform?.name || link.platform || 'amazon';
  
  // Platform-specific benefits
  const platformBenefits = {
    amazon: 'Widest Selection',
    instacart: 'Same-Day Delivery',
    thrivemarket: 'Organic & Halal-Certified'
  };
  
  // Ingredient-specific context
  if (ingredientType === 'fresh') {
    if (platform === 'instacart') {
      return `Get ${ingredientName} Delivered Today`;
    }
    return `Find Halal-Certified ${ingredientName}`;
  }
  
  if (ingredientType === 'pantry') {
    if (platform === 'thrivemarket') {
      return `Organic ${ingredientName} (Halal-Certified)`;
    }
    return `Find ${ingredientName} - ${platformBenefits[platform]}`;
  }
  
  if (ingredientType === 'specialty') {
    return `Find Halal-Certified ${ingredientName}`;
  }
  
  // Default: Simple and helpful
  return `Find ${ingredientName} on ${link.platform?.display_name || 'Amazon'}`;
}

/**
 * Determine if ingredient is high-conversion category
 * Focus optimization efforts on these
 * 
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {boolean}
 */
export function isHighConversionCategory(ingredientId) {
  if (!ingredientId) return false;
  
  const ingredient = ingredientId.toLowerCase();
  
  // Tier 1: High-conversion categories
  const highConversion = [
    // Specialty substitutes
    'agar_agar', 'halal_gelatin', 'halal_vanilla_extract', 'halal_cheese',
    // Fresh meat alternatives
    'turkey_bacon', 'halal_beef', 'halal_chicken', 'halal_lamb',
    // Pantry staples (halal-certified)
    'halal_spices', 'halal_oil', 'halal_flour'
  ];
  
  return highConversion.some(high => ingredient.includes(high));
}

/**
 * Get platform-specific benefits text
 * Helps users choose the right platform
 * 
 * @param {string} platform - Platform name
 * @param {string} ingredientType - Ingredient type
 * @returns {string} - Benefits text
 */
export function getPlatformBenefits(platform, ingredientType) {
  const benefits = {
    amazon: {
      fresh: 'Widest selection, fast shipping',
      pantry: 'Best prices, bulk options available',
      specialty: 'Hard-to-find items, verified sellers'
    },
    instacart: {
      fresh: 'Same-day delivery, local stores',
      pantry: 'Same-day delivery, fresh options',
      specialty: 'Local halal stores, same-day pickup'
    },
    thrivemarket: {
      fresh: 'Organic options, halal-certified',
      pantry: 'Organic & halal-certified, bulk discounts',
      specialty: 'Premium organic, halal-certified brands'
    }
  };
  
  return benefits[platform]?.[ingredientType] || benefits[platform]?.pantry || '';
}

/**
 * Determine optimal link placement timing
 * Show links when user is most engaged
 * 
 * @param {string} context - 'immediate', 'after_expand', 'after_read'
 * @returns {boolean} - Whether to show links now
 */
export function shouldShowLinks(context) {
  // Show immediately for high-intent items
  // Show after expand for others (better engagement)
  
  if (context === 'immediate') {
    return true;
  }
  
  if (context === 'after_expand') {
    return true; // User has shown interest
  }
  
  if (context === 'after_read') {
    return true; // User has read explanation
  }
  
  return false;
}

/**
 * Get trust-building disclosure text
 * Clear, honest, helpful
 * 
 * @param {boolean} prominent - Whether to show prominent disclosure
 * @returns {string} - Disclosure text
 */
export function getDisclosureText(prominent = false) {
  if (prominent) {
    return `💚 We may earn a small commission at no extra cost to you. This helps keep Halal Kitchen free for everyone.`;
  }
  
  return `We may earn a small commission (no extra cost to you)`;
}

/**
 * Calculate expected revenue per click
 * Helps prioritize high-value links
 * 
 * @param {string} platform - Platform name
 * @param {string} ingredientType - Ingredient type
 * @returns {number} - Estimated revenue per click (in cents)
 */
export function getEstimatedRevenuePerClick(platform, ingredientType) {
  // Base rates (estimated)
  const baseRates = {
    amazon: 4, // 4% average
    instacart: 3, // 3% average
    thrivemarket: 5 // 5% average
  };
  
  // Category multipliers
  const categoryMultipliers = {
    fresh: 1.2, // Higher ticket items
    pantry: 1.0, // Standard
    specialty: 1.5 // Premium items
  };
  
  const baseRate = baseRates[platform] || 3;
  const multiplier = categoryMultipliers[ingredientType] || 1.0;
  
  // Estimated average order value: $25
  // Revenue per click = (AOV * commission rate * multiplier) * conversion rate
  const aov = 25;
  const conversionRate = 0.10; // 10% conversion rate
  const revenuePerClick = (aov * (baseRate / 100) * multiplier) * conversionRate;
  
  return Math.round(revenuePerClick * 100); // Return in cents
}

/**
 * Prioritize affiliate links by revenue potential
 * Show highest-value links first
 * 
 * @param {Array} links - Array of affiliate links
 * @param {string} ingredientType - Ingredient type
 * @returns {Array} - Sorted links by revenue potential
 */
export function prioritizeLinksByRevenue(links, ingredientType) {
  if (!links || links.length === 0) return [];
  
  return [...links].sort((a, b) => {
    const platformA = a.platform?.name || a.platform || 'amazon';
    const platformB = b.platform?.name || b.platform || 'amazon';
    
    // Featured links first
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    
    // Then by revenue potential
    const revenueA = getEstimatedRevenuePerClick(platformA, ingredientType);
    const revenueB = getEstimatedRevenuePerClick(platformB, ingredientType);
    
    if (revenueA !== revenueB) {
      return revenueB - revenueA; // Higher revenue first
    }
    
    // Then by click count (social proof)
    return (b.click_count || 0) - (a.click_count || 0);
  });
}
