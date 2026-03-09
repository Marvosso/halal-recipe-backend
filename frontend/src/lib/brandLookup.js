/**
 * Premium Brand-Level Ingredient Lookup
 * Allows users to search specific brands and get halal certification information
 * Premium feature only
 */

import { evaluateItem } from './halalEngine';
import { isPremiumUser } from './subscription';
import { formatIngredientName } from './ingredientDisplay';

/**
 * Brand Ingredient Data Model
 * 
 * Structure:
 * {
 *   brand_name: string,
 *   product_name: string,
 *   ingredient_name: string,
 *   halal_certified: boolean,
 *   certifying_body: string | null,
 *   certification_number: string | null,
 *   last_verified_date: string (ISO date) | null,
 *   verification_source: string, // "certifying_body", "user_report", "manufacturer"
 *   notes: string | null,
 *   status: "halal" | "conditional" | "haram" | "uncertain"
 * }
 */

/**
 * Brand Ingredient Database
 * In production, this would be stored in a database and updated regularly
 */
const BRAND_INGREDIENTS_DB = {
  // Ben's Original products
  "bens_original_basmati_rice": {
    brand_name: "Ben's Original",
    product_name: "Basmati Rice",
    ingredient_name: "basmati_rice",
    halal_certified: true,
    certifying_body: "IFANCA",
    certification_number: "IFANCA-12345",
    last_verified_date: "2024-12-15",
    verification_source: "certifying_body",
    notes: "Certified halal by IFANCA. Product is halal.",
    status: "halal"
  },
  "bens_original_jasmine_rice": {
    brand_name: "Ben's Original",
    product_name: "Jasmine Rice",
    ingredient_name: "jasmine_rice",
    halal_certified: true,
    certifying_body: "IFANCA",
    certification_number: "IFANCA-12346",
    last_verified_date: "2024-12-15",
    verification_source: "certifying_body",
    notes: "Certified halal by IFANCA. Product is halal.",
    status: "halal"
  },
  
  // Ziyad products
  "ziyad_tahini": {
    brand_name: "Ziyad",
    product_name: "Tahini",
    ingredient_name: "tahini",
    halal_certified: true,
    certifying_body: "IFANCA",
    certification_number: "IFANCA-23456",
    last_verified_date: "2024-11-20",
    verification_source: "certifying_body",
    notes: "Certified halal by IFANCA. Product is halal.",
    status: "halal"
  },
  
  // Al Wadi products
  "al_wadi_pine_nuts": {
    brand_name: "Al Wadi",
    product_name: "Pine Nuts",
    ingredient_name: "pine_nuts",
    halal_certified: true,
    certifying_body: "HFSAA",
    certification_number: "HFSAA-34567",
    last_verified_date: "2024-10-10",
    verification_source: "certifying_body",
    notes: "Certified halal by HFSAA. Product is halal.",
    status: "halal"
  },
  
  // Generic brand examples (uncertain)
  "generic_brand_cheese": {
    brand_name: "Generic Brand",
    product_name: "Cheese",
    ingredient_name: "cheese",
    halal_certified: false,
    certifying_body: null,
    certification_number: null,
    last_verified_date: null,
    verification_source: "manufacturer",
    notes: "No halal certification found. Please verify with manufacturer or look for halal-certified alternatives.",
    status: "uncertain"
  }
};

/**
 * Normalize brand search term
 * Handles variations like "Ben's Original", "Bens Original", "bens original"
 */
function normalizeBrandTerm(searchTerm) {
  return searchTerm
    .toLowerCase()
    .trim()
    .replace(/'/g, '') // Remove apostrophes
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_'); // Replace spaces with underscores
}

/**
 * Extract brand and product from search term
 * Examples:
 * - "Ben's Original Basmati Rice" -> { brand: "bens_original", product: "basmati_rice" }
 * - "Ziyad Tahini" -> { brand: "ziyad", product: "tahini" }
 */
function extractBrandAndProduct(searchTerm) {
  const normalized = normalizeBrandTerm(searchTerm);
  
  // Try to match known brand patterns
  const brandPatterns = [
    /^(bens_original|ziyad|al_wadi|generic_brand)_(.+)$/,
    /^(.+?)_(.+)$/ // Generic pattern: brand_product
  ];
  
  for (const pattern of brandPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        brand: match[1],
        product: match[2],
        fullTerm: normalized
      };
    }
  }
  
  // If no pattern matches, treat entire term as product
  return {
    brand: null,
    product: normalized,
    fullTerm: normalized
  };
}

/**
 * Lookup brand ingredient
 * @param {string} searchTerm - Brand and product name (e.g., "Ben's Original Basmati Rice")
 * @returns {Object|null} Brand ingredient data or null if not found
 */
export function lookupBrandIngredient(searchTerm) {
  const { fullTerm } = extractBrandAndProduct(searchTerm);
  
  // Direct lookup
  if (BRAND_INGREDIENTS_DB[fullTerm]) {
    return BRAND_INGREDIENTS_DB[fullTerm];
  }
  
  // Try partial matches (e.g., "bens_original" matches "bens_original_basmati_rice")
  const partialMatches = Object.keys(BRAND_INGREDIENTS_DB).filter(key => {
    return key.includes(fullTerm) || fullTerm.includes(key);
  });
  
  if (partialMatches.length > 0) {
    // Return the most specific match (longest key)
    const bestMatch = partialMatches.reduce((a, b) => a.length > b.length ? a : b);
    return BRAND_INGREDIENTS_DB[bestMatch];
  }
  
  return null;
}

/**
 * Format brand lookup result for API response
 * @param {Object} brandData - Brand ingredient data
 * @param {Object} genericResult - Generic ingredient lookup result (fallback)
 * @returns {Object} Formatted response
 */
function formatBrandResult(brandData, genericResult) {
  const displayName = formatIngredientName(brandData.product_name || brandData.ingredient_name);
  
  return {
    isBrandLookup: true,
    brand_name: brandData.brand_name,
    product_name: brandData.product_name,
    display_name: displayName,
    halal_status: brandData.status,
    halal_certified: brandData.halal_certified,
    certifying_body: brandData.certifying_body,
    certification_number: brandData.certification_number,
    last_verified_date: brandData.last_verified_date,
    verification_source: brandData.verification_source,
    notes: brandData.notes,
    confidence_level: brandData.halal_certified ? "high" : "medium",
    confidence_score: brandData.halal_certified ? 95 : 60,
    generic_fallback: genericResult || null
  };
}

/**
 * Perform premium brand-level lookup
 * @param {string} searchTerm - Brand and product name
 * @returns {Object} Lookup result with brand data or generic fallback
 */
export function performBrandLookup(searchTerm) {
  // Check premium access
  if (!isPremiumUser()) {
    return {
      isBrandLookup: false,
      requiresPremium: true,
      message: "Brand-level verification is a premium feature. Upgrade to access brand-specific halal certification data.",
      generic_fallback: null
    };
  }
  
  // Try brand lookup first
  const brandData = lookupBrandIngredient(searchTerm);
  
  if (brandData) {
    // Get generic ingredient lookup as fallback/reference
    const genericResult = evaluateItem(brandData.ingredient_name);
    
    return formatBrandResult(brandData, genericResult);
  }
  
  // Brand not found - fall back to generic ingredient lookup
  const { product } = extractBrandAndProduct(searchTerm);
  const genericResult = evaluateItem(product);
  
  return {
    isBrandLookup: false,
    brand_not_found: true,
    message: `Brand-specific data not available for "${searchTerm}". Showing generic ingredient information.`,
    generic_fallback: genericResult,
    searched_brand: extractBrandAndProduct(searchTerm).brand,
    searched_product: product
  };
}

/**
 * Check if search term appears to be a brand search
 * @param {string} searchTerm - Search term
 * @returns {boolean} True if appears to be brand search
 */
export function isBrandSearch(searchTerm) {
  const normalized = searchTerm.toLowerCase().trim();
  
  // Check for known brand names
  const knownBrands = [
    "ben's original",
    "bens original",
    "ziyad",
    "al wadi",
    "halal",
    "certified"
  ];
  
  // Check if search term contains brand indicators
  const hasBrandIndicator = knownBrands.some(brand => normalized.includes(brand));
  
  // Check if search term has multiple words (likely brand + product)
  const wordCount = normalized.split(/\s+/).length;
  const hasMultipleWords = wordCount >= 2;
  
  // Check for capitalization patterns (Brand Name Product)
  const hasCapitalization = /[A-Z][a-z]+ [A-Z][a-z]+/.test(searchTerm);
  
  return hasBrandIndicator || (hasMultipleWords && hasCapitalization);
}
