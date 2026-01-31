/**
 * Recipe Conversion API Routes
 * Handles recipe conversion with premium feature gating
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requirePremium, attachFeatureLimits } from '../middleware/featureGate.js';
import { hasPremiumAccess } from '../services/subscriptionService.js';
import { checkConversionLimit, trackConversion } from '../services/conversionLimitService.js';
import { getPool } from '../database.js';
import convertService from '../services/convertService.js';

const router = express.Router();

/**
 * POST /convert
 * Convert recipe with premium gating
 * 
 * Free users: 5 conversions per month
 * Premium users: Unlimited conversions
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipeText } = req.body;

    if (!recipeText || typeof recipeText !== 'string') {
      return res.status(400).json({ error: 'Recipe text is required' });
    }

    // Check conversion limit before conversion
    const limitCheck = await checkConversionLimit(userId);
    
    if (!limitCheck.canConvert) {
      return res.status(403).json({
        error: 'Monthly conversion limit reached',
        message: `You've used all ${limitCheck.limit} free conversions this month. Upgrade to Premium for unlimited conversions.`,
        limit: limitCheck.limit,
        used: limitCheck.used,
        remaining: limitCheck.remaining,
        upgrade_required: true,
        upgrade_url: '/subscription/upgrade'
      });
    }

    // Perform conversion
    const result = await convertService(recipeText, {
      userId: userId,
      isPremium: limitCheck.isPremium
    });

    // Track conversion in database (for limit tracking)
    await trackConversion(userId, recipeText);

    res.json(result);
  } catch (error) {
    console.error('Error converting recipe:', error);
    res.status(500).json({ error: 'Failed to convert recipe' });
  }
});

/**
 * GET /convert/limit
 * Get user's conversion limit status
 */
router.get('/limit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limitCheck = await checkConversionLimit(userId);
    
    res.json(limitCheck);
  } catch (error) {
    console.error('Error fetching conversion limit:', error);
    res.status(500).json({ error: 'Failed to fetch conversion limit' });
  }
});

/**
 * POST /convert/advanced-substitutions
 * Get advanced substitutions (premium only)
 */
router.post('/advanced-substitutions', authenticateToken, requirePremium, async (req, res) => {
  try {
    const { ingredientId } = req.body;
    
    if (!ingredientId) {
      return res.status(400).json({ error: 'Ingredient ID is required' });
    }

    // Get all alternatives with match scores (premium feature)
    const result = await convertService.getAdvancedSubstitutions(ingredientId);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting advanced substitutions:', error);
    res.status(500).json({ error: 'Failed to get advanced substitutions' });
  }
});

/**
 * POST /convert/export-shopping-list
 * Export shopping list (premium only)
 */
router.post('/export-shopping-list', authenticateToken, requirePremium, async (req, res) => {
  try {
    const { recipeId, format } = req.body;
    
    if (!recipeId) {
      return res.status(400).json({ error: 'Recipe ID is required' });
    }

    // Generate shopping list (premium feature)
    const shoppingList = await convertService.generateShoppingList(recipeId, format || 'json');
    
    res.json({ shoppingList });
  } catch (error) {
    console.error('Error exporting shopping list:', error);
    res.status(500).json({ error: 'Failed to export shopping list' });
  }
});

export default router;
