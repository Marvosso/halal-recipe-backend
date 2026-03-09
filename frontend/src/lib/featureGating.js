/**
 * Feature Gating Logic
 * Controls access to premium features based on subscription status
 */

import { isPremiumUser, getMaxSubstitutions, getSavedRecipesLimit, canUseFeature, getRemainingConversionsThisMonth, getConversionsThisMonth } from './subscription';
import { getSubscriptionStatus } from './subscriptionApi';
import { getUpgradeCopy } from './upgradeCopy';

/**
 * Feature Gating Rules
 * 
 * Premium Features:
 * - Advanced substitution logic (all alternatives, match scores)
 * - Strict Halal Mode (enhanced verification)
 * - Unlimited saved recipes (vs. 10 free)
 * - PDF/JSON export (vs. text only)
 * - Brand-level verification
 * - Batch conversion
 * - Conversion history
 * - Meal planning integration
 * 
 * Free Features (Always Available):
 * - Unlimited basic conversions
 * - Top 2 substitution alternatives
 * - Basic halal verification
 * - Text export
 * - Up to 10 saved recipes
 */

/**
 * Check if user can use advanced substitution logic
 * @returns {boolean}
 */
export function canUseAdvancedSubstitutions() {
  return isPremiumUser();
}

/**
 * Check if user can export shopping list
 * @returns {boolean}
 */
export function canExportShoppingList() {
  return isPremiumUser();
}

/**
 * Check if user can use strict halal mode
 * @returns {boolean}
 */
export function canUseStrictHalalMode() {
  return isPremiumUser();
}

/**
 * Get substitution limit for current user
 * @returns {number} Max substitutions (2 for free, Infinity for premium)
 */
export function getSubstitutionLimit() {
  if (isPremiumUser()) {
    return Infinity;
  }
  return getMaxSubstitutions(); // Returns 2 for free
}

/**
 * Check if user can perform a conversion
 * @returns {Object} { canConvert: boolean, remaining: number, limit: number, reason?: string }
 */
export function checkConversionLimit() {
  if (isPremiumUser()) {
    return {
      canConvert: true,
      remaining: Infinity,
      limit: Infinity
    };
  }
  
  // Use imported functions
  const remaining = getRemainingConversionsThisMonth();
  const used = getConversionsThisMonth();
  const limit = 5; // FREE_TIER_LIMITS.conversionsPerMonth
  
  if (remaining <= 0) {
    return {
      canConvert: false,
      remaining: 0,
      limit: limit,
      used: used,
      reason: 'conversion_limit_reached'
    };
  }
  
  return {
    canConvert: true,
    remaining: remaining,
    limit: limit,
    used: used
  };
}

/**
 * Check if user can save more recipes
 * @param {number} currentCount - Current number of saved recipes
 * @returns {Promise<boolean>}
 */
export async function canSaveMoreRecipes(currentCount) {
  if (isPremiumUser()) {
    return true; // Unlimited
  }
  
  const limit = await getSavedRecipesLimit();
  return currentCount < limit; // 10 for free
}

/**
 * Check if user can use brand-level verification
 * @returns {Promise<boolean>}
 */
export async function canUseBrandVerification() {
  return isPremiumUser();
}

/**
 * Check if user can use batch conversion
 * @returns {Promise<boolean>}
 */
export async function canUseBatchConversion() {
  return isPremiumUser();
}

/**
 * Check if user can export to PDF/JSON
 * @param {string} format - 'pdf' or 'json'
 * @returns {Promise<boolean>}
 */
export async function canExportTo(format) {
  if (format === 'txt') {
    return true; // Always available
  }
  return isPremiumUser();
}

/**
 * Get available export formats for user
 * @returns {Promise<string[]>}
 */
export async function getAvailableExportFormats() {
  if (isPremiumUser()) {
    return ['txt', 'pdf', 'json'];
  }
  return ['txt'];
}

/**
 * Check if user can view conversion history
 * @returns {Promise<boolean>}
 */
export async function canViewConversionHistory() {
  return isPremiumUser();
}

/**
 * Apply substitution limit to alternatives array
 * Limits free users to top 2, premium gets all
 * 
 * @param {Array} alternatives - All available alternatives
 * @returns {Promise<Array>} Filtered alternatives based on user tier
 */
export function applySubstitutionLimit(alternatives) {
  if (!alternatives || !Array.isArray(alternatives)) {
    return [];
  }

  const limit = getSubstitutionLimit();
  
  if (limit === Infinity) {
    return alternatives; // Premium: all alternatives
  }

  return alternatives.slice(0, limit); // Free: top 2
}

/**
 * Check if advanced substitution features should be shown
 * @returns {Promise<boolean>}
 */
export async function shouldShowAdvancedSubstitutionFeatures() {
  return isPremiumUser();
}

/**
 * Get upgrade prompt context
 * Returns information about what feature triggered the upgrade prompt
 * 
 * @param {string} triggerFeature - Feature that triggered upgrade
 * @returns {Object} Upgrade prompt data
 */
export function getUpgradePrompt(triggerFeature) {
  // Use upgrade copy from upgradeCopy.js
  const copy = getUpgradeCopy(triggerFeature);
  
  // Fallback for backward compatibility
  if (!copy) {
    return {
      title: "Upgrade to Premium",
      message: "This feature is available in Premium. Upgrade to unlock all features.",
      feature: "Premium Feature",
      cta: "Upgrade to Premium"
    };
  }
  
  return {
    title: copy.title,
    message: copy.message,
    feature: copy.title,
    cta: copy.cta
  };
}

/**
 * Check if upgrade prompt should be shown
 * Only show at natural friction points, not aggressively
 * 
 * @param {string} triggerFeature - Feature that triggered check
 * @param {Object} context - Additional context (e.g., currentCount, limit)
 * @returns {boolean} Whether to show upgrade prompt
 */
export function shouldShowUpgradePrompt(triggerFeature, context = {}) {
  // Never show prompts for core features
  const coreFeatures = ['conversions', 'basicVerification', 'textExport'];
  if (coreFeatures.includes(triggerFeature)) {
    return false;
  }

  // Show prompts only at natural friction points
  const frictionPoints = {
    substitutions: true, // When user sees only 2 alternatives
    savedRecipes: context.currentCount >= context.limit, // When hitting limit
    brandVerification: true, // When trying to use feature
    strictHalalMode: true, // When trying to use feature
    pdfExport: true, // When trying to export
    batchConversion: true, // When trying to batch convert
    conversionHistory: true // When trying to view history
  };

  return frictionPoints[triggerFeature] === true;
}
