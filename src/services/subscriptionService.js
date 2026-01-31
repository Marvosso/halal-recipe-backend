/**
 * Subscription Service
 * Business logic for subscription management and feature gating
 */

import { getPool } from '../database.js';

/**
 * Subscription State Machine
 * 
 * States:
 * - free: No subscription
 * - active: Subscription active and paid
 * - trialing: In trial period
 * - past_due: Payment failed, grace period
 * - canceled: Canceled but active until period end
 * - expired: Subscription expired, downgraded to free
 * 
 * Transitions:
 * free → active (payment successful)
 * active → past_due (payment failed)
 * past_due → active (payment retried successfully)
 * past_due → canceled (payment failed after grace period)
 * active → canceled (user cancels)
 * canceled → expired (period end reached)
 * expired → free (graceful downgrade)
 */

/**
 * Get user's subscription status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Subscription status object
 */
export async function getSubscriptionStatus(userId) {
  const pool = getPool();

  const result = await pool.query(
    `SELECT 
      s.id,
      s.plan_type,
      s.status,
      s.current_period_start,
      s.current_period_end,
      s.cancel_at_period_end,
      s.created_at
    FROM subscriptions s
    WHERE s.user_id = $1
    ORDER BY s.created_at DESC
    LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return {
      state: 'free',
      plan: null,
      expires_at: null,
      is_active: false,
      features: getFreeTierFeatures()
    };
  }

  const subscription = result.rows[0];
  const now = new Date();
  const periodEnd = new Date(subscription.current_period_end);

  // Determine current state
  let state = subscription.status;
  let is_active = false;

  if (state === 'active' && periodEnd > now) {
    is_active = true;
  } else if (state === 'active' && periodEnd <= now) {
    // Expired but not yet updated
    state = 'expired';
    await updateExpiredSubscription(subscription.id);
  } else if (state === 'canceled' && periodEnd > now) {
    // Canceled but still active until period end
    is_active = true;
    state = 'canceled';
  } else if (state === 'canceled' && periodEnd <= now) {
    state = 'expired';
    is_active = false;
  } else if (state === 'past_due') {
    // Grace period - still has access for now
    is_active = true;
  }

  return {
    state: state,
    plan: subscription.plan_type,
    expires_at: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    is_active: is_active,
    features: is_active ? getPremiumFeatures() : getFreeTierFeatures()
  };
}

/**
 * Check if user has premium access
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function hasPremiumAccess(userId) {
  const status = await getSubscriptionStatus(userId);
  return status.is_active;
}

/**
 * Check if user can use a specific feature
 * @param {string} userId - User ID
 * @param {string} feature - Feature name
 * @returns {Promise<boolean>}
 */
export async function canUseFeature(userId, feature) {
  const status = await getSubscriptionStatus(userId);
  
  if (!status.is_active) {
    return false;
  }

  return status.features[feature] === true || 
         (typeof status.features[feature] === 'object' && 
          status.features[feature].max !== undefined);
}

/**
 * Get feature limit for user
 * @param {string} userId - User ID
 * @param {string} feature - Feature name
 * @returns {Promise<number>} Feature limit (Infinity for unlimited)
 */
export async function getFeatureLimit(userId, feature) {
  const status = await getSubscriptionStatus(userId);
  
  if (!status.is_active) {
    // Return free tier limit
    const freeFeatures = getFreeTierFeatures();
    if (freeFeatures[feature]?.max !== undefined) {
      return freeFeatures[feature].max;
    }
    return 0;
  }

  const premiumFeatures = getPremiumFeatures();
  if (premiumFeatures[feature]?.max !== undefined) {
    return premiumFeatures[feature].max === Infinity ? Infinity : premiumFeatures[feature].max;
  }

  return 0;
}

/**
 * Update expired subscription
 * @param {string} subscriptionId - Subscription ID
 */
async function updateExpiredSubscription(subscriptionId) {
  const pool = getPool();
  
  await pool.query(
    `UPDATE subscriptions
     SET status = 'expired',
         updated_at = NOW()
     WHERE id = $1`,
    [subscriptionId]
  );
}

/**
 * Trigger graceful downgrade
 * @param {string} userId - User ID
 */
export async function triggerGracefulDowngrade(userId) {
  const pool = getPool();

  // Log downgrade event
  await pool.query(
    `INSERT INTO subscription_events (user_id, event_type, event_data)
     VALUES ($1, 'downgraded', $2)`,
    [userId, JSON.stringify({ reason: 'subscription_expired', timestamp: new Date() })]
  );

  // Graceful downgrade: Keep all user data
  // - Keep saved recipes (but limit to 10)
  // - Keep conversion history (but don't show)
  // - Keep preferences (but disable premium features)
  // - No data deletion

  console.log(`Graceful downgrade completed for user ${userId}`);
}

/**
 * Get free tier features
 * @returns {Object} Free tier feature set
 */
function getFreeTierFeatures() {
  return {
    conversions: { unlimited: true },
    substitutions: { max: 2 },
    savedRecipes: { max: 10 },
    exportFormats: ['txt'],
    brandVerification: false,
    batchConversion: false,
    conversionHistory: false,
    mealPlanning: false,
    recipeScaling: false,
    prioritySupport: false,
    earlyAccess: false
  };
}

/**
 * Get premium features
 * @returns {Object} Premium feature set
 */
function getPremiumFeatures() {
  return {
    conversions: { unlimited: true },
    substitutions: { max: Infinity },
    savedRecipes: { max: Infinity },
    exportFormats: ['txt', 'pdf', 'json'],
    brandVerification: true,
    batchConversion: true,
    conversionHistory: true,
    mealPlanning: true,
    recipeScaling: true,
    prioritySupport: true,
    earlyAccess: true
  };
}
