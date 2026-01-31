/**
 * Anonymous Affiliate Analytics
 * GDPR-friendly, lightweight tracking for affiliate monetization
 * 
 * Principles:
 * - No personal data (no names, emails, IP addresses)
 * - No cross-site tracking
 * - Aggregate data only
 * - User consent required (GDPR)
 */

/**
 * Event Schema
 * All events follow this structure:
 * {
 *   event: string,           // Event name (e.g., 'affiliate_click')
 *   props: {                 // Event properties (anonymized)
 *     ingredient_id: string, // Normalized ingredient ID (e.g., 'agar_agar')
 *     platform: string,      // Platform name (e.g., 'amazon')
 *     region: string,        // Country code (e.g., 'US')
 *     ingredient_type: string // 'fresh', 'pantry', 'specialty'
 *   },
 *   timestamp: number,        // Unix timestamp
 *   session_id: string       // Anonymous session ID (not tied to user)
 * }
 */

// Generate anonymous session ID (stored in sessionStorage, not persistent)
function getSessionId() {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    // Generate random session ID (not tied to user identity)
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Get region (country code only, no zip code)
async function getRegion() {
  try {
    const { detectUserRegion } = await import('./regionDetection');
    const region = await detectUserRegion();
    return region.countryCode || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

/**
 * Track ingredient view
 * Fired when user views an ingredient detail (Quick Lookup or conversion result)
 * 
 * @param {string} ingredientId - Normalized ingredient ID
 * @param {string} source - 'quick_lookup' | 'conversion_result' | 'seo_page'
 * @param {string} status - 'halal' | 'haram' | 'conditional' | 'questionable'
 */
export async function trackIngredientView(ingredientId, source = 'unknown', status = 'unknown') {
  if (!ingredientId) return;

  const region = await getRegion();
  const event = {
    event: 'ingredient_view',
    props: {
      ingredient_id: ingredientId,
      source: source,
      status: status,
      region: region
    }
  };

  sendAnalyticsEvent(event);
}

/**
 * Track substitute click
 * Fired when user clicks to view/expand a substitute option
 * 
 * @param {string} ingredientId - Original haram ingredient ID
 * @param {string} substituteId - Halal substitute ingredient ID
 * @param {string} source - 'conversion_result' | 'quick_lookup'
 */
export async function trackSubstituteClick(ingredientId, substituteId, source = 'unknown') {
  if (!ingredientId || !substituteId) return;

  const region = await getRegion();
  const event = {
    event: 'substitute_click',
    props: {
      ingredient_id: ingredientId,
      substitute_id: substituteId,
      source: source,
      region: region
    }
  };

  sendAnalyticsEvent(event);
}

/**
 * Track affiliate link click
 * Fired when user clicks an affiliate link
 * 
 * @param {string} ingredientId - Original haram ingredient ID
 * @param {string} substituteId - Halal substitute ingredient ID
 * @param {string} platform - 'amazon' | 'instacart' | 'thrivemarket'
 * @param {string} linkId - Affiliate link ID (for tracking specific links)
 * @param {boolean} isFeatured - Whether link was featured
 * @param {string} ingredientType - 'fresh' | 'pantry' | 'specialty'
 */
export async function trackAffiliateClick(
  ingredientId,
  substituteId,
  platform,
  linkId = null,
  isFeatured = false,
  ingredientType = 'unknown'
) {
  if (!ingredientId || !substituteId || !platform) return;

  const region = await getRegion();
  const event = {
    event: 'affiliate_click',
    props: {
      ingredient_id: ingredientId,
      substitute_id: substituteId,
      platform: platform,
      link_id: linkId || 'unknown',
      is_featured: isFeatured,
      ingredient_type: ingredientType,
      region: region
    }
  };

  sendAnalyticsEvent(event);
}

/**
 * Track conversion funnel step
 * Tracks user journey: view → substitute → affiliate click
 * 
 * @param {string} step - 'view' | 'substitute_view' | 'affiliate_click'
 * @param {string} ingredientId - Ingredient ID
 * @param {Object} metadata - Additional metadata
 */
export async function trackConversionFunnel(step, ingredientId, metadata = {}) {
  if (!step || !ingredientId) return;

  const region = await getRegion();
  const event = {
    event: 'conversion_funnel',
    props: {
      step: step,
      ingredient_id: ingredientId,
      region: region,
      ...metadata
    }
  };

  sendAnalyticsEvent(event);
}

/**
 * Track recipe conversion with affiliate context
 * Fired when recipe is converted and affiliate links are shown
 * 
 * @param {number} totalIngredients - Total ingredients in recipe
 * @param {number} haramIngredients - Number of haram ingredients detected
 * @param {number} substitutesShown - Number of substitutes with affiliate links
 * @param {number} affiliateLinksShown - Total affiliate links displayed
 */
export async function trackRecipeConversion(
  totalIngredients,
  haramIngredients,
  substitutesShown,
  affiliateLinksShown
) {
  const region = await getRegion();
  const event = {
    event: 'recipe_conversion',
    props: {
      total_ingredients: totalIngredients,
      haram_ingredients: haramIngredients,
      substitutes_shown: substitutesShown,
      affiliate_links_shown: affiliateLinksShown,
      region: region
    }
  };

  sendAnalyticsEvent(event);
}

/**
 * Check if analytics should be sent
 * Respects user consent and privacy settings
 * 
 * @returns {boolean}
 */
function shouldTrack() {
  // Check consent
  if (!hasAnalyticsConsent()) {
    return false;
  }

  // Check if Do Not Track is enabled
  if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
    return false;
  }

  return true;
}

/**
 * Send analytics event
 * Uses Plausible Analytics (privacy-friendly) or fallback to console
 * 
 * @param {Object} event - Event object
 */
function sendAnalyticsEvent(event) {
  // Check if tracking is allowed
  if (!shouldTrack()) {
    return; // Don't track if user hasn't consented
  }

  // Add session ID and timestamp
  const sessionId = getSessionId();
  const enrichedEvent = {
    ...event,
    props: {
      ...event.props,
      session_id: sessionId,
      timestamp: Date.now()
    }
  };

  // Send to Plausible Analytics (if available)
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(enrichedEvent.event, {
      props: enrichedEvent.props
    });
  }

  // Fallback: Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', enrichedEvent);
  }

  // Optional: Send to backend for aggregation
  // sendToBackend(enrichedEvent);
}

/**
 * Track affiliate link performance
 * Aggregated metrics (no personal data)
 * 
 * @param {string} linkId - Affiliate link ID
 * @param {string} platform - Platform name
 * @param {boolean} converted - Whether purchase occurred (if available from platform)
 */
export function trackAffiliatePerformance(linkId, platform, converted = false) {
  if (!linkId || !platform) return;

  const event = {
    event: 'affiliate_performance',
    props: {
      link_id: linkId,
      platform: platform,
      converted: converted
    }
  };

  sendAnalyticsEvent(event);
}

/**
 * Get consent status
 * Check if user has consented to analytics (GDPR)
 * 
 * @returns {boolean}
 */
export function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false;
  
  const consent = localStorage.getItem('analytics_consent');
  return consent === 'true';
}

/**
 * Set analytics consent
 * Store user's consent preference (GDPR)
 * 
 * @param {boolean} consented - Whether user consented
 */
export function setAnalyticsConsent(consented) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('analytics_consent', consented ? 'true' : 'false');
  
  // If consenting, initialize analytics
  if (consented) {
    // Analytics already initialized via Plausible script
    console.log('[Analytics] Consent granted, tracking enabled');
  } else {
    // Disable tracking
    console.log('[Analytics] Consent denied, tracking disabled');
  }
}

