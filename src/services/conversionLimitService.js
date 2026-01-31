/**
 * Conversion Limit Service
 * Handles conversion limit checking and tracking for free users
 */

import { getPool } from '../database.js';
import { hasPremiumAccess } from './subscriptionService.js';

const FREE_TIER_LIMIT = 5; // 5 conversions per month for free users

/**
 * Get the start of the current calendar month
 * @returns {Date} Start of current month (00:00:00)
 */
function getCurrentMonthStart() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart;
}

/**
 * Check if user has reached conversion limit
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { canConvert: boolean, limit: number, used: number, remaining: number }
 */
export async function checkConversionLimit(userId) {
  try {
    // Premium users bypass limit
    const isPremium = await hasPremiumAccess(userId);
    if (isPremium) {
      return {
        canConvert: true,
        limit: Infinity,
        used: 0,
        remaining: Infinity,
        isPremium: true
      };
    }

    // Check monthly conversion count for free users
    const pool = getPool();
    const monthStart = getCurrentMonthStart();
    
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM conversion_history
       WHERE user_id = $1 
       AND created_at >= $2`,
      [userId, monthStart]
    );
    
    const used = parseInt(result.rows[0]?.count || '0', 10);
    const remaining = Math.max(0, FREE_TIER_LIMIT - used);
    const canConvert = remaining > 0;

    return {
      canConvert: canConvert,
      limit: FREE_TIER_LIMIT,
      used: used,
      remaining: remaining,
      isPremium: false,
      monthStart: monthStart.toISOString()
    };
  } catch (error) {
    console.error('Error checking conversion limit:', error);
    // On error, allow conversion (fail open)
    return {
      canConvert: true,
      limit: FREE_TIER_LIMIT,
      used: 0,
      remaining: FREE_TIER_LIMIT,
      isPremium: false,
      error: error.message
    };
  }
}

/**
 * Track a conversion for a free user
 * @param {string} userId - User ID
 * @param {string} recipeText - Recipe text (first 500 chars stored)
 * @returns {Promise<void>}
 */
export async function trackConversion(userId, recipeText = '') {
  try {
    // Only track for free users
    const isPremium = await hasPremiumAccess(userId);
    if (isPremium) {
      return; // Premium users don't need tracking
    }

    const pool = getPool();
    const recipePreview = recipeText ? recipeText.substring(0, 500) : '';
    
    await pool.query(
      `INSERT INTO conversion_history (user_id, recipe_text, created_at)
       VALUES ($1, $2, NOW())`,
      [userId, recipePreview]
    );
    
    console.log(`✅ Conversion tracked for user ${userId}`);
  } catch (error) {
    console.error('Error tracking conversion:', error);
    // Don't throw - tracking failure shouldn't break conversion
  }
}

/**
 * Get conversion history for a user (current month only)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of conversion records
 */
export async function getConversionHistory(userId) {
  try {
    const pool = getPool();
    const monthStart = getCurrentMonthStart();
    
    const result = await pool.query(
      `SELECT id, recipe_text, created_at
       FROM conversion_history
       WHERE user_id = $1 
       AND created_at >= $2
       ORDER BY created_at DESC`,
      [userId, monthStart]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching conversion history:', error);
    return [];
  }
}

/**
 * Get conversion statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Conversion stats
 */
export async function getConversionStats(userId) {
  try {
    const limitCheck = await checkConversionLimit(userId);
    const history = await getConversionHistory(userId);
    
    return {
      ...limitCheck,
      totalConversions: history.length,
      conversions: history.map(conv => ({
        id: conv.id,
        preview: conv.recipe_text?.substring(0, 100) || '',
        createdAt: conv.created_at
      }))
    };
  } catch (error) {
    console.error('Error fetching conversion stats:', error);
    return {
      canConvert: true,
      limit: FREE_TIER_LIMIT,
      used: 0,
      remaining: FREE_TIER_LIMIT,
      isPremium: false,
      totalConversions: 0,
      conversions: []
    };
  }
}
