/**
 * Analytics API Routes
 * Aggregates anonymous analytics data for affiliate monetization
 * 
 * GDPR Compliant:
 * - No personal data stored
 * - Aggregate data only
 * - Session-based tracking (not persistent)
 */

import express from 'express';
import { getPool } from '../database.js';

const router = express.Router();

/**
 * Analytics Events Schema
 * 
 * ingredient_view: {
 *   ingredient_id: string,
 *   source: 'quick_lookup' | 'conversion_result' | 'seo_page',
 *   status: 'halal' | 'haram' | 'conditional' | 'questionable',
 *   region: string (country code)
 * }
 * 
 * substitute_click: {
 *   ingredient_id: string,
 *   substitute_id: string,
 *   source: string,
 *   region: string
 * }
 * 
 * affiliate_click: {
 *   ingredient_id: string,
 *   substitute_id: string,
 *   platform: 'amazon' | 'instacart' | 'thrivemarket',
 *   link_id: string,
 *   is_featured: boolean,
 *   ingredient_type: 'fresh' | 'pantry' | 'specialty',
 *   region: string
 * }
 * 
 * conversion_funnel: {
 *   step: 'view' | 'substitute_view' | 'affiliate_click',
 *   ingredient_id: string,
 *   region: string
 * }
 * 
 * recipe_conversion: {
 *   total_ingredients: number,
 *   haram_ingredients: number,
 *   substitutes_shown: number,
 *   affiliate_links_shown: number,
 *   region: string
 * }
 */

/**
 * POST /api/analytics/event
 * Store anonymous analytics event
 * 
 * Body: {
 *   event: string,
 *   props: object,
 *   timestamp: number,
 *   session_id: string
 * }
 */
router.post('/event', async (req, res) => {
  try {
    const { event, props, timestamp, session_id } = req.body;

    // Validate event structure
    if (!event || !props || !session_id) {
      return res.status(400).json({ error: 'Invalid event structure' });
    }

    // Ensure no personal data
    const sanitizedProps = sanitizeProps(props);

    const pool = getPool();
    
    // Store event (aggregate only, no personal data)
    await pool.query(
      `INSERT INTO analytics_events (event_type, event_props, session_id, created_at)
       VALUES ($1, $2, $3, $4)`,
      [event, JSON.stringify(sanitizedProps), session_id, new Date(timestamp || Date.now())]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error storing analytics event:', error);
    res.status(500).json({ error: 'Failed to store event' });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get aggregated metrics for dashboard
 * 
 * Query params:
 * - start_date: ISO date string
 * - end_date: ISO date string
 * - region: country code (optional)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { start_date, end_date, region } = req.query;
    const pool = getPool();

    // Build date filter
    const dateFilter = start_date && end_date
      ? `WHERE created_at >= $1 AND created_at <= $2`
      : start_date
      ? `WHERE created_at >= $1`
      : '';

    const dateParams = start_date && end_date
      ? [start_date, end_date]
      : start_date
      ? [start_date]
      : [];

    // Build region filter
    const regionFilter = region
      ? `${dateFilter ? 'AND' : 'WHERE'} event_props->>'region' = $${dateParams.length + 1}`
      : '';

    const allParams = region ? [...dateParams, region] : dateParams;

    // Get aggregated metrics
    const metrics = {
      // Total events
      total_events: await getTotalEvents(pool, dateFilter, regionFilter, allParams),
      
      // Ingredient views
      ingredient_views: await getIngredientViews(pool, dateFilter, regionFilter, allParams),
      
      // Substitute clicks
      substitute_clicks: await getSubstituteClicks(pool, dateFilter, regionFilter, allParams),
      
      // Affiliate clicks
      affiliate_clicks: await getAffiliateClicks(pool, dateFilter, regionFilter, allParams),
      
      // Conversion funnel
      conversion_funnel: await getConversionFunnel(pool, dateFilter, regionFilter, allParams),
      
      // Recipe conversions
      recipe_conversions: await getRecipeConversions(pool, dateFilter, regionFilter, allParams),
      
      // Top ingredients
      top_ingredients: await getTopIngredients(pool, dateFilter, regionFilter, allParams),
      
      // Top platforms
      top_platforms: await getTopPlatforms(pool, dateFilter, regionFilter, allParams),
      
      // Regional breakdown
      regional_breakdown: await getRegionalBreakdown(pool, dateFilter, regionFilter, allParams)
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Helper functions

function sanitizeProps(props) {
  // Remove any potential personal data
  const allowedKeys = [
    'ingredient_id', 'substitute_id', 'platform', 'link_id',
    'source', 'status', 'region', 'ingredient_type',
    'is_featured', 'step', 'total_ingredients', 'haram_ingredients',
    'substitutes_shown', 'affiliate_links_shown'
  ];

  const sanitized = {};
  for (const key of allowedKeys) {
    if (props[key] !== undefined) {
      sanitized[key] = props[key];
    }
  }

  return sanitized;
}

async function getTotalEvents(pool, dateFilter, regionFilter, params) {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM analytics_events ${dateFilter} ${regionFilter}`,
    params
  );
  return parseInt(result.rows[0].count, 10);
}

async function getIngredientViews(pool, dateFilter, regionFilter, params) {
  const result = await pool.query(
    `SELECT COUNT(*) as count, 
            event_props->>'ingredient_id' as ingredient_id,
            event_props->>'source' as source,
            event_props->>'status' as status
     FROM analytics_events 
     WHERE event_type = 'ingredient_view' ${dateFilter.replace('WHERE', 'AND')} ${regionFilter}
     GROUP BY ingredient_id, source, status
     ORDER BY count DESC
     LIMIT 20`,
    params
  );
  return result.rows;
}

async function getSubstituteClicks(pool, dateFilter, regionFilter, params) {
  const result = await pool.query(
    `SELECT COUNT(*) as count,
            event_props->>'ingredient_id' as ingredient_id,
            event_props->>'substitute_id' as substitute_id
     FROM analytics_events
     WHERE event_type = 'substitute_click' ${dateFilter.replace('WHERE', 'AND')} ${regionFilter}
     GROUP BY ingredient_id, substitute_id
     ORDER BY count DESC
     LIMIT 20`,
    params
  );
  return result.rows;
}

async function getAffiliateClicks(pool, dateFilter, regionFilter, params) {
  const result = await pool.query(
    `SELECT COUNT(*) as count,
            event_props->>'platform' as platform,
            event_props->>'ingredient_id' as ingredient_id,
            event_props->>'substitute_id' as substitute_id,
            event_props->>'is_featured' as is_featured
     FROM analytics_events
     WHERE event_type = 'affiliate_click' ${dateFilter.replace('WHERE', 'AND')} ${regionFilter}
     GROUP BY platform, ingredient_id, substitute_id, is_featured
     ORDER BY count DESC
     LIMIT 20`,
    params
  );
  return result.rows;
}

async function getConversionFunnel(pool, dateFilter, regionFilter, params) {
  const result = await pool.query(
    `SELECT event_props->>'step' as step,
            COUNT(*) as count
     FROM analytics_events
     WHERE event_type = 'conversion_funnel' ${dateFilter.replace('WHERE', 'AND')} ${regionFilter}
     GROUP BY step
     ORDER BY 
       CASE step
         WHEN 'view' THEN 1
         WHEN 'substitute_view' THEN 2
         WHEN 'affiliate_click' THEN 3
         ELSE 4
       END`,
    params
  );
  return result.rows;
}

async function getRecipeConversions(pool, dateFilter, regionFilter, params) {
  const result = await pool.query(
    `SELECT AVG((event_props->>'total_ingredients')::int) as avg_total,
            AVG((event_props->>'haram_ingredients')::int) as avg_haram,
            AVG((event_props->>'substitutes_shown')::int) as avg_substitutes,
            AVG((event_props->>'affiliate_links_shown')::int) as avg_links,
            COUNT(*) as total_conversions
     FROM analytics_events
     WHERE event_type = 'recipe_conversion' ${dateFilter.replace('WHERE', 'AND')} ${regionFilter}`,
    params
  );
  return result.rows[0] || {};
}

async function getTopIngredients(pool, dateFilter, regionFilter, params) {
  const result = await pool.query(
    `SELECT event_props->>'ingredient_id' as ingredient_id,
            COUNT(*) as views
     FROM analytics_events
     WHERE event_type = 'ingredient_view' ${dateFilter.replace('WHERE', 'AND')} ${regionFilter}
     GROUP BY ingredient_id
     ORDER BY views DESC
     LIMIT 10`,
    params
  );
  return result.rows;
}

async function getTopPlatforms(pool, dateFilter, regionFilter, params) {
  const result = await pool.query(
    `SELECT event_props->>'platform' as platform,
            COUNT(*) as clicks
     FROM analytics_events
     WHERE event_type = 'affiliate_click' ${dateFilter.replace('WHERE', 'AND')} ${regionFilter}
     GROUP BY platform
     ORDER BY clicks DESC`,
    params
  );
  return result.rows;
}

async function getRegionalBreakdown(pool, dateFilter, regionFilter, params) {
  const result = await pool.query(
    `SELECT event_props->>'region' as region,
            COUNT(*) as events
     FROM analytics_events
     ${dateFilter} ${regionFilter}
     GROUP BY region
     ORDER BY events DESC
     LIMIT 20`,
    params
  );
  return result.rows;
}

export default router;
