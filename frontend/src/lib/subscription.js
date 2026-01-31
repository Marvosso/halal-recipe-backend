/**
 * Premium Subscription Management
 * Handles subscription status, features, and limits
 */

const FREE_TIER_LIMITS = {
  // Recipe Conversion
  conversionsPerMonth: 5, // 5 conversions per month for free users
  batchConversion: false, // No batch conversion (single only)
  conversionHistory: false, // No history
  
  // Substitutions
  maxSubstitutions: 2, // Top 2 alternatives only (generous free tier)
  advancedSubstitutionLogic: false, // Basic only
  substitutionQualityScores: false, // No scores
  customSubstitutionPreferences: false, // Standard only
  
  // Halal Verification
  brandLevelVerification: false, // Ingredient-level only (no brand-level)
  scholarConsultation: false, // No access
  
  // Export & Sharing
  exportFormats: ['txt'], // Text only
  mealPlanningIntegration: false, // No integration
  shoppingListGeneration: false, // No shopping lists (PREMIUM ONLY)
  shoppingListExport: false, // No shopping list export (PREMIUM ONLY)
  
  // Saved Recipes
  savedRecipes: 10, // Max 10 saved recipes (generous for casual users)
  recipeCollections: false, // No collections
  recipeSearch: false, // No search
  recipeTags: false, // No tags
  
  // Support
  prioritySupport: false, // Community only
  featureRequestPriority: false, // Community voting
  
  // Advanced Features
  nutritionalAnalysis: false, // No analysis
  recipeScaling: false, // No scaling
  ingredientSubstitutionHistory: false, // No history
  
  // Early Access
  earlyAccess: false, // Standard release
};

const PREMIUM_FEATURES = {
  // Recipe Conversion
  conversionsPerDay: Infinity, // Unlimited
  batchConversion: true, // Up to 5 recipes at once
  conversionHistory: true, // Last 30 days of history
  
  // Substitutions
  maxSubstitutions: Infinity, // All alternatives (not just top 2)
  advancedSubstitutionLogic: true, // Advanced algorithms
  substitutionQualityScores: true, // Flavor/texture match scores
  customSubstitutionPreferences: true, // Save custom preferences
  
  // Halal Verification
  brandLevelVerification: true, // Brand-specific checks (IFANCA, HFSAA)
  scholarConsultation: true, // Priority access
  
  // Export & Sharing
  exportFormats: ['txt', 'pdf', 'json'], // All formats (PDF formatted, JSON for meal planning)
  mealPlanningIntegration: true, // Meal planning apps integration
  shoppingListGeneration: true, // Auto-generate shopping lists
  shoppingListExport: true, // Shopping list export (PREMIUM ONLY)
  
  // Saved Recipes
  savedRecipes: Infinity, // Unlimited (vs. 10 free)
  recipeCollections: true, // Organize by cuisine, meal type
  recipeSearch: true, // Full search and filter
  recipeTags: true, // Tag recipes for organization
  
  // Support
  prioritySupport: true, // 48-hour email response (vs. community only)
  featureRequestPriority: true, // Direct access (vs. community voting)
  
  // Advanced Features
  nutritionalAnalysis: true, // Basic halal-focused nutrition
  recipeScaling: true, // Scale recipes by serving size
  ingredientSubstitutionHistory: true, // Full substitution history
  
  // Early Access
  earlyAccess: true, // Beta features, early ingredient access
};

/**
 * Check if user has premium subscription
 * @returns {boolean}
 */
export function isPremiumUser() {
  // Check localStorage first (for offline/quick check)
  const premiumStatus = localStorage.getItem('premiumStatus');
  if (premiumStatus === 'active') {
    return true;
  }
  
  // Check user object if available
  if (typeof window !== 'undefined' && window.user) {
    return window.user.isPremium === true;
  }
  
  return false;
}

/**
 * Get current month key for conversion tracking
 * @returns {string} - Format: "YYYY-MM" (e.g., "2024-01")
 */
function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get user's conversion count for current month
 * @returns {number} - Number of conversions this month
 */
export function getConversionsThisMonth() {
  if (isPremiumUser()) {
    return 0; // Premium users don't need tracking
  }
  
  const monthKey = getCurrentMonthKey();
  const conversionsKey = `conversions_${monthKey}`;
  return parseInt(localStorage.getItem(conversionsKey) || '0', 10);
}

/**
 * Get remaining conversions for current month
 * @returns {number} - Remaining conversions this month, or Infinity for premium
 */
export function getRemainingConversionsThisMonth() {
  if (isPremiumUser()) {
    return Infinity;
  }
  
  const used = getConversionsThisMonth();
  const limit = FREE_TIER_LIMITS.conversionsPerMonth;
  return Math.max(0, limit - used);
}

/**
 * Track a conversion (increment counter for free users)
 * @returns {Object} - { success: boolean, remaining: number, limit: number }
 */
export function trackConversion() {
  if (isPremiumUser()) {
    return { success: true, remaining: Infinity, limit: Infinity };
  }
  
  const monthKey = getCurrentMonthKey();
  const conversionsKey = `conversions_${monthKey}`;
  const current = parseInt(localStorage.getItem(conversionsKey) || '0', 10);
  const newCount = current + 1;
  const limit = FREE_TIER_LIMITS.conversionsPerMonth;
  
  localStorage.setItem(conversionsKey, newCount.toString());
  
  return {
    success: true,
    remaining: Math.max(0, limit - newCount),
    limit: limit,
    used: newCount
  };
}

/**
 * Check if user can perform conversion
 * @returns {boolean}
 */
export function canConvert() {
  if (isPremiumUser()) {
    return true;
  }
  
  return getRemainingConversionsThisMonth() > 0;
}

/**
 * Get feature availability
 * @param {string} feature - Feature name
 * @returns {boolean}
 */
export function hasFeature(feature) {
  if (isPremiumUser()) {
    return PREMIUM_FEATURES[feature] === true;
  }
  
  // Free tier features
  return FREE_TIER_LIMITS[feature] === true || 
         (typeof FREE_TIER_LIMITS[feature] === 'number' && FREE_TIER_LIMITS[feature] > 0);
}

/**
 * Check if user can use a specific feature
 * @param {string} feature - Feature name
 * @returns {boolean}
 */
export function canUseFeature(feature) {
  if (isPremiumUser()) {
    return PREMIUM_FEATURES[feature] === true;
  }
  
  // Check free tier limits
  const freeLimit = FREE_TIER_LIMITS[feature];
  
  if (freeLimit === true) {
    return true; // Available in free tier
  }
  
  if (freeLimit === false || freeLimit === 0) {
    return false; // Not available in free tier
  }
  
  if (typeof freeLimit === 'number') {
    return freeLimit > 0; // Has a limit (check usage separately)
  }
  
  return false;
}

/**
 * Get maximum substitutions allowed
 * @returns {number} - Max substitutions (Infinity for premium, 2 for free)
 */
export function getMaxSubstitutions() {
  if (isPremiumUser()) {
    return Infinity; // All alternatives
  }
  
  return FREE_TIER_LIMITS.maxSubstitutions || 2; // Top 2 alternatives
}

/**
 * Check if user can save more recipes
 * @param {number} currentCount - Current number of saved recipes
 * @returns {boolean}
 */
export function canSaveRecipe(currentCount) {
  if (isPremiumUser()) {
    return true; // Unlimited
  }
  
  return currentCount < FREE_TIER_LIMITS.savedRecipes;
}

/**
 * Check if user can use batch conversion
 * @returns {boolean}
 */
export function canUseBatchConversion() {
  if (isPremiumUser()) {
    return PREMIUM_FEATURES.batchConversion === true;
  }
  
  return FREE_TIER_LIMITS.batchConversion === true;
}

/**
 * Check if user can use brand-level verification
 * @returns {boolean}
 */
export function canUseBrandVerification() {
  if (isPremiumUser()) {
    return PREMIUM_FEATURES.brandLevelVerification === true;
  }
  
  return FREE_TIER_LIMITS.brandLevelVerification === true;
}

/**
 * Get saved recipes limit
 * @returns {number} - Max saved recipes (10 for free, Infinity for premium)
 */
export function getSavedRecipesLimit() {
  if (isPremiumUser()) {
    return Infinity;
  }
  
  return FREE_TIER_LIMITS.savedRecipes; // 10 for free tier
}

/**
 * Get available export formats
 * @returns {string[]}
 */
export function getAvailableExportFormats() {
  if (isPremiumUser()) {
    return PREMIUM_FEATURES.exportFormats;
  }
  
  return FREE_TIER_LIMITS.exportFormats;
}
