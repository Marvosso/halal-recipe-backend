/**
 * Premium Analytics
 * Tracks premium subscription success metrics
 * 
 * Events:
 * - Conversion limit hits
 * - Upgrade attempts
 * - Successful subscriptions
 * - Feature usage by premium users
 */

import { v4 as uuidv4 } from 'uuid';

const SESSION_ID_KEY = 'analytics_session_id';
const CONSENT_KEY = 'analytics_consent';

/**
 * Generates or retrieves a session ID
 */
function getSessionId() {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${uuidv4().slice(0, 8)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Checks if user has given consent for analytics tracking
 */
export function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false;
  const consent = localStorage.getItem(CONSENT_KEY);
  return consent === 'granted';
}

/**
 * Sends an analytics event if consent is granted
 */
function sendAnalyticsEvent(event) {
  if (typeof window === 'undefined' || !hasAnalyticsConsent() || navigator.doNotTrack === '1') {
    return;
  }

  const sessionId = getSessionId();
  const enrichedEvent = {
    ...event,
    props: {
      ...event.props,
      session_id: sessionId,
      timestamp: Date.now(),
      path: window.location.pathname,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
    }
  };

  // Send to Plausible Analytics
  if (window.plausible) {
    window.plausible(enrichedEvent.event, {
      props: enrichedEvent.props
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Premium Analytics]', enrichedEvent);
  }

  // Send to backend for aggregation
  sendToBackend(enrichedEvent);
}

/**
 * Send analytics event to backend
 */
async function sendToBackend(event) {
  try {
    const response = await fetch('/api/analytics/premium-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.warn('Failed to send premium analytics event to backend');
    }
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics backend error:', error);
    }
  }
}

// ============================================================================
// CONVERSION LIMIT HITS
// ============================================================================

/**
 * Track when a free user hits conversion limit
 * @param {number} currentCount - Current number of conversions today
 * @param {number} limit - Conversion limit (Infinity for premium)
 */
export function trackConversionLimitHit(currentCount, limit) {
  sendAnalyticsEvent({
    event: 'conversion_limit_hit',
    props: {
      current_count: currentCount,
      limit: limit,
      user_tier: 'free',
      action_taken: 'limit_reached'
    }
  });
}

/**
 * Track when a free user approaches conversion limit
 * @param {number} currentCount - Current number of conversions today
 * @param {number} limit - Conversion limit
 * @param {number} remaining - Remaining conversions
 */
export function trackConversionLimitApproach(currentCount, limit, remaining) {
  if (remaining <= 2) { // Only track when 2 or fewer remaining
    sendAnalyticsEvent({
      event: 'conversion_limit_approach',
      props: {
        current_count: currentCount,
        limit: limit,
        remaining: remaining,
        user_tier: 'free'
      }
    });
  }
}

// ============================================================================
// UPGRADE ATTEMPTS
// ============================================================================

/**
 * Track when user views upgrade modal
 * @param {string} triggerFeature - Feature that triggered upgrade (optional)
 * @param {string} source - Where upgrade was triggered (e.g., 'modal', 'prompt', 'settings')
 */
export function trackUpgradeModalView(triggerFeature = null, source = 'unknown') {
  sendAnalyticsEvent({
    event: 'upgrade_modal_view',
    props: {
      trigger_feature: triggerFeature,
      source: source,
      user_tier: 'free'
    }
  });
}

/**
 * Track when user clicks upgrade CTA
 * @param {string} plan - 'monthly' or 'yearly'
 * @param {string} triggerFeature - Feature that triggered upgrade
 * @param {string} source - Where upgrade was triggered
 */
export function trackUpgradeAttempt(plan, triggerFeature = null, source = 'unknown') {
  sendAnalyticsEvent({
    event: 'upgrade_attempt',
    props: {
      plan: plan,
      trigger_feature: triggerFeature,
      source: source,
      user_tier: 'free'
    }
  });
}

/**
 * Track when user starts checkout process
 * @param {string} plan - 'monthly' or 'yearly'
 * @param {string} sessionId - Stripe checkout session ID
 */
export function trackCheckoutStart(plan, sessionId) {
  sendAnalyticsEvent({
    event: 'checkout_start',
    props: {
      plan: plan,
      session_id: sessionId,
      user_tier: 'free'
    }
  });
}

/**
 * Track when checkout is abandoned
 * @param {string} plan - 'monthly' or 'yearly'
 * @param {string} sessionId - Stripe checkout session ID
 * @param {string} reason - Reason for abandonment (optional)
 */
export function trackCheckoutAbandoned(plan, sessionId, reason = null) {
  sendAnalyticsEvent({
    event: 'checkout_abandoned',
    props: {
      plan: plan,
      session_id: sessionId,
      reason: reason,
      user_tier: 'free'
    }
  });
}

// ============================================================================
// SUCCESSFUL SUBSCRIPTIONS
// ============================================================================

/**
 * Track successful subscription
 * @param {string} plan - 'monthly' or 'yearly'
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} sessionId - Stripe checkout session ID
 */
export function trackSubscriptionSuccess(plan, subscriptionId, sessionId) {
  sendAnalyticsEvent({
    event: 'subscription_success',
    props: {
      plan: plan,
      subscription_id: subscriptionId,
      session_id: sessionId,
      user_tier: 'premium',
      revenue: plan === 'monthly' ? 2.99 : 29.99
    }
  });
}

/**
 * Track subscription activation
 * @param {string} plan - 'monthly' or 'yearly'
 * @param {string} subscriptionId - Stripe subscription ID
 */
export function trackSubscriptionActivated(plan, subscriptionId) {
  sendAnalyticsEvent({
    event: 'subscription_activated',
    props: {
      plan: plan,
      subscription_id: subscriptionId,
      user_tier: 'premium'
    }
  });
}

/**
 * Track subscription cancellation
 * @param {string} plan - 'monthly' or 'yearly'
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} reason - Cancellation reason (optional)
 */
export function trackSubscriptionCancelled(plan, subscriptionId, reason = null) {
  sendAnalyticsEvent({
    event: 'subscription_cancelled',
    props: {
      plan: plan,
      subscription_id: subscriptionId,
      reason: reason,
      user_tier: 'premium'
    }
  });
}

/**
 * Track subscription renewal
 * @param {string} plan - 'monthly' or 'yearly'
 * @param {string} subscriptionId - Stripe subscription ID
 */
export function trackSubscriptionRenewed(plan, subscriptionId) {
  sendAnalyticsEvent({
    event: 'subscription_renewed',
    props: {
      plan: plan,
      subscription_id: subscriptionId,
      user_tier: 'premium',
      revenue: plan === 'monthly' ? 2.99 : 29.99
    }
  });
}

// ============================================================================
// FEATURE USAGE BY PREMIUM USERS
// ============================================================================

/**
 * Track premium feature usage
 * @param {string} feature - Feature name (e.g., 'strict_halal_mode', 'all_alternatives')
 * @param {string} action - Action taken (e.g., 'enabled', 'used', 'viewed')
 * @param {Object} context - Additional context (optional)
 */
export function trackPremiumFeatureUsage(feature, action, context = {}) {
  sendAnalyticsEvent({
    event: 'premium_feature_usage',
    props: {
      feature: feature,
      action: action,
      user_tier: 'premium',
      ...context
    }
  });
}

/**
 * Track strict halal mode usage
 * @param {boolean} enabled - Whether strict mode was enabled
 */
export function trackStrictHalalModeUsage(enabled) {
  trackPremiumFeatureUsage('strict_halal_mode', enabled ? 'enabled' : 'disabled');
}

/**
 * Track all alternatives view
 * @param {number} totalAlternatives - Total number of alternatives shown
 * @param {string} ingredientId - Ingredient ID
 */
export function trackAllAlternativesView(totalAlternatives, ingredientId) {
  trackPremiumFeatureUsage('all_alternatives', 'viewed', {
    total_alternatives: totalAlternatives,
    ingredient_id: ingredientId
  });
}

/**
 * Track brand verification usage
 * @param {string} brandName - Brand name checked
 * @param {string} ingredientId - Ingredient ID
 */
export function trackBrandVerificationUsage(brandName, ingredientId) {
  trackPremiumFeatureUsage('brand_verification', 'used', {
    brand_name: brandName,
    ingredient_id: ingredientId
  });
}

/**
 * Track PDF export usage
 * @param {number} recipeCount - Number of recipes exported
 */
export function trackPDFExportUsage(recipeCount = 1) {
  trackPremiumFeatureUsage('pdf_export', 'used', {
    recipe_count: recipeCount
  });
}

/**
 * Track batch conversion usage
 * @param {number} recipeCount - Number of recipes converted
 */
export function trackBatchConversionUsage(recipeCount) {
  trackPremiumFeatureUsage('batch_conversion', 'used', {
    recipe_count: recipeCount
  });
}

/**
 * Track conversion history view
 * @param {number} historyCount - Number of conversions in history
 */
export function trackConversionHistoryView(historyCount) {
  trackPremiumFeatureUsage('conversion_history', 'viewed', {
    history_count: historyCount
  });
}

/**
 * Track unlimited recipe save
 * @param {number} totalSaved - Total number of saved recipes
 */
export function trackUnlimitedRecipeSave(totalSaved) {
  trackPremiumFeatureUsage('unlimited_saves', 'used', {
    total_saved: totalSaved
  });
}

// ============================================================================
// UPGRADE FUNNEL TRACKING
// ============================================================================

/**
 * Track upgrade funnel step
 * @param {string} step - Funnel step (e.g., 'awareness', 'interest', 'consideration', 'purchase')
 * @param {Object} props - Additional properties
 */
export function trackUpgradeFunnel(step, props = {}) {
  sendAnalyticsEvent({
    event: 'upgrade_funnel',
    props: {
      step: step,
      user_tier: 'free',
      ...props
    }
  });
}

/**
 * Track upgrade prompt dismissal
 * @param {string} triggerFeature - Feature that triggered prompt
 * @param {string} dismissalReason - Why user dismissed (optional)
 */
export function trackUpgradePromptDismissal(triggerFeature, dismissalReason = null) {
  sendAnalyticsEvent({
    event: 'upgrade_prompt_dismissed',
    props: {
      trigger_feature: triggerFeature,
      dismissal_reason: dismissalReason,
      user_tier: 'free'
    }
  });
}

// ============================================================================
// PREMIUM USER ENGAGEMENT
// ============================================================================

/**
 * Track premium user engagement
 * @param {string} engagementType - Type of engagement (e.g., 'daily_active', 'feature_used', 'recipe_saved')
 * @param {Object} props - Additional properties
 */
export function trackPremiumEngagement(engagementType, props = {}) {
  sendAnalyticsEvent({
    event: 'premium_engagement',
    props: {
      engagement_type: engagementType,
      user_tier: 'premium',
      ...props
    }
  });
}

/**
 * Track premium user retention
 * @param {number} daysSinceSubscription - Days since subscription started
 * @param {string} plan - 'monthly' or 'yearly'
 */
export function trackPremiumRetention(daysSinceSubscription, plan) {
  sendAnalyticsEvent({
    event: 'premium_retention',
    props: {
      days_since_subscription: daysSinceSubscription,
      plan: plan,
      user_tier: 'premium'
    }
  });
}
