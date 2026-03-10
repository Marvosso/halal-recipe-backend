/**
 * Recipe Conversion API Routes
 * Handles recipe conversion with premium feature gating
 */

import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { requirePremium, attachFeatureLimits } from '../middleware/featureGate.js';
import { hasPremiumAccess } from '../services/subscriptionService.js';
import { checkConversionLimit, trackConversion } from '../services/conversionLimitService.js';
import { getPool } from '../database.js';
import convertService from '../services/convertService.js';
import { classifyIngredient } from '../services/halalClassificationService.js';
import { runPhotoScanPipeline } from '../services/photoScanPipelineService.js';
import { extractTextFromImage } from '../services/ocrAdapter.js';
import { ROUTE, shouldUseOCRCleanupAI } from '../services/aiRoutingService.js';
import { getAIFeatureFlags, isFallbackAIEnabled } from '../config/aiFeatureFlags.js';

const router = express.Router();

// In-memory upload for scan (no disk write)
const scanUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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
 * POST /convert/classify-ingredient
 * Hybrid halal classification: deterministic rule engine + AI-enhanced explanation and substitutes.
 * Returns structured output; halal_status and confidence always from rules, not AI.
 *
 * Body: { ingredient: string, useOCRNormalization?: boolean, recipeContext?: object, intent?: string, ocrConfidence?: number }
 * intent: simple_lookup | known_page | recipe_conversion | ocr_cleanup | ambiguous_fallback (optional; inferred from recipeContext if omitted)
 * Response: { ingredient, modifiers, halal_status, confidence, explanation, warnings, substitutes }
 * substitutes: { best: { name, score, reason, notes } | null, alternatives: Array<{ name, score, reason, notes }> }
 */
router.post('/classify-ingredient', authenticateToken, async (req, res) => {
  try {
    const { ingredient, useOCRNormalization, recipeContext, userPreferences, intent, ocrConfidence } = req.body || {};
    if (!ingredient || typeof ingredient !== 'string') {
      return res.status(400).json({ error: 'ingredient string is required' });
    }
    const result = await classifyIngredient(ingredient.trim(), {
      userPreferences: userPreferences || {},
      useOCRNormalization: Boolean(useOCRNormalization),
      recipeContext: recipeContext || {},
      intent: intent || undefined,
      ocrConfidence: ocrConfidence != null ? Number(ocrConfidence) : undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('Error classifying ingredient:', error);
    res.status(500).json({ error: 'Failed to classify ingredient' });
  }
});

/**
 * POST /convert/scan-ingredients
 * Photo scan pipeline: OCR text (or raw text) → parse → normalize → rule-engine evaluation.
 * Body (JSON): { rawText: string, ocrConfidence?: number, useAINormalization?: boolean }
 * Or multipart: field "image" (file) — then OCR runs server-side and pipeline uses extracted text.
 * Response: { summary: { halal, conditional, haram, unknown }, ingredients: [...], ocr_confidence }
 */
router.post('/scan-ingredients', authenticateToken, scanUpload.single('image'), async (req, res) => {
  try {
    let rawText = '';
    let ocrConfidence = 0.7;

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (req.file && req.file.buffer) {
      const { text, confidence } = await extractTextFromImage(req.file.buffer);
      rawText = text || '';
      ocrConfidence = typeof confidence === 'number' ? confidence : 0.5;
    } else {
      rawText = (body.rawText != null ? String(body.rawText) : '').trim();
      if (body.ocrConfidence != null) ocrConfidence = Number(body.ocrConfidence);
    }

    if (!rawText) {
      return res.status(400).json({
        error: 'No text to analyze. Send rawText (JSON) or upload an image (multipart/form-data with field "image").',
      });
    }

    const useOCRRoute = ocrConfidence < 0.5 ? ROUTE.AMBIGUOUS_FALLBACK : ROUTE.OCR_CLEANUP;
    const aiCleanupAllowed =
      shouldUseOCRCleanupAI(useOCRRoute, { ocrConfidence }) ||
      (ocrConfidence < 0.5 && isFallbackAIEnabled());
    const useAINormalization = (body.useAINormalization !== false) && aiCleanupAllowed;

    const result = await runPhotoScanPipeline(rawText, {
      userPreferences: body.userPreferences || {},
      ocrConfidence,
      useAINormalization,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in scan-ingredients:', error);
    res.status(500).json({ error: 'Failed to scan ingredients' });
  }
});

/**
 * GET /convert/ai-flags
 * Expose AI feature flags (read-only). Env: AI_EXPLANATION_ENABLED, AI_SUBSTITUTES_ENABLED, AI_OCR_CLEANUP_ENABLED, AI_FALLBACK_ENABLED.
 */
router.get('/ai-flags', authenticateToken, (req, res) => {
  res.json(getAIFeatureFlags());
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
