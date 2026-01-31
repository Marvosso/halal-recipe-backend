/**
 * Premium Analytics API Routes
 * Tracks premium subscription success metrics
 */

import express from 'express';
import { getPool } from '../database.js';

const router = express.Router();

/**
 * POST /api/analytics/premium-event
 * Store premium analytics event
 * 
 * Body: {
 *   event: string,
 *   props: object,
 *   timestamp: number,
 *   session_id: string
 * }
 */
router.post('/premium-event', async (req, res) => {
  try {
    const { event, props, timestamp, session_id } = req.body;

    // Validate event structure
    if (!event || !props || !session_id) {
      return res.status(400).json({ error: 'Invalid event structure' });
    }

    // Sanitize props (remove any personal data)
    const sanitizedProps = sanitizePremiumProps(props);

    const pool = getPool();
    
    // Store event
    await pool.query(
      `INSERT INTO premium_analytics_events (
        event_type,
        event_props,
        session_id,
        user_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        event,
        JSON.stringify(sanitizedProps),
        session_id,
        sanitizedProps.user_id || null, // Optional user_id for authenticated users
        new Date(timestamp || Date.now())
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error storing premium analytics event:', error);
    res.status(500).json({ error: 'Failed to store event' });
  }
});

/**
 * GET /api/analytics/premium-dashboard
 * Get aggregated premium metrics for dashboard
 * 
 * Query params:
 * - start_date: ISO date string
 * - end_date: ISO date string
 * - plan: 'monthly' | 'yearly' (optional)
 */
router.get('/premium-dashboard', async (req, res) => {
  try {
    const { start_date, end_date, plan } = req.query;
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

    // Build plan filter
    const planFilter = plan
      ? `${dateFilter ? 'AND' : 'WHERE'} event_props->>'plan' = $${dateParams.length + 1}`
      : '';

    const allParams = plan ? [...dateParams, plan] : dateParams;

    // Get aggregated metrics
    const metrics = {
      // Conversion limit hits
      conversion_limit_hits: await getConversionLimitHits(pool, dateFilter, planFilter, allParams),
      
      // Upgrade funnel
      upgrade_funnel: await getUpgradeFunnel(pool, dateFilter, planFilter, allParams),
      
      // Subscription success
      subscription_success: await getSubscriptionSuccess(pool, dateFilter, planFilter, allParams),
      
      // Premium feature usage
      premium_feature_usage: await getPremiumFeatureUsage(pool, dateFilter, planFilter, allParams),
      
      // Subscription cancellations
      cancellations: await getCancellations(pool, dateFilter, planFilter, allParams),
      
      // Revenue metrics
      revenue: await getRevenueMetrics(pool, dateFilter, planFilter, allParams),
      
      // Retention metrics
      retention: await getRetentionMetrics(pool, dateFilter, planFilter, allParams)
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching premium dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Helper functions

function sanitizePremiumProps(props) {
  // Allowed keys for premium analytics
  const allowedKeys = [
    'current_count', 'limit', 'remaining', 'user_tier',
    'trigger_feature', 'source', 'plan', 'subscription_id',
    'session_id', 'feature', 'action', 'reason',
    'revenue', 'days_since_subscription', 'user_id',
    'total_alternatives', 'ingredient_id', 'brand_name',
    'recipe_count', 'history_count', 'total_saved',
    'engagement_type', 'dismissal_reason'
  ];

  const sanitized = {};
  for (const key of allowedKeys) {
    if (props[key] !== undefined) {
      sanitized[key] = props[key];
    }
  }

  return sanitized;
}

async function getConversionLimitHits(pool, dateFilter, planFilter, params) {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_hits,
      COUNT(DISTINCT session_id) as unique_users,
      AVG((event_props->>'current_count')::int) as avg_conversions_before_hit
     FROM premium_analytics_events
     WHERE event_type = 'conversion_limit_hit' 
     ${dateFilter.replace('WHERE', 'AND')} 
     ${planFilter}
     `,
    params
  );
  return result.rows[0] || {};
}

async function getUpgradeFunnel(pool, dateFilter, planFilter, params) {
  const result = await pool.query(
    `SELECT 
      event_type,
      COUNT(*) as count,
      COUNT(DISTINCT session_id) as unique_users
     FROM premium_analytics_events
     WHERE event_type IN (
       'conversion_limit_hit',
       'upgrade_modal_view',
       'upgrade_attempt',
       'checkout_start',
       'subscription_success'
     )
     ${dateFilter.replace('WHERE', 'AND')} 
     ${planFilter}
     GROUP BY event_type
     ORDER BY 
       CASE event_type
         WHEN 'conversion_limit_hit' THEN 1
         WHEN 'upgrade_modal_view' THEN 2
         WHEN 'upgrade_attempt' THEN 3
         WHEN 'checkout_start' THEN 4
         WHEN 'subscription_success' THEN 5
         ELSE 6
       END`,
    params
  );
  return result.rows;
}

async function getSubscriptionSuccess(pool, dateFilter, planFilter, params) {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_subscriptions,
      COUNT(DISTINCT session_id) as unique_subscribers,
      SUM((event_props->>'revenue')::numeric) as total_revenue,
      AVG((event_props->>'revenue')::numeric) as avg_revenue,
      event_props->>'plan' as plan,
      COUNT(*) FILTER (WHERE event_props->>'plan' = 'monthly') as monthly_count,
      COUNT(*) FILTER (WHERE event_props->>'plan' = 'yearly') as yearly_count
     FROM premium_analytics_events
     WHERE event_type = 'subscription_success'
     ${dateFilter.replace('WHERE', 'AND')} 
     ${planFilter}
     GROUP BY event_props->>'plan'`,
    params
  );
  return result.rows;
}

async function getPremiumFeatureUsage(pool, dateFilter, planFilter, params) {
  const result = await pool.query(
    `SELECT 
      event_props->>'feature' as feature,
      event_props->>'action' as action,
      COUNT(*) as usage_count,
      COUNT(DISTINCT session_id) as unique_users
     FROM premium_analytics_events
     WHERE event_type = 'premium_feature_usage'
     ${dateFilter.replace('WHERE', 'AND')} 
     ${planFilter}
     GROUP BY feature, action
     ORDER BY usage_count DESC`,
    params
  );
  return result.rows;
}

async function getCancellations(pool, dateFilter, planFilter, params) {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_cancellations,
      COUNT(DISTINCT session_id) as unique_cancellations,
      event_props->>'plan' as plan,
      event_props->>'reason' as reason
     FROM premium_analytics_events
     WHERE event_type = 'subscription_cancelled'
     ${dateFilter.replace('WHERE', 'AND')} 
     ${planFilter}
     GROUP BY plan, reason`,
    params
  );
  return result.rows;
}

async function getRevenueMetrics(pool, dateFilter, planFilter, params) {
  const result = await pool.query(
    `SELECT 
      SUM((event_props->>'revenue')::numeric) as total_revenue,
      AVG((event_props->>'revenue')::numeric) as avg_revenue,
      COUNT(*) FILTER (WHERE event_props->>'plan' = 'monthly') * 2.99 as monthly_revenue,
      COUNT(*) FILTER (WHERE event_props->>'plan' = 'yearly') * 29.99 as yearly_revenue
     FROM premium_analytics_events
     WHERE event_type IN ('subscription_success', 'subscription_renewed')
     ${dateFilter.replace('WHERE', 'AND')} 
     ${planFilter}`,
    params
  );
  return result.rows[0] || {};
}

async function getRetentionMetrics(pool, dateFilter, planFilter, params) {
  const result = await pool.query(
    `SELECT 
      AVG((event_props->>'days_since_subscription')::int) as avg_days_active,
      COUNT(*) FILTER (WHERE (event_props->>'days_since_subscription')::int < 30) as new_subscribers,
      COUNT(*) FILTER (WHERE (event_props->>'days_since_subscription')::int >= 30) as retained_subscribers
     FROM premium_analytics_events
     WHERE event_type = 'premium_retention'
     ${dateFilter.replace('WHERE', 'AND')} 
     ${planFilter}`,
    params
  );
  return result.rows[0] || {};
}

export default router;
