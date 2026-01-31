/**
 * Affiliate Service
 * Fetches affiliate links for halal substitutes
 * NEVER attaches affiliate links to haram ingredients
 */

import { autoRouteAffiliateLinks } from './affiliateRouting';

import { autoRouteAffiliateLinks } from './affiliateRouting';

/**
 * Get affiliate links for a substitute ingredient
 * Now includes region-aware routing
 * @param {string} substituteId - Normalized ingredient ID (e.g., 'agar_agar')
 * @param {string} regionCode - Optional region code (auto-detected if not provided)
 * @param {number} limit - Maximum number of links to return (default: 3)
 * @returns {Promise<Array>} Array of affiliate link objects
 */
export async function getAffiliateLinksForSubstitute(substituteId, regionCode = null, limit = 3) {
  // For now, return mock data structure
  // In production, this would call the backend API
  // TODO: Replace with actual API call to backend/src/db/affiliate.js
  
  try {
    // Mock affiliate links - replace with actual API call
    const mockLinks = generateMockAffiliateLinks(substituteId, regionCode || 'US');
    
    // Apply region-aware routing
    const routedLinks = await autoRouteAffiliateLinks(mockLinks, substituteId);
    
    // Limit to requested number
    return routedLinks.slice(0, limit);
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    return []; // Return empty array on error - don't break conversion
  }
}

/**
 * Generate mock affiliate links (for development)
 * Replace with actual API call in production
 */
function generateMockAffiliateLinks(substituteId, regionCode) {
  const platformMap = {
    amazon: {
      name: 'amazon',
      display_name: 'Amazon',
      base_url_template: 'https://www.amazon.com/s?k={query}',
      color_hex: '#FF9900'
    },
    instacart: {
      name: 'instacart',
      display_name: 'Instacart',
      base_url_template: 'https://www.instacart.com/store/search?q={query}',
      color_hex: '#00A862'
    },
    thrivemarket: {
      name: 'thrivemarket',
      display_name: 'Thrive Market',
      base_url_template: 'https://thrivemarket.com/search?q={query}',
      color_hex: '#2E7D32'
    }
  };

  // Map common substitutes to affiliate links
  const substituteLinkMap = {
    'agar_agar': [
      { platform: 'amazon', search_query: 'agar agar halal certified', is_featured: true },
      { platform: 'instacart', search_query: 'agar agar', is_featured: false },
      { platform: 'thrivemarket', search_query: 'organic agar agar', is_featured: false }
    ],
    'turkey_bacon': [
      { platform: 'amazon', search_query: 'halal turkey bacon certified', is_featured: true },
      { platform: 'instacart', search_query: 'halal turkey bacon', is_featured: false }
    ],
    'grape_juice': [
      { platform: 'amazon', search_query: '100% pure grape juice halal', is_featured: true },
      { platform: 'instacart', search_query: 'pure grape juice', is_featured: false }
    ],
    'halal_vanilla_extract': [
      { platform: 'amazon', search_query: 'alcohol free vanilla extract halal', is_featured: true },
      { platform: 'thrivemarket', search_query: 'alcohol free vanilla', is_featured: false }
    ],
    'white_wine_vinegar_halal': [
      { platform: 'amazon', search_query: 'halal white wine vinegar', is_featured: true }
    ]
  };

  const links = substituteLinkMap[substituteId] || [];
  
  return links.map((link, index) => ({
    id: `link_${substituteId}_${link.platform}_${index}`,
    platform: platformMap[link.platform],
    search_query: link.search_query,
    affiliate_tag: link.platform === 'amazon' ? 'halalkitchen-20' : null, // Replace with actual tag
    is_featured: link.is_featured,
    click_count: Math.floor(Math.random() * 100), // Mock data
    region_code: regionCode
  }));
}

/**
 * Build affiliate URL from link data
 * @param {Object} linkData - Affiliate link data
 * @returns {string} Complete affiliate URL
 */
export function buildAffiliateUrl(linkData) {
  if (!linkData || !linkData.platform) {
    return null;
  }

  const searchQuery = encodeURIComponent(linkData.search_query);
  let url = linkData.platform.base_url_template.replace('{query}', searchQuery);
  
  // Add affiliate tag if available
  if (linkData.affiliate_tag) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}tag=${linkData.affiliate_tag}`;
  }
  
  return url;
}

/**
 * Get affiliate links for multiple substitutes
 * Now includes region-aware routing
 * @param {Array<string>} substituteIds - Array of normalized ingredient IDs
 * @param {string} regionCode - Optional region code (auto-detected if not provided)
 * @param {number} limitPerSubstitute - Max links per substitute
 * @returns {Promise<Object>} Map of substituteId -> affiliate links
 */
export async function getAffiliateLinksForSubstitutes(substituteIds, regionCode = null, limitPerSubstitute = 3) {
  const linksMap = {};
  
  // Fetch links for each substitute in parallel
  const promises = substituteIds.map(async (substituteId) => {
    const links = await getAffiliateLinksForSubstitute(substituteId, regionCode, limitPerSubstitute);
    if (links.length > 0) {
      linksMap[substituteId] = links;
    }
  });
  
  await Promise.all(promises);
  
  return linksMap;
}
